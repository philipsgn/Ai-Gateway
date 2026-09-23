import crypto from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96 bits for AES-GCM
const SALT = "enterprise-ai-vault-salt-v1";

/**
 * Derives a 32-byte (256-bit) key from environment secret
 */
function getMasterKey(): Buffer {
  const secret = process.env.VAULT_ENCRYPTION_KEY || process.env.AUTH_SECRET || "enterprise-ai-default-master-key-32b";
  return crypto.scryptSync(secret, SALT, 32);
}

export interface EncryptedPayload {
  encryptedSecret: string;
  iv: string;
  authTag: string;
}

/**
 * Encrypts a plaintext secret using AES-256-GCM with authentication tag
 */
export function encryptCredential(plainText: string): EncryptedPayload {
  const key = getMasterKey();
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(plainText, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag().toString("hex");

  return {
    encryptedSecret: encrypted,
    iv: iv.toString("hex"),
    authTag,
  };
}

/**
 * Decrypts an AES-256-GCM encrypted secret and verifies authTag integrity
 */
export function decryptCredential(
  encryptedSecret: string,
  ivHex: string,
  authTagHex: string
): string {
  const key = getMasterKey();
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedSecret, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

/**
 * Returns a masked representation of a secret for safe preview in admin portals
 */
export function maskSecret(secret: string): string {
  if (!secret) return "••••••••";
  if (secret.length <= 8) return "••••" + secret.slice(-2);
  const prefix = secret.slice(0, 4);
  const suffix = secret.slice(-4);
  return `${prefix}••••••••${suffix}`;
}
