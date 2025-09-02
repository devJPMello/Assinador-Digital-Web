import { Router } from 'express'
import { authRequired } from '../auth.js'
import { prisma } from '../prisma.js'
import { decryptPrivateKey } from '../crypto.js'
import crypto from 'crypto'

const router = Router()

function sha256Base64(buf: Buffer) {
  return crypto.createHash('sha256').update(buf).digest('base64')
}

// Fingerprint SHA-256 da chave pública (base64) a partir do SPKI DER
function publicKeyFingerprint(publicKeyPem: string) {
  const b64 = publicKeyPem
    .replace(/-----BEGIN PUBLIC KEY-----/g, '')
    .replace(/-----END PUBLIC KEY-----/g, '')
    .replace(/\s+/g, '')
  const der = Buffer.from(b64, 'base64')
  return sha256Base64(der)
}

// GET /keys  → detalhes da chave pública
router.get('/keys', authRequired, async (req, res) => {
  const userId = (req as any).userId as string
  const kp = await prisma.keyPair.findUnique({ where: { userId } })
  if (!kp) return res.status(404).json({ error: 'keypair_not_found' })

  const fp = publicKeyFingerprint(kp.publicKeyPem)
  return res.json({
    algorithm: kp.algorithm,
    createdAt: kp.createdAt,
    publicKeyPem: kp.publicKeyPem,
    fingerprintSHA256: fp
  })
})

// GET /keys/public.pem → download da pública
router.get('/keys/public.pem', authRequired, async (req, res) => {
  const userId = (req as any).userId as string
  const kp = await prisma.keyPair.findUnique({ where: { userId } })
  if (!kp) return res.status(404).send('keypair_not_found')

  res.setHeader('Content-Type', 'application/x-pem-file')
  res.setHeader('Content-Disposition', 'attachment; filename="public_key.pem"')
  res.send(kp.publicKeyPem)
})

/**
 * VISUALIZAR A PRIVADA EM JSON (DEV)
 * GET /keys/private.view[?token=XYZ]
 * Regras:
 *  - Se EXPOSE_PRIVATE_ALWAYS="true"  => NÃO precisa token.
 *  - Caso contrário, exige token igual ao campo `privateOnceToken` (one-time).
 *  - Ao usar com token, invalida (seta null).
 */
router.get('/keys/private.view', authRequired, async (req, res) => {
  const userId = (req as any).userId as string
  const kp = await prisma.keyPair.findUnique({ where: { userId } })
  if (!kp) return res.status(404).json({ error: 'keypair_not_found' })

  const always = process.env.EXPOSE_PRIVATE_ALWAYS === 'true'
  const token = (req.query.token as string | undefined) || ''

  if (!always) {
    if (!token) return res.status(400).json({ error: 'missing_token' })
    if (!kp.privateOnceToken) return res.status(410).json({ error: 'private_already_exported' })
    if (kp.privateOnceToken !== token) return res.status(401).json({ error: 'invalid_token' })
  }

  const privatePem = decryptPrivateKey(kp.privateKeyEnc)

  if (!always) {
    await prisma.keyPair.update({
      where: { userId },
      data: { privateOnceToken: null }
    })
  }

  // Retorna para exibição em tela (JSON)
  res.json({ privateKeyPem: privatePem })
})

/**
 * DOWNLOAD DA PRIVADA (DEV)
 * GET /keys/private.pem[?token=XYZ]
 * Regras iguais ao endpoint de visualização:
 *  - EXPOSE_PRIVATE_ALWAYS="true" => sem token
 *  - Caso contrário, exige token one-time e invalida
 */
router.get('/keys/private.pem', authRequired, async (req, res) => {
  const userId = (req as any).userId as string
  const kp = await prisma.keyPair.findUnique({ where: { userId } })
  if (!kp) return res.status(404).send('keypair_not_found')

  const always = process.env.EXPOSE_PRIVATE_ALWAYS === 'true'
  const token = (req.query.token as string | undefined) || ''

  if (!always) {
    if (!token) return res.status(400).send('missing_token')
    if (!kp.privateOnceToken) return res.status(410).send('private_already_exported')
    if (kp.privateOnceToken !== token) return res.status(401).send('invalid_token')
  }

  const privatePem = decryptPrivateKey(kp.privateKeyEnc)

  if (!always) {
    await prisma.keyPair.update({
      where: { userId },
      data: { privateOnceToken: null }
    })
  }

  res.setHeader('Content-Type', 'application/x-pem-file')
  res.setHeader('Content-Disposition', 'attachment; filename="private_key.pem"')
  res.send(privatePem)
})

export default router
