'use client';

import Link from 'next/link';
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin, Send } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-950 text-gray-300 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-pink-500/5 to-purple-600/10" />
      <div className="relative container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
          {/* Company Info */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="text-3xl">🍕</div>
              <span className="text-xl font-bold text-white">FoodHub</span>
            </div>
            <p className="text-sm text-gray-400 mb-5 leading-relaxed">
              บริการสั่งอาหารออนไลน์ที่ดีที่สุด ส่งตรงถึงบ้านคุณอย่างรวดเร็ว พร้อมทีมซัพพอร์ต 24/7
            </p>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 mb-6">
              <p className="text-xs uppercase tracking-widest text-gray-400 mb-3">Stay in the loop</p>
              <form className="flex items-center gap-2">
                <input
                  type="email"
                  placeholder="อีเมลของคุณ"
                  className="flex-1 rounded-xl bg-black/20 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500/60"
                />
                <button
                  type="button"
                  className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-orange-500/40"
                >
                  <Send className="h-4 w-4" />
                  ส่ง
                </button>
              </form>
            </div>
            <div className="flex space-x-3">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-gray-800 hover:bg-orange-500 transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-gray-800 hover:bg-orange-500 transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-gray-800 hover:bg-orange-500 transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">ลิงก์ด่วน</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/food" className="text-sm hover:text-orange-500 transition-colors">
                  ร้านอาหาร
                </Link>
              </li>
              <li>
                <Link href="/orders" className="text-sm hover:text-orange-500 transition-colors">
                  ออเดอร์ของฉัน
                </Link>
              </li>
              <li>
                <Link href="/chatbot" className="text-sm hover:text-orange-500 transition-colors">
                  AI Assistant
                </Link>
              </li>
              <li>
                <Link href="/documents" className="text-sm hover:text-orange-500 transition-colors">
                  Documents
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-white font-semibold mb-4">สำหรับร้านค้า</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/restaurant/register" className="text-sm hover:text-orange-500 transition-colors">
                  ลงทะเบียนร้านค้า
                </Link>
              </li>
              <li>
                <Link href="/restaurant/dashboard" className="text-sm hover:text-orange-500 transition-colors">
                  จัดการร้านค้า
                </Link>
              </li>
              <li>
                <Link href="/driver/register" className="text-sm hover:text-orange-500 transition-colors">
                  สมัครเป็นคนขับ
                </Link>
              </li>
              <li>
                <Link href="/help" className="text-sm hover:text-orange-500 transition-colors">
                  ช่วยเหลือ
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4">ติดต่อเรา</h3>
            <ul className="space-y-3">
              <li className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm">123 ถนนสุขุมวิท กรุงเทพฯ 10110</span>
              </li>
              <li className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-orange-500 flex-shrink-0" />
                <a href="tel:0212345678" className="text-sm hover:text-orange-500 transition-colors">
                  02-123-4567
                </a>
              </li>
              <li className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-orange-500 flex-shrink-0" />
                <a href="mailto:support@foodhub.com" className="text-sm hover:text-orange-500 transition-colors">
                  support@foodhub.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 mt-10 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-400">
              © {currentYear} FoodHub. All rights reserved.
            </p>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
              <Link href="/privacy" className="hover:text-orange-400 transition">
                นโยบายความเป็นส่วนตัว
              </Link>
              <Link href="/terms" className="hover:text-orange-400 transition">
                เงื่อนไขการใช้งาน
              </Link>
              <Link href="/cookies" className="hover:text-orange-400 transition">
                นโยบายคุกกี้
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
