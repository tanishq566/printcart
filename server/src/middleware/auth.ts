import type { Request, Response, NextFunction } from 'express';
import { verifyToken, type JWTPayload } from '../utils/auth.js';

// Extend Express Request to include authenticated shop data
declare global {
  namespace Express {
    interface Request {
      auth?: JWTPayload;
    }
  }
}

/**
 * Extract JWT from Authorization header (Bearer) or HTTP-only cookie.
 */
function extractToken(req: Request): string | null {
  // 1. Check Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  // 2. Check HTTP-only cookie
  if (req.cookies?.token) {
    return req.cookies.token;
  }

  return null;
}

/**
 * Middleware: Requires a valid JWT. Populates `req.auth`.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = extractToken(req);

  if (!token) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  try {
    const payload = verifyToken(token);
    req.auth = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Middleware: Requires SUPER_ADMIN role.
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  requireAuth(req, res, () => {
    if (req.auth?.role !== 'SUPER_ADMIN') {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }
    next();
  });
}
