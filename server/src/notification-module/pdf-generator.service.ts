import { Injectable, Logger } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const PDFDocument = require('pdfkit') as typeof import('pdfkit');

// ─────────────────────────────────────────────────────────────────────────────
// Interfaces
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// Palette
// ─────────────────────────────────────────────────────────────────────────────

const C = {
  burnt: '#A85032',
  burntDark: '#7A3521',
  burntLight: '#FAF0ED',
  dark: '#1E293B',
  darkMid: '#243347',
  darkDeep: '#2D3F55',
  slate: '#334155',
  mid: '#64748B',
  light: '#CBD5E1',
  bgSoft: '#F8FAFC',
  bgMid: '#F1F5F9',
  divider: '#E2E8F0',
  white: '#FFFFFF',
  green: '#16A34A',
  mutedBlue: '#94A3B8',
};

// ─────────────────────────────────────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────────────────────────────────────

@Injectable()
export class PdfGeneratorService {
  private readonly logger = new Logger(PdfGeneratorService.name);

  // ── font resolution ─────────────────────────────────────────────────────────
  private resolveFonts(): { regular: string; bold: string } {
    const candidates = [
      path.join(process.cwd(), 'dist/assets/fonts'),
      path.join(process.cwd(), 'src/assets/fonts'),
    ];
    for (const dir of candidates) {
      const regular = path.join(dir, 'Arial.ttf');
      const bold = path.join(dir, 'Arial-Bold.ttf');
      if (fs.existsSync(regular)) return { regular, bold };
    }
    throw new Error('Font files not found. Place Arial.ttf / Arial-Bold.ttf in src/assets/fonts/');
  }

