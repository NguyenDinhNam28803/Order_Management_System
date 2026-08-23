import {
  USER_SAFE_SELECT,
  USER_SAFE_SELECT_WITH_DEPT,
  USER_SENSITIVE_FIELDS,
  toSafeUser,
} from './user-select';

/**
 * Chốt chặn hồi quy: các cột nhạy cảm của User từng bị trả ra qua
 * GET /users, GET /users/profile và response đăng nhập/đăng ký.
 * Nếu ai đó thêm lại chúng vào whitelist, test này phải đỏ.
 */
describe('user-select', () => {
  describe('USER_SAFE_SELECT', () => {
    it.each(USER_SENSITIVE_FIELDS)('không chứa cột %s', (field) => {
      expect(USER_SAFE_SELECT).not.toHaveProperty(field);
      expect(USER_SAFE_SELECT_WITH_DEPT).not.toHaveProperty(field);
    });

    it('vẫn giữ các cột cần cho giao diện', () => {
      expect(USER_SAFE_SELECT).toMatchObject({
        id: true,
        email: true,
        fullName: true,
        role: true,
        orgId: true,
        isActive: true,
      });
    });

    it('giữ cờ mfaEnabled nhưng không giữ mfaSecret', () => {
      expect(USER_SAFE_SELECT).toHaveProperty('mfaEnabled', true);
      expect(USER_SAFE_SELECT).not.toHaveProperty('mfaSecret');
    });

    it('mọi giá trị trong whitelist đều là true', () => {
      for (const value of Object.values(USER_SAFE_SELECT)) {
        expect(value).toBe(true);
      }
    });

    it('bản kèm phòng ban chỉ lộ id và tên phòng ban', () => {
      expect(USER_SAFE_SELECT_WITH_DEPT.department).toEqual({
        select: { id: true, name: true },
      });
    });
  });

  describe('toSafeUser', () => {
    const rawUser = {
      id: 'u-1',
      email: 'a@b.com',
      fullName: 'Nguyễn Văn A',
      role: 'REQUESTER',
      mfaEnabled: true,
      passwordHash: '$2b$10$hash',
      mfaSecret: 'JBSWY3DPEHPK3PXP',
      hashedRefreshToken: 'refresh-hash',
      refreshTokenExpiresAt: new Date('2026-01-01'),
    };

    it('loại bỏ toàn bộ cột nhạy cảm', () => {
      const safe = toSafeUser(rawUser);
      for (const field of USER_SENSITIVE_FIELDS) {
        expect(safe).not.toHaveProperty(field);
      }
    });

    it('giữ nguyên các cột không nhạy cảm', () => {
      expect(toSafeUser(rawUser)).toEqual({
        id: 'u-1',
        email: 'a@b.com',
        fullName: 'Nguyễn Văn A',
        role: 'REQUESTER',
        mfaEnabled: true,
      });
    });

    it('không làm thay đổi object gốc', () => {
      toSafeUser(rawUser);
      expect(rawUser.passwordHash).toBe('$2b$10$hash');
      expect(rawUser.mfaSecret).toBe('JBSWY3DPEHPK3PXP');
    });

    it('chịu được bản ghi thiếu cột nhạy cảm', () => {
      expect(toSafeUser({ id: 'u-2' })).toEqual({ id: 'u-2' });
    });
  });
});
