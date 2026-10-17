import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { prisma } from '../config/prisma';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    username: string;
    email: string;
    role: string;
    isActive: boolean;
    studentProfile?: any;
    assignedSubjects?: any[];
  };
}

export const authenticateJwt = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
    return;
  }

  const token = authHeader.split(' ')[1];
  const payload = AuthService.verifyToken(token);

  if (!payload) {
    res.status(401).json({ success: false, message: 'Invalid or expired token.' });
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        studentProfile: {
          include: {
            stream: true,
            subjectEnrollments: {
              include: { subject: true }
            }
          }
        },
        assignedSubjects: true
      }
    });

    if (!user) {
      res.status(401).json({ success: false, message: 'User not found.' });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({ success: false, message: 'Your account is deactivated. Please contact administration.' });
      return;
    }

    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      studentProfile: user.studentProfile,
      assignedSubjects: user.assignedSubjects
    };

    next();
  } catch (error) {
    res.status(500).json({ success: false, message: 'Authentication error', error: (error as Error).message });
  }
};
