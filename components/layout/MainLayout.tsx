'use client';

import { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { useSocket } from '@/lib/hooks/useSocket';

interface MainLayoutProps {
  children: ReactNode;
  userId?: string;
  cartItemCount?: number;
  showFooter?: boolean;
}

export function MainLayout({
  children,
  userId,
  cartItemCount = 0,
  showFooter = true,
}: MainLayoutProps) {
  // Initialize Socket.IO connection
  useSocket(userId);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      <Header userId={userId} cartItemCount={cartItemCount} />

      <main className="flex-1">
        {children}
      </main>

      {showFooter && <Footer />}
    </div>
  );
}
