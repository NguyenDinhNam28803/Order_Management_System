import { Injectable, Logger } from '@nestjs/common';
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
  supplierOrg: { name: string; address?: string; email?: string; phone?: string };
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
        const fmt = (n: number) =>
          n.toLocaleString('vi-VN') + ' ' + currency;

        // ── Header ──────────────────────────────────────────────────────────
        doc
          .fontSize(20)
          .font('Helvetica-Bold')
          .text('PURCHASE ORDER', { align: 'center' });

        doc
          .fontSize(13)
          .font('Helvetica-Bold')
          .fillColor('#1a56db')
          .text(data.poNumber, { align: 'center' });

        doc.moveDown(0.5);
        doc
          .moveTo(50, doc.y)
          .lineTo(545, doc.y)
          .strokeColor('#1a56db')
          .lineWidth(2)
          .stroke();
        doc.moveDown(0.8);

        // ── Buyer & Supplier info (2 columns) ───────────────────────────────
        const colLeft = 50;
        const colRight = 300;
        const startY = doc.y;

        doc.font('Helvetica-Bold').fontSize(9).fillColor('#555555').text('BÊN MUA (BUYER)', colLeft, startY);
        doc
          .font('Helvetica-Bold')
          .fontSize(11)
          .fillColor('#000000')
          .text(data.buyerOrg.name, colLeft, doc.y + 2, { width: 220 });
        if (data.buyerOrg.address)
          doc.font('Helvetica').fontSize(9).fillColor('#444').text(data.buyerOrg.address, colLeft, doc.y + 2, { width: 220 });
        if (data.buyerOrg.email)
          doc.text(`Email: ${data.buyerOrg.email}`, colLeft, doc.y + 2, { width: 220 });

        const supplierY = startY;
        doc.font('Helvetica-Bold').fontSize(9).fillColor('#555555').text('NHÀ CUNG CẤP (SUPPLIER)', colRight, supplierY);
        doc
          .font('Helvetica-Bold')
          .fontSize(11)
          .fillColor('#000000')
          .text(data.supplierOrg.name, colRight, supplierY + 14, { width: 220 });
        if (data.supplierOrg.address)
          doc.font('Helvetica').fontSize(9).fillColor('#444').text(data.supplierOrg.address, colRight, doc.y + 2, { width: 220 });
        if (data.supplierOrg.email)
          doc.text(`Email: ${data.supplierOrg.email}`, colRight, doc.y + 2, { width: 220 });

        doc.moveDown(2);

        // ── Meta info row ────────────────────────────────────────────────────
        const metaY = doc.y;
        doc
          .font('Helvetica-Bold').fontSize(9).fillColor('#555')
          .text('NGÀY PHÁT HÀNH', colLeft, metaY)
          .font('Helvetica').fontSize(10).fillColor('#000')
          .text(data.issuedDate.toLocaleDateString('vi-VN'), colLeft, metaY + 12);

        if (data.deliveryDate) {
          doc
            .font('Helvetica-Bold').fontSize(9).fillColor('#555')
            .text('NGÀY GIAO HÀNG', 200, metaY)
            .font('Helvetica').fontSize(10).fillColor('#000')
            .text(new Date(data.deliveryDate).toLocaleDateString('vi-VN'), 200, metaY + 12);
        }

        doc
          .font('Helvetica-Bold').fontSize(9).fillColor('#555')
          .text('ĐIỀU KHOẢN THANH TOÁN', colRight, metaY)
          .font('Helvetica').fontSize(10).fillColor('#000')
          .text(data.paymentTerms ?? 'NET 30', colRight, metaY + 12);

        doc.moveDown(3);

        if (data.deliveryAddress) {
          doc
            .font('Helvetica-Bold').fontSize(9).fillColor('#555').text('ĐỊA CHỈ GIAO HÀNG')
            .font('Helvetica').fontSize(9).fillColor('#000').text(data.deliveryAddress);
          doc.moveDown(0.5);
        }

        // ── Items table ──────────────────────────────────────────────────────
        doc.moveDown(0.5);
        const tableTop = doc.y;
        const cols = { no: 50, desc: 80, qty: 330, unit: 365, price: 410, total: 470 };
        const rowH = 20;

        // Header row
        doc.rect(50, tableTop, 495, rowH).fill('#1a56db');
        doc
          .font('Helvetica-Bold')
          .fontSize(9)
          .fillColor('#ffffff');
        doc.text('#', cols.no, tableTop + 6, { width: 25, align: 'center' });
        doc.text('MÔ TẢ SẢN PHẨM / DỊCH VỤ', cols.desc, tableTop + 6, { width: 245 });
        doc.text('SL', cols.qty, tableTop + 6, { width: 30, align: 'right' });
        doc.text('ĐVT', cols.unit, tableTop + 6, { width: 40 });
        doc.text('ĐƠN GIÁ', cols.price, tableTop + 6, { width: 55, align: 'right' });
        doc.text('THÀNH TIỀN', cols.total, tableTop + 6, { width: 70, align: 'right' });

        // Item rows
        let y = tableTop + rowH;
        data.items.forEach((item, idx) => {
          const bg = idx % 2 === 0 ? '#f8fafc' : '#ffffff';
          doc.rect(50, y, 495, rowH).fill(bg);
          doc.font('Helvetica').fontSize(9).fillColor('#111');
          doc.text(String(item.lineNumber), cols.no, y + 6, { width: 25, align: 'center' });
          doc.text(item.description, cols.desc, y + 6, { width: 245 });
          doc.text(String(item.qty), cols.qty, y + 6, { width: 30, align: 'right' });
          doc.text(item.unit ?? 'cái', cols.unit, y + 6, { width: 40 });
          doc.text(fmt(item.unitPrice), cols.price, y + 6, { width: 55, align: 'right' });
          doc.text(fmt(item.total), cols.total, y + 6, { width: 70, align: 'right' });
          y += rowH;
        });

        // Bottom border of table
        doc.moveTo(50, y).lineTo(545, y).strokeColor('#cccccc').lineWidth(1).stroke();

        // ── Totals ───────────────────────────────────────────────────────────
        y += 10;
        const totX = 370;
        doc.font('Helvetica').fontSize(10).fillColor('#333');
        doc.text('Tạm tính:', totX, y, { width: 100 });
        doc.text(fmt(data.subtotal), 475, y, { width: 70, align: 'right' });

        if (data.taxAmount && data.taxAmount > 0) {
          y += 18;
          doc.text('Thuế VAT:', totX, y, { width: 100 });
          doc.text(fmt(data.taxAmount), 475, y, { width: 70, align: 'right' });
        }

        y += 18;
        doc.rect(365, y - 4, 180, 24).fill('#1a56db');
        doc.font('Helvetica-Bold').fontSize(11).fillColor('#ffffff');
        doc.text('TỔNG CỘNG:', totX, y + 2, { width: 100 });
        doc.text(fmt(data.totalAmount), 475, y + 2, { width: 70, align: 'right' });

        // ── Notes ────────────────────────────────────────────────────────────
        if (data.notes) {
          doc.moveDown(2);
          doc.font('Helvetica-Bold').fontSize(9).fillColor('#555').text('GHI CHÚ:');
          doc.font('Helvetica').fontSize(9).fillColor('#333').text(data.notes);
        }

        // ── Footer ───────────────────────────────────────────────────────────
        doc.moveDown(2);
        doc
          .moveTo(50, doc.y)
          .lineTo(545, doc.y)
          .strokeColor('#dddddd')
          .lineWidth(1)
          .stroke();
        doc.moveDown(0.3);
        doc
          .font('Helvetica')
          .fontSize(8)
          .fillColor('#888')
          .text(
            'Tài liệu này được tạo tự động bởi hệ thống OMS. Vui lòng xác nhận hoặc từ chối qua link đính kèm trong email.',
            { align: 'center' },
          );

        doc.end();
      } catch (err) {
        this.logger.error('PDF generation failed:', err);
        reject(err);
      }
    });
  }
}
