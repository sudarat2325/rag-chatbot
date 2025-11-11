# 🍕 Food Delivery System - API Documentation

## 📊 สรุป API Endpoints

ระบบมี **27 API endpoints** แบ่งเป็น 10 หมวดหมู่:

1. **Authentication (2 endpoints)** - Login/Register
2. **Users (2 endpoints)** - User management
3. **Restaurants (2 endpoints)** - Restaurant management
4. **Menu (1 endpoint)** - Menu items
5. **Orders (3 endpoints)** - Order management
6. **Deliveries (2 endpoints)** - Delivery tracking
7. **Drivers (1 endpoint)** - Driver management
8. **Notifications (1 endpoint)** - Push notifications
9. **Reviews (1 endpoint)** - Restaurant reviews
10. **Others (12 endpoints)** - Chat, Documents, Favorites, etc.

---

## 🔐 1. Authentication APIs

### 1.1 Login
```bash
# POST /api/auth/login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@example.com",
    "password": "password123"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "690b86f51ae3dae3cb00cbb0",
    "email": "customer@example.com",
    "name": "สมชาย ใจดี",
    "role": "CUSTOMER"
  }
}
```

### 1.2 Register
```bash
# POST /api/auth/register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "password123",
    "name": "ผู้ใช้ใหม่",
    "phone": "099-999-9999"
  }'
```

---

## 👤 2. Users APIs

### 2.1 Get All Users (Admin only)
```bash
# GET /api/users
curl http://localhost:3000/api/users
```

### 2.2 Update User Role (Admin only)
```bash
# PATCH /api/users/:userId
curl -X PATCH http://localhost:3000/api/users/690b86f51ae3dae3cb00cbb0 \
  -H "Content-Type: application/json" \
  -d '{
    "role": "DRIVER"
  }'
```

---

## 🏪 3. Restaurants APIs

### 3.1 Get All Restaurants
```bash
# GET /api/restaurants
curl http://localhost:3000/api/restaurants

# With filters
curl "http://localhost:3000/api/restaurants?isActive=true&isOpen=true"

# By owner
curl "http://localhost:3000/api/restaurants?ownerId=690b86f41ae3dae3cb00cbb1"
```

### 3.2 Get Restaurant by ID
```bash
# GET /api/restaurants/:id
curl http://localhost:3000/api/restaurants/690b86f51ae3dae3cb00cbb7
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "690b86f51ae3dae3cb00cbb7",
    "name": "ส้มตำป้าเด่น",
    "description": "ส้มตำรสจัดจ้าน อร่อยถูกปากคนไทย",
    "rating": 4.5,
    "deliveryFee": 25,
    "minimumOrder": 50,
    "estimatedTime": "30-40 mins",
    "owner": {
      "name": "ร้านส้มตำป้าเด่น",
      "email": "owner1@example.com"
    }
  }
}
```

---

## 🍽️ 4. Menu APIs

### 4.1 Get Menu Items
```bash
# GET /api/menu
# Get all menu items by restaurant
curl "http://localhost:3000/api/menu?restaurantId=690b86f51ae3dae3cb00cbb7"

# Get menu item by ID
curl "http://localhost:3000/api/menu?menuItemId=690b86f51ae3dae3cb00cbba"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "690b86f51ae3dae3cb00cbba",
      "name": "ส้มตำปู",
      "description": "ส้มตำปูนา รสจัดจ้าน",
      "price": 60,
      "category": "Main Dish",
      "isAvailable": true,
      "restaurant": {
        "name": "ส้มตำป้าเด่น",
        "deliveryFee": 25
      }
    }
  ]
}
```

---

## 📦 5. Orders APIs

### 5.1 Get Orders
```bash
# GET /api/orders
# Get all orders (admin)
curl http://localhost:3000/api/orders

# Get orders by customer
curl "http://localhost:3000/api/orders?customerId=690b86f51ae3dae3cb00cbb4"

# Get orders by restaurant
curl "http://localhost:3000/api/orders?restaurantId=690b86f51ae3dae3cb00cbb7"

# Get orders by status
curl "http://localhost:3000/api/orders?status=PENDING"
```

