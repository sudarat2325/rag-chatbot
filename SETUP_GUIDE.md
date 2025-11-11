# 🚀 FoodHub - Setup & Usage Guide

Complete Food Delivery System with RAG Chatbot, Real-time Tracking, and Push Notifications

---

## 🎯 Features

### ✅ Completed Features

#### 1. **Real-time System**
- ✅ Socket.IO for real-time updates
- ✅ Web Push Notifications with VAPID keys
- ✅ Real-time order status updates
- ✅ Live delivery tracking
- ✅ Instant notifications

#### 2. **Frontend Pages**
- ✅ Main Layout with Navigation & NotificationBell
- ✅ Login & Register pages
- ✅ Restaurant listing with search & filters
- ✅ Restaurant detail with menu & shopping cart
- ✅ Order tracking with real-time updates
- ✅ Responsive design (Mobile & Desktop)

#### 3. **Backend APIs**
- ✅ Orders API with Socket.IO integration
- ✅ Notifications API with push & real-time
- ✅ Restaurant & Menu APIs
- ✅ Delivery tracking API
- ✅ Promotion system

#### 4. **Database**
- ✅ SQLite database with Prisma ORM
- ✅ Push notification subscriptions
- ✅ Promotion tracking
- ✅ Complete food delivery schema

---

## 📦 Installation

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Environment Variables

The `.env` file already has VAPID keys generated. Update if needed:

```bash
# Generate new VAPID keys (optional)
npx tsx scripts/generate-vapid-keys.ts

# Update .env with your email
VAPID_EMAIL=mailto:your-email@example.com
```

### 3. Setup Database

```bash
# Push schema to database
npm run db:push

# Seed database with demo data (optional)
npm run db:seed
```

---

## 🚀 Running the Application

### Development Mode (with Socket.IO)

```bash
npm run dev
```

This starts:
- ✓ Next.js at http://localhost:3000
- ✓ Socket.IO at /api/socket
- ✓ All real-time features enabled

### Production Build

```bash
npm run build
npm start
```

---

## 🎨 Available Pages

### Public Pages

| Page | URL | Description |
|------|-----|-------------|
| **Login** | `/login` | User authentication |
| **Register** | `/register` | New user registration |
| **Food Delivery** | `/food` | Restaurant listing with search |
| **Restaurant Detail** | `/restaurant/[id]` | Menu & shopping cart |
| **Order Tracking** | `/orders/[orderId]` | Real-time order tracking |
| **AI Chatbot** | `/chatbot` | RAG chatbot assistant |
| **Documents** | `/documents` | Document management |

### Demo Accounts

**Quick Login:**
- Email: `demo@foodhub.com`
- Password: `demo123`

---

## 🔔 Push Notifications Setup

### For Users

1. Visit any page after logging in
2. Look for notification bell icon in header
3. Browser will ask for notification permission
4. Click "Allow" to enable push notifications

### For Developers

Push notifications are automatically sent when:
- New order is created
- Order status changes
- Delivery updates occur

Manual push notification:

```typescript
import { sendPushNotification } from '@/lib/services/notificationService';

await sendPushNotification(userPushSubscription, {
  title: 'New Message',
  message: 'You have a new message!',
  data: { url: '/messages' },
});
```

---

## 🔌 Socket.IO Real-time Features

### Client Usage

```typescript
import { useSocket } from '@/lib/hooks/useSocket';

function MyComponent() {
  const { joinOrder, on, off } = useSocket(userId);

  useEffect(() => {
    joinOrder(orderId);

    const handleUpdate = (data) => {
      console.log('Order updated:', data);
    };

    on('order-status-update', handleUpdate);

    return () => {
      off('order-status-update', handleUpdate);
    };
  }, [orderId]);
}
```

### Available Socket Events

**Client → Server:**
- `authenticate` - Authenticate user
- `join-order` - Join order room
- `join-delivery` - Join delivery tracking
- `join-restaurant` - Join restaurant room
- `update-location` - Update driver location

**Server → Client:**
- `order-status-update` - Order status changed
- `delivery-location-update` - Driver location updated
- `notification` - New notification
- `restaurant-notification` - Restaurant notification

---

## 🛒 Using the Shopping Cart

### Add Items to Cart

1. Go to `/food`
2. Click on any restaurant
3. Browse menu and click "+ เพิ่ม" on items
4. Adjust quantity with +/- buttons
5. Cart summary appears at bottom
6. Click "สั่งซื้อ" to checkout

### Cart Features

