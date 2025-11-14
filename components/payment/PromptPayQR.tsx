'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, Download } from 'lucide-react';
import Image from 'next/image';

interface PromptPayQRProps {
  qrCodeUrl: string;
  amount: number;
  paymentId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function PromptPayQR({
  qrCodeUrl,
  amount,
  paymentId,
  onSuccess,
  onCancel,
}: PromptPayQRProps) {
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutes
  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const handleConfirmPayment = async () => {
    setIsConfirming(true);
    try {
      const response = await fetch('/api/payments/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId,
          status: 'PAID',
        }),
      });

      const data = await response.json();

      if (data.success) {
        onSuccess?.();
      } else {
        alert('เกิดข้อผิดพลาด: ' + data.error);
      }
    } catch (error) {
      console.error('Error confirming payment:', error);
      alert('ไม่สามารถยืนยันการชำระเงินได้');
    } finally {
      setIsConfirming(false);
    }
  };

  const downloadQR = () => {
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `promptpay-${paymentId}.png`;
    link.click();
  };

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full mb-4">
          <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3 9h18v2H3V9zm0 4h18v2H3v-2z" />
            <path d="M3 5h18v2H3V5zm0 12h18v2H3v-2z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          สแกน QR Code เพื่อชำระเงิน
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          ยอดชำระ: <span className="text-2xl font-bold text-orange-500">฿{amount.toFixed(2)}</span>
        </p>
      </div>

      {/* QR Code */}
      <div className="bg-white p-6 rounded-xl mb-6 flex justify-center">
        <div className="relative">
          <Image
            src={qrCodeUrl}
            alt="PromptPay QR Code"
            width={300}
            height={300}
            className="rounded-lg"
          />
          <button
            onClick={downloadQR}
            className="absolute bottom-2 right-2 p-2 bg-white/90 rounded-lg shadow-lg hover:bg-white transition-colors"
          >
            <Download className="w-5 h-5 text-gray-700" />
          </button>
        </div>
      </div>

      {/* Timer */}
      <div className="flex items-center justify-center space-x-2 mb-6">
        <Clock className="w-5 h-5 text-orange-500" />
        <span
          className={`text-lg font-semibold ${
            timeLeft < 60 ? 'text-red-500' : 'text-gray-700 dark:text-gray-300'
          }`}
        >
          {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
        </span>
        <span className="text-sm text-gray-500">เหลือเวลา</span>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
          วิธีชำระเงิน:
        </h3>
        <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800 dark:text-blue-200">
          <li>เปิดแอปธนาคารหรือ Mobile Banking</li>
          <li>เลือก "สแกน QR Code"</li>
          <li>สแกน QR Code ด้านบน</li>
          <li>ตรวจสอบยอดเงินและยืนยันการชำระ</li>
          <li>กดปุ่ม "ยืนยันการชำระเงิน" ด้านล่าง</li>
        </ol>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          ยกเลิก
        </button>
        <button
          onClick={handleConfirmPayment}
          disabled={isConfirming}
          className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg font-semibold text-white hover:from-orange-600 hover:to-red-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isConfirming ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              กำลังยืนยัน...
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5" />
              ชำระเงินเรียบร้อย
            </>
          )}
        </button>
      </div>

      {/* Warning */}
      {timeLeft === 0 && (
        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-start space-x-3">
          <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-900 dark:text-red-100">QR Code หมดอายุ</p>
            <p className="text-sm text-red-700 dark:text-red-200">
              กรุณาสร้าง QR Code ใหม่อีกครั้ง
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
