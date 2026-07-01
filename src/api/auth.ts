import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { randomUUID } from 'crypto';

const AGM_DIR = join(homedir(), '.agm');
const KEYS_FILE = join(AGM_DIR, 'api-keys.json');

interface ApiKeyRecord {
  key: string;
  name: string;
  createdAt: string;
}

function ensureDir(): void {
  if (!existsSync(AGM_DIR)) mkdirSync(AGM_DIR, { recursive: true, mode: 0o700 });
}

function loadKeys(): ApiKeyRecord[] {
  ensureDir();
  if (!existsSync(KEYS_FILE)) return [];
  return JSON.parse(readFileSync(KEYS_FILE, 'utf-8'));
}

function saveKeys(keys: ApiKeyRecord[]): void {
  ensureDir();
  writeFileSync(KEYS_FILE, JSON.stringify(keys, null, 2), { mode: 0o600 });
}

export function createApiKey(name: string = 'default'): string {
  const keys = loadKeys();
  const key = `agm_${randomUUID().replace(/-/g, '')}`;
  keys.push({ key, name, createdAt: new Date().toISOString() });
  saveKeys(keys);
  return key;
}

export function validateApiKey(key: string): boolean {
  const keys = loadKeys();
  return keys.some(k => k.key === key);
}

export function listApiKeys(): Array<{ name: string; prefix: string; createdAt: string }> {
  return loadKeys().map(k => ({
    name: k.name,
    prefix: k.key.slice(0, 12) + '...',
    createdAt: k.createdAt,
  }));
}
