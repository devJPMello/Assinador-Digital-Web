// server/src/routes/auth.ts
import { Router } from 'express'
import { prisma } from '../prisma.js'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { createToken, authRequired, AuthedRequest } from '../auth.js'
import { encryptPrivateKey, generateRsaKeyPair } from '../crypto.js'

const router = Router()

// POST /auth/register
router.post('/register', async (req, res) => {
  const schema = z.object({ email: z.string().email(), password: z.string().min(6) })
  const parse = schema.safeParse(req.body)
  if (!parse.success) return res.status(400).json({ error: parse.error.errors })

  const { email, password } = parse.data
  const exists = await prisma.user.findUnique({ where: { email } })
  if (exists) return res.status(409).json({ error: 'email_already_registered' })

  const passwordHash = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({ data: { email, password: passwordHash } })

  const { publicKeyPem, privateKeyPem, algorithm } = generateRsaKeyPair()
  const privateKeyEnc = encryptPrivateKey(privateKeyPem)
  await prisma.keyPair.create({
    data: { userId: user.id, publicKeyPem, privateKeyEnc, algorithm }
  })

  const token = createToken({ userId: user.id })
  res
    .cookie('token', token, { httpOnly: true, sameSite: 'lax' })
    .json({ ok: true, userId: user.id })
})

// POST /auth/login
router.post('/login', async (req, res) => {
  const schema = z.object({ email: z.string().email(), password: z.string().min(6) })
  const parse = schema.safeParse(req.body)
  if (!parse.success) return res.status(400).json({ error: parse.error.errors })

  const { email, password } = parse.data
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return res.status(401).json({ error: 'invalid_credentials' })

  const ok = await bcrypt.compare(password, user.password)
  if (!ok) return res.status(401).json({ error: 'invalid_credentials' })

  const token = createToken({ userId: user.id })
  res.cookie('token', token, { httpOnly: true, sameSite: 'lax' }).json({ ok: true })
})

// POST /auth/logout
router.post('/logout', async (_req, res) => {
  res.clearCookie('token').json({ ok: true })
})

// GET /auth/me (confere sessão real)
router.get('/me', authRequired, async (req: AuthedRequest, res) => {
  const userId = req.userId!
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true }
  })
  if (!user) return res.status(401).json({ error: 'unauthorized' })
  res.json({ user })
})

export default router
