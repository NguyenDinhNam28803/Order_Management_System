import { PrismaClient, CurrencyCode } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log(
    '🚀 Seeding 50 Business Office products (Price >= 100,000 VND)...',
  );

  // Ensure Business Office category exists
  let bizCat = await prisma.productCategory.findFirst({
    where: { code: 'BIZ_OFFICE' },
  });

  if (!bizCat) {
    bizCat = await prisma.productCategory.create({
      data: {
        code: 'BIZ_OFFICE',
        name: 'Văn phòng phẩm doanh nghiệp',
        description:
          'Vật tư và thiết bị văn phòng chuyên dụng cho môi trường làm việc chuyên nghiệp.',
      },
    });
  }

  const bizProducts = [
    {
      name: 'Bảng Flipchart chân chữ U (70x100cm)',
      price: 1250000,
      unit: 'CÁI',
    },
    { name: 'Bút trình chiếu Logitech R400', price: 650000, unit: 'CÁI' },
    { name: 'Bút ký cao cấp Parker IM Black GT', price: 850000, unit: 'CÁI' },
    { name: 'Máy đóng sách gáy lò xo sắt Bosser', price: 2450000, unit: 'CÁI' },
    { name: 'Máy ép Plastic khổ A3 DSB HQ-335', price: 1850000, unit: 'CÁI' },
    { name: 'Máy cắt giấy khổ A3 YT-300', price: 950000, unit: 'CÁI' },
    {
      name: 'Thùng 5 Ream Giấy IK Plus A4 80gsm',
      price: 445000,
      unit: 'THÙNG',
    },
    {
      name: 'Bộ dụng cụ để bàn da cao cấp (7 món)',
      price: 1550000,
      unit: 'BỘ',
    },
    { name: 'Tủ hồ sơ sắt 2 cánh kính Hòa Phát', price: 2850000, unit: 'CÁI' },
    {
      name: 'Bìa còng 7cm Thiên Long (Thùng 50 cái)',
      price: 1950000,
      unit: 'THÙNG',
    },
    { name: 'Dấu nhảy số tự động 6 số Shiny', price: 280000, unit: 'CÁI' },
    { name: 'Máy bấm kim đại KW-Trio 50LA', price: 420000, unit: 'CÁI' },
    { name: 'Hộp kim bấm đại (Hộp 10 hộp nhỏ)', price: 150000, unit: 'HỘP' },
    { name: 'Kệ hồ sơ 3 tầng sắt sơn tĩnh điện', price: 220000, unit: 'CÁI' },
    { name: 'Bảng từ trắng treo tường 120x240cm', price: 1650000, unit: 'CÁI' },
    {
      name: 'Ghế xoay lưới công sở Ergonomic G01',
      price: 1850000,
      unit: 'CÁI',
    },
    { name: 'Bàn họp gỗ MDF 2m4 x 1m2', price: 4500000, unit: 'CÁI' },
    { name: 'Máy hủy tài liệu Bingo C30 (Vụn)', price: 3250000, unit: 'CÁI' },
    { name: 'Máy đếm tiền Xinda Super BC 31', price: 5850000, unit: 'CÁI' },
    { name: 'Bộ đàm Motorola CP-1300', price: 1450000, unit: 'CÁI' },
    { name: 'Bảng chức danh đồng đế gỗ cao cấp', price: 450000, unit: 'CÁI' },
    {
      name: 'Két sắt văn phòng chống cháy Việt Tiệp',
      price: 3550000,
      unit: 'CÁI',
    },
    { name: 'Hộp đựng namecard pha lê để bàn', price: 320000, unit: 'CÁI' },
    {
      name: 'Máy chấm công vân tay Ronald Jack RJ1200',
      price: 2650000,
      unit: 'CÁI',
    },
    {
      name: 'Thẻ tên nhân viên thay tên (Lô 100 cái)',
      price: 1200000,
      unit: 'LÔ',
    },
    {
      name: 'Dây đeo thẻ in logo doanh nghiệp (100 sợi)',
      price: 850000,
      unit: 'BỘ',
    },
    { name: 'Bìa trình ký đôi da cao cấp A4', price: 185000, unit: 'CÁI' },
    {
      name: 'Mực máy photo Ricoh MP 2014 (Chính hãng)',
      price: 950000,
      unit: 'HỘP',
    },
    {
      name: 'Khung hình khen thưởng A4 (Lô 20 cái)',
      price: 750000,
      unit: 'LÔ',
    },
    {
      name: 'Đèn LED văn phòng 600x600 (Bộ 4 máng)',
      price: 1450000,
      unit: 'BỘ',
    },
    {
      name: 'Giấy note 3M Post-it (Thùng 24 xấp)',
      price: 580000,
      unit: 'THÙNG',
    },
    {
      name: 'Ghim kẹp giấy tam giác (Thùng 100 hộp)',
      price: 350000,
      unit: 'THÙNG',
    },
    {
      name: 'Băng keo trong 5cm 100yard (Cây 6 cuộn)',
      price: 125000,
      unit: 'CÂY',
    },
    {
      name: 'Hộp đựng hồ sơ lưu trữ carton (Lô 50 cái)',
      price: 850000,
      unit: 'LÔ',
    },
    { name: 'Bút dạ quang highlight (Hộp 10 cây)', price: 120000, unit: 'HỘP' },
    {
      name: 'Bộ vệ sinh laptop/máy tính chuyên nghiệp',
      price: 110000,
      unit: 'BỘ',
    },
    {
      name: 'Chuột máy tính văn phòng Dell MS116 (Lô 10 cái)',
      price: 1350000,
      unit: 'LÔ',
    },
    {
      name: 'Bàn phím văn phòng Logitech K120 (Lô 5 cái)',
      price: 950000,
      unit: 'LÔ',
    },
    { name: 'Ổ cắm điện kéo dài Lioa 10 lỗ 3m', price: 245000, unit: 'CÁI' },
    { name: 'Kệ để CPU có bánh xe di chuyển', price: 185000, unit: 'CÁI' },
    {
      name: 'Giá đỡ màn hình đôi (Dual Monitor Arm)',
      price: 1150000,
      unit: 'CÁI',
    },
    {
      name: 'Tấm lót chuột khổ lớn (90x40cm) cho văn phòng',
      price: 145000,
      unit: 'CÁI',
    },
    {
      name: 'Thùng rác văn phòng Inox đạp chân 12L',
      price: 385000,
      unit: 'CÁI',
    },
    { name: 'Bộ tách trà gốm sứ Minh Long in logo', price: 650000, unit: 'BỘ' },
    {
      name: 'Cà phê hạt nguyên chất Arabica (Bao 5kg)',
      price: 1450000,
      unit: 'BAO',
    },
    {
      name: 'Nước uống tinh khiết Lavie 19L (Combo 10 bình)',
      price: 650000,
      unit: 'COMBO',
    },
    {
      name: 'Giấy vệ sinh cuộn lớn An An (Cây 10 cuộn)',
      price: 285000,
      unit: 'CÂY',
    },
    { name: 'Nước rửa tay sát khuẩn 5L (Can)', price: 350000, unit: 'CAN' },
    {
      name: 'Khăn giấy lụa Bless You (Thùng 50 hộp)',
      price: 1150000,
      unit: 'THÙNG',
    },
    { name: 'Cây nước nóng lạnh Kangaroo KG31A3', price: 2850000, unit: 'CÁI' },
  ];

  for (let i = 0; i < bizProducts.length; i++) {
    const p = bizProducts[i];
    const sku = `BIZ-OFF-${(2000 + i).toString()}`;

    const existingProduct = await prisma.product.findFirst({
      where: { sku: sku },
    });

    if (existingProduct) {
      await prisma.product.update({
        where: { id: existingProduct.id },
        data: {
          name: p.name,
          unitPriceRef: p.price,
          categoryId: bizCat.id,
        },
      });
    } else {
      await prisma.product.create({
        data: {
          sku: sku,
          name: p.name,
          description: `${p.name} - Giải pháp văn phòng chuyên nghiệp cho doanh nghiệp. Độ bền cao, thiết kế hiện đại.`,
          unitPriceRef: p.price,
          unit: p.unit,
          currency: CurrencyCode.VND,
          categoryId: bizCat.id,
          isActive: true,
        },
      });
    }
  }

  console.log(
    `✅ Successfully seeded ${bizProducts.length} business office products.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
