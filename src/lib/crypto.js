import { getToken } from './helpers';

function getSalt() {
  const existing = sessionStorage.getItem('messenger_salt');
  if (existing) {
    const parts = existing.split(',');
    return new Uint8Array(parts.map(Number));
  }
  const salt = crypto.getRandomValues(new Uint8Array(16));
  sessionStorage.setItem('messenger_salt', Array.from(salt).join(','));
  return salt;
}

async function deriveKey(material, salt) {
  const enc = new TextEncoder();
  const keyData = await crypto.subtle.importKey('raw', enc.encode(material), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyData,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

export async function encrypt(plaintext) {
  try {
    const material = getToken();
    if (!material) return '';
    const salt = getSalt();
    const key = await deriveKey(material, salt);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const enc = new TextEncoder();
    const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(plaintext));
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encrypted), iv.length);
    return btoa(String.fromCharCode(...combined));
  } catch { return ''; }
}

export async function decrypt(ciphertext) {
  try {
    const material = getToken();
    if (!material) return '';
    const salt = getSalt();
    const key = await deriveKey(material, salt);
    const combined = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
    return new TextDecoder().decode(decrypted);
  } catch { return ''; }
}

export async function encryptStorage(key, value) {
  try {
    const json = JSON.stringify(value);
    const encrypted = await encrypt(json);
    if (encrypted) sessionStorage.setItem(key, encrypted);
  } catch {}
}

export async function decryptStorage(key) {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const decrypted = await decrypt(raw);
    if (!decrypted) return null;
    return JSON.parse(decrypted);
  } catch { return null; }
}

export function clearEncryptionSalt() {
  sessionStorage.removeItem('messenger_salt');
}
