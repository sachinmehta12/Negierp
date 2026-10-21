import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { User, StudentProfile, Stream, StudentSubject, Subject } from '../models';

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
    const userInstance = await User.findByPk(payload.userId, {
      include: [
        {
          model: StudentProfile,
          as: 'studentProfile',
          include: [
            { model: Stream, as: 'stream' },
            {
              model: StudentSubject,
              as: 'subjectEnrollments',
              include: [{ model: Subject, as: 'subject' }]
            }
          ]
        },
        { model: Subject, as: 'assignedSubjects' }
      ]
    });

    if (!userInstance) {
      res.status(401).json({ success: false, message: 'User not found.' });
      return;
    }

    const user = userInstance.get({ plain: true });

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
