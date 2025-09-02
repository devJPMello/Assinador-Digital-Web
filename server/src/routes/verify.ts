import { Router } from 'express';
import { prisma } from '../prisma.js';
import { z } from 'zod';
import { verifyTextWithRsaPss, sha256Hex } from '../crypto.js';

const router = Router();

router.get('/verify/:id', async (req, res) => {
  const { id } = req.params;
  const sig = await prisma.signature.findUnique({
    where: { id },
    include: { user: { include: { keyPair: true } } }
  });
  if (!sig || !sig.user?.keyPair) {
    await prisma.verifyLog.create({
      data: { method: 'byId', signatureId: null, isValid: false, ip: req.ip }
    });
    return res.json({ valid: false });
  }

  const publicKey = sig.user.keyPair.publicKeyPem;
  const text = sig.textStored ?? ''; 
  let valid = false;

  if (sig.textStored) {
    const ok = verifyTextWithRsaPss(publicKey, text, sig.signatureB64);
    const hashOk = sha256Hex(text) === sig.textHashHex;
    valid = ok && hashOk;
  } else {
    valid = true;
  }

  await prisma.verifyLog.create({
    data: { method: 'byId', signatureId: sig.id, isValid: valid, ip: req.ip }
  });

  res.json({
    valid,
    signatureId: sig.id,
    signer: sig.user.email,
    algorithm: sig.algorithm,
    createdAt: sig.createdAt,
    textStored: Boolean(sig.textStored)
  });
});
router.post('/verify', async (req, res) => {
  const schema = z.object({
    text: z.string().min(1),
    signatureB64: z.string().min(1)
  });
  const parse = schema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.errors });

  const { text, signatureB64 } = parse.data;
  const hash = sha256Hex(text);

  const sig = await prisma.signature.findFirst({
    where: { signatureB64 },
    include: { user: { include: { keyPair: true } } }
  });

  let valid = false;
  let signer: string | null = null;
  let algorithm: string | null = null;
  let signatureId: string | null = null;

  if (sig && sig.user?.keyPair) {
    const ok = verifyTextWithRsaPss(sig.user.keyPair.publicKeyPem, text, signatureB64);
    const hashOk = sig.textHashHex === hash;
    valid = ok && hashOk;
    signer = sig.user.email;
    algorithm = sig.algorithm;
    signatureId = sig.id;
  } else {
    valid = false;
  }

  await prisma.verifyLog.create({
    data: {
      method: 'byPayload',
      signatureId,
      providedHashHex: hash,
      providedSigB64: signatureB64,
      isValid: valid,
      ip: req.ip
    }
  });

  res.json({ valid, signer, algorithm, signatureId, providedHashHex: hash });
});

export default router;
