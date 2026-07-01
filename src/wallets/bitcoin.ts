import * as bip39 from 'bip39';
import { BIP32Factory } from 'bip32';
import * as ecc from 'tiny-secp256k1';
import * as bitcoin from 'bitcoinjs-lib';
import type { Network } from '../types.js';

const bip32 = BIP32Factory(ecc);

function getNetwork(network: Network): bitcoin.Network {
  return network === 'mainnet' ? bitcoin.networks.bitcoin : bitcoin.networks.testnet;
}

export function generateMnemonic(): string {
  return bip39.generateMnemonic(256); // 24 words for maximum security
}

export function getDerivationPath(network: Network): string {
  // BIP84 (native segwit) - lower fees
  return network === 'mainnet' ? "m/84'/0'/0'" : "m/84'/1'/0'";
}

export function deriveAddress(mnemonic: string, network: Network, index: number = 0): string {
  const seed = bip39.mnemonicToSeedSync(mnemonic);
  const root = bip32.fromSeed(seed, getNetwork(network));
  const path = getDerivationPath(network);
  const child = root.derivePath(`${path}/0/${index}`);

  const { address } = bitcoin.payments.p2wpkh({
    pubkey: Buffer.from(child.publicKey),
    network: getNetwork(network),
  });

  if (!address) throw new Error('Failed to derive address');
  return address;
}

export function deriveKeyPair(mnemonic: string, network: Network, index: number = 0) {
  const seed = bip39.mnemonicToSeedSync(mnemonic);
  const root = bip32.fromSeed(seed, getNetwork(network));
  const path = getDerivationPath(network);
  const child = root.derivePath(`${path}/0/${index}`);
  return child;
}

export async function fetchBalance(address: string, network: Network): Promise<string> {
  const baseUrl = network === 'mainnet'
    ? 'https://mempool.space/api'
    : 'https://mempool.space/testnet/api';

  const res = await fetch(`${baseUrl}/address/${address}`);
  if (!res.ok) throw new Error(`Failed to fetch balance: ${res.statusText}`);

  const data = await res.json() as {
    chain_stats: { funded_txo_sum: number; spent_txo_sum: number };
    mempool_stats: { funded_txo_sum: number; spent_txo_sum: number };
  };

  const confirmed = data.chain_stats.funded_txo_sum - data.chain_stats.spent_txo_sum;
  const unconfirmed = data.mempool_stats.funded_txo_sum - data.mempool_stats.spent_txo_sum;
  const totalSats = confirmed + unconfirmed;

  return totalSats.toString();
}

export async function fetchUtxos(address: string, network: Network) {
  const baseUrl = network === 'mainnet'
    ? 'https://mempool.space/api'
    : 'https://mempool.space/testnet/api';

  const res = await fetch(`${baseUrl}/address/${address}/utxo`);
  if (!res.ok) throw new Error(`Failed to fetch UTXOs: ${res.statusText}`);

  return await res.json() as Array<{
    txid: string;
    vout: number;
    value: number;
    status: { confirmed: boolean };
  }>;
}

export async function broadcastTx(txHex: string, network: Network): Promise<string> {
  const baseUrl = network === 'mainnet'
    ? 'https://mempool.space/api'
    : 'https://mempool.space/testnet/api';

  const res = await fetch(`${baseUrl}/tx`, {
    method: 'POST',
    body: txHex,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Broadcast failed: ${errText}`);
  }

  return await res.text(); // returns txid
}