### 5.2 Create Order
```bash
# POST /api/orders
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "690b86f51ae3dae3cb00cbb4",
    "restaurantId": "690b86f51ae3dae3cb00cbb7",
    "addressId": "690b874f91a7a7822d2e4620",
    "items": [
      {
        "menuItemId": "690b86f51ae3dae3cb00cbba",
        "quantity": 1,
        "price": 60
      }
    ],
    "subtotal": 60,
    "deliveryFee": 25,
    "total": 85,
    "paymentMethod": "CASH",
    "notes": ""
  }'
```

### 5.3 Update Order Status
```bash
# PATCH /api/orders/:orderId
curl -X PATCH http://localhost:3000/api/orders/690b875091a7a7822d2e4621 \
  -H "Content-Type: application/json" \
  -d '{
    "status": "ACCEPTED"
  }'
```

**Order Status Flow:**
```
PENDING → ACCEPTED → PREPARING → READY → PICKED_UP → ON_THE_WAY → DELIVERED
                   ↓
                REJECTED/CANCELLED
```

---

## 🚚 6. Deliveries APIs

### 6.1 Get Deliveries
```bash
# GET /api/deliveries
# Get available deliveries (for drivers)
curl http://localhost:3000/api/deliveries

# Get deliveries by driver
curl "http://localhost:3000/api/deliveries?driverId=690b86f41ae3dae3cb00cbb3"

# Get deliveries by status
curl "http://localhost:3000/api/deliveries?status=DRIVER_ASSIGNED"
```

### 6.2 Assign Driver to Delivery
```bash
# POST /api/deliveries
curl -X POST http://localhost:3000/api/deliveries \
  -H "Content-Type: application/json" \
  -d '{
    "deliveryId": "690b875091a7a7822d2e4624",
    "driverId": "690b86f41ae3dae3cb00cbb3"
  }'
```

### 6.3 Update Delivery Status
```bash
# PATCH /api/deliveries/:id
curl -X PATCH http://localhost:3000/api/deliveries/690b875091a7a7822d2e4624 \
  -H "Content-Type: application/json" \
  -d '{
    "status": "DRIVER_ARRIVED",
    "latitude": 13.7563,
    "longitude": 100.5018
  }'
```

---

## 🏍️ 7. Drivers APIs

### 7.1 Update Driver Status
```bash
# PATCH /api/drivers/:id
curl -X PATCH http://localhost:3000/api/drivers/690b86f41ae3dae3cb00cbb3 \
  -H "Content-Type: application/json" \
  -d '{
    "isOnline": true
  }'
```

---

## 🔔 8. Notifications APIs

### 8.1 Get Notifications
```bash
# GET /api/notifications
curl "http://localhost:3000/api/notifications?userId=690b86f51ae3dae3cb00cbb4&limit=10"
```

### 8.2 Mark Notification as Read
```bash
# PATCH /api/notifications
curl -X PATCH http://localhost:3000/api/notifications \
  -H "Content-Type: application/json" \
  -d '{
    "notificationId": "690b875091a7a7822d2e4625",
    "isRead": true
  }'
```

### 8.3 Subscribe to Push Notifications
```bash
# POST /api/push/subscribe
curl -X POST http://localhost:3000/api/push/subscribe \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "690b86f51ae3dae3cb00cbb4",
    "subscription": {
      "endpoint": "https://...",
      "keys": {
        "p256dh": "...",
        "auth": "..."
      }
    }
  }'
```

---

## ⭐ 9. Reviews APIs

### 9.1 Get Reviews
```bash
# GET /api/reviews
# Get reviews by restaurant
curl "http://localhost:3000/api/reviews?restaurantId=690b86f51ae3dae3cb00cbb7&limit=5"

# Get reviews by customer
curl "http://localhost:3000/api/reviews?customerId=690b86f51ae3dae3cb00cbb4"
```

### 9.2 Create Review
```bash
# POST /api/reviews
curl -X POST http://localhost:3000/api/reviews \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "690b875091a7a7822d2e4621",
    "customerId": "690b86f51ae3dae3cb00cbb4",
    "restaurantId": "690b86f51ae3dae3cb00cbb7",
    "foodRating": 5,
    "deliveryRating": 5,
    "overallRating": 5,
    "comment": "อร่อยมาก!"
  }'
```

---

## 📍 10. Other APIs

### 10.1 Addresses
```bash
# GET /api/addresses
curl "http://localhost:3000/api/addresses?userId=690b86f51ae3dae3cb00cbb4"

# POST /api/addresses
curl -X POST http://localhost:3000/api/addresses \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "690b86f51ae3dae3cb00cbb4",
    "label": "บ้าน",
    "fullAddress": "123 ถนนสุขุมวิท",
    "latitude": 13.7563,
    "longitude": 100.5018,
    "isDefault": true
  }'
```

