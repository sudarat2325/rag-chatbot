'use client';

import { useState } from 'react';
import { PromptPayQR } from '@/components/payment/PromptPayQR';
import { WalletCard } from '@/components/payment/WalletCard';
import { LoyaltyCard } from '@/components/payment/LoyaltyCard';
import { ArrowLeft, Wallet, QrCode } from 'lucide-react';
import Link from 'next/link';

export default function PaymentDemoPage() {
  const [selectedMethod, setSelectedMethod] = useState<'qr' | 'wallet' | null>(null);
  const [amount, setAmount] = useState<number>(100);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [paymentId, setPaymentId] = useState<string>('');
  const [paymentStatus, setPaymentStatus] = useState<string>('');

  // Mock user ID for demo
  const demoUserId = '690b86f51ae3dae3cb00cbb4';

  const quickAmounts = [50, 100, 200, 500, 1000];

  const handleGenerateQR = async () => {
    setLoading(true);
    try {
      // Create a mock order first (in real app, this would be from order page)
      const mockOrderId = `demo-order-${Date.now()}`;

      // Call API to create payment and generate QR
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: mockOrderId,
          amount,
          method: 'PROMPTPAY',
          userId: demoUserId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setQrCodeUrl(data.data.qrCodeUrl);
        setPaymentId(data.data.payment.id);
        setPaymentStatus('PENDING');
      } else {
        alert('Error generating QR: ' + data.error);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to generate QR code');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!paymentId) return;

    try {
      const response = await fetch('/api/payments/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId,
          userId: demoUserId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setPaymentStatus('PAID');
        alert('✅ ชำระเงินสำเร็จ! ได้รับ Loyalty Points: ' + data.data.loyaltyPoints?.pointsEarned);
      } else {
        alert('Error confirming payment: ' + data.error);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to confirm payment');
    }
  };

  const handleReset = () => {
    setSelectedMethod(null);
    setQrCodeUrl('');
    setPaymentId('');
    setPaymentStatus('');
    setAmount(100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-600 dark:text-gray-400 hover:text-orange-500">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                💳 Payment System Demo
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                ทดสอบระบบชำระเงิน PromptPay QR, Wallet, และ Loyalty Points
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Payment Method Selection */}
          <div className="lg:col-span-2 space-y-6">
            {/* Info Card */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                📱 วิธีทดสอบ QR Code
              </h3>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>1. เลือกจำนวนเงินและกด "สร้าง QR Code"</li>
                <li>2. เปิดแอพ PromptPay บนมือถือ (เช่น แอพธนาคาร)</li>
                <li>3. Scan QR Code บนหน้าจอ</li>
                <li>
                  4. ใน Demo นี้ใช้ PromptPay ID:{' '}
                  <span className="font-mono font-bold">0891112222</span>
                </li>
                <li className="text-yellow-700 dark:text-yellow-300">
                  ⚠️ สำหรับ Demo เท่านั้น - กด "Mock Confirm Payment" เพื่อจำลองการชำระเงิน
                </li>
              </ul>
            </div>

            {/* Amount Selection */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                เลือกจำนวนเงิน
              </h2>

              {/* Quick Amount Buttons */}
              <div className="grid grid-cols-5 gap-3 mb-4">
                {quickAmounts.map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setAmount(amt)}
                    className={`py-3 px-4 rounded-lg font-semibold transition-all ${
                      amount === amt
                        ? 'bg-orange-500 text-white shadow-lg scale-105'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {amt}
                  </button>
                ))}
              </div>

              {/* Custom Amount Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  หรือใส่จำนวนเงินเอง
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full px-4 py-3 text-lg font-bold border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                    min="1"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 font-medium">
                    THB
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Method Selection */}
            {!selectedMethod && !qrCodeUrl && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  เลือกวิธีการชำระเงิน
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* PromptPay QR */}
                  <button
                    onClick={() => {
                      setSelectedMethod('qr');
                      handleGenerateQR();
                    }}
                    disabled={loading || amount <= 0}
                    className="group relative overflow-hidden p-6 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-orange-500 dark:hover:border-orange-500 transition-all hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative">
                      <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform">
                        <QrCode className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                      </div>
                      <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-2">
                        PromptPay QR
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        สแกน QR Code ด้วยแอพธนาคาร
                      </p>
                    </div>
                  </button>

                  {/* Wallet */}
                  <button
                    onClick={() => setSelectedMethod('wallet')}
                    className="group relative overflow-hidden p-6 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-orange-500 dark:hover:border-orange-500 transition-all hover:shadow-xl"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative">
                      <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform">
                        <Wallet className="w-8 h-8 text-green-600 dark:text-green-400" />
                      </div>
                      <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-2">
                        Wallet
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        ใช้เงินในกระเป๋า
                      </p>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* QR Code Display */}
            {selectedMethod === 'qr' && qrCodeUrl && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <PromptPayQR
                  qrCodeUrl={qrCodeUrl}
                  amount={amount}
                  paymentId={paymentId}
                  onSuccess={handleConfirmPayment}
                  onCancel={handleReset}
                />

                {/* Mock Payment Confirmation Button */}
                {paymentStatus === 'PENDING' && (
                  <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-3">
                      🧪 Demo Mode: กดปุ่มด้านล่างเพื่อจำลองการชำระเงินสำเร็จ
                    </p>
                    <button
                      onClick={handleConfirmPayment}
                      className="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors"
                    >
                      ✅ Mock Confirm Payment
                    </button>
                  </div>
                )}

                {paymentStatus === 'PAID' && (
                  <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <p className="text-green-800 dark:text-green-200 font-semibold text-center">
                      ✅ ชำระเงินสำเร็จ!
                    </p>
                    <button
                      onClick={handleReset}
                      className="w-full mt-3 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-medium rounded-lg transition-colors"
                    >
                      ทดสอบใหม่
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Wallet Display */}
            {selectedMethod === 'wallet' && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Wallet Demo
                  </h2>
                  <button
                    onClick={handleReset}
                    className="text-gray-600 dark:text-gray-400 hover:text-orange-500"
                  >
                    ← ย้อนกลับ
                  </button>
                </div>
                <WalletCard userId={demoUserId} />
              </div>
            )}
          </div>

          {/* Right Column - Loyalty Card */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Loyalty Points
              </h2>
              <LoyaltyCard userId={demoUserId} />
            </div>

            {/* Payment Summary */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4">
                สรุปการชำระเงิน
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">จำนวนเงิน:</span>
                  <span className="font-bold text-gray-900 dark:text-white text-lg">
                    ฿{amount}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Points ที่จะได้:</span>
                  <span className="font-semibold text-orange-500">
                    +{Math.floor(amount / 10)} pts
                  </span>
                </div>
                {paymentStatus && (
                  <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">สถานะ:</span>
                      <span
                        className={`font-semibold ${
                          paymentStatus === 'PAID'
                            ? 'text-green-600'
                            : 'text-yellow-600'
                        }`}
                      >
                        {paymentStatus === 'PAID' ? '✅ สำเร็จ' : '⏳ รอชำระเงิน'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
