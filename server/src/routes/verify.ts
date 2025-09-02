import { Router } from 'express'
import { prisma } from '../prisma.js'
import { z } from 'zod'
import { verifyTextWithRsaPss, sha256Hex } from '../crypto.js'

const router = Router()

// GET /verify/:id
router.get('/verify/:id', async (req, res) => {
  const { id } = req.params

  const sig = await prisma.signature.findUnique({
    where: { id },
    include: { user: { include: { keyPair: true } } }
  })

  // NÃO achou assinatura/chave -> loga valid=false
  if (!sig || !sig.user?.keyPair) {
    await prisma.verifyLog.create({
      data: {
        method: 'byId',
        signatureId: null,
        valid: false,               // booleano (não use Boolean)
        requesterIp: req.ip         // nome de coluna correto (não use ip)
      }
    })
    return res.json({ valid: false })
  }

  const publicKey = sig.user.keyPair.publicKeyPem
  const text = sig.textStored ?? ''
  let valid = false

  if (sig.textStored) {
    const ok = verifyTextWithRsaPss(publicKey, text, sig.signatureB64)
    const hashOk = sha256Hex(text) === sig.textHashHex
    valid = ok && hashOk
  } else {
    // se você não armazena o texto, a validação por ID vira "existente" (ajuste conforme regra do seu projeto)
    valid = true
  }

  await prisma.verifyLog.create({
    data: {
      method: 'byId',
      signatureId: sig.id,
      valid,                        // variável booleana
      requesterIp: req.ip,
      algorithm: sig.algorithm ?? null
    }
  })

  res.json({
    valid,
    signatureId: sig.id,
    signer: sig.user.email,
    algorithm: sig.algorithm,
    createdAt: sig.createdAt,
    textStored: Boolean(sig.textStored)
  })
})

// POST /verify { text, signatureB64 }
router.post('/verify', async (req, res) => {
  const schema = z.object({
    text: z.string().min(1),
    signatureB64: z.string().min(1)
  })
  const parse = schema.safeParse(req.body)
  if (!parse.success) return res.status(400).json({ error: parse.error.errors })

  const { text, signatureB64 } = parse.data
  const hash = sha256Hex(text)

  const sig = await prisma.signature.findFirst({
    where: { signatureB64 },
    include: { user: { include: { keyPair: true } } }
  })

  let valid = false
  let signer: string | null = null
  let algorithm: string | null = null
  let signatureId: string | null = null

  if (sig && sig.user?.keyPair) {
    const ok = verifyTextWithRsaPss(sig.user.keyPair.publicKeyPem, text, signatureB64)
    const hashOk = sig.textHashHex === hash
    valid = ok && hashOk
    signer = sig.user.email
    algorithm = sig.algorithm
    signatureId = sig.id
  }

  await prisma.verifyLog.create({
    data: {
      method: 'byPayload',
      signatureId,
      providedHashHex: hash,
      providedSigB64: signatureB64,
      valid,                         // booleano
      requesterIp: req.ip,
      algorithm: algorithm ?? null
    }
  })

  res.json({ valid, signer, algorithm, signatureId, providedHashHex: hash })
})

export default router
