'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, RefreshCw } from 'lucide-react';
import { Navigation } from '@/components/navigation';
import { Footer } from '@/components/footer';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function ChatbotPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: '👋 สวัสดีครับ! ผม FoodBot ผู้ช่วยอัจฉริยะของคุณ\n\nผมสามารถช่วยคุณได้ในเรื่อง:\n• 🍽️ แนะนำร้านอาหารและเมนู\n• 🔍 ค้นหาสูตรและส่วนผสม\n• 📦 ตรวจสอบสถานะออเดอร์\n• 💰 สอบถามราคาและโปรโมชั่น\n• ❓ ตอบคำถามทั่วไป\n\nลองถามผมดูได้เลยครับ! 😊',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const exampleQuestions = [
    '🍜 ส้มตำไทยมีส่วนผสมอะไรบ้าง?',
    '🏪 มีร้านอาหารอะไรบ้าง?',
    '💰 ค่าส่งคำนวณยังไง?',
    '🎁 วันนี้มีโปรอะไรบ้าง?',
    '🍲 ลาบหมูทำยังไง?',
    '⭐ เมนูยอดนิยมคืออะไร?',
  ];

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          chatHistory: messages.slice(-10).map((m) => m.content), // Last 10 messages
        }),
      });

      const data = await response.json();

      if (data.success) {
        const assistantMessage: Message = {
          role: 'assistant',
          content: data.data.message,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: '❌ ขออภัยครับ เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleExampleClick = (question: string) => {
    setInput(question.replace(/^[^\s]+\s/, '')); // Remove emoji
  };

  const handleReset = () => {
    setMessages([
      {
        role: 'assistant',
        content: '👋 สวัสดีครับ! มีอะไรให้ผมช่วยไหมครับ?',
        timestamp: new Date(),
      },
    ]);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Navigation */}
      <Navigation />

      {/* Action Bar */}
      <div className="border-b bg-white/80 backdrop-blur-sm dark:bg-gray-900/80">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-gradient-to-r from-blue-600 to-purple-600 p-2">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">FoodBot AI Assistant</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                ผู้ช่วยอัจฉริยะสำหรับสั่งอาหาร
              </p>
            </div>
          </div>

          <button
            onClick={handleReset}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-700 hover:bg-gray-50 transition dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            title="เริ่มใหม่"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 max-w-4xl w-full mx-auto px-4 py-6">
        {/* Example Questions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-semibold text-gray-900 dark:text-white">คำถามตัวอย่าง:</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {exampleQuestions.map((question, idx) => (
              <button
                key={idx}
                onClick={() => handleExampleClick(question)}
                className="text-left px-4 py-2 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg text-sm transition-colors border border-blue-200 dark:border-blue-700 text-gray-900 dark:text-white"
              >
                {question}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Messages */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg h-[500px] flex flex-col border border-gray-200 dark:border-gray-700">
          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, idx) => (
              <div
                key={idx}
                className={`flex gap-3 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                  </div>
                )}

                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                  }`}
                >
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">
                    {message.content}
                  </p>
                  <span
                    className={`text-xs mt-1 block ${
                      message.role === 'user'
                        ? 'text-white/70'
                        : 'text-gray-500'
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString('th-TH', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                {message.role === 'user' && (
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl px-4 py-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: '0.1s' }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: '0.2s' }}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="พิมพ์คำถามของคุณที่นี่..."
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                disabled={loading}
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white p-3 rounded-full transition-all hover:shadow-lg"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Info Card */}
        <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
            💡 เคล็ดลับการใช้งาน:
          </h3>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>• ถามเกี่ยวกับเมนู ส่วนผสม และวิธีทำอาหาร</li>
            <li>• ค้นหาร้านอาหารและเช็คสถานะออเดอร์</li>
            <li>• สอบถามโปรโมชั่นและวิธีประหยัดค่าใช้จ่าย</li>
            <li>• พิมพ์คำถามเป็นภาษาไทยหรืออังกฤษก็ได้</li>
          </ul>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
