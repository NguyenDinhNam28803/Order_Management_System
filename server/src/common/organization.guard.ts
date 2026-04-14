import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

/**
 * Guard to ensure users can only access data from their own organization
 * This guard extracts orgId from JWT token and adds it to the request query/body
 */
@Injectable()
export class OrganizationGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false;
    }

    // Add orgId to request for filtering
    request.orgId = user.orgId;

    // For PLATFORM_ADMIN, they can see their own org data
    // If you want PLATFORM_ADMIN to see all orgs, add special handling here
    
    return true;
  }
}

/**
 * Decorator to mark routes that need organization filtering
 */
export const UseOrganization = () => {
  return (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) => {
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
  return Reflect.getMetadata('useOrganization', target[propertyKey]) || false;
};
