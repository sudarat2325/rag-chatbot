'use client';

import { useState, useEffect, useRef } from 'react';
import { useSocket } from '@/lib/hooks/useSocket';
import { Send, X, Paperclip, Image as ImageIcon, Smile } from 'lucide-react';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: string;
  type?: 'text' | 'image';
  imageUrl?: string;
}

interface ChatBoxProps {
  orderId: string;
  userId: string;
  userName: string;
  recipientId: string;
  recipientName: string;
  recipientType: 'restaurant' | 'driver' | 'customer';
  recipientImage?: string;
  position?: 'right' | 'left';
  onClose: () => void;
  onMessageReceived?: (senderId: string) => void; // Callback when message received
}

interface ChatMessageResponse {
  id: string;
  senderId: string;
  sender: {
    name: string;
  };
  message: string;
  createdAt: string;
  messageType: string;
  imageUrl?: string;
}

interface TypingEventPayload {
  userId: string;
  isTyping: boolean;
}

export function ChatBox({
  orderId,
  userId,
  userName,
  recipientId,
  recipientName,
  recipientType,
  recipientImage,
  position = 'right',
  onClose,
}: ChatBoxProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { on, off } = useSocket(userId);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load existing messages on mount
  useEffect(() => {
    const loadMessages = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/chat/messages?orderId=${orderId}&userId=${userId}`);
        const data = await response.json();

        if (data.success) {
          const mappedMessages = (data.data || []).map((msg: ChatMessageResponse) => ({
            id: msg.id,
            senderId: msg.senderId,
            senderName: msg.sender.name,
            message: msg.message,
            timestamp: msg.createdAt,
            type: msg.messageType.toLowerCase(),
            imageUrl: msg.imageUrl,
          }));
          setMessages(mappedMessages);
        }
      } catch (error) {
        console.error('Error loading messages:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
  }, [orderId, userId]);

  // Listen for incoming messages
  useEffect(() => {
    const handleNewMessage = (rawData: unknown) => {
      const data = rawData as Message;
      console.log('💬 Received chat message:', {
        event: `chat-message-${orderId}`,
        recipientType,
        senderId: data.senderId,
        senderName: data.senderName,
        message: data.message,
        myUserId: userId,
        willShow: data.senderId !== userId,
      });

      if (data.senderId !== userId) {
        console.log('✅ Adding message to chat');
        setMessages(prev => [...prev, data]);
      } else {
        console.log('⏭️ Skipping own message');
      }
    };

    const handleTypingEvent = (rawData: unknown) => {
      const data = rawData as TypingEventPayload;
      if (data.userId !== userId) {
        setIsTyping(data.isTyping);
      }
    };

    console.log('👂 ChatBox setup:', {
      recipientType,
      myUserId: userId,
      orderId,
      eventName: `chat-message-${orderId}`,
    });
    on(`chat-message-${orderId}`, handleNewMessage);
    on(`chat-typing-${orderId}`, handleTypingEvent);

    return () => {
      console.log('👋 ChatBox cleanup:', { recipientType, orderId });
      off(`chat-message-${orderId}`, handleNewMessage);
      off(`chat-typing-${orderId}`, handleTypingEvent);
    };
  }, [orderId, userId, on, off, recipientType]);

  // Handle typing indicator
  const handleTyping = () => {
    // Emit typing event
    // In real app, would send via Socket.IO
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const messageData = {
      orderId,
      senderId: userId,
      receiverId: recipientId,
      message: newMessage,
      messageType: 'TEXT',
    };

    // Optimistically add to local messages
    const optimisticMessage: Message = {
      id: Date.now().toString(),
      senderId: userId,
      senderName: userName,
      message: newMessage,
      timestamp: new Date().toISOString(),
      type: 'text',
    };
    setMessages(prev => [...prev, optimisticMessage]);
    setNewMessage('');

    try {
      // Save to database via API
      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messageData),
      });

      const data = await response.json();

      if (data.success) {
        // Update with server-generated ID
        setMessages(prev =>
          prev.map(msg =>
            msg.id === optimisticMessage.id
              ? { ...msg, id: data.data.id }
              : msg
          )
        );
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Could add error handling/retry logic here
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const positionClass = position === 'right' ? 'right-6' : 'right-[25rem]';

  return (
    <div className={`fixed bottom-0 ${positionClass} w-96 bg-white dark:bg-gray-800 rounded-t-xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col`} style={{ height: '500px', zIndex: 1000 }}>
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-3 rounded-t-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar/Logo */}
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center overflow-hidden flex-shrink-0">
            {recipientImage ? (
              <img
                src={recipientImage}
                alt={recipientName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-3xl">
                {recipientType === 'restaurant' ? '🏪' : recipientType === 'customer' ? '👤' : '🚗'}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-base truncate">{recipientName}</h3>
            <p className="text-xs opacity-90 font-medium">
              {recipientType === 'restaurant'
                ? '💬 ร้านอาหาร'
                : recipientType === 'customer'
                  ? '💬 ลูกค้า'
                  : '💬 คนขับ'}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-white/20 rounded-full transition-colors flex-shrink-0"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-900">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <Smile className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                เริ่มต้นการสนทนา
              </p>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.senderId === userId;
            return (
              <div
                key={msg.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg px-4 py-2 ${
                    isOwn
                      ? 'bg-orange-500 text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700'
                  }`}
                >
                  {!isOwn && (
                    <p className="text-xs font-semibold opacity-80 mb-1.5">{msg.senderName}</p>
                  )}

                  {msg.type === 'image' && msg.imageUrl && (
                    <img
                      src={msg.imageUrl}
                      alt="Shared image"
                      className="rounded mb-2 max-w-full"
                    />
                  )}

                  <p className="text-sm whitespace-pre-wrap break-words">
                    {msg.message}
                  </p>

                  <p className={`text-xs mt-1 ${isOwn ? 'opacity-75' : 'opacity-50'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString('th-TH', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            );
          })
        )}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-end gap-2">
          {/* Attachment buttons */}
          <div className="flex gap-1">
            <button
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="แนบไฟล์"
            >
              <Paperclip className="w-5 h-5" />
            </button>
            <button
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="ส่งรูปภาพ"
            >
              <ImageIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Text input */}
          <textarea
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            onKeyPress={handleKeyPress}
            placeholder="พิมพ์ข้อความ..."
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
            rows={1}
            style={{ maxHeight: '100px' }}
          />

          {/* Send button */}
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim()}
            className="p-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>

        {/* Quick replies */}
        <div className="flex gap-2 mt-2">
          {recipientType === 'driver' ? (
            <>
              <button
                onClick={() => setNewMessage('ถึงแล้วหรือยังคะ?')}
                className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                ถึงแล้วหรือยัง?
              </button>
              <button
                onClick={() => setNewMessage('ขอบคุณค่ะ')}
                className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                ขอบคุณ
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setNewMessage('อาหารพร้อมหรือยังคะ?')}
                className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                อาหารพร้อมหรือยัง?
              </button>
              <button
                onClick={() => setNewMessage('ขอบคุณค่ะ')}
                className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                ขอบคุณ
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
