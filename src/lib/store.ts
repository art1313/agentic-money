import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import type { WalletStore, StoredWallet, AgmConfig, TreasuryWallet, FeeRecord } from '../types.js';

const AGM_DIR = join(homedir(), '.agm');
const STORE_FILE = join(AGM_DIR, 'wallets.json');

const DEFAULT_CONFIG: AgmConfig = {
  defaultNetwork: 'testnet',
  defaultChain: 'solana',
  jsonOutput: true,
  feePercent: 0.5,
};

function ensureDir(): void {
  if (!existsSync(AGM_DIR)) {
    mkdirSync(AGM_DIR, { recursive: true, mode: 0o700 });
  }
}

export function loadStore(): WalletStore {
  ensureDir();
  if (!existsSync(STORE_FILE)) {
    const store: WalletStore = {
      version: 1,
      wallets: [],
      config: DEFAULT_CONFIG,
      treasury: [],
      fees: [],
    };
    saveStore(store);
    return store;
  }
  const raw = readFileSync(STORE_FILE, 'utf-8');
  const store = JSON.parse(raw) as WalletStore;
  // Migrate older stores
  if (!store.treasury) store.treasury = [];
  if (!store.fees) store.fees = [];
  if (!store.config.feePercent && store.config.feePercent !== 0) store.config.feePercent = 0.5;
  return store;
}

export function saveStore(store: WalletStore): void {
  ensureDir();
  writeFileSync(STORE_FILE, JSON.stringify(store, null, 2), { mode: 0o600 });
}

export function addWallet(wallet: StoredWallet): void {
  const store = loadStore();
  store.wallets.push(wallet);
  saveStore(store);
}

export function getWallet(id: string): StoredWallet | undefined {
  const store = loadStore();
  return store.wallets.find(w => w.id === id || w.name === id);
}

export function listWallets(): StoredWallet[] {
  const store = loadStore();
  return store.wallets;
}

export function removeWallet(id: string): boolean {
  const store = loadStore();
  const idx = store.wallets.findIndex(w => w.id === id || w.name === id);
  if (idx === -1) return false;
  store.wallets.splice(idx, 1);
  saveStore(store);
  return true;
}

export function getConfig(): AgmConfig {
  return loadStore().config;
}

export function setConfig(key: string, value: string): void {
  const store = loadStore();
  if (key === 'feePercent') {
    store.config.feePercent = parseFloat(value);
  } else {
    (store.config as unknown as Record<string, unknown>)[key] = value;
  }
  saveStore(store);
}

// --- Treasury ---

export function getTreasuryWallet(chain: string, asset: string, network: string): TreasuryWallet | undefined {
  const store = loadStore();
  return store.treasury.find(t => t.chain === chain && t.asset === asset && t.network === network);
}

export function setTreasuryWallet(tw: TreasuryWallet): void {
  const store = loadStore();
  const idx = store.treasury.findIndex(t => t.chain === tw.chain && t.asset === tw.asset && t.network === tw.network);
  if (idx >= 0) store.treasury[idx] = tw;
  else store.treasury.push(tw);
  saveStore(store);
}

export function listTreasuryWallets(): TreasuryWallet[] {
  return loadStore().treasury;
}

// --- Fees ---

export function recordFee(fee: FeeRecord): void {
  const store = loadStore();
  store.fees.push(fee);
  saveStore(store);
}

export function listFees(): FeeRecord[] {
  return loadStore().fees;
}

export function getRevenueSummary(): Record<string, { total: number; count: number }> {
  const fees = listFees();
  const summary: Record<string, { total: number; count: number }> = {};
  for (const f of fees) {
    const key = `${f.asset}_${f.chain}_${f.network}`;
    if (!summary[key]) summary[key] = { total: 0, count: 0 };
    summary[key].total += parseFloat(f.feeTaken);
    summary[key].count += 1;
  }
  return summary;
}
