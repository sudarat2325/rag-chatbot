'use client';

import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import {
  HelpCircle,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Mail,
  Phone,
  Search,
} from 'lucide-react';
import Link from 'next/link';

interface FAQ {
  question: string;
  answer: string;
  category: string;
}

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const faqs: FAQ[] = [
    {
      question: 'จะสั่งอาหารได้อย่างไร?',
      answer:
        'เลือกร้านอาหารที่ต้องการ → เลือกเมนูและจำนวน → กดสั่งซื้อ → เลือกที่อยู่จัดส่ง → เลือกวิธีการชำระเงิน → ยืนยันคำสั่งซื้อ',
      category: 'การสั่งอาหาร',
    },
    {
      question: 'ค่าจัดส่งคิดอย่างไร?',
      answer:
        'ค่าจัดส่งขึ้นอยู่กับระยะทางระหว่างร้านอาหารและที่อยู่ของคุณ โดยเริ่มต้นที่ 20 บาท และอาจมีโปรโมชั่นฟรีค่าส่งในบางช่วงเวลา',
      category: 'การชำระเงิน',
    },
    {
      question: 'สามารถยกเลิกคำสั่งซื้อได้หรือไม่?',
      answer:
        'สามารถยกเลิกได้ภายใน 5 นาทีหลังจากสั่งซื้อ หากร้านอาหารรับออเดอร์แล้วจะไม่สามารถยกเลิกได้ กรุณาติดต่อร้านอาหารโดยตรง',
      category: 'การสั่งอาหาร',
    },
    {
      question: 'มีวิธีการชำระเงินอะไรบ้าง?',
      answer:
        'รับชำระเงินด้วยเงินสด, บัตรเครดิต/เดบิต, พร้อมเพย์, และ Mobile Banking ผ่านแอพพลิเคชั่น',
      category: 'การชำระเงิน',
    },
    {
      question: 'ติดตามสถานะออเดอร์ได้อย่างไร?',
      answer:
        'คลิกที่เมนู "ออเดอร์ของฉัน" แล้วเลือกออเดอร์ที่ต้องการติดตาม จะเห็นสถานะแบบ Real-time และแผนที่ตำแหน่งคนขับ',
      category: 'การจัดส่ง',
    },
    {
      question: 'ระยะเวลาการจัดส่งโดยประมาณ?',
      answer:
        'โดยทั่วไปใช้เวลา 30-60 นาที ขึ้นอยู่กับระยะทาง สภาพการจราจร และจำนวนออเดอร์ของร้าน',
      category: 'การจัดส่ง',
    },
    {
      question: 'จะใช้คูปองส่วนลดได้อย่างไร?',
      answer:
        'ไปที่หน้าโปรโมชั่น → คัดลอกรหัสคูปอง → นำไปใส่ในหน้าชำระเงิน ก่อนยืนยันคำสั่งซื้อ',
      category: 'โปรโมชั่น',
    },
    {
      question: 'อาหารมีปัญหาจะทำอย่างไร?',
      answer:
        'กรุณาติดต่อฝ่ายบริการลูกค้าทันทีที่ 02-xxx-xxxx หรือแชทกับเราผ่านแอพ เราจะดำเนินการแก้ไขให้โดยเร็ว',
      category: 'ปัญหา',
    },
    {
      question: 'สามารถเพิ่มรายการโปรดได้หรือไม่?',
      answer:
        'ได้ค่ะ เมื่อเข้าหน้าร้านอาหารให้กดปุ่มรูปหัวใจ ร้านจะถูกเพิ่มเข้ารายการโปรดและสามารถเข้าถึงได้ง่ายจากเมนู "รายการโปรด"',
      category: 'การใช้งานแอพ',
    },
    {
      question: 'แก้ไขที่อยู่จัดส่งได้อย่างไร?',
      answer:
        'ไปที่ "ที่อยู่ของฉัน" ในเมนูโปรไฟล์ → เลือกที่อยู่ที่ต้องการแก้ไข → กดปุ่มแก้ไข → บันทึกการเปลี่ยนแปลง',
      category: 'การใช้งานแอพ',
    },
  ];

  const categories = ['all', ...new Set(faqs.map((faq) => faq.category))];

  const filteredFAQs = faqs.filter((faq) => {
    const matchesSearch =
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'all' || faq.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 dark:from-gray-900 dark:to-gray-800 py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 dark:bg-orange-900/20 rounded-full mb-4">
              <HelpCircle className="w-8 h-8 text-orange-500" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              ศูนย์ช่วยเหลือ
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              มีคำถาม? เราพร้อมช่วยเหลือคุณ
            </p>
          </div>

          {/* Search Bar */}
          <div className="mb-8">
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="ค้นหาคำถามที่พบบ่อย..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-800 dark:text-white shadow-lg text-lg"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2 justify-center mb-8">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-orange-500 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-gray-700'
                }`}
              >
                {category === 'all' ? 'ทั้งหมด' : category}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* FAQ List */}
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                คำถามที่พบบ่อย
              </h2>

              {filteredFAQs.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-12 text-center">
                  <HelpCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    ไม่พบคำถามที่ตรงกับการค้นหา
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredFAQs.map((faq, index) => (
                    <div
                      key={index}
                      className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden"
                    >
                      <button
                        onClick={() =>
                          setExpandedId(expandedId === index ? null : index)
                        }
                        className="w-full p-6 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <div className="flex-1">
                          <span className="inline-block px-3 py-1 bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 text-xs font-medium rounded-full mb-2">
                            {faq.category}
                          </span>
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {faq.question}
                          </h3>
                        </div>
                        {expandedId === index ? (
                          <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0 ml-4" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0 ml-4" />
                        )}
                      </button>

                      {expandedId === index && (
                        <div className="px-6 pb-6">
                          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                            {faq.answer}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Contact Section */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                ติดต่อเรา
              </h2>

              {/* Live Chat */}
              <Link
                href="/chatbot"
                className="block bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-6 text-white hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-white/20 rounded-lg">
                    <MessageCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">แชทสด</h3>
                    <p className="text-sm opacity-90">
                      พูดคุยกับ AI Assistant ตลอด 24 ชั่วโมง
                    </p>
                  </div>
                </div>
              </Link>

              {/* Email */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                    <Mail className="w-6 h-6 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                      อีเมล
                    </h3>
                    <a
                      href="mailto:support@foodhub.com"
                      className="text-sm text-orange-500 hover:text-orange-600"
                    >
                      support@foodhub.com
                    </a>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      ตอบกลับภายใน 24 ชั่วโมง
                    </p>
                  </div>
                </div>
              </div>

              {/* Phone */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                    <Phone className="w-6 h-6 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                      โทรศัพท์
                    </h3>
                    <a
                      href="tel:02-xxx-xxxx"
                      className="text-sm text-orange-500 hover:text-orange-600"
                    >
                      02-xxx-xxxx
                    </a>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      จันทร์-ศุกร์ 9:00-18:00
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Links */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                  ลิงก์ด่วน
                </h3>
                <div className="space-y-3">
                  <Link
                    href="/promotions"
                    className="block text-sm text-orange-500 hover:text-orange-600"
                  >
                    → โปรโมชั่นและคูปอง
                  </Link>
                  <Link
                    href="/orders"
                    className="block text-sm text-orange-500 hover:text-orange-600"
                  >
                    → ติดตามออเดอร์
                  </Link>
                  <Link
                    href="/profile"
                    className="block text-sm text-orange-500 hover:text-orange-600"
                  >
                    → จัดการบัญชี
                  </Link>
                  <Link
                    href="/settings"
                    className="block text-sm text-orange-500 hover:text-orange-600"
                  >
                    → การตั้งค่า
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