- ✅ Real-time quantity updates
- ✅ Auto-calculate totals
- ✅ Minimum order validation
- ✅ Promotion code support
- ✅ Delivery fee calculation

---

## 📱 Mobile Support

The application is fully responsive:

- ✅ Mobile navigation menu
- ✅ Touch-friendly buttons
- ✅ Responsive layouts
- ✅ Mobile-optimized forms
- ✅ Swipeable categories

---

## 🔧 Development Scripts

```bash
# Development with Socket.IO
npm run dev

# Development (Next.js only, no Socket.IO)
npm run dev:next

# Build for production
npm run build

# Start production server
npm start

# Database operations
npm run db:push      # Push schema changes
npm run db:seed      # Seed demo data
npm run db:studio    # Open Prisma Studio
npm run db:reset     # Reset database

# Code quality
npm run lint         # Run ESLint
npm run build        # Build & type-check

# Backend services
npm run chat         # RAG chatbot CLI
npm run ingest       # Ingest documents

# Generate VAPID keys
npx tsx scripts/generate-vapid-keys.ts
```

---

## 🎯 User Flow Examples

### Ordering Food

1. **Browse Restaurants**
   - Visit `/food`
   - Search or filter by category
   - Click on restaurant card

2. **Select Items**
   - Browse menu
   - Add items to cart
   - Adjust quantities

3. **Checkout**
   - Click "สั่งซื้อ" button
   - Fill in delivery address
   - Apply promo code (optional)
   - Confirm order

4. **Track Order**
   - Receive real-time notifications
   - View order tracking page
   - See delivery progress
   - Get driver info when assigned

### For Restaurant Owners

Coming soon:
- Restaurant dashboard
- Order management
- Menu editing
- Analytics & reports

---

## 📊 Database Schema

### Key Models

- **User** - Customers, drivers, restaurant owners
- **Restaurant** - Restaurant information
- **MenuItem** - Food menu items
- **Order** - Customer orders
- **OrderItem** - Items in an order
- **Delivery** - Delivery tracking
- **Notification** - User notifications
- **Promotion** - Discount codes
- **Review** - Restaurant reviews

---

## 🐛 Troubleshooting

### Socket.IO not connecting

```bash
# Make sure you're using the custom server
npm run dev  # NOT npm run dev:next
```

### Push notifications not working

1. Check VAPID keys in `.env`
2. Verify browser supports push notifications
3. Allow notifications when prompted
4. Check service worker registration

### Database issues

```bash
# Reset database
npm run db:reset

# Or manually
rm dev.db
npm run db:push
npm run db:seed
```

### Build errors

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Clear Next.js cache
rm -rf .next

# Rebuild
npm run build
```

---

## 📚 API Documentation

### Orders

```http
POST /api/orders
GET /api/orders?customerId={id}
PATCH /api/orders/{orderId}/status
```

### Restaurants

```http
GET /api/restaurants
GET /api/restaurants/{id}
GET /api/menu?restaurantId={id}
```

### Notifications

```http
GET /api/notifications?userId={id}
POST /api/notifications
PATCH /api/notifications
```

### Push Subscriptions

```http
POST /api/push/subscribe
DELETE /api/push/subscribe?userId={id}
```

### Tracking

```http
GET /api/tracking/{orderId}
PATCH /api/tracking/{orderId}
```

See `REALTIME_FEATURES.md` for detailed API documentation.

---

## 🚀 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

**Note:** Socket.IO requires a custom server, so Vercel deployment needs configuration for serverless functions or use a separate Socket.IO server.

### Docker (Coming Soon)

```bash
docker build -t foodhub .
docker run -p 3000:3000 foodhub
```

---

## 🔐 Security Notes

- ✅ Input validation on all forms
- ✅ SQL injection prevention (Prisma)
- ✅ XSS protection
- ⚠️  TODO: Add proper authentication (NextAuth.js)
- ⚠️  TODO: Add rate limiting
- ⚠️  TODO: Add CSRF protection

---

## 📈 Performance

- ✅ Turbopack for faster builds
- ✅ Lazy loading components
- ✅ Image optimization
- ✅ Code splitting
- ✅ Server-side rendering
- ✅ Real-time updates without polling

---

## 🎓 Learning Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Socket.IO Documentation](https://socket.io/docs)
- [Web Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

## 📝 License

ISC License

---

## 🎉 Enjoy!

Your Food Delivery System with RAG Chatbot is ready to use!

For detailed real-time features documentation, see `REALTIME_FEATURES.md`

Happy coding! 🍕🚀
