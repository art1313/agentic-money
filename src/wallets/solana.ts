import { Connection, PublicKey, Keypair, Transaction, SystemProgram, clusterApiUrl } from '@solana/web3.js';
import { getAssociatedTokenAddress, createTransferInstruction, getAccount, getMint } from '@solana/spl-token';
import * as bip39 from 'bip39';
import { derivePath } from 'ed25519-hd-key';
import type { Network, AssetType } from '../types.js';

// Token mint addresses on Solana
const TOKEN_MINTS: Record<string, string> = {
  usdc_mainnet: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  usdc_testnet: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU', // devnet USDC
  usdt_mainnet: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  usdt_testnet: 'EJwZgeZrdC8TXTQbQBoL6bfuAnFUQe2ixfHMawJpauQE', // devnet
};

function getConnection(network: Network): Connection {
  const endpoint = network === 'mainnet'
    ? 'https://api.mainnet-beta.solana.com'
    : clusterApiUrl('devnet');
  return new Connection(endpoint, 'confirmed');
}

function getTokenMint(asset: AssetType, network: Network): PublicKey {
  const key = `${asset}_${network}`;
  const mint = TOKEN_MINTS[key];
  if (!mint) throw new Error(`Token mint not found for ${asset} on ${network}`);
  return new PublicKey(mint);
}

export function deriveKeypair(mnemonic: string, index: number = 0): Keypair {
  const seed = bip39.mnemonicToSeedSync(mnemonic);
  const path = `m/44'/501'/${index}'/0'`;
  const derived = derivePath(path, seed.toString('hex'));
  return Keypair.fromSeed(derived.key);
}

export function deriveSolanaAddress(mnemonic: string, index: number = 0): string {
  const keypair = deriveKeypair(mnemonic, index);
  return keypair.publicKey.toBase58();
}

export async function fetchSolBalance(mnemonic: string, network: Network, index: number = 0): Promise<string> {
  const connection = getConnection(network);
  const keypair = deriveKeypair(mnemonic, index);
  const balance = await connection.getBalance(keypair.publicKey);
  return (balance / 1e9).toString(); // lamports to SOL
}

export async function fetchTokenBalance(
  mnemonic: string,
  asset: AssetType,
  network: Network,
  index: number = 0
): Promise<string> {
  const connection = getConnection(network);
  const keypair = deriveKeypair(mnemonic, index);
  const mint = getTokenMint(asset, network);

  try {
    const ata = await getAssociatedTokenAddress(mint, keypair.publicKey);
    const account = await getAccount(connection, ata);
    const mintInfo = await getMint(connection, mint);
    const balance = Number(account.amount) / Math.pow(10, mintInfo.decimals);
    return balance.toString();
  } catch {
    return '0'; // no token account = zero balance
  }
}

export async function sendToken(
  mnemonic: string,
  asset: AssetType,
  network: Network,
  to: string,
  amount: string,
  index: number = 0
): Promise<string> {
  const connection = getConnection(network);
  const keypair = deriveKeypair(mnemonic, index);
  const mint = getTokenMint(asset, network);
  const mintInfo = await getMint(connection, mint);

  const fromAta = await getAssociatedTokenAddress(mint, keypair.publicKey);
  const toPubkey = new PublicKey(to);
  const toAta = await getAssociatedTokenAddress(mint, toPubkey);

  const amountRaw = BigInt(Math.round(parseFloat(amount) * Math.pow(10, mintInfo.decimals)));

  const ix = createTransferInstruction(fromAta, toAta, keypair.publicKey, amountRaw);

  const tx = new Transaction().add(ix);
  tx.feePayer = keypair.publicKey;
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  tx.sign(keypair);

  const sig = await connection.sendRawTransaction(tx.serialize());
  await connection.confirmTransaction(sig, 'confirmed');
  return sig;
}
