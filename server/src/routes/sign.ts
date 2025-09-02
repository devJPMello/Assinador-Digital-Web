import { Router } from 'express';
import { authRequired } from '../auth.js';
import { prisma } from '../prisma.js';
import { z } from 'zod';
import { decryptPrivateKey, sha256Hex, signTextWithRsaPss } from '../crypto.js';

const router = Router();

router.post('/sign', authRequired, async (req, res) => {
  const schema = z.object({ text: z.string().min(1), storeText: z.boolean().optional() });
  const parse = schema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.errors });

  const { text, storeText = false } = parse.data;
  const userId = (req as any).userId as string;

  const keyPair = await prisma.keyPair.findUnique({ where: { userId } });
  if (!keyPair) return res.status(400).json({ error: 'keypair_not_found' });

  const textHashHex = sha256Hex(text);
  const privateKeyPem = decryptPrivateKey(keyPair.privateKeyEnc);
  const signatureB64 = signTextWithRsaPss(privateKeyPem, text);

  const record = await prisma.signature.create({
    data: {
      userId,
      textHashHex,
      textStored: storeText ? text : null,
      signatureB64,
      algorithm: keyPair.algorithm
    }
  });

  res.json({ signatureId: record.id, algorithm: record.algorithm, textHashHex, signatureB64 });
});

export default router;
