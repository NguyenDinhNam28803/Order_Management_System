import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class QualityTrendService {
  private readonly logger = new Logger(QualityTrendService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Thuật toán tìm chuỗi tăng liên tiếp dài nhất (Longest Increasing Subarray)
   * Phù hợp để phát hiện hành vi "luộc ếch" (tăng phế phẩm đều đặn)
   */
  async getLongestIncreasingTrend(supplierId: string) {
    const grnItems = await this.prisma.grnItem.findMany({
      where: {
        grn: {
          po: { supplierId },
          receivedAt: { gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) },
        },
      },
      orderBy: { grn: { receivedAt: 'asc' } },
      include: { grn: { include: { po: true } } },
    });

    if (grnItems.length === 0) return { detected: false };

    const dailyRates = this.calculateDailyDefectRates(grnItems);
    const rates = dailyRates.map((d) => d.rate);

    // Tìm chuỗi tăng dài nhất
    const result = this.findLongestIncreasingSubarray(rates);

    // Ngưỡng cảnh báo: Chuỗi tăng liên tiếp >= 7 ngày
    const MIN_TREND_DAYS = 7;

    return {
      detected: result.length >= MIN_TREND_DAYS,
      length: result.length,
      startRate: result.startRate,
      endRate: result.endRate,
      isCritical: result.length >= 14, // Cảnh báo mức cao nếu trượt dài >= 14 ngày
    };
  }

  private findLongestIncreasingSubarray(rates: number[]) {
    if (rates.length === 0) return { length: 0, startRate: 0, endRate: 0 };

    let maxLength = 1;
    let currentLength = 1;
    let endIndex = 0;

    for (let i = 1; i < rates.length; i++) {
      // Điều kiện tăng: rate hôm nay > rate hôm qua
      if (rates[i] > rates[i - 1]) {
        currentLength++;
      } else {
        if (currentLength > maxLength) {
          maxLength = currentLength;
          endIndex = i - 1;
        }
        currentLength = 1;
      }
    }

    // Kiểm tra lần cuối
    if (currentLength > maxLength) {
      maxLength = currentLength;
      endIndex = rates.length - 1;
    }

    return {
      length: maxLength,
      startRate: rates[endIndex - maxLength + 1],
      endRate: rates[endIndex],
    };
  }

  private calculateDailyDefectRates(items: any[]) {
    const daily: Record<string, { total: number; rejected: number }> = {};
    items.forEach((item) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const date = item.grn.receivedAt.toISOString().split('T')[0];
      if (!daily[date]) daily[date] = { total: 0, rejected: 0 };
      daily[date].total += Number(item.acceptedQty) + Number(item.rejectedQty);
      daily[date].rejected += Number(item.rejectedQty);
    });

    return Object.keys(daily)
      .map((date) => ({
        date,
        rate: daily[date].rejected / daily[date].total,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  // Phương thức generateWarningLetter giữ nguyên như đã báo cáo
  async generateWarningLetter(
    supplierId: string,
    context: { startRate: number; endRate: number; days: number },
  ) {
    const supplier = await this.prisma.organization.findUnique({
      where: { id: supplierId },
    });
    const supplierName = supplier?.name || 'Valued Supplier';

    const prompt = `
      Act as a Senior Quality Assurance Manager.
      Write a formal Warning Letter for quality degradation.
      - Supplier: ${supplierName}
      - Observation: Defect rate increased from ${(context.startRate * 100).toFixed(1)}% to ${(context.endRate * 100).toFixed(1)}% over ${context.days} days.
      - Tone: Professional, firm, and stern.
    `;

    const response = await fetch(
      `${process.env.AI_SERVICE_URL || 'http://localhost:5000'}/ai-service/chat`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: prompt }),
      },
    );

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const data = await response.json();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    return { letter: data.reply || data.response };
  }
}
