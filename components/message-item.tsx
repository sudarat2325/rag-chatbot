'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { Copy, Check, Bot, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

interface MessageItemProps {
  role: 'user' | 'assistant';
  content: string;
  sources?: string[];
  index: number;
}

export function MessageItem({ role, content, sources, index }: MessageItemProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      className={`flex gap-4 ${role === 'user' ? 'justify-end' : 'justify-start'}`}
    >
      {role === 'assistant' && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.2, delay: index * 0.1 + 0.1 }}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-purple-600 shadow-lg"
        >
          <Bot className="h-5 w-5 text-white" />
        </motion.div>
      )}

      <div
        className={`group relative max-w-[80%] rounded-2xl px-4 py-3 shadow-md transition-all hover:shadow-lg ${
          role === 'user'
            ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white'
            : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700'
        }`}
      >
        {/* Copy Button */}
        <button
          onClick={copyToClipboard}
          className={`absolute -top-2 -right-2 rounded-full p-2 opacity-0 transition-opacity group-hover:opacity-100 ${
            role === 'user'
              ? 'bg-blue-800 hover:bg-blue-900'
              : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600'
          }`}
          title="Copy message"
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className={`h-4 w-4 ${role === 'user' ? 'text-white' : 'text-gray-600 dark:text-gray-300'}`} />
          )}
        </button>

        {/* Message Content with Markdown */}
        {role === 'assistant' ? (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ node, inline, className, children, ...props }: any) {
                  const match = /language-(\w+)/.exec(className || '');
                  return !inline && match ? (
                    <SyntaxHighlighter
                      style={vscDarkPlus as any}
                      language={match[1]}
                      PreTag="div"
                      className="rounded-md !my-2"
                      {...props}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  ) : (
                    <code className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded text-sm" {...props}>
                      {children}
                    </code>
                  );
                },
                a({ node, children, href, ...props }: any) {
                  return (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                      {...props}
                    >
                      {children}
                    </a>
                  );
                },
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        ) : (
          <p className="whitespace-pre-wrap">{content}</p>
        )}

        {/* Sources */}
        {sources && sources.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="mt-3 border-t pt-3 text-sm opacity-75 border-gray-300 dark:border-gray-600"
          >
            <p className="font-semibold mb-2 flex items-center gap-2">
              📚 Sources:
            </p>
            <div className="flex flex-wrap gap-2">
              {Array.from(new Set(sources)).map((source, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2, delay: i * 0.05 }}
                  className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900/30 px-3 py-1 text-xs font-medium text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-700"
                  title={source}
                >
                  {source.length > 40 ? source.substring(0, 40) + '...' : source}
                </motion.span>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {role === 'user' && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.2, delay: index * 0.1 + 0.1 }}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gray-600 to-gray-700 shadow-lg"
        >
          <User className="h-5 w-5 text-white" />
        </motion.div>
      )}
    </motion.div>
  );
}
