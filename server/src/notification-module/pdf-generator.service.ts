import { Injectable, Logger } from '@nestjs/common';
import * as path from 'path';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const PDFDocument = require('pdfkit') as typeof import('pdfkit');

export interface PoItemData {
  lineNumber: number;
  description: string;
  qty: number;
  unit?: string;
  unitPrice: number;
  total: number;
}

export interface PoPdfData {
  poNumber: string;
  issuedDate: Date;
  deliveryDate?: Date | null;
  paymentTerms?: string;
  deliveryAddress?: string;
  notes?: string;
  buyerOrg: { name: string; address?: string; email?: string; phone?: string };
  supplierOrg: {
    name: string;
    address?: string;
    email?: string;
    phone?: string;
  };
  items: PoItemData[];
  subtotal: number;
  taxAmount?: number;
  totalAmount: number;
  currency?: string;
}

@Injectable()
export class PdfGeneratorService {
  private readonly logger = new Logger(PdfGeneratorService.name);

  async generatePoPdf(data: PoPdfData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const chunks: Buffer[] = [];

        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        const currency = data.currency ?? 'VND';
        const fmt = (n: number) => n.toLocaleString('vi-VN') + ' ' + currency;

        const isContract = data.poNumber.startsWith('CON-');
        const title = isContract ? 'HỢP ĐỒNG CUNG CẤP' : 'PURCHASE ORDER';
        
        // Font paths logic
        const fontDir = path.join(process.cwd(), 'dist/assets/fonts');
        const srcFontDir = path.join(process.cwd(), 'src/assets/fonts');
        
        let regularFontPath = path.join(fontDir, 'Arial.ttf');
        let boldFontPath = path.join(fontDir, 'Arial-Bold.ttf');
        
        // Fallback to src if dist doesn't exist
        if (!require('fs').existsSync(regularFontPath)) {
          regularFontPath = path.join(srcFontDir, 'Arial.ttf');
          boldFontPath = path.join(srcFontDir, 'Arial-Bold.ttf');
        }

        doc.registerFont('MainFont', regularFontPath);
        doc.registerFont('MainFontBold', boldFontPath);

        // ── Background Header Shading ────────────────────────────────────────
        doc.rect(0, 0, 595, 120).fill('#f8fafc');
        
        doc
          .fontSize(28)
          .font('MainFontBold')
          .fillColor('#000000')
          .text(title, 0, 45, { align: 'center' });

        doc
          .fontSize(14)
          .font('MainFontBold')
          .fillColor('#A85032')
          .text(data.poNumber, 0, 75, { align: 'center' });

        doc.moveDown(2);

        // ── Buyer & Supplier info (Grid Layout) ─────────────────────────────
        const colLeft = 50;
        const colRight = 310;
        const infoY = 140;

        // BÊN MUA
        doc
          .font('MainFontBold')
          .fontSize(9)
          .fillColor('#000000')
          .text('BÊN MUA (BUYER)', colLeft, infoY);
        
        doc
          .font('MainFontBold')
          .fontSize(11)
          .fillColor('#000000')
          .text(data.buyerOrg.name || '____________________', colLeft, infoY + 14, { width: 230 });
        
        doc
          .font('MainFont')
          .fontSize(9)
          .fillColor('#000000')
          .text(`Email: ${data.buyerOrg.email || '____________________'}`, colLeft, doc.y + 4, { width: 230 });

        // NHÀ CUNG CẤP
        doc
          .font('MainFontBold')
          .fontSize(9)
          .fillColor('#000000')
          .text('NHÀ CUNG CẤP (SUPPLIER)', colRight, infoY);
        
        doc
          .font('MainFontBold')
          .fontSize(11)
          .fillColor('#000000')
          .text(data.supplierOrg.name || '____________________', colRight, infoY + 14, { width: 235 });
        
        doc
          .font('MainFont')
          .fontSize(9)
          .fillColor('#000000')
          .text(`Email: ${data.supplierOrg.email || '____________________'}`, colRight, doc.y + 4);

        // ── Metadata Row (Horizontal) ───────────────────────────────────────
        const metaY = 220;
        doc.rect(50, metaY - 10, 495, 45).fill('#f1f5f9');
        
        doc.font('MainFontBold').fontSize(8).fillColor('#64748b');
        doc.text('NGÀY PHÁT HÀNH', 65, metaY);
        doc.text('ĐIỀU KHOẢN THANH TOÁN', 315, metaY);

        doc.font('MainFontBold').fontSize(10).fillColor('#1e293b');
        const dateStr = data.issuedDate ? data.issuedDate.toLocaleDateString('vi-VN') : '____/____/____';
        doc.text(dateStr, 65, metaY + 14);
        doc.text(data.paymentTerms ?? 'Net 30', 315, metaY + 14);

        // ── Items table ──────────────────────────────────────────────────────
        const tableTop = 280;
        const cols = {
          no: 50,
          desc: 85,
          qty: 340,
          unit: 385,
          price: 430,
          total: 495,
        };
        const rowH = 28;

        // Table Header
        doc.rect(50, tableTop, 495, rowH).fill('#A85032');
        doc.font('MainFontBold').fontSize(9).fillColor('#ffffff');
        
        doc.text('#', 50, tableTop + 9, { width: 35, align: 'center' });
        doc.text('MÔ TẢ SẢN PHẨM / DỊCH VỤ', 85, tableTop + 9, { width: 255, align: 'left' });
        doc.text('SL', 340, tableTop + 9, { width: 45, align: 'center' });
        doc.text('ĐVT', 385, tableTop + 9, { width: 45, align: 'center' });
        doc.text('ĐƠN GIÁ', 430, tableTop + 9, { width: 65, align: 'center' });
        doc.text('THÀNH TIỀN', 495, tableTop + 9, { width: 50, align: 'center' });

        // Item rows
        let currentY = tableTop + rowH;
        data.items.forEach((item, idx) => {
          // Alternating background for rows
          if (idx % 2 !== 0) {
            doc.rect(50, currentY, 495, rowH).fill('#f8fafc');
          }
          
          doc.font('MainFont').fontSize(9).fillColor('#334155');
          doc.text(String(idx + 1), 50, currentY + 9, { width: 35, align: 'center' });
          doc.text(item.description, 85, currentY + 9, { width: 250 });
          doc.text(String(item.qty), 340, currentY + 9, { width: 45, align: 'center' });
          doc.text(item.unit ?? 'PCS', 385, currentY + 9, { width: 45, align: 'center' });
          doc.text(fmt(item.unitPrice), 430, currentY + 9, { width: 60, align: 'right' });
          doc.text(fmt(item.total), 495, currentY + 9, { width: 50, align: 'right' });
          
          // Border below row
          doc.moveTo(50, currentY + rowH).lineTo(545, currentY + rowH).strokeColor('#e2e8f0').lineWidth(0.5).stroke();
          
          currentY += rowH;
        });

        // ── Totals ───────────────────────────────────────────────────────────
        currentY += 15;
        doc.font('MainFont').fontSize(9).fillColor('#64748b');
        doc.text('Tạm tính:', 350, currentY, { width: 100, align: 'right' });
        doc.text(fmt(data.subtotal), 465, currentY, { width: 80, align: 'right' });

        currentY += 22;
        doc.rect(100, currentY, 445, 34).fill('#A85032');
        doc.font('MainFontBold').fontSize(12).fillColor('#ffffff');
        doc.text('TỔNG CỘNG:', 120, currentY + 11, { width: 100 });
        doc.text(fmt(data.totalAmount), 435, currentY + 11, { width: 100, align: 'right' });

        // ── Notes ────────────────────────────────────────────────────────────
        currentY += 55;
        doc.font('MainFontBold').fontSize(10).fillColor('#1e293b').text('GHI CHÚ:', 50, currentY);
        
        doc.font('MainFont').fontSize(9).fillColor('#475569');
        if (data.notes) {
          const parts = data.notes.split(' và ');
          let noteY = currentY + 16;
          parts.forEach(part => {
            const prefix = part.trim().startsWith('•') ? '' : '• ';
            doc.text(`${prefix}${part.trim()}`, 50, noteY, { width: 450 });
            noteY += 14;
          });
          currentY = noteY;
        } else {
          doc.text('• Không có ghi chú.', 50, currentY + 16);
          currentY += 30;
        }

        // ── Footer ───────────────────────────────────────────────────────────
        doc.moveDown(2);
        doc
          .font('MainFontBold')
          .fontSize(10)
          .fillColor('#000000')
          .text('ĐIỀU KHOẢN VÀ CÓ LIÊN QUAN:', 50, doc.y);
        
        doc
          .font('MainFont')
          .fontSize(8)
          .fillColor('#94a3b8')
          .text(
            'Tài liệu này được tạo tự động bởi hệ thống OMS. Vui lòng xác nhận hoặc từ chối qua link đính kèm trong email.',
            50,
            doc.y + 5,
            { width: 495 }
          );

        doc.end();
      } catch (err) {
        this.logger.error('PDF generation failed:', err);
        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
        reject(err);
      }
    });
  }
}
