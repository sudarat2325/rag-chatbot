'use client';

import Link from 'next/link';
import { Bot, Github, Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t bg-white/80 backdrop-blur-sm dark:bg-gray-900/80 mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Left - Branding */}
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 p-1.5">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Powered by <span className="font-semibold text-blue-600 dark:text-blue-400">Claude AI</span> & RAG Technology
            </p>
          </div>

          {/* Center - Links */}
          <div className="flex items-center gap-6 text-sm">
            <Link
              href="/"
              className="text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition"
            >
              RAG Chat
            </Link>
            <Link
              href="/chatbot"
              className="text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition"
            >
              Food Bot
            </Link>
            <Link
              href="/food"
              className="text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition"
            >
              Food Delivery
            </Link>
            <Link
              href="/documents"
              className="text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition"
            >
              Documents
            </Link>
          </div>

          {/* Right - Copyright */}
          <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
            <span>Made with</span>
            <Heart className="h-4 w-4 text-red-500 fill-red-500" />
            <span>© 2024</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
