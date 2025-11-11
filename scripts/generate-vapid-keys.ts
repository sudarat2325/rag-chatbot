#!/usr/bin/env tsx
/**
 * Generate VAPID keys for Web Push Notifications
 *
 * Run this script once to generate keys for your application:
 * npx tsx scripts/generate-vapid-keys.ts
 *
 * Then add the generated keys to your .env file
 */

import webpush from 'web-push';

function generateVapidKeys() {
  console.warn('🔑 Generating VAPID Keys for Web Push Notifications...\n');

  const keys = webpush.generateVAPIDKeys();

  console.warn('✅ VAPID Keys Generated Successfully!\n');
  console.warn('📋 Copy these to your .env file:\n');
  console.warn('─'.repeat(80));
  console.warn(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${keys.publicKey}`);
  console.warn(`VAPID_PRIVATE_KEY=${keys.privateKey}`);
  console.warn('─'.repeat(80));
  console.warn('\n📌 Also add your contact email:');
  console.warn(`VAPID_EMAIL=mailto:your-email@example.com`);
  console.warn('\n💡 Make sure to replace "your-email@example.com" with your actual email\n');

  return keys;
}

// Run the generator
generateVapidKeys();
