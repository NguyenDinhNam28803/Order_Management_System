import { Injectable } from '@nestjs/common';

// eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
export type EmailEventType = 'USER_LOGIN' | 'USER_REGISTERED' | string;

@Injectable()
export class EmailTemplatesService {
  /**
   * Trả về HTML email dựa trên eventType.
   * Nếu không match → fallback về template generic.
   */
  render(eventType: EmailEventType, data: Record<string, any>): string {
    switch (eventType) {
      case 'USER_LOGIN':
        return this.templateWelcomeBack(data);
      case 'USER_REGISTERED':
        return this.templateNewMember(data);
      default:
        return this.templateGeneric(data);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Base layout
  // ─────────────────────────────────────────────────────────────
  private base(accentColor: string, content: string): string {
    return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>OMS Notification</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=DM+Serif+Display&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #f0f2f5;
      font-family: 'DM Sans', sans-serif;
      color: #1a1a2e;
      padding: 40px 16px;
    }
    .wrapper { max-width: 560px; margin: 0 auto; }

    /* Card */
    .card {
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 24px rgba(0,0,0,0.08);
    }

    /* Header stripe */
    .header {
      background: ${accentColor};
      padding: 36px 40px 32px;
      position: relative;
      overflow: hidden;
    }
    .header::after {
      content: '';
      position: absolute;
      bottom: -40px; right: -40px;
      width: 140px; height: 140px;
      border-radius: 50%;
      background: rgba(255,255,255,0.08);
    }
    .header-label {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 3px;
      text-transform: uppercase;
      color: rgba(255,255,255,0.65);
      margin-bottom: 8px;
    }
    .header h1 {
      font-family: 'DM Serif Display', serif;
      font-size: 28px;
      color: #ffffff;
      line-height: 1.25;
    }

    /* Body */
    .body { padding: 36px 40px; }
    .body p { font-size: 15px; line-height: 1.7; color: #444; margin-bottom: 16px; }
    .body p:last-child { margin-bottom: 0; }

    /* Info table */
    .info-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    .info-table td {
      padding: 10px 14px;
      font-size: 14px;
      border-bottom: 1px solid #f0f0f0;
      vertical-align: top;
    }
    .info-table td:first-child {
      font-weight: 600;
      color: #888;
      width: 38%;
      white-space: nowrap;
    }

    /* CTA Button */
    .btn-wrap { text-align: center; margin: 28px 0 8px; }
    .btn {
      display: inline-block;
      padding: 14px 36px;
      background: ${accentColor};
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 50px;
      font-weight: 600;
      font-size: 15px;
      letter-spacing: 0.3px;
    }

    /* Divider */
    .divider { border: none; border-top: 1px solid #f0f0f0; margin: 24px 0; }

    /* Alert box */
    .alert {
      background: #fff8e1;
      border-left: 4px solid #f59e0b;
      border-radius: 0 8px 8px 0;
      padding: 12px 16px;
      font-size: 13px;
      color: #78350f;
      margin: 20px 0;
      line-height: 1.6;
    }

    /* Footer */
    .footer {
      padding: 20px 40px 28px;
      text-align: center;
      font-size: 12px;
      color: #aaa;
      line-height: 1.7;
      background: #fafafa;
      border-top: 1px solid #f0f0f0;
    }
    .footer a { color: #aaa; text-decoration: underline; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      ${content}
    </div>
    <p style="text-align:center; margin-top:20px; font-size:12px; color:#bbb;">
      © 2025 Order Management System &nbsp;·&nbsp; Email tự động, vui lòng không reply.
    </p>
  </div>
</body>
</html>`;
  }

  // ─────────────────────────────────────────────────────────────
  // 1. Chào mừng trở lại (USER_LOGIN)
  // ─────────────────────────────────────────────────────────────
  private templateWelcomeBack(data: Record<string, any>): string {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const name = data.name ?? 'bạn';
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const time = data.loginAt ?? new Date().toLocaleString('vi-VN');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const device = data.device ?? 'Không xác định';
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const location = data.location ?? 'Không xác định';
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const dashUrl = data.dashUrl ?? '#';

    const content = `
      <div class="header">
        <div class="header-label">Đăng nhập thành công</div>
        <h1>Chào mừng trở lại,<br/>${name} 👋</h1>
      </div>

      <div class="body">
        <p>Chúng tôi ghi nhận một phiên đăng nhập mới vào tài khoản của bạn. Dưới đây là thông tin chi tiết:</p>

        <table class="info-table">
          <tr><td>Thời gian</td><td>${time}</td></tr>
          <tr><td>Thiết bị</td><td>${device}</td></tr>
          <tr><td>Vị trí</td><td>${location}</td></tr>
        </table>

        <div class="alert">
          ⚠️ Nếu bạn <strong>không thực hiện</strong> đăng nhập này, hãy đổi mật khẩu ngay lập tức và liên hệ quản trị viên.
        </div>

        <div class="btn-wrap">
          <a href="${dashUrl}" class="btn">Vào Dashboard</a>
        </div>
      </div>

      <div class="footer">
        Email này được gửi tự động khi có đăng nhập mới.<br/>
        <a href="#">Quản lý thông báo</a> &nbsp;·&nbsp; <a href="#">Hỗ trợ</a>
      </div>
    `;

    return this.base('#0f4c81', content);
  }

  // ─────────────────────────────────────────────────────────────
  // 2. Thành viên mới (USER_REGISTERED)
  // ─────────────────────────────────────────────────────────────
  private templateNewMember(data: Record<string, any>): string {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const name = data.name ?? 'bạn';
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const email = data.email ?? '';
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const role = data.role ?? 'Member';
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const org = data.orgName ?? 'Hệ thống';
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const loginUrl = data.loginUrl ?? '#';
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const tempPass = data.tempPassword;

    const content = `
      <div class="header">
        <div class="header-label">Chào mừng thành viên mới</div>
        <h1>Xin chào,<br/>${name}! 🎉</h1>
      </div>

      <div class="body">
        <p>Tài khoản của bạn đã được tạo thành công trong hệ thống <strong>${org}</strong>. Bạn có thể đăng nhập và bắt đầu sử dụng ngay bây giờ.</p>

        <table class="info-table">
          <tr><td>Họ tên</td><td>${name}</td></tr>
          <tr><td>Email</td><td>${email}</td></tr>
          <tr><td>Vai trò</td><td>${role}</td></tr>
          <tr><td>Tổ chức</td><td>${org}</td></tr>
          ${tempPass ? `<tr><td>Mật khẩu tạm</td><td><strong>${tempPass}</strong></td></tr>` : ''}
        </table>

        ${
          tempPass
            ? `
        <div class="alert">
          🔐 Đây là mật khẩu tạm thời. Vui lòng <strong>đổi mật khẩu ngay</strong> sau khi đăng nhập lần đầu.
        </div>`
            : ''
        }

        <div class="btn-wrap">
          <a href="${loginUrl}" class="btn">Đăng nhập ngay</a>
        </div>

        <hr class="divider"/>
        <p style="font-size:13px; color:#999; text-align:center;">
          Cần hỗ trợ? Liên hệ quản trị viên hệ thống hoặc reply email này.
        </p>
      </div>

      <div class="footer">
        Bạn nhận email này vì tài khoản vừa được tạo trong hệ thống.<br/>
        <a href="#">Chính sách bảo mật</a> &nbsp;·&nbsp; <a href="#">Hỗ trợ</a>
      </div>
    `;

    return this.base('#0d7c4e', content);
  }

  // ─────────────────────────────────────────────────────────────
  // Fallback generic
  // ─────────────────────────────────────────────────────────────
  private templateGeneric(data: Record<string, any>): string {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const title = data.title ?? 'Thông báo hệ thống';
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const message = data.message ?? '';

    const content = `
      <div class="header">
        <div class="header-label">Thông báo</div>
        <h1>${title}</h1>
      </div>
      <div class="body">
        <p>${message}</p>
      </div>
      <div class="footer">© 2025 Order Management System</div>
    `;

    return this.base('#334155', content);
  }
}
