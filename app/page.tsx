'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, Loader2, FileText, Download, ChevronDown, Mic, MicOff, Trash2, MessageSquarePlus, Sparkles } from 'lucide-react';
import { MessageItem } from '@/components/message-item';
import { Navigation } from '@/components/navigation';
import { Footer } from '@/components/footer';
import { exportToJSON, exportToMarkdown, exportToPDF } from '@/lib/export-utils';
import toast from 'react-hot-toast';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: string[];
}

// Web Speech API types
interface SpeechRecognitionType extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventType) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionEventType {
  results: {
    [key: number]: {
      [key: number]: {
        transcript: string;
      };
      isFinal: boolean;
    };
    length: number;
  };
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionType;

interface SpeechRecognitionWindow extends Window {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [documentCount, setDocumentCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognitionType | null>(null);

  const suggestedQuestions = [
    "What are the main topics covered in these documents?",
    "Summarize the key points from the documents",
    "เอกสารนี้เขียนถึงอะไรบ้าง?",
    "อธิบายเนื้อหาสำคัญในเอกสาร",
  ];

  // Load chat history and document count on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedMessages = localStorage.getItem('chatHistory');
      if (savedMessages) {
        try {
          const parsed = JSON.parse(savedMessages);
          setMessages(parsed);
        } catch (error) {
          console.error('Error loading chat history:', error);
        }
      }
      setIsHydrated(true);
      loadDocumentCount();
    }
  }, []);

  // Save chat history to localStorage whenever messages change
  useEffect(() => {
    if (isHydrated && typeof window !== 'undefined') {
      localStorage.setItem('chatHistory', JSON.stringify(messages));
    }
  }, [messages, isHydrated]);

  // Load document count
  const loadDocumentCount = async () => {
    try {
      const response = await fetch('/api/documents');
      if (response.ok) {
        const data = await response.json();
        setDocumentCount(data.total || 0);
      }
    } catch (error) {
      console.error('Error loading document count:', error);
    }
  };

  const handleExport = (format: 'json' | 'markdown' | 'pdf') => {
    if (messages.length === 0) {
      toast.error('No messages to export');
      return;
    }

    try {
      if (format === 'json') {
        exportToJSON(messages);
        toast.success('Chat exported as JSON');
      } else if (format === 'markdown') {
        exportToMarkdown(messages);
        toast.success('Chat exported as Markdown');
      } else if (format === 'pdf') {
        exportToPDF(messages);
        toast.success('Chat exported as PDF');
      }
      setShowExportMenu(false);
    } catch (error) {
      toast.error('Failed to export chat');
      console.error('Export error:', error);
    }
  };

  const handleClearChat = () => {
    if (messages.length === 0) {
      toast.error('No messages to clear');
      return;
    }

    if (confirm('Are you sure you want to clear all chat history?')) {
      setMessages([]);
      localStorage.removeItem('chatHistory');
      toast.success('Chat history cleared');
    }
  };

  const handleNewChat = () => {
    if (messages.length === 0) {
      toast.error('No messages to start new chat');
      return;
    }

    if (confirm('Start a new conversation? Current chat will be saved in history.')) {
      setMessages([]);
      setInput('');
      toast.success('New chat started');
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    setInput(question);
    toast.success('Question filled! Press send to ask.');
  };

  const initializeVoiceRecognition = () => {
    if (typeof window !== 'undefined') {
      const win = window as SpeechRecognitionWindow;
      const SpeechRecognitionCtor = win.SpeechRecognition || win.webkitSpeechRecognition;

      if (SpeechRecognitionCtor) {
        const recognition = new SpeechRecognitionCtor();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
          setIsListening(true);
          toast.success('Listening... Speak now');
        };

        recognition.onresult = (event: SpeechRecognitionEventType) => {
          const transcript = event.results[0][0].transcript;
          setInput(transcript);
          toast.success('Voice input captured');
        };

        recognition.onerror = (event: { error: string }) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
          if (event.error === 'not-allowed') {
            toast.error('Microphone access denied');
          } else if (event.error === 'no-speech') {
            toast.error('No speech detected');
          } else {
            toast.error('Voice recognition error');
          }
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  };

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      initializeVoiceRecognition();
    }

    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (error) {
          console.error('Error starting recognition:', error);
          toast.error('Voice recognition not supported in this browser');
        }
      } else {
        toast.error('Voice recognition not supported in this browser');
      }
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Initialize voice recognition on mount
  useEffect(() => {
    initializeVoiceRecognition();
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    };

    if (showExportMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showExportMenu]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: input,
          chatHistory: messages.map((m) => m.content),
        }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const data = await response.json();
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.answer,
        sources: data.sources,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen flex-col bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Navigation */}
      <Navigation />

      {/* Action Bar */}
      <div className="border-b bg-white/80 backdrop-blur-sm dark:bg-gray-900/80">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            {/* Document Count Badge */}
            {documentCount > 0 && (
              <div className="flex items-center gap-2 rounded-lg bg-green-100 dark:bg-green-900/30 px-3 py-2 text-sm font-medium text-green-800 dark:text-green-300 border border-green-200 dark:border-green-700">
                <FileText className="h-4 w-4" />
                <span>{documentCount} docs</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* New Chat Button */}
            <button
              onClick={handleNewChat}
              disabled={messages.length === 0}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-blue-900/20 dark:hover:border-blue-600"
              title="Start new chat"
            >
              <MessageSquarePlus className="h-5 w-5" />
            </button>

            {/* Clear Chat Button */}
            <button
              onClick={handleClearChat}
              disabled={messages.length === 0}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-700 hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-red-900/20 dark:hover:border-red-600"
              title="Clear chat history"
            >
              <Trash2 className="h-5 w-5" />
            </button>

            {/* Export Dropdown */}
            <div className="relative z-20" ref={exportMenuRef}>
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                disabled={messages.length === 0}
                className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                title="Export chat history"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Export</span>
                <ChevronDown className="h-3 w-3" />
              </button>

              {showExportMenu && (
                <div
                  className="absolute right-0 top-full mt-2 w-48 rounded-xl bg-white dark:bg-gray-800 shadow-2xl border-2 border-gray-300 dark:border-gray-600"
                  style={{ zIndex: 999999 }}
                >
                  <div className="p-2.5 space-y-1.5">
                    <button
                      onClick={() => handleExport('json')}
                      className="w-full px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 rounded-lg transition-all text-left flex items-center gap-2"
                    >
                      <span className="text-lg">📄</span>
                      <span>JSON</span>
                    </button>
                    <button
                      onClick={() => handleExport('markdown')}
                      className="w-full px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 rounded-lg transition-all text-left flex items-center gap-2"
                    >
                      <span className="text-lg">📝</span>
                      <span>Markdown</span>
                    </button>
                    <button
                      onClick={() => handleExport('pdf')}
                      className="w-full px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 rounded-lg transition-all text-left flex items-center gap-2"
                    >
                      <span className="text-lg">📕</span>
                      <span>PDF</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto max-w-4xl px-4 py-8">
          {messages.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center max-w-3xl mx-auto">
                <div className="mb-6">
                  <div className="mx-auto h-20 w-20 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg">
                    <Bot className="h-10 w-10 text-white" />
                  </div>
                </div>
                <h2 className="mt-4 text-3xl font-bold text-gray-900 dark:text-white">
                  Start a conversation
                </h2>
                <p className="mt-3 text-lg text-gray-600 dark:text-gray-400">
                  Ask me anything about your documents
                </p>

                {/* Suggested Questions */}
                {documentCount > 0 && (
                  <div className="mt-8">
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Try asking:
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {suggestedQuestions.map((question, index) => (
                        <button
                          key={index}
                          onClick={() => handleSuggestedQuestion(question)}
                          className="group relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 text-left transition-all hover:border-blue-400 hover:shadow-lg hover:-translate-y-1"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                          <p className="relative text-sm text-gray-700 dark:text-gray-300 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
                            {question}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {documentCount === 0 && (
                  <div className="mt-8 p-6 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700">
                    <p className="text-sm text-yellow-800 dark:text-yellow-300">
                      📁 No documents found. Please upload documents first to start chatting.
                    </p>
                    <a
                      href="/documents"
                      className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-yellow-900 dark:text-yellow-200 hover:underline"
                    >
                      <FileText className="h-4 w-4" />
                      Go to Documents
                    </a>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((message, index) => (
                <MessageItem
                  key={index}
                  role={message.role}
                  content={message.content}
                  sources={message.sources}
                  index={index}
                />
              ))}
              {isLoading && (
                <div className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-purple-600 shadow-lg">
                    <Bot className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex items-center gap-2 rounded-2xl bg-white px-4 py-3 shadow-md dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    <span className="text-gray-600 dark:text-gray-300">
                      Thinking...
                    </span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input Form */}
      <div className="border-t bg-white/80 backdrop-blur-sm dark:bg-gray-900/80">
        <div className="container mx-auto max-w-4xl px-4 py-4">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question about your documents..."
              className="flex-1 rounded-lg border bg-white px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white dark:border-gray-700"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={toggleVoiceInput}
              disabled={isLoading}
              className={`rounded-lg px-4 py-3 font-medium transition focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${
                isListening
                  ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200'
              }`}
              title={isListening ? 'Stop recording' : 'Voice input'}
            >
              {isListening ? (
                <MicOff className="h-5 w-5" />
              ) : (
                <Mic className="h-5 w-5" />
              )}
            </button>
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
