// server/src/auth.ts
import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET!
if (!JWT_SECRET) throw new Error('JWT_SECRET ausente no .env')

export function createToken(payload: object) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export interface AuthedRequest extends Request {
  userId?: string
}

export function authRequired(req: AuthedRequest, res: Response, next: NextFunction) {
  const token = (req as any).cookies?.token
  if (!token) return res.status(401).json({ error: 'unauthorized' })
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    req.userId = decoded.userId
    next()
  } catch {
    return res.status(401).json({ error: 'unauthorized' })
  }
}
