'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingCart, User, Menu, X, Sparkles } from 'lucide-react';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { useEffect, useState } from 'react';

interface HeaderProps {
  userId?: string;
  cartItemCount?: number;
}

export function Header({ userId, cartItemCount = 0 }: HeaderProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setHasScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { href: '/food', label: 'ร้านอาหาร', icon: '🍽️' },
    { href: '/favorites', label: 'รายการโปรด', icon: '❤️' },
    { href: '/orders', label: 'ออเดอร์ของฉัน', icon: '📦' },
    { href: '/become-restaurant', label: 'เป็นพาร์ทเนอร์', icon: '🏪' },
    { href: '/chatbot', label: 'AI Assistant', icon: '🤖' },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        hasScrolled
          ? 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-white/20 dark:border-gray-800/60 shadow-lg shadow-orange-500/5'
          : 'bg-white dark:bg-gray-900'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/food" className="flex items-center gap-3 group">
            <div className="text-2xl drop-shadow-sm transition-transform group-hover:-rotate-6">
              🍕
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-orange-500 via-pink-500 to-red-500 bg-clip-text text-transparent">
              FoodHub
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 rounded-full border border-orange-200/60 bg-gradient-to-r from-orange-50 to-pink-50 px-3 py-1 text-xs font-semibold text-orange-600">
              <Sparkles className="h-3 w-3" />
              Premium
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-2 rounded-full border border-gray-200/60 dark:border-gray-800 px-1 py-1 bg-white/70 dark:bg-gray-900/70 backdrop-blur">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  isActive(item.href)
                    ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/30'
                    : 'text-gray-700 hover:text-orange-600 dark:text-gray-300 dark:hover:text-orange-300'
                }`}
              >
                <span className="mr-2">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-2">
            {/* Notifications */}
            {userId && <NotificationBell userId={userId} />}

            {/* Shopping Cart */}
            <Link
              href="/cart"
              className="relative group p-2 rounded-full bg-white shadow-inner border border-gray-200 dark:border-gray-700 dark:bg-gray-800 transition-all hover:-translate-y-0.5"
              aria-label="Shopping Cart"
            >
              <ShoppingCart className="h-5 w-5 text-gray-900 dark:text-gray-100" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform bg-gradient-to-r from-red-500 to-orange-500 rounded-full shadow-md">
                  {cartItemCount > 99 ? '99+' : cartItemCount}
                </span>
              )}
            </Link>

            {/* User Menu */}
            {userId ? (
              <Link
                href="/profile"
                className="px-3 py-2 rounded-full border border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-500 transition-colors text-sm font-medium text-gray-700 dark:text-gray-200"
                aria-label="Profile"
              >
                <User className="h-5 w-5" />
              </Link>
            ) : (
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-orange-500 to-red-500 rounded-full shadow-lg hover:shadow-orange-500/40 hover:-translate-y-0.5 transition-all"
              >
                เข้าสู่ระบบ
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden py-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-3 rounded-2xl text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                }`}
              >
                <span className="mr-2">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
