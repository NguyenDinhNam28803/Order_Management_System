import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
// Load biến môi trường từ file .env
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Định nghĩa cấu trúc dữ liệu để tránh lỗi TypeScript 'never'
interface TrainingDataItem {
  id: string;
  prNumber: string;
  features: {
    title: string;
    description: string;
    justification: string;
    totalAmount: number;
    currency: string;
    priority: number;
    department: string;
    costCenter: string;
    requesterRole: string;
    requesterTrustScore: number;
    itemsCount: number;
    itemsSummary: string;
    budgetStatus: {
      allocated: number;
      remaining: number;
      isOverBudget: boolean;
    };
  };
  label: number;
  decision: string;
  approverComment: string;
}

async function exportData() {
  console.log(
    '--- 🚀 Đang bắt đầu trích xuất dữ liệu huấn luyện phê duyệt PR ---',
  );

  try {
    // 1. Lấy danh sách các PR đã được phê duyệt hoặc từ chối
    const prs = await prisma.purchaseRequisition.findMany({
      where: {
        status: { in: ['APPROVED', 'REJECTED'] },
      },
      include: {
        requester: {
          select: {
            role: true,
            fullName: true,
            trustScore: true,
          },
        },
        department: {
          select: {
            name: true,
          },
        },
        costCenter: {
          select: {
            name: true,
            code: true,
          },
        },
        items: {
          select: {
            productDesc: true,
            qty: true,
            estimatedPrice: true,
          },
        },
      },
    });

    if (prs.length === 0) {
      console.warn(
        '⚠️ Không tìm thấy dữ liệu PR nào có trạng thái APPROVED hoặc REJECTED trong database.',
      );
      return;
    }

    console.log(
      `📦 Tìm thấy ${prs.length} bản ghi PR. Đang phân tích chi tiết...`,
    );

    const trainingData: TrainingDataItem[] = [];

    for (const pr of prs) {
      try {
        // 2. Tìm lịch sử phê duyệt cuối cùng (quyết định của con người)
        const workflow = await prisma.approvalWorkflow.findFirst({
          where: {
            documentId: pr.id,
            documentType: 'PURCHASE_REQUISITION',
            status: { in: ['APPROVED', 'REJECTED'] },
          },
          orderBy: { actionedAt: 'desc' },
        });

        // 3. Lấy thông tin ngân sách tại thời điểm đó (allocation của cost center)
        const budget = await prisma.budgetAllocation.findFirst({
          where: {
            costCenterId: pr.costCenterId || undefined,
            orgId: pr.orgId,
          },
          orderBy: { createdAt: 'desc' },
        });

        // Chuyển đổi Decimal sang Number để lưu JSON an toàn
        const totalAmount = Number(pr.totalEstimate);
        const budgetAllocated = budget ? Number(budget.allocatedAmount) : 0;
        const budgetSpent = budget ? Number(budget.spentAmount) : 0;
        const budgetRemaining = budgetAllocated - budgetSpent;

        trainingData.push({
          id: pr.id,
          prNumber: pr.prNumber,
          features: {
            title: pr.title,
            description: pr.description || '',
            justification: pr.justification || '',
            totalAmount: totalAmount,
            currency: pr.currency,
            priority: pr.priority,
            department: pr.department.name,
            costCenter: pr.costCenter?.name || 'N/A',
            requesterRole: pr.requester.role,
            requesterTrustScore: Number(pr.requester.trustScore),
            itemsCount: pr.items.length,
            itemsSummary: pr.items
              .map((i) => `${i.productDesc} (Qty: ${Number(i.qty)})`)
              .join('; '),
            budgetStatus: {
              allocated: budgetAllocated,
              remaining: budgetRemaining,
              isOverBudget: totalAmount > budgetRemaining,
            },
          },
          label: pr.status === 'APPROVED' ? 1 : 0,
          decision: pr.status,
          approverComment: workflow?.comment || '',
        });
      } catch (recordError) {
        console.error(`❌ Lỗi khi xử lý PR ${pr.prNumber}:`, recordError);
      }
    }

    // 4. Ghi file JSON
    const outputFileName = 'pr_training_data.json';
    const outputPath = path.join(process.cwd(), 'prisma', outputFileName);

    fs.writeFileSync(outputPath, JSON.stringify(trainingData, null, 2));

    console.log('--- ✅ Hoàn tất trích xuất dữ liệu! ---');
    console.log(`📍 File đã lưu tại: ${outputPath}`);
    console.log(`📊 Tổng số mẫu huấn luyện: ${trainingData.length}`);
  } catch (error) {
    console.error('💥 Lỗi nghiêm trọng trong quá trình trích xuất:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

exportData();
