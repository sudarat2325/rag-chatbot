'use client';

import { useEffect, useState } from 'react';
import { X, Download, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed
    const isInStandaloneMode = () =>
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

    setIsStandalone(isInStandaloneMode());

    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      // Check if user has dismissed before
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      const dismissedTime = dismissed ? parseInt(dismissed, 10) : 0;
      const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);

      // Show prompt if not dismissed or dismissed more than 7 days ago
      if (!dismissed || daysSinceDismissed > 7) {
        setTimeout(() => setShowPrompt(true), 3000); // Show after 3 seconds
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user's response
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }

    // Clear the deferred prompt
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  // Don't show if already installed
  if (isStandalone) {
    return null;
  }

  // iOS Install Instructions
  if (isIOS && showPrompt) {
    return (
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 animate-slide-up">
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl shadow-2xl p-4 text-white">
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 p-1 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-start gap-3">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center flex-shrink-0">
              <Smartphone className="w-6 h-6 text-orange-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg mb-2">ติดตั้งแอพ Food Delivery</h3>
              <p className="text-sm text-orange-50 mb-3">
                ติดตั้งแอพเพื่อประสบการณ์ที่ดีขึ้นและเข้าถึงได้เร็วขึ้น
              </p>
              <div className="text-sm space-y-2 bg-white/10 rounded-lg p-3">
                <p className="font-semibold">วิธีติดตั้ง:</p>
                <ol className="space-y-1 text-orange-50 list-decimal list-inside">
                  <li>แตะปุ่ม <strong>Share</strong> (ไอคอนแชร์)</li>
                  <li>เลื่อนลงและแตะ <strong>&quot;Add to Home Screen&quot;</strong></li>
                  <li>แตะ <strong>&quot;Add&quot;</strong> เพื่อยืนยัน</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Android/Desktop Install Prompt
  if (showPrompt && deferredPrompt) {
    return (
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 animate-slide-up">
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl shadow-2xl p-4 text-white">
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 p-1 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-start gap-3">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center flex-shrink-0">
              <Download className="w-6 h-6 text-orange-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg mb-1">ติดตั้งแอพ Food Delivery</h3>
              <p className="text-sm text-orange-50 mb-3">
                ติดตั้งแอพเพื่อเข้าถึงได้เร็วขึ้น ใช้งานออฟไลน์ได้ และรับการแจ้งเตือนแบบ Push
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleInstallClick}
                  className="flex-1 bg-white text-orange-600 font-semibold py-2 px-4 rounded-lg hover:bg-orange-50 transition-colors"
                >
                  ติดตั้งเลย
                </button>
                <button
                  onClick={handleDismiss}
                  className="px-4 py-2 text-white hover:bg-white/20 rounded-lg transition-colors"
                >
                  ไว้ทีหลัง
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