### 10.2 Favorites
```bash
# GET /api/favorites
curl "http://localhost:3000/api/favorites?userId=690b86f51ae3dae3cb00cbb4"

# POST /api/favorites
curl -X POST http://localhost:3000/api/favorites \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "690b86f51ae3dae3cb00cbb4",
    "restaurantId": "690b86f51ae3dae3cb00cbb7"
  }'
```

### 10.3 Preferences
```bash
# GET /api/preferences
curl "http://localhost:3000/api/preferences?userId=690b86f51ae3dae3cb00cbb4"

# PATCH /api/preferences
curl -X PATCH http://localhost:3000/api/preferences \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "690b86f51ae3dae3cb00cbb4",
    "orderUpdates": true,
    "promotions": false
  }'
```

### 10.4 Promotions
```bash
# GET /api/promotions
curl http://localhost:3000/api/promotions

# Validate promo code
curl "http://localhost:3000/api/promotions?code=WELCOME50"
```

### 10.5 Order Tracking
```bash
# GET /api/tracking/:orderId
curl http://localhost:3000/api/tracking/690b875091a7a7822d2e4621
```

### 10.6 Chat Messages
```bash
# GET /api/chat/messages
curl "http://localhost:3000/api/chat/messages?orderId=690b875091a7a7822d2e4621"

# POST /api/chat/messages
curl -X POST http://localhost:3000/api/chat/messages \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "690b875091a7a7822d2e4621",
    "senderId": "690b86f51ae3dae3cb00cbb4",
    "receiverId": "690b86f41ae3dae3cb00cbb1",
    "message": "สวัสดีครับ"
  }'
```

### 10.7 Chatbot (RAG)
```bash
# POST /api/chatbot
curl -X POST http://localhost:3000/api/chatbot \
  -H "Content-Type: application/json" \
  -d '{
    "query": "แนะนำร้านอาหารหน่อย"
  }'
```

### 10.8 Documents (RAG)
```bash
# GET /api/documents
curl http://localhost:3000/api/documents

# POST /api/documents/upload
curl -X POST http://localhost:3000/api/documents/upload \
  -F "file=@document.pdf" \
  -F "title=Menu"
```

---

## 🎯 Quick Test Scripts

### Test Authentication Flow
```bash
# 1. Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123","name":"Test User","phone":"099-999-9999"}'

# 2. Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'
```

### Test Order Flow
```bash
# 1. Get restaurants
curl http://localhost:3000/api/restaurants

# 2. Get menu
curl "http://localhost:3000/api/menu?restaurantId=690b86f51ae3dae3cb00cbb7"

# 3. Create address
curl -X POST http://localhost:3000/api/addresses \
  -H "Content-Type: application/json" \
  -d '{"userId":"USER_ID","label":"บ้าน","fullAddress":"123 Test","latitude":13.75,"longitude":100.50,"isDefault":true}'

# 4. Create order
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{"customerId":"USER_ID","restaurantId":"RESTAURANT_ID","addressId":"ADDRESS_ID","items":[{"menuItemId":"MENU_ID","quantity":1,"price":60}],"subtotal":60,"deliveryFee":25,"total":85,"paymentMethod":"CASH"}'
```

---

## 📝 Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Customer | customer@example.com | password123 |
| Customer (Demo) | demo@foodhub.com | demo123 |
| Restaurant Owner 1 | owner1@example.com | password123 |
| Restaurant Owner 2 | owner2@example.com | password123 |
| Driver | driver@example.com | password123 |
| Admin | admin@example.com | admin123 |

---

## 🔗 Base URLs

- **Development**: `http://localhost:3000`
- **Production**: (ใส่ URL production ของคุณ)

---

## 📊 API Response Format

### Success Response
```json
{
  "success": true,
  "data": { /* your data */ }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message"
}
```

---

## 🚀 Next Steps

1. ติดตั้ง Postman หรือ Insomnia
2. Import curl commands ข้างบน
3. ทดสอบ APIs ตามลำดับ
4. อ่าน response และปรับใช้ในโปรเจคของคุณ

---

**สร้างเมื่อ:** 2025-11-06
**MongoDB Atlas:** ✅ Connected
**Total Endpoints:** 27
