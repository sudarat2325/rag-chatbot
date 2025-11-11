import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.warn('🌱 Starting database seed...');
  console.warn('⚠️  Note: If data already exists, this will fail due to unique constraints.');
  console.warn('   To re-seed, please drop the database first.');

  // Create Users
  console.warn('Creating users...');

  const customer1 = await prisma.user.create({
    data: {
      email: 'customer@example.com',
      password: await bcrypt.hash('password123', 10),
      name: 'สมชาย ใจดี',
      phone: '081-234-5678',
      role: 'CUSTOMER',
    },
  });

  const restaurantOwner1 = await prisma.user.create({
    data: {
      email: 'owner1@example.com',
      password: await bcrypt.hash('password123', 10),
      name: 'ร้านส้มตำป้าเด่น',
      phone: '089-111-2222',
      role: 'RESTAURANT_OWNER',
    },
  });

  const restaurantOwner2 = await prisma.user.create({
    data: {
      email: 'owner2@example.com',
      password: await bcrypt.hash('password123', 10),
      name: 'ร้านก๋วยเตี๋ยวลุงเจี๊ยบ',
      phone: '089-333-4444',
      role: 'RESTAURANT_OWNER',
    },
  });

  const restaurantOwner3 = await prisma.user.create({
    data: {
      email: 'owner3@example.com',
      password: await bcrypt.hash('password123', 10),
      name: 'โออิชิ ราเมน',
      phone: '089-555-6666',
      role: 'RESTAURANT_OWNER',
    },
  });

  const restaurantOwner4 = await prisma.user.create({
    data: {
      email: 'owner4@example.com',
      password: await bcrypt.hash('password123', 10),
      name: 'เฮงเฮง ติ่มซำ',
      phone: '089-777-8888',
      role: 'RESTAURANT_OWNER',
    },
  });

  const restaurantOwner5 = await prisma.user.create({
    data: {
      email: 'owner5@example.com',
      password: await bcrypt.hash('password123', 10),
      name: 'BurgerKing Thailand',
      phone: '089-999-0000',
      role: 'RESTAURANT_OWNER',
    },
  });

  const restaurantOwner6 = await prisma.user.create({
    data: {
      email: 'owner6@example.com',
      password: await bcrypt.hash('password123', 10),
      name: 'Sweet Cafe & Bakery',
      phone: '089-111-3333',
      role: 'RESTAURANT_OWNER',
    },
  });

  const restaurantOwner7 = await prisma.user.create({
    data: {
      email: 'owner7@example.com',
      password: await bcrypt.hash('password123', 10),
      name: 'Bubble Tea Paradise',
      phone: '089-222-4444',
      role: 'RESTAURANT_OWNER',
    },
  });

  const driver1 = await prisma.user.create({
    data: {
      email: 'driver@example.com',
      password: await bcrypt.hash('password123', 10),
      name: 'สมศักดิ์ ขับรถเร็ว',
      phone: '091-555-6666',
      role: 'DRIVER',
    },
  });

  // Create Demo and Admin users
  const demoUser = await prisma.user.create({
    data: {
      email: 'demo@foodhub.com',
      password: await bcrypt.hash('demo123', 10),
      name: 'demo',
      phone: '099-999-9999',
      role: 'CUSTOMER',
    },
  });

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      password: await bcrypt.hash('admin123', 10),
      name: 'Admin User',
      phone: '088-888-8888',
      role: 'ADMIN',
    },
  });

  // Create Customer Address
  console.warn('Creating addresses...');

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
  console.warn('Creating restaurants...');

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

  const restaurant3 = await prisma.restaurant.create({
    data: {
      ownerId: restaurantOwner3.id,
      name: 'โออิชิ ราเมน',
      description: 'ราเมนสไตล์ญี่ปุ่นแท้ ซุปเข้มข้น เส้นนุ่ม หมูชาชูหนา',
      phone: '089-555-6666',
      address: '321 ถนนสีลม แขวงสีลม เขตบางรัก กรุงเทพมหานคร',
      latitude: 13.7245,
      longitude: 100.5348,
      district: 'บางรัก',
      province: 'กรุงเทพมหานคร',
      rating: 4.8,
      totalReviews: 567,
      totalOrders: 3456,
      isOpen: true,
      deliveryFee: 0,
      minimumOrder: 100,
      estimatedTime: '35-45 mins',
      categories: 'อาหารญี่ปุ่น,ราเมน,อาหารจานเดียว',
      operatingHours: JSON.stringify({
        monday: { open: '11:00', close: '22:00' },
        tuesday: { open: '11:00', close: '22:00' },
        wednesday: { open: '11:00', close: '22:00' },
        thursday: { open: '11:00', close: '22:00' },
        friday: { open: '11:00', close: '23:00' },
        saturday: { open: '11:00', close: '23:00' },
        sunday: { open: '11:00', close: '22:00' },
      }),
    },
  });

  const restaurant4 = await prisma.restaurant.create({
    data: {
      ownerId: restaurantOwner4.id,
      name: 'เฮงเฮง ติ่มซำ',
      description: 'ติ่มซำสดใหม่ หมูแดงหวาน ซาลาเปา เกี๊ยวกุ้ง อร่อยทุกเมนู',
      phone: '089-777-8888',
      address: '555 ถนนเยาวราช แขวงสัมพันธวงศ์ เขตสัมพันธวงศ์ กรุงเทพมหานคร',
      latitude: 13.7392,
      longitude: 100.5121,
      district: 'สัมพันธวงศ์',
      province: 'กรุงเทพมหานคร',
      rating: 4.6,
      totalReviews: 389,
      totalOrders: 2789,
      isOpen: true,
      deliveryFee: 35,
      minimumOrder: 80,
      estimatedTime: '30-40 mins',
      categories: 'อาหารจีน,ติ่มซำ,อาหารเช้า',
      operatingHours: JSON.stringify({
        monday: { open: '06:00', close: '14:00' },
        tuesday: { open: '06:00', close: '14:00' },
        wednesday: { open: '06:00', close: '14:00' },
        thursday: { open: '06:00', close: '14:00' },
        friday: { open: '06:00', close: '14:00' },
        saturday: { open: '06:00', close: '15:00' },
        sunday: { open: '06:00', close: '15:00' },
      }),
    },
  });

  const restaurant5 = await prisma.restaurant.create({
    data: {
      ownerId: restaurantOwner5.id,
      name: 'Burger Station',
      description: 'เบอร์เกอร์เนื้อชั้นเลิศ ฟราย หรือนักเก็ต อร่อยทุกคำ ส่งไวมาก',
      phone: '089-999-0000',
      address: '888 ถนนพระราม 4 แขวงคลองเตย เขตคลองเตย กรุงเทพมหานคร',
      latitude: 13.7273,
      longitude: 100.5635,
      district: 'คลองเตย',
      province: 'กรุงเทพมหานคร',
      rating: 4.4,
      totalReviews: 892,
      totalOrders: 5678,
      isOpen: true,
      deliveryFee: 20,
      minimumOrder: 70,
      estimatedTime: '20-30 mins',
      categories: 'ฟาสต์ฟู้ด,เบอร์เกอร์,ไก่ทอด',
      operatingHours: JSON.stringify({
        monday: { open: '10:00', close: '23:00' },
        tuesday: { open: '10:00', close: '23:00' },
        wednesday: { open: '10:00', close: '23:00' },
        thursday: { open: '10:00', close: '23:00' },
        friday: { open: '10:00', close: '24:00' },
        saturday: { open: '10:00', close: '24:00' },
        sunday: { open: '10:00', close: '23:00' },
      }),
    },
  });

  const restaurant6 = await prisma.restaurant.create({
    data: {
      ownerId: restaurantOwner6.id,
      name: 'Sweet Cafe & Bakery',
      description: 'เค้ก คุกกี้ เบเกอรี่สดใหม่ทุกวัน กาแฟหอมกรุ่น บรรยากาศอบอุ่น',
      phone: '089-111-3333',
      address: '222 ถนนทองหล่อ แขวงคลองตันเหนือ เขตวัฒนา กรุงเทพมหานคร',
      latitude: 13.7370,
      longitude: 100.5747,
      district: 'วัฒนา',
      province: 'กรุงเทพมหานคร',
      rating: 4.9,
      totalReviews: 234,
      totalOrders: 1567,
      isOpen: true,
      deliveryFee: 25,
      minimumOrder: 90,
      estimatedTime: '25-35 mins',
      categories: 'ของหวาน,เบเกอรี่,กาแฟ',
      operatingHours: JSON.stringify({
        monday: { open: '08:00', close: '20:00' },
        tuesday: { open: '08:00', close: '20:00' },
        wednesday: { open: '08:00', close: '20:00' },
        thursday: { open: '08:00', close: '20:00' },
        friday: { open: '08:00', close: '21:00' },
        saturday: { open: '09:00', close: '21:00' },
        sunday: { open: '09:00', close: '20:00' },
      }),
    },
  });

  const restaurant7 = await prisma.restaurant.create({
    data: {
      ownerId: restaurantOwner7.id,
      name: 'Bubble Tea Paradise',
      description: 'ชานมไข่มุก รสชาติหลากหลาย วัตถุดิบคัดสรร หวานน้อยได้ ไข่มุกนุ่ม',
      phone: '089-222-4444',
      address: '999 ถนนรามคำแหง แขวงสะพานสูง เขตสะพานสูง กรุงเทพมหานคร',
      latitude: 13.7550,
      longitude: 100.6045,
      district: 'สะพานสูง',
      province: 'กรุงเทพมหานคร',
      rating: 4.5,
      totalReviews: 678,
      totalOrders: 4321,
      isOpen: true,
      deliveryFee: 0,
      minimumOrder: 50,
      estimatedTime: '15-25 mins',
      categories: 'เครื่องดื่ม,ชานมไข่มุก,ของหวาน',
      operatingHours: JSON.stringify({
        monday: { open: '10:00', close: '22:00' },
        tuesday: { open: '10:00', close: '22:00' },
        wednesday: { open: '10:00', close: '22:00' },
        thursday: { open: '10:00', close: '22:00' },
        friday: { open: '10:00', close: '23:00' },
        saturday: { open: '10:00', close: '23:00' },
        sunday: { open: '10:00', close: '22:00' },
      }),
    },
  });

  // Create Menu Items for Restaurant 1
  console.warn('Creating menu items...');

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

  // Create Menu Items for Restaurant 3 (โออิชิ ราเมน)
  await prisma.menuItem.createMany({
    data: [
      {
        restaurantId: restaurant3.id,
        name: 'ราเมนหมูชาชู',
        description: 'ราเมนซุปกระดูกหมูเข้มข้น เส้นนุ่ม หมูชาชูหนานุ่ม',
        price: 120,
        category: 'อาหารหลัก',
        image: 'https://images.unsplash.com/photo-1557872943-16a5ac26437e?w=400&h=300&fit=crop',
        isAvailable: true,
        isPopular: true,
      },
      {
        restaurantId: restaurant3.id,
        name: 'ราเมนไก่เผ็ด',
        description: 'ราเมนซุปรสเผ็ด เนื้อไก่นุ่ม ใส่พริกเกาหลี',
        price: 110,
        category: 'อาหารหลัก',
        isAvailable: true,
        isPopular: true,
      },
      {
        restaurantId: restaurant3.id,
        name: 'ราเมนทะเล',
        description: 'ราเมนซุปกุ้ง หอยแครง กุ้งสด ปลาหมึก',
        price: 150,
        category: 'อาหารหลัก',
        isAvailable: true,
      },
      {
        restaurantId: restaurant3.id,
        name: 'ราเมนเห็ดเจ',
        description: 'ราเมนซุปผัก เห็ดหลากชนิด ผักสด',
        price: 95,
        category: 'อาหารหลัก',
        isAvailable: true,
      },
      {
        restaurantId: restaurant3.id,
        name: 'ไก่คาราเกะ',
        description: 'ไก่ทอดสไตล์ญี่ปุ่น กรอบนอกนุ่มใน',
        price: 80,
        category: 'อาหารเรียกน้ำย่อย',
        isAvailable: true,
      },
      {
        restaurantId: restaurant3.id,
        name: 'เกี๊ยวซ่าญี่ปุ่น',
        description: 'เกี๊ยวซ่าไส้หมู ทอดกรอบ',
        price: 60,
        category: 'อาหารเรียกน้ำย่อย',
        isAvailable: true,
      },
      {
        restaurantId: restaurant3.id,
        name: 'ชาเขียวเย็น',
        description: 'ชาเขียวญี่ปุ่นแท้ เย็นชื่นใจ',
        price: 45,
        category: 'เครื่องดื่ม',
        isAvailable: true,
      },
      {
        restaurantId: restaurant3.id,
        name: 'โซดาญี่ปุ่น',
        description: 'โซดาหลากรสชาติ',
        price: 35,
        category: 'เครื่องดื่ม',
        isAvailable: true,
      },
    ],
  });

  // Create Menu Items for Restaurant 4 (เฮงเฮง ติ่มซำ)
  await prisma.menuItem.createMany({
    data: [
      {
        restaurantId: restaurant4.id,
        name: 'ฮะเก๋า',
        description: 'ขนมจีบกุ้งสด ห่อผิงบางนุ่ม',
        price: 60,
        category: 'ติ่มซำ',
        isAvailable: true,
        isPopular: true,
      },
      {
        restaurantId: restaurant4.id,
        name: 'ซาลาเปาไส้หมูแดง',
        description: 'ซาลาเปานุ่มฟู ไส้หมูแดงหวานมัน',
        price: 45,
        category: 'ติ่มซำ',
        isAvailable: true,
        isPopular: true,
      },
      {
        restaurantId: restaurant4.id,
        name: 'ขาหมูพะโล้',
        description: 'ขาหมูตุ๋นน้ำพะโล้ หอมเครื่องเทศ',
        price: 120,
        category: 'อาหารหลัก',
        isAvailable: true,
      },
      {
        restaurantId: restaurant4.id,
        name: 'เป็ดย่างน้ำผึ้ง',
        description: 'เป็ดย่างหนังกรอบ เนื้อนุ่ม',
        price: 150,
        category: 'อาหารหลัก',
        isAvailable: true,
      },
      {
        restaurantId: restaurant4.id,
        name: 'ผัดผักรวม',
        description: 'ผักสดหลากชนิด ผัดน้ำมันงา',
        price: 70,
        category: 'อาหารหลัก',
        isAvailable: true,
      },
      {
        restaurantId: restaurant4.id,
        name: 'เกี๊ยวกุ้งทอด',
        description: 'เกี๊ยวกุ้งสด ทอดกรอบ',
        price: 55,
        category: 'ติ่มซำ',
        isAvailable: true,
      },
      {
        restaurantId: restaurant4.id,
        name: 'ชาจีน',
        description: 'ชาจีนร้อน หอมกรุ่น',
        price: 30,
        category: 'เครื่องดื่ม',
        isAvailable: true,
      },
      {
        restaurantId: restaurant4.id,
        name: 'โจ๊กหมู',
        description: 'โจ๊กหมูสับ ข้าวต้มจนละเอียด',
        price: 50,
        category: 'อาหารหลัก',
        isAvailable: true,
      },
    ],
  });

  // Create Menu Items for Restaurant 5 (Burger Station)
  await prisma.menuItem.createMany({
    data: [
      {
        restaurantId: restaurant5.id,
        name: 'Classic Cheeseburger',
        description: 'เบอร์เกอร์เนื้อวัวแท้ ชีสละลาย ผักสด',
        price: 89,
        category: 'เบอร์เกอร์',
        isAvailable: true,
        isPopular: true,
      },
      {
        restaurantId: restaurant5.id,
        name: 'Double Bacon Burger',
        description: 'เนื้อแพตตี้ 2 ชิ้น เบคอนกรอบ ชีส 2 ชั้น',
        price: 129,
        category: 'เบอร์เกอร์',
        isAvailable: true,
        isPopular: true,
      },
      {
        restaurantId: restaurant5.id,
        name: 'Spicy Chicken Burger',
        description: 'ไก่ทอดกรอบรสเผ็ด ซอสมายองเนส',
        price: 79,
        category: 'เบอร์เกอร์',
        isAvailable: true,
      },
      {
        restaurantId: restaurant5.id,
        name: 'French Fries',
        description: 'มันฝรั่งทอดกรอบ ขนาดใหญ่',
        price: 45,
        category: 'เครื่องเคียง',
        isAvailable: true,
      },
      {
        restaurantId: restaurant5.id,
        name: 'Onion Rings',
        description: 'หอมทอดกรอบ ห่อแป้งพิเศษ',
        price: 55,
        category: 'เครื่องเคียง',
        isAvailable: true,
      },
      {
        restaurantId: restaurant5.id,
        name: 'Chicken Nuggets',
        description: 'นักเก็ตไก่ 6 ชิ้น กรอบนอกนุ่มใน',
        price: 65,
        category: 'เครื่องเคียง',
        isAvailable: true,
      },
      {
        restaurantId: restaurant5.id,
        name: 'Coca-Cola',
        description: 'โค้กเย็นๆ ขนาดใหญ่',
        price: 35,
        category: 'เครื่องดื่ม',
        isAvailable: true,
      },
      {
        restaurantId: restaurant5.id,
        name: 'Milkshake Chocolate',
        description: 'มิลค์เชคช็อกโกแลต เข้มข้น',
        price: 70,
        category: 'เครื่องดื่ม',
        isAvailable: true,
      },
    ],
  });

  // Create Menu Items for Restaurant 6 (Sweet Cafe & Bakery)
  await prisma.menuItem.createMany({
    data: [
      {
        restaurantId: restaurant6.id,
        name: 'Chocolate Lava Cake',
        description: 'เค้กช็อกโกแลต ไหลลาวา เสิร์ฟร้อน',
        price: 85,
        category: 'ของหวาน',
        isAvailable: true,
        isPopular: true,
      },
      {
        restaurantId: restaurant6.id,
        name: 'Strawberry Cheesecake',
        description: 'ชีสเค้กสตรอเบอร์รี่ นุ่มละมุน',
        price: 95,
        category: 'ของหวาน',
        isAvailable: true,
        isPopular: true,
      },
      {
        restaurantId: restaurant6.id,
        name: 'Tiramisu',
        description: 'ทีรามิสุสูตรต้นตำรับ กาแฟเข้มข้น',
        price: 100,
        category: 'ของหวาน',
        isAvailable: true,
      },
      {
        restaurantId: restaurant6.id,
        name: 'Croissant',
        description: 'ครัวซองต์เนยสด กรอบนอกนุ่มใน',
        price: 50,
        category: 'เบเกอรี่',
        isAvailable: true,
      },
      {
        restaurantId: restaurant6.id,
        name: 'Brownie',
        description: 'บราวนี่ช็อกโกแลต เข้มข้น ท็อปวอลนัท',
        price: 65,
        category: 'ของหวาน',
        isAvailable: true,
      },
      {
        restaurantId: restaurant6.id,
        name: 'Americano',
        description: 'กาแฟอเมริกาโน่ เข้มข้น',
        price: 60,
        category: 'เครื่องดื่ม',
        isAvailable: true,
      },
      {
        restaurantId: restaurant6.id,
        name: 'Cappuccino',
        description: 'คาปูชิโน่ นมฟองนุ่ม',
        price: 70,
        category: 'เครื่องดื่ม',
        isAvailable: true,
      },
      {
        restaurantId: restaurant6.id,
        name: 'Iced Caramel Latte',
        description: 'ลาเต้คาราเมลเย็น หวานมัน',
        price: 80,
        category: 'เครื่องดื่ม',
        isAvailable: true,
      },
    ],
  });

  // Create Menu Items for Restaurant 7 (Bubble Tea Paradise)
  await prisma.menuItem.createMany({
    data: [
      {
        restaurantId: restaurant7.id,
        name: 'Classic Brown Sugar Boba',
        description: 'ชานมไข่มุกน้ำตาลทรายแดง หวานมัน',
        price: 55,
        category: 'ชานมไข่มุก',
        isAvailable: true,
        isPopular: true,
      },
      {
        restaurantId: restaurant7.id,
        name: 'Matcha Boba Latte',
        description: 'ชาเขียวมัทฉะ นมสด ไข่มุกนุ่ม',
        price: 65,
        category: 'ชานมไข่มุก',
        isAvailable: true,
        isPopular: true,
      },
      {
        restaurantId: restaurant7.id,
        name: 'Taro Milk Tea',
        description: 'ชานมเผือก หอมหวาน ไข่มุกนุ่ม',
        price: 60,
        category: 'ชานมไข่มุก',
        isAvailable: true,
      },
      {
        restaurantId: restaurant7.id,
        name: 'Mango Smoothie',
        description: 'ปั่นมะม่วงสด เย็นชื่นใจ',
        price: 70,
        category: 'สมูทตี้',
        isAvailable: true,
      },
      {
        restaurantId: restaurant7.id,
        name: 'Strawberry Yogurt',
        description: 'โยเกิร์ตสตรอเบอร์รี่ สดชื่น',
        price: 65,
        category: 'สมูทตี้',
        isAvailable: true,
      },
      {
        restaurantId: restaurant7.id,
        name: 'Thai Tea',
        description: 'ชาไทยแท้ หอมกรุ่น หวานมัน',
        price: 50,
        category: 'ชานมไข่มุก',
        isAvailable: true,
      },
      {
        restaurantId: restaurant7.id,
        name: 'Passion Fruit Green Tea',
        description: 'ชาเขียวเสาวรส เปรี้ยวหวาน',
        price: 55,
        category: 'ชาผลไม้',
        isAvailable: true,
      },
      {
        restaurantId: restaurant7.id,
        name: 'Lychee Rose Tea',
        description: 'ชากุหลาบลิ้นจี่ หอมหวาน',
        price: 60,
        category: 'ชาผลไม้',
        isAvailable: true,
      },
    ],
  });

  // Create Driver Profile
  console.warn('Creating driver profile...');

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

  console.warn('✅ Seed completed successfully!');
  console.warn('\nTest Accounts:');
  console.warn('Customer: customer@example.com / password123');
  console.warn('Restaurant Owner 1: owner1@example.com / password123');
  console.warn('Restaurant Owner 2: owner2@example.com / password123');
  console.warn('Driver: driver@example.com / password123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