  // ── public entry point ──────────────────────────────────────────────────────
  async generatePoPdf(data: PoPdfData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 0, size: 'A4' });
        const chunks: Buffer[] = [];

        doc.on('data', (c: Buffer) => chunks.push(c));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        const fonts = this.resolveFonts();
        doc.registerFont('R', fonts.regular);
        doc.registerFont('B', fonts.bold);

        const currency = data.currency ?? 'VND';
        const isContract = data.poNumber.startsWith('CON-');
        const title = isContract ? 'HỢP ĐỒNG CUNG CẤP' : 'PURCHASE ORDER';
        const ML = 42;   // margin left
        const MR = 42;   // margin right
        const PW = 595;  // A4 width pt
        const CW = PW - ML - MR;  // content width

        const fmt = (n: number) =>
          n.toLocaleString('vi-VN') + ' ₫';

        const dateStr = (d?: Date | null) =>
          d ? d.toLocaleDateString('vi-VN') : '—';

        // ── helpers ────────────────────────────────────────────────────────────

        /** Rounded rect (fill only) */
        const fillRRect = (x: number, y: number, w: number, h: number, r: number, color: string) => {
          doc.roundedRect(x, y, w, h, r).fill(color);
        };

        /** Sharp rect fill */
        const fillRect = (x: number, y: number, w: number, h: number, color: string) => {
          doc.rect(x, y, w, h).fill(color);
        };

        /** Text with explicit font reset after */
        const text = (
          str: string,
          x: number, y: number,
          opts: Record<string, unknown> = {},
          font: 'R' | 'B' = 'R',
          size = 9,
          color = C.dark,
        ) => {
          doc.font(font).fontSize(size).fillColor(color).text(str, x, y, opts);
        };

        // ── 1. HEADER BANNER ──────────────────────────────────────────────────
        const HH = 165; // header height

        // Dark background
        fillRRect(ML, 14, CW, HH, 8, C.dark);

        // Left accent bar
        fillRRect(ML, 14, 5, HH, 4, C.burnt);
        fillRect(ML + 3, 14, 2, HH, C.burnt);

        // Decorative circles
        doc.circle(ML + CW - 56, 10, 85).fill(C.darkMid);
        doc.circle(ML + CW - 28, 38, 52).fill(C.darkDeep);

        // Title
        doc.font('B').fontSize(24).fillColor(C.white).text(title, ML + 38, 32, { lineBreak: false });

        // PO Number badge
        const badgeText = data.poNumber;
        doc.font('B').fontSize(10);
        const badgeW = doc.widthOfString(badgeText) + 24;
        fillRRect(ML + 38, 68, badgeW, 22, 5, C.burnt);
        doc.font('B').fontSize(10).fillColor(C.white).text(badgeText, ML + 38 + 12, 73, { lineBreak: false });

        // Status badge
        const statusText = isContract ? 'HỢP ĐỒNG' : 'ĐANG XỬ LÝ';
        doc.font('B').fontSize(8);
        const statusW = doc.widthOfString(statusText) + 20;
        fillRRect(ML + 38 + badgeW + 8, 68, statusW, 22, 5, C.green);
        doc.font('B').fontSize(8).fillColor(C.white).text(statusText, ML + 38 + badgeW + 8 + 10, 74, { lineBreak: false });

        // Divider inside header
        doc.moveTo(ML + 38, 102).lineTo(ML + CW - 14, 102)
          .strokeColor('#334155').lineWidth(0.5).stroke();

        // Meta labels
        const metas: [string, string, number][] = [
          ['NGÀY PHÁT HÀNH', dateStr(data.issuedDate), ML + 38],
          ['GIAO HÀNG DỰ KIẾN', dateStr(data.deliveryDate), ML + 38 + 145],
          ['ĐIỀU KHOẢN THANH TOÁN', data.paymentTerms ?? 'Net 30', ML + 38 + 290],
        ];
        for (const [label, val, lx] of metas) {
          doc.font('R').fontSize(7).fillColor(C.mutedBlue).text(label, lx, 112, { lineBreak: false });
          doc.font('B').fontSize(9).fillColor(C.white).text(val, lx, 124, { lineBreak: false });
        }

        let curY = 14 + HH + 14;

        // ── 2. SECTION HELPER ─────────────────────────────────────────────────
        const sectionTitle = (label: string) => {
          fillRRect(ML, curY, CW, 22, 4, C.bgMid);
          fillRRect(ML, curY, 4, 22, 2, C.burnt);
          fillRect(ML + 2, curY, 2, 22, C.burnt);
          doc.font('B').fontSize(8).fillColor(C.burnt)
            .text(label.toUpperCase(), ML + 26, curY + 7, { lineBreak: false });
          curY += 22 + 10;
        };

        // ── 3. PARTIES ────────────────────────────────────────────────────────
        sectionTitle('Thông tin các bên');

        const colW = (CW - 6) / 2;

        const drawPartyCard = (org: PoPdfData['buyerOrg'], role: string, x: number, bgColor: string, borderColor: string) => {
          const cardH = 90;
          fillRRect(x, curY, colW, cardH, 5, bgColor);
          doc.roundedRect(x, curY, colW, cardH, 5)
            .strokeColor(borderColor).lineWidth(0.5).stroke();

          doc.font('R').fontSize(7).fillColor(C.mid).text(role, x + 12, curY + 10, { lineBreak: false });
          doc.font('B').fontSize(11).fillColor(C.dark).text(org.name ?? '—', x + 12, curY + 22, { width: colW - 24, lineBreak: false });
          doc.font('R').fontSize(8).fillColor(C.slate);
          let iy = curY + 37;
          if (org.address) {
            doc.text(org.address, x + 12, iy, { width: colW - 24 });
            iy = doc.y + 2;
          }
          doc.text(`✉  ${org.email ?? '—'}`, x + 12, iy, { lineBreak: false });
          doc.text(`✆  ${org.phone ?? '—'}`, x + 12, iy + 13, { lineBreak: false });
        };

        drawPartyCard(data.buyerOrg, 'BÊN MUA  /  BUYER', ML, C.bgSoft, C.light);
        drawPartyCard(data.supplierOrg, 'NHÀ CUNG CẤP  /  SUPPLIER', ML + colW + 6, C.burntLight, '#E8C4B8');

        curY += 90 + 16;

        // ── 4. DELIVERY ADDRESS ───────────────────────────────────────────────
        if (data.deliveryAddress) {
          sectionTitle('Địa chỉ giao hàng');
          doc.font('R').fontSize(9).fillColor(C.slate)
            .text(`📍  ${data.deliveryAddress}`, ML + 14, curY, { width: CW - 14 });
          curY = doc.y + 14;
        }

        // ── 5. ITEMS TABLE ────────────────────────────────────────────────────
        sectionTitle('Chi tiết đơn hàng');

        const cols = {
          no: { x: ML, w: 24 },
          desc: { x: ML + 24, w: CW - 24 - 46 - 46 - 62 - 62 },
          qty: { x: 0, w: 46 },
          unit: { x: 0, w: 46 },
          price: { x: 0, w: 62 },
          total: { x: 0, w: 62 },
        };
        cols.qty.x = cols.desc.x + cols.desc.w;
        cols.unit.x = cols.qty.x + cols.qty.w;
        cols.price.x = cols.unit.x + cols.unit.w;
        cols.total.x = cols.price.x + cols.price.w;

        const rowH = 28;

        // Table header
        fillRRect(ML, curY, CW, rowH, 4, C.burnt);
        // Remove bottom rounding on header
        fillRect(ML, curY + rowH / 2, CW, rowH / 2, C.burnt);

        doc.font('B').fontSize(8).fillColor(C.white);
        doc.text('#', cols.no.x, curY + 9, { width: cols.no.w, align: 'center', lineBreak: false });
        doc.text('MÔ TẢ SẢN PHẨM / DỊCH VỤ', cols.desc.x, curY + 9, { width: cols.desc.w, align: 'left', lineBreak: false });
        doc.text('SL', cols.qty.x, curY + 9, { width: cols.qty.w, align: 'center', lineBreak: false });
        doc.text('ĐVT', cols.unit.x, curY + 9, { width: cols.unit.w, align: 'center', lineBreak: false });
        doc.text('ĐƠN GIÁ', cols.price.x, curY + 9, { width: cols.price.w, align: 'right', lineBreak: false });
        doc.text('THÀNH TIỀN', cols.total.x, curY + 9, { width: cols.total.w, align: 'right', lineBreak: false });

        curY += rowH;

        // Item rows
        data.items.forEach((item, idx) => {
          if (idx % 2 === 1) fillRect(ML, curY, CW, rowH, C.bgSoft);

          doc.font('R').fontSize(8.5).fillColor(C.mid);
          doc.text(String(idx + 1), cols.no.x, curY + 9, { width: cols.no.w, align: 'center', lineBreak: false });

          doc.font('R').fontSize(8.5).fillColor(C.slate);
          doc.text(item.description, cols.desc.x, curY + 9, { width: cols.desc.w - 6, lineBreak: false });

          doc.font('R').fontSize(8.5).fillColor(C.mid);
          doc.text(String(item.qty), cols.qty.x, curY + 9, { width: cols.qty.w, align: 'center', lineBreak: false });
          doc.text(item.unit ?? 'PCS', cols.unit.x, curY + 9, { width: cols.unit.w, align: 'center', lineBreak: false });

          doc.font('R').fontSize(8.5).fillColor(C.slate);
          doc.text(fmt(item.unitPrice), cols.price.x, curY + 9, { width: cols.price.w, align: 'right', lineBreak: false });

          doc.font('B').fontSize(8.5).fillColor(C.dark);
          doc.text(fmt(item.total), cols.total.x, curY + 9, { width: cols.total.w, align: 'right', lineBreak: false });

          // Row divider
          doc.moveTo(ML, curY + rowH).lineTo(ML + CW, curY + rowH)
            .strokeColor(C.divider).lineWidth(0.5).stroke();

          curY += rowH;
        });

        // Table outer border
        doc.roundedRect(ML, curY - rowH * data.items.length - rowH, CW,
          rowH * data.items.length + rowH, 4)
          .strokeColor(C.light).lineWidth(0.5).stroke();

        curY += 12;

        // ── 6. TOTALS ─────────────────────────────────────────────────────────
        const totX = ML + CW * 0.48;
        const totW = CW * 0.52;

        doc.font('R').fontSize(8.5).fillColor(C.mid)
          .text('Tạm tính:', totX, curY, { width: totW * 0.5, lineBreak: false });
        doc.font('B').fontSize(8.5).fillColor(C.slate)
          .text(fmt(data.subtotal), totX + totW * 0.5, curY, { width: totW * 0.5, align: 'right', lineBreak: false });

        if (data.taxAmount) {
          curY += 16;
          doc.font('R').fontSize(8.5).fillColor(C.mid)
            .text('Thuế VAT (10%):', totX, curY, { width: totW * 0.5, lineBreak: false });
          doc.font('B').fontSize(8.5).fillColor(C.slate)
            .text(fmt(data.taxAmount), totX + totW * 0.5, curY, { width: totW * 0.5, align: 'right', lineBreak: false });
        }

        curY += 12;
        doc.moveTo(totX, curY).lineTo(ML + CW - 2, curY)
          .strokeColor(C.light).lineWidth(0.5).stroke();
        curY += 6;

        // Total bar
        fillRRect(totX - 4, curY, totW + 4, 30, 6, C.burnt);
        doc.font('B').fontSize(9).fillColor(C.white)
          .text(`TỔNG CỘNG  ( ${currency} )`, totX + 12, curY + 9, { lineBreak: false });
        doc.font('B').fontSize(13).fillColor(C.white)
          .text(fmt(data.totalAmount), totX, curY + 7, { width: totW - 4, align: 'right', lineBreak: false });

        curY += 42;

        // ── 7. NOTES ──────────────────────────────────────────────────────────
        if (data.notes) {
          sectionTitle('Ghi chú');
          const noteParts = data.notes.split(' và ').map(p => p.trim());
          for (const part of noteParts) {
            const bullet = part.startsWith('•') ? part : `•  ${part}`;
            doc.font('R').fontSize(8.5).fillColor(C.slate)
              .text(bullet, ML + 14, curY, { width: CW - 14 });
            curY = doc.y + 4;
          }
          curY += 8;
        }

        // ── 8. SIGNATURE BLOCK ────────────────────────────────────────────────
        sectionTitle('Xác nhận & ký kết');

        const sigW = (CW - 8) / 2;
        const sigH = 120;
        const sigParties = [
          { role: 'ĐẠI DIỆN BÊN MUA', name: data.buyerOrg.name },
          { role: 'ĐẠI DIỆN NHÀ CUNG CẤP', name: data.supplierOrg.name },
        ];

        sigParties.forEach(({ role, name }, i) => {
          const sx = ML + i * (sigW + 8);
          fillRRect(sx, curY, sigW, sigH, 5, C.bgSoft);
          doc.roundedRect(sx, curY, sigW, sigH, 5).strokeColor(C.light).lineWidth(0.5).stroke();

          doc.font('R').fontSize(7.5).fillColor(C.mid)
            .text(role, sx, curY + 15, { width: sigW, align: 'center', lineBreak: false });

          // Signature line (moved up)
          const lineY = curY + sigH - 45;
          doc.moveTo(sx + 30, lineY).lineTo(sx + sigW - 30, lineY)
            .strokeColor(C.light).lineWidth(0.5).stroke();

          doc.font('R').fontSize(7).fillColor(C.mid)
            .text('Ký tên & đóng dấu', sx, lineY + 6, { width: sigW, align: 'center', lineBreak: false });
          
          doc.font('B').fontSize(8).fillColor(C.dark)
            .text(name, sx + 10, lineY + 18, { width: sigW - 20, align: 'center' });
        });

        curY += sigH + 20;

        // ── 9. FOOTER ─────────────────────────────────────────────────────────
        const pageH = 841;
        fillRect(0, pageH - 40, PW, 40, C.bgMid);
        doc.moveTo(ML, pageH - 40).lineTo(PW - MR, pageH - 40)
          .strokeColor(C.divider).lineWidth(0.5).stroke();
        doc.font('R').fontSize(6.5).fillColor(C.mid)
          .text('Tài liệu được tạo tự động bởi hệ thống OMS  •  Vui lòng xác nhận hoặc từ chối qua link đính kèm trong email',
            ML, pageH - 26, { lineBreak: false });
        doc.font('B').fontSize(6.5).fillColor(C.burnt)
          .text(data.poNumber, PW - MR - 80, pageH - 26, { width: 80, align: 'right', lineBreak: false });

        doc.end();
      } catch (err) {
        this.logger.error('PDF generation failed:', err);
        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
        reject(err);
      }
    });
  }
}