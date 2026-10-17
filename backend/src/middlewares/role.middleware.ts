import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.middleware';

export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    const userRole = req.user.role;
    // Owner is a superuser who has access to all mentor functions as well
    const isOwner = userRole === 'owner';
    const isAllowed = allowedRoles.includes(userRole) || (isOwner && allowedRoles.includes('mentor'));

    if (!isAllowed) {
      res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted to roles: ${allowedRoles.join(', ')}`
      });
      return;
    }

    next();
  };
};

export const requireOwner = requireRole(['owner']);
export const requireMentor = requireRole(['mentor', 'owner']);
export const requireStudent = requireRole(['student']);
