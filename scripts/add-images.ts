import prisma from '../lib/prisma';

// รูปอาหารแต่ละประเภท
const images = {
  ราเมน: 'https://images.unsplash.com/photo-1557872943-16a5ac26437e?w=400&h=300&fit=crop',
  ติ่มซำ: 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=400&h=300&fit=crop',
  เบอร์เกอร์: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop',
  ฟรายส์: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=300&fit=crop',
  ไก่ทอด: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400&h=300&fit=crop',
  เค้ก: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=300&fit=crop',
  กาแฟ: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=300&fit=crop',
  ชานม: 'https://images.unsplash.com/photo-1515823064-d6e0c04616a7?w=400&h=300&fit=crop',
  สมูทตี้: 'https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=400&h=300&fit=crop',
  default: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop',
};

async function main() {
  console.log('🖼️ Adding images to menu items...');

  const allItems = await prisma.menuItem.findMany();

  for (const item of allItems) {
    let imageUrl = images.default;

    // เลือกรูปตามชื่อเมนู
    if (item.name.includes('ราเมน')) imageUrl = images.ราเมน;
    else if (item.name.includes('ฮะเก๋า') || item.name.includes('ซาลาเปา') || item.name.includes('เกี๊ยว')) imageUrl = images.ติ่มซำ;
    else if (item.name.includes('Burger') || item.name.includes('เบอร์เกอร์')) imageUrl = images.เบอร์เกอร์;
    else if (item.name.includes('Fries') || item.name.includes('French Fries')) imageUrl = images.ฟรายส์;
    else if (item.name.includes('Chicken') || item.name.includes('ไก่') || item.name.includes('Nuggets')) imageUrl = images.ไก่ทอด;
    else if (item.name.includes('Cake') || item.name.includes('เค้ก') || item.name.includes('Cheesecake') || item.name.includes('Brownie')) imageUrl = images.เค้ก;
    else if (item.name.includes('Coffee') || item.name.includes('กาแฟ') || item.name.includes('Cappuccino') || item.name.includes('Latte')) imageUrl = images.กาแฟ;
    else if (item.name.includes('Boba') || item.name.includes('ชานม') || item.name.includes('Milk Tea') || item.name.includes('Tea')) imageUrl = images.ชานม;
    else if (item.name.includes('Smoothie') || item.name.includes('สมูทตี้') || item.name.includes('Yogurt')) imageUrl = images.สมูทตี้;

    await prisma.menuItem.update({
      where: { id: item.id },
      data: { image: imageUrl },
    });

    console.log(`✅ Updated: ${item.name}`);
  }

  console.log('🎉 Done! All menu items now have images.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
