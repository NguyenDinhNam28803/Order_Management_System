import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

/**
 * Guard to ensure users can only access data from their own organization.
 * Sets request.orgId from the JWT payload and enforces that any `orgId`
 * appearing in route params or query string matches the authenticated user's
 * org — preventing cross-org access via URL manipulation.
 * PLATFORM_ADMIN users are exempt from this check.
 */
@Injectable()
export class OrganizationGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const request = context.switchToHttp().getRequest();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const user = request.user;

    if (!user) {
      return false;
    }

    // Propagate orgId so controllers/services can use it directly
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    request.orgId = user.orgId;

    // PLATFORM_ADMIN may act across organisations
    if (user.role === 'PLATFORM_ADMIN') {
      return true;
    }

    // If the route exposes an orgId param or query param, verify it matches
    // the authenticated user's org to prevent horizontal privilege escalation.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const paramOrgId: string | undefined =
      request.params?.orgId ?? request.query?.orgId;

    if (paramOrgId && paramOrgId !== user.orgId) {
      throw new ForbiddenException(
        'Bạn không có quyền truy cập dữ liệu của tổ chức khác.',
      );
    }

    return true;
  }
}

/**
 * Decorator to mark routes that need organization filtering
 */
export const UseOrganization = () => {
  return (
    target: any,
    propertyKey?: string,
    descriptor?: PropertyDescriptor,
  ) => {
    // Mark the route for organization filtering
    if (descriptor) {
      Reflect.defineMetadata('useOrganization', true, descriptor.value);
    }
    return descriptor;
  };
};

/**
 * Check if a route should use organization filtering
 */
export const shouldUseOrganization = (
  target: any,
  propertyKey: string,
): boolean => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  return Reflect.getMetadata('useOrganization', target[propertyKey]) || false;
};
