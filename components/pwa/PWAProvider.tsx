'use client';

import { usePWA } from '@/lib/hooks/usePWA';
import { InstallPrompt } from './InstallPrompt';
import { UpdatePrompt } from './UpdatePrompt';
import { OfflineIndicator } from './OfflineIndicator';

export function PWAProvider({ children }: { children: React.ReactNode }) {
  const { isOnline, isUpdateAvailable, updateServiceWorker } = usePWA();

  return (
    <>
      {children}
      <InstallPrompt />
      {isUpdateAvailable && <UpdatePrompt onUpdate={updateServiceWorker} />}
      {!isOnline && <OfflineIndicator />}
    </>
  );
}
