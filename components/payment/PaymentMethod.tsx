'use client';

import React, { useState } from 'react';
import { CreditCard, Smartphone, Wallet, DollarSign, QrCode } from 'lucide-react';

interface PaymentMethodProps {
  selectedMethod: string;
  onMethodChange: (method: string) => void;
  walletBalance?: number;
}

export function PaymentMethod({ selectedMethod, onMethodChange, walletBalance = 0 }: PaymentMethodProps) {
  const paymentMethods = [
    {
      id: 'PROMPTPAY',
      name: 'PromptPay QR',
      icon: <QrCode className="w-6 h-6" />,
      description: 'สแกน QR Code ชำระเงิน',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      id: 'WALLET',
      name: 'FoodHub Wallet',
      icon: <Wallet className="w-6 h-6" />,
      description: `ยอดคงเหลือ: ฿${walletBalance.toFixed(2)}`,
      color: 'from-purple-500 to-pink-500',
    },
    {
      id: 'CREDIT_CARD',
      name: 'Credit Card',
      icon: <CreditCard className="w-6 h-6" />,
      description: 'Visa, Mastercard',
      color: 'from-green-500 to-emerald-500',
      disabled: true,
      badge: 'Coming Soon',
    },
    {
      id: 'MOBILE_BANKING',
      name: 'Mobile Banking',
      icon: <Smartphone className="w-6 h-6" />,
      description: 'ธนาคารต่างๆ',
      color: 'from-orange-500 to-red-500',
      disabled: true,
      badge: 'Coming Soon',
    },
    {
      id: 'CASH',
      name: 'เงินสด',
      icon: <DollarSign className="w-6 h-6" />,
      description: 'ชำระเมื่อได้รับสินค้า',
      color: 'from-gray-500 to-slate-500',
    },
  ];

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        เลือกวิธีชำระเงิน
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {paymentMethods.map((method) => (
          <button
            key={method.id}
            onClick={() => !method.disabled && onMethodChange(method.id)}
            disabled={method.disabled}
            className={`relative p-4 rounded-xl border-2 transition-all ${
              selectedMethod === method.id
                ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            } ${
              method.disabled
                ? 'opacity-50 cursor-not-allowed'
                : 'cursor-pointer hover:shadow-md'
            }`}
          >
            {/* Badge */}
            {method.badge && (
              <span className="absolute top-2 right-2 px-2 py-1 text-xs font-semibold text-white bg-gradient-to-r from-orange-500 to-red-500 rounded-full">
                {method.badge}
              </span>
            )}

            <div className="flex items-start space-x-3">
              {/* Icon */}
              <div
                className={`flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br ${method.color} flex items-center justify-center text-white`}
              >
                {method.icon}
              </div>

              {/* Info */}
              <div className="flex-1 text-left">
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  {method.name}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {method.description}
                </p>
              </div>

              {/* Radio */}
              <div className="flex-shrink-0">
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedMethod === method.id
                      ? 'border-orange-500 bg-orange-500'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                >
                  {selectedMethod === method.id && (
                    <div className="w-2 h-2 rounded-full bg-white"></div>
                  )}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
