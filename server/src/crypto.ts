import crypto from 'crypto';

const MASTER_KEY = process.env.MASTER_KEY!;
if (!MASTER_KEY) throw new Error('MASTER_KEY ausente no .env');

function getMasterKey(): Buffer {
  try {
    if (/^[A-Za-z0-9+/=]+$/.test(MASTER_KEY) && MASTER_KEY.length % 4 === 0) {
      return Buffer.from(MASTER_KEY, 'base64');
    }
    if (/^[0-9a-fA-F]+$/.test(MASTER_KEY) && MASTER_KEY.length % 2 === 0) {
      return Buffer.from(MASTER_KEY, 'hex');
    }
  } catch {}
  return Buffer.from(MASTER_KEY, 'utf8');
}

export function generateRsaKeyPair() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
  });
  return { publicKeyPem: publicKey, privateKeyPem: privateKey, algorithm: 'RSA-PSS-SHA256-2048' };
}

export function encryptPrivateKey(privateKeyPem: string) {
  const key = getMasterKey();
  if (key.length < 32) throw new Error('MASTER_KEY precisa ter 32 bytes (AES-256)');
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key.subarray(0, 32), iv);
  const ciphertext = Buffer.concat([cipher.update(privateKeyPem, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return JSON.stringify({
    alg: 'aes-256-gcm',
    iv: iv.toString('base64'),
    ct: ciphertext.toString('base64'),
    tag: tag.toString('base64')
  });
}

export function decryptPrivateKey(privateKeyEncJson: string): string {
  const key = getMasterKey();
  const enc = JSON.parse(privateKeyEncJson);
  const iv = Buffer.from(enc.iv, 'base64');
  const ct = Buffer.from(enc.ct, 'base64');
  const tag = Buffer.from(enc.tag, 'base64');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key.subarray(0, 32), iv);
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([decipher.update(ct), decipher.final()]).toString('utf8');
  return plaintext;
}

export function sha256Hex(text: string) {
  return crypto.createHash('sha256').update(text, 'utf8').digest('hex');
}

export function signTextWithRsaPss(privateKeyPem: string, text: string) {
  const signer = crypto.createSign('sha256');
  signer.update(text, 'utf8');
  signer.end();
  const sig = signer.sign({
    key: privateKeyPem,
    padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
    saltLength: 32
  });
  return sig.toString('base64');
}

export function verifyTextWithRsaPss(publicKeyPem: string, text: string, signatureB64: string) {
  const verifier = crypto.createVerify('sha256');
  verifier.update(text, 'utf8');
  verifier.end();
  return verifier.verify(
    { key: publicKeyPem, padding: crypto.constants.RSA_PKCS1_PSS_PADDING, saltLength: 32 },
    Buffer.from(signatureB64, 'base64')
  );
}

export function randomBase64Url(n = 32) {
  return crypto.randomBytes(n).toString('base64url');
}
export function sha256HexBuf(buf: Buffer | string) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}
