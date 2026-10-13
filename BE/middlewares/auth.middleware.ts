import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import UserModel from '../models/user.model';
import { IUser } from '../types/user.type';

// Extend Express Request interface to include authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      userId?: string;
    }
  }
}

export interface JwtPayload {
  id: string;
  email: string;
  name?: string;
  status?: string;
  iat?: number;
  exp?: number;
}

/**
 * Extracts authentication token from either Authorization header or cookies
 */
function extractToken(req: Request): string | null {
  // 1. Check Authorization header (Bearer <token>)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1]?.trim();
    if (token) return token;
  }

  // 2. Check Cookie header (jwt_access_token=<token>)
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    const match = cookieHeader.match(/(?:^|;\s*)jwt_access_token=([^;]+)/);
    if (match && match[1]) {
      return decodeURIComponent(match[1]);
    }
  }

  // 3. Check req.cookies if cookie-parser middleware is present
  if ((req as any).cookies?.jwt_access_token) {
    return (req as any).cookies.jwt_access_token;
  }

  return null;
}

/**
 * Express middleware / guard that permits only authenticated requests.
 * Verifies JWT token, ensures user exists and is ACTIVE, and attaches user to req.user.
 */
export const authenticatedOnly = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = extractToken(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No authentication token provided.',
      });
    }

    const secret = process.env.JWT_SECRET || 'spectrum_jwt_super_secret_key_2026_xyz!';

    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, secret) as JwtPayload;
    } catch (err: any) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Authentication token has expired. Please log in again.',
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication token.',
      });
    }

    if (!decoded || !decoded.id) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token payload.',
      });
    }

    // Verify user exists in database and is ACTIVE
    const user = await UserModel.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'The user belonging to this token no longer exists.',
      });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        message: `Account is ${user.status.toLowerCase()}. Access restricted.`,
      });
    }

    // Attach user document and id to request object
    req.user = user;
    req.userId = user._id.toString();

    return next();
  } catch (error: any) {
    console.error('Error in authenticatedOnly guard:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during authentication.',
    });
  }
};

export default authenticatedOnly;
