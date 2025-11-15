import { createCanvas } from 'canvas';
import fs from 'fs';
import path from 'path';

const OUTPUT_DIR = path.join(process.cwd(), 'public', 'icons');

// Icon sizes to generate
const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

// Color scheme
const COLORS = {
  primary: '#f97316', // Orange
  secondary: '#ea580c',
  background: '#ffffff',
  text: '#ffffff',
};

function drawIcon(size: number): Buffer {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, COLORS.primary);
  gradient.addColorStop(1, COLORS.secondary);

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  // Draw food icon (simplified bowl/dish)
  ctx.fillStyle = COLORS.text;

  const centerX = size / 2;
  const centerY = size / 2;
  const iconSize = size * 0.6;

  // Draw a simple food bowl icon
  ctx.beginPath();
  // Bowl shape
  ctx.arc(centerX, centerY + iconSize * 0.1, iconSize * 0.35, 0, Math.PI, true);
  ctx.lineTo(centerX - iconSize * 0.35, centerY + iconSize * 0.1);
  ctx.quadraticCurveTo(
    centerX,
    centerY + iconSize * 0.4,
    centerX + iconSize * 0.35,
    centerY + iconSize * 0.1
  );
  ctx.fill();

  // Draw food items (circles representing food)
  const foodSize = iconSize * 0.12;
  ctx.beginPath();
  ctx.arc(centerX - iconSize * 0.15, centerY - iconSize * 0.1, foodSize, 0, Math.PI * 2);
  ctx.arc(centerX + iconSize * 0.15, centerY - iconSize * 0.1, foodSize, 0, Math.PI * 2);
  ctx.arc(centerX, centerY - iconSize * 0.05, foodSize, 0, Math.PI * 2);
  ctx.fill();

  // Add steam effect
  ctx.strokeStyle = COLORS.text;
  ctx.lineWidth = size * 0.02;
  ctx.lineCap = 'round';

  // Steam lines
  for (let i = 0; i < 3; i++) {
    const offsetX = (i - 1) * iconSize * 0.15;
    ctx.beginPath();
    ctx.moveTo(centerX + offsetX, centerY - iconSize * 0.25);
    ctx.quadraticCurveTo(
      centerX + offsetX - iconSize * 0.05,
      centerY - iconSize * 0.35,
      centerX + offsetX,
      centerY - iconSize * 0.45
    );
    ctx.stroke();
  }

  return canvas.toBuffer('image/png');
}

function drawShortcutIcon(size: number, type: 'order' | 'orders' | 'chat'): Buffer {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, COLORS.primary);
  gradient.addColorStop(1, COLORS.secondary);

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  ctx.fillStyle = COLORS.text;
  ctx.strokeStyle = COLORS.text;
  ctx.lineWidth = size * 0.08;

  const centerX = size / 2;
  const centerY = size / 2;
  const iconSize = size * 0.5;

  if (type === 'order') {
    // Shopping cart icon
    ctx.beginPath();
    // Cart body
    ctx.rect(centerX - iconSize * 0.3, centerY - iconSize * 0.2, iconSize * 0.6, iconSize * 0.5);
    // Wheels
    ctx.arc(centerX - iconSize * 0.15, centerY + iconSize * 0.5, iconSize * 0.1, 0, Math.PI * 2);
    ctx.arc(centerX + iconSize * 0.15, centerY + iconSize * 0.5, iconSize * 0.1, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === 'orders') {
    // List icon
    for (let i = 0; i < 3; i++) {
      const y = centerY - iconSize * 0.3 + i * iconSize * 0.3;
      ctx.fillRect(centerX - iconSize * 0.4, y, iconSize * 0.8, iconSize * 0.12);
    }
  } else if (type === 'chat') {
    // Chat bubble icon
    ctx.beginPath();
    ctx.roundRect(
      centerX - iconSize * 0.4,
      centerY - iconSize * 0.3,
      iconSize * 0.8,
      iconSize * 0.6,
      iconSize * 0.1
    );
    ctx.fill();
    // Tail
    ctx.beginPath();
    ctx.moveTo(centerX - iconSize * 0.2, centerY + iconSize * 0.3);
    ctx.lineTo(centerX - iconSize * 0.3, centerY + iconSize * 0.5);
    ctx.lineTo(centerX - iconSize * 0.1, centerY + iconSize * 0.3);
    ctx.fill();
  }

  return canvas.toBuffer('image/png');
}

function drawNotificationIcon(size: number): Buffer {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = COLORS.primary;
  ctx.fillRect(0, 0, size, size);

  ctx.fillStyle = COLORS.text;
  const centerX = size / 2;
  const centerY = size / 2;
  const iconSize = size * 0.6;

  // Bell shape
  ctx.beginPath();
  ctx.arc(centerX, centerY - iconSize * 0.1, iconSize * 0.3, Math.PI, 0);
  ctx.lineTo(centerX + iconSize * 0.3, centerY + iconSize * 0.2);
  ctx.lineTo(centerX - iconSize * 0.3, centerY + iconSize * 0.2);
  ctx.closePath();
  ctx.fill();

  // Bell clapper
  ctx.beginPath();
  ctx.arc(centerX, centerY + iconSize * 0.3, iconSize * 0.08, 0, Math.PI * 2);
  ctx.fill();

  return canvas.toBuffer('image/png');
}

async function generateIcons() {
  console.log('🎨 Generating PWA icons...');

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Generate main app icons
  for (const size of SIZES) {
    const iconBuffer = drawIcon(size);
    const filename = `icon-${size}x${size}.png`;
    const filepath = path.join(OUTPUT_DIR, filename);

    fs.writeFileSync(filepath, iconBuffer);
    console.log(`✅ Generated ${filename}`);
  }

  // Generate shortcut icons
  const shortcuts: Array<{ name: string; type: 'order' | 'orders' | 'chat' }> = [
    { name: 'shortcut-order.png', type: 'order' },
    { name: 'shortcut-orders.png', type: 'orders' },
    { name: 'shortcut-chat.png', type: 'chat' },
  ];

  for (const shortcut of shortcuts) {
    const iconBuffer = drawShortcutIcon(96, shortcut.type);
    const filepath = path.join(OUTPUT_DIR, shortcut.name);

    fs.writeFileSync(filepath, iconBuffer);
    console.log(`✅ Generated ${shortcut.name}`);
  }

  // Generate notification icons
  const notificationIcons = [
    'notification-icon.png',
    'badge-icon.png',
    'view-icon.png',
    'close-icon.png',
  ];

  for (const iconName of notificationIcons) {
    const iconBuffer = drawNotificationIcon(96);
    const filepath = path.join(OUTPUT_DIR, iconName);

    fs.writeFileSync(filepath, iconBuffer);
    console.log(`✅ Generated ${iconName}`);
  }

  console.log('🎉 All PWA icons generated successfully!');
}

// Run the generator
generateIcons().catch(console.error);
