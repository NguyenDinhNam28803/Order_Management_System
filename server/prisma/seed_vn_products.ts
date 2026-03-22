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
  console.log('🚀 Seeding 50 Vietnamese products with price >= 100,000 VND...');

  // Ensure categories exist
  const categories = [
    { code: 'VN_FOOD', name: 'Đồ ăn & Thực phẩm VN' },
    { code: 'VN_ELEC', name: 'Thiết bị điện VN' },
    { code: 'VN_HOUSE', name: 'Đồ gia dụng VN' },
    { code: 'VN_OFFICE', name: 'Văn phòng phẩm VN' },
  ];

  const catMap: Record<string, string> = {};
  for (const cat of categories) {
    let existingCat = await prisma.productCategory.findFirst({
      where: { code: cat.code },
    });

    if (!existingCat) {
      existingCat = await prisma.productCategory.create({
        data: {
          code: cat.code,
          name: cat.name,
        },
      });
    }
    catMap[cat.code] = existingCat.id;
  }

  const vnProducts = [
    // Đồ ăn & Thực phẩm (Gạo, Cafe, v.v.)
    {
      name: 'Gạo ST25 Ông Cua (Túi 5kg)',
      cat: 'VN_FOOD',
      price: 195000,
      unit: 'TÚI',
    },
    {
      name: 'Cà phê Trung Nguyên Legend Special Edition',
      cat: 'VN_FOOD',
      price: 250000,
      unit: 'HỘP',
    },
    {
      name: 'Hạt điều rang muối Bình Phước (Hũ 500g)',
      cat: 'VN_FOOD',
      price: 155000,
      unit: 'HŨ',
    },
    {
      name: 'Trà Thái Nguyên Thượng Hạng (Gói 500g)',
      cat: 'VN_FOOD',
      price: 320000,
      unit: 'GÓI',
    },
    {
      name: 'Mật ong hoa nhãn Hưng Yên (Chai 1L)',
      cat: 'VN_FOOD',
      price: 280000,
      unit: 'CHAI',
    },
    {
      name: 'Nước mắm Phú Quốc Khải Hoàn 40 độ đạm',
      cat: 'VN_FOOD',
      price: 185000,
      unit: 'CHAI',
    },
    {
      name: 'Tương ớt Cholimex (Thùng 24 chai)',
      cat: 'VN_FOOD',
      price: 360000,
      unit: 'THÙNG',
    },
    {
      name: 'Sữa bột Vinamilk Dielac Alpha Gold 4',
      cat: 'VN_FOOD',
      price: 245000,
      unit: 'HỘP',
    },
    {
      name: 'Bánh đậu xanh Rồng Vàng Hải Dương (Hộp lớn)',
      cat: 'VN_FOOD',
      price: 120000,
      unit: 'HỘP',
    },
    {
      name: 'Nấm linh chi đỏ Việt Nam (Gói 200g)',
      cat: 'VN_FOOD',
      price: 450000,
      unit: 'GÓI',
    },
    {
      name: 'Yến sào Khánh Hòa tinh chế (10g)',
      cat: 'VN_FOOD',
      price: 650000,
      unit: 'HỘP',
    },
    {
      name: 'Rượu vang Đà Lạt Premium Red Wine',
      cat: 'VN_FOOD',
      price: 210000,
      unit: 'CHAI',
    },

    // Thiết bị điện (Điện Quang, Rạng Đông)
    {
      name: 'Ổ cắm điện quay Điện Quang 6 lỗ 5m',
      cat: 'VN_ELEC',
      price: 145000,
      unit: 'CÁI',
    },
    {
      name: 'Đèn bàn học chống cận Rạng Đông LED',
      cat: 'VN_ELEC',
      price: 285000,
      unit: 'CÁI',
    },
    {
      name: 'Bóng đèn LED tròn Điện Quang 12W (Combo 5)',
      cat: 'VN_ELEC',
      price: 175000,
      unit: 'BỘ',
    },
    {
      name: 'Đèn pha LED Rạng Đông 50W',
      cat: 'VN_ELEC',
      price: 420000,
      unit: 'CÁI',
    },
    {
      name: 'Vợt muỗi thông minh Sunhouse',
      cat: 'VN_ELEC',
      price: 135000,
      unit: 'CÁI',
    },
    {
      name: 'Ấm siêu tốc Inox Sunhouse 1.8L',
      cat: 'VN_ELEC',
      price: 199000,
      unit: 'CÁI',
    },
    {
      name: 'Quạt đứng Senko có remote',
      cat: 'VN_ELEC',
      price: 485000,
      unit: 'CÁI',
    },
    {
      name: 'Máy sấy tóc Kangaroo 1200W',
      cat: 'VN_ELEC',
      price: 215000,
      unit: 'CÁI',
    },
    {
      name: 'Nồi cơm điện nắp gài Sunhouse 1.8L',
      cat: 'VN_ELEC',
      price: 550000,
      unit: 'CÁI',
    },
    {
      name: 'Bếp hồng ngoại Sunhouse SHD6011',
      cat: 'VN_ELEC',
      price: 790000,
      unit: 'CÁI',
    },
    {
      name: 'Máy lọc nước Karofi Optimus Duo',
      cat: 'VN_ELEC',
      price: 5450000,
      unit: 'CÁI',
    },
    {
      name: 'Loa kéo karaoke Acnos CS445',
      cat: 'VN_ELEC',
      price: 4200000,
      unit: 'CÁI',
    },

    // Đồ gia dụng (Kangaroo, Sunhouse)
    {
      name: 'Chảo chống dính Sunhouse CT26',
      cat: 'VN_HOUSE',
      price: 115000,
      unit: 'CÁI',
    },
    {
      name: 'Bộ lau nhà xoay tay 360 độ Kangaroo',
      cat: 'VN_HOUSE',
      price: 345000,
      unit: 'BỘ',
    },
    {
      name: 'Bộ nồi Inox Sunhouse 3 chiếc',
      cat: 'VN_HOUSE',
      price: 520000,
      unit: 'BỘ',
    },
    {
      name: 'Bình thủy giữ nhiệt Rạng Đông 2L',
      cat: 'VN_HOUSE',
      price: 165000,
      unit: 'CÁI',
    },
    {
      name: 'Hộp cơm điện hâm nóng Magic Vietnam',
      cat: 'VN_HOUSE',
      price: 295000,
      unit: 'CÁI',
    },
    {
      name: 'Máy xay sinh tố đa năng Sunhouse',
      cat: 'VN_HOUSE',
      price: 465000,
      unit: 'BỘ',
    },
    {
      name: 'Nồi chiên không dầu Kangaroo 5L',
      cat: 'VN_HOUSE',
      price: 1250000,
      unit: 'CÁI',
    },
    {
      name: 'Bàn là hơi nước Sunhouse SHD7772',
      cat: 'VN_HOUSE',
      price: 380000,
      unit: 'CÁI',
    },
    {
      name: 'Máy hút bụi cầm tay Shimono VN',
      cat: 'VN_HOUSE',
      price: 890000,
      unit: 'CÁI',
    },
    {
      name: 'Kệ chén bát Inox 304 Đại Thành',
      cat: 'VN_HOUSE',
      price: 650000,
      unit: 'CÁI',
    },
    {
      name: 'Thùng rác thông minh Duy Tân 20L',
      cat: 'VN_HOUSE',
      price: 195000,
      unit: 'CÁI',
    },
    {
      name: 'Tủ nhựa Duy Tân Tabi 5 tầng',
      cat: 'VN_HOUSE',
      price: 1150000,
      unit: 'CÁI',
    },

    // Văn phòng phẩm (Thiên Long)
    {
      name: 'Bút bi Thiên Long TL-027 (Hộp 20 cây)',
      cat: 'VN_OFFICE',
      price: 110000,
      unit: 'HỘP',
    },
    {
      name: 'Máy tính Casio FX-580VN X',
      cat: 'VN_OFFICE',
      price: 650000,
      unit: 'CÁI',
    },
    {
      name: 'Giấy in Double A A4 80gsm (Thùng 5 ream)',
      cat: 'VN_OFFICE',
      price: 425000,
      unit: 'THÙNG',
    },
    {
      name: 'Bìa hồ sơ 12 ngăn Thiên Long',
      cat: 'VN_OFFICE',
      price: 125000,
      unit: 'CÁI',
    },
    {
      name: 'Dập ghim đại Thiên Long G10',
      cat: 'VN_OFFICE',
      price: 185000,
      unit: 'CÁI',
    },
    {
      name: 'Mực in Laser Canon 2900 (Thương hiệu Việt)',
      cat: 'VN_OFFICE',
      price: 350000,
      unit: 'HỘP',
    },
    {
      name: 'Bảng từ trắng treo tường 80x120cm',
      cat: 'VN_OFFICE',
      price: 480000,
      unit: 'CÁI',
    },
    {
      name: 'Ghế xoay văn phòng Hòa Phát',
      cat: 'VN_OFFICE',
      price: 850000,
      unit: 'CÁI',
    },
    {
      name: 'Bàn làm việc gỗ công nghiệp Hòa Phát',
      cat: 'VN_OFFICE',
      price: 1250000,
      unit: 'CÁI',
    },
    {
      name: 'Cặp da công sở Ladoda',
      cat: 'VN_OFFICE',
      price: 550000,
      unit: 'CÁI',
    },
    {
      name: 'Sổ tay bìa da cao cấp (Set 3 cuốn)',
      cat: 'VN_OFFICE',
      price: 150000,
      unit: 'BỘ',
    },
    {
      name: 'Máy hủy tài liệu mini Bingo',
      cat: 'VN_OFFICE',
      price: 1450000,
      unit: 'CÁI',
    },

    // Thêm các sản phẩm khác để đủ 50
    {
      name: 'Nón bảo hiểm Sơn cao cấp',
      cat: 'VN_HOUSE',
      price: 450000,
      unit: 'CÁI',
    },
    {
      name: 'Giày Bitis Hunter Street',
      cat: 'VN_HOUSE',
      price: 680000,
      unit: 'ĐÔI',
    },
  ];

  for (let i = 0; i < vnProducts.length; i++) {
    const p = vnProducts[i];
    const sku = `${p.cat}-${(1000 + i).toString()}`;

    const existingProduct = await prisma.product.findFirst({
      where: { sku: sku },
    });

    if (existingProduct) {
      await prisma.product.update({
        where: { id: existingProduct.id },
        data: {
          name: p.name,
          unitPriceRef: p.price,
          categoryId: catMap[p.cat],
        },
      });
    } else {
      await prisma.product.create({
        data: {
          sku: sku,
          name: p.name,
          description: `${p.name} - Sản phẩm chất lượng cao từ các thương hiệu hàng đầu Việt Nam.`,
          unitPriceRef: p.price,
          unit: p.unit,
          currency: CurrencyCode.VND,
          categoryId: catMap[p.cat],
          isActive: true,
        },
      });
    }
  }

  console.log(`✅ Successfully seeded ${vnProducts.length} products.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
