import { Prisma, User } from '@prisma/client';

/**
 * Các cột nhạy cảm của User không bao giờ được rời khỏi tầng database.
 *
 * `passwordHash` cho phép brute-force offline, `mfaSecret` cho phép sinh mã
 * TOTP hợp lệ (vô hiệu hoá hoàn toàn 2FA), còn `hashedRefreshToken` là vật liệu
 * để làm giả phiên đăng nhập. Không endpoint nào có lý do trả các cột này ra.
 */
export const USER_SENSITIVE_FIELDS = [
  'passwordHash',
  'mfaSecret',
  'hashedRefreshToken',
  'refreshTokenExpiresAt',
] as const;

/** Kiểu User đã loại bỏ toàn bộ cột nhạy cảm — dùng cho mọi response. */
export type SafeUser = Omit<User, (typeof USER_SENSITIVE_FIELDS)[number]>;

/**
 * Whitelist select cho mọi truy vấn User trả ra ngoài API.
 *
 * Cố tình dùng whitelist thay vì loại trừ: khi schema thêm cột nhạy cảm mới,
 * cột đó mặc định không lọt ra ngoài thay vì phải nhớ bổ sung vào danh sách cấm.
 */
export const USER_SAFE_SELECT = {
  id: true,
  orgId: true,
  deptId: true,
  email: true,
  phone: true,
  fullName: true,
  avatarUrl: true,
  employeeCode: true,
  jobTitle: true,
  role: true,
  isActive: true,
  isVerified: true,
  mfaEnabled: true, // chỉ cờ bật/tắt, không phải secret
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

/** Bản select kèm thông tin phòng ban rút gọn, dùng cho các endpoint danh sách. */
export const USER_SAFE_SELECT_WITH_DEPT = {
  ...USER_SAFE_SELECT,
  department: { select: { id: true, name: true } },
} satisfies Prisma.UserSelect;

/**
 * Loại bỏ cột nhạy cảm khỏi một bản ghi User đã đọc đầy đủ.
 * Dùng cho luồng auth — vốn buộc phải đọc `passwordHash` để xác thực.
 */
export function toSafeUser<T extends Partial<User>>(
  user: T,
): Omit<T, (typeof USER_SENSITIVE_FIELDS)[number]> {
  const clone = { ...user };
  for (const field of USER_SENSITIVE_FIELDS) {
    delete clone[field as keyof T];
  }
  return clone;
}
