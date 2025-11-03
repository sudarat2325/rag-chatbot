import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create Users
  console.log('Creating users...');

  const customer1 = await prisma.user.upsert({
    where: { email: 'customer@example.com' },
    update: {},
    create: {
      email: 'customer@example.com',
      password: await bcrypt.hash('password123', 10),
      name: 'สมชาย ใจดี',
      phone: '081-234-5678',
      role: 'CUSTOMER',
    },
  });

  const restaurantOwner1 = await prisma.user.upsert({
    where: { email: 'owner1@example.com' },
    update: {},
    create: {
      email: 'owner1@example.com',
      password: await bcrypt.hash('password123', 10),
      name: 'ร้านส้มตำป้าเด่น',
      phone: '089-111-2222',
      role: 'RESTAURANT_OWNER',
    },
  });

  const restaurantOwner2 = await prisma.user.upsert({
    where: { email: 'owner2@example.com' },
    update: {},
    create: {
      email: 'owner2@example.com',
      password: await bcrypt.hash('password123', 10),
      name: 'ร้านก๋วยเตี๋ยวลุงเจี๊ยบ',
      phone: '089-333-4444',
      role: 'RESTAURANT_OWNER',
    },
  });

  const driver1 = await prisma.user.upsert({
    where: { email: 'driver@example.com' },
    update: {},
    create: {
      email: 'driver@example.com',
      password: await bcrypt.hash('password123', 10),
      name: 'สมศักดิ์ ขับรถเร็ว',
      phone: '091-555-6666',
      role: 'DRIVER',
    },
  });

  // Create Customer Address
  console.log('Creating addresses...');

  const address1 = await prisma.address.create({
    data: {
      userId: customer1.id,
      label: 'บ้าน',
      fullAddress: '123 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพมหานคร 10110',
      latitude: 13.7308,
      longitude: 100.5641,
      district: 'คลองเตย',
      province: 'กรุงเทพมหานคร',
      postalCode: '10110',
      isDefault: true,
    },
  });

  // Create Restaurants
  console.log('Creating restaurants...');

  const restaurant1 = await prisma.restaurant.create({
    data: {
      ownerId: restaurantOwner1.id,
      name: 'ส้มตำป้าเด่น',
      description: 'ส้มตำรสจัดจ้าน อร่อยถูกปากคนไทย เมนูหลากหลาย บริการรวดเร็ว',
      phone: '089-111-2222',
      address: '456 ถนนเพชรบุรี แขวงมักกะสัน เขตราชเทวี กรุงเทพมหานคร',
      latitude: 13.7520,
      longitude: 100.5434,
      district: 'ราชเทวี',
      province: 'กรุงเทพมหานคร',
      rating: 4.5,
      totalReviews: 156,
      totalOrders: 1234,
      isOpen: true,
      deliveryFee: 25,
      minimumOrder: 50,
      estimatedTime: '30-40 mins',
      categories: 'อาหารไทย,ส้มตำ,อาหารอีสาน',
      operatingHours: JSON.stringify({
        monday: { open: '10:00', close: '21:00' },
        tuesday: { open: '10:00', close: '21:00' },
        wednesday: { open: '10:00', close: '21:00' },
        thursday: { open: '10:00', close: '21:00' },
        friday: { open: '10:00', close: '22:00' },
        saturday: { open: '10:00', close: '22:00' },
        sunday: { open: '10:00', close: '21:00' },
      }),
    },
  });

  const restaurant2 = await prisma.restaurant.create({
    data: {
      ownerId: restaurantOwner2.id,
      name: 'ก๋วยเตี๋ยวลุงเจี๊ยบ',
      description: 'ก๋วยเตี๋ยวน้ำใส ซุปกระดูกหมูเข้มข้น เส้นเหนียวนุ่ม เนื้อชิ้นใหญ่',
      phone: '089-333-4444',
      address: '789 ถนนรัชดาภิเษก แขวงดินแดง เขตดินแดง กรุงเทพมหานคร',
      latitude: 13.7650,
      longitude: 100.5440,
      district: 'ดินแดง',
      province: 'กรุงเทพมหานคร',
      rating: 4.7,
      totalReviews: 243,
      totalOrders: 2156,
      isOpen: true,
      deliveryFee: 30,
      minimumOrder: 60,
      estimatedTime: '25-35 mins',
      categories: 'อาหารไทย,ก๋วยเตี๋ยว,อาหารจานเดียว',
      operatingHours: JSON.stringify({
        monday: { open: '08:00', close: '20:00' },
        tuesday: { open: '08:00', close: '20:00' },
        wednesday: { open: '08:00', close: '20:00' },
        thursday: { open: '08:00', close: '20:00' },
        friday: { open: '08:00', close: '20:00' },
        saturday: { open: '08:00', close: '20:00' },
        sunday: { open: '08:00', close: '15:00' },
      }),
    },
  });

  // Create Menu Items for Restaurant 1
  console.log('Creating menu items...');

  await prisma.menuItem.createMany({
    data: [
      {
        restaurantId: restaurant1.id,
        name: 'ส้มตำไทย',
        description: 'ส้มตำแบบดั้งเดิม รสชาติกลมกล่อม ใส่ถั่วฝักยาว มะเขือเทศ',
        price: 45,
        category: 'อาหารหลัก',
        isAvailable: true,
        isPopular: true,
      },
      {
        restaurantId: restaurant1.id,
        name: 'ส้มตำปู',
        description: 'ส้มตำใส่ปูนา รสชาติเข้มข้น กลิ่นหอมปู',
        price: 60,
        category: 'อาหารหลัก',
        isAvailable: true,
        isPopular: true,
      },
      {
        restaurantId: restaurant1.id,
        name: 'ลาบหมู',
        description: 'ลาบหมูสับ รสจัดจ้าน เผ็ดร้อน กรุบกรอบ',
        price: 50,
        category: 'อาหารหลัก',
        isAvailable: true,
      },
      {
        restaurantId: restaurant1.id,
        name: 'ไก่ย่าง',
        description: 'ไก่ย่างหอมเครื่องเทศ เนื้อนุ่ม จ้านรส',
        price: 120,
        category: 'อาหารหลัก',
        isAvailable: true,
        isPopular: true,
      },
      {
        restaurantId: restaurant1.id,
        name: 'ข้าวเหนียว',
        description: 'ข้าวเหนียวหอมมะลิ นุ่มเหนียว',
        price: 10,
        category: 'เครื่องเคียง',
        isAvailable: true,
      },
      {
        restaurantId: restaurant1.id,
        name: 'น้ำอ้อย',
        description: 'น้ำอ้อยคั้นสด หวานชื่นใจ',
        price: 20,
        category: 'เครื่องดื่ม',
        isAvailable: true,
      },
    ],
  });

  // Create Menu Items for Restaurant 2
  await prisma.menuItem.createMany({
    data: [
      {
        restaurantId: restaurant2.id,
        name: 'ก๋วยเตี๋ยวหมูน้ำใส',
        description: 'ก๋วยเตี๋ยวน้ำใสซุปกระดูก เส้นเหนียว หมูชิ้นใหญ่',
        price: 50,
        category: 'อาหารหลัก',
        isAvailable: true,
        isPopular: true,
      },
      {
        restaurantId: restaurant2.id,
        name: 'ก๋วยเตี๋ยวหมูต้มยำ',
        description: 'ก๋วยเตี๋ยวต้มยำ รสจัดจ้าน เผ็ดร้อน',
        price: 55,
        category: 'อาหารหลัก',
        isAvailable: true,
        isPopular: true,
      },
      {
        restaurantId: restaurant2.id,
        name: 'ก๋วยเตี๋ยวเนื้อน้ำตก',
        description: 'เนื้อย่างสไลซ์ ราดน้ำจิ้มรสเด็ด',
        price: 65,
        category: 'อาหารหลัก',
        isAvailable: true,
      },
      {
        restaurantId: restaurant2.id,
        name: 'เกี้ยวน้ำ',
        description: 'เกี้ยวกุ้งสด น้ำซุปหอม',
        price: 45,
        category: 'อาหารหลัก',
        isAvailable: true,
      },
      {
        restaurantId: restaurant2.id,
        name: 'น้ำเปล่า',
        description: 'น้ำดื่มบรรจุขวด',
        price: 10,
        category: 'เครื่องดื่ม',
        isAvailable: true,
      },
    ],
  });

  // Create Driver Profile
  console.log('Creating driver profile...');

  await prisma.driverProfile.create({
    data: {
      userId: driver1.id,
      vehicleType: 'Motorcycle',
      vehiclePlate: 'กก-1234',
      rating: 4.8,
      totalDeliveries: 523,
      isOnline: true,
      isAvailable: true,
    },
  });

  console.log('✅ Seed completed successfully!');
  console.log('\nTest Accounts:');
  console.log('Customer: customer@example.com / password123');
  console.log('Restaurant Owner 1: owner1@example.com / password123');
  console.log('Restaurant Owner 2: owner2@example.com / password123');
  console.log('Driver: driver@example.com / password123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
