import { ethers } from 'ethers';
import type { Network, AssetType } from '../types.js';

// USDC on Base (Circle)
const USDC_ADDRESSES: Record<string, string> = {
  base_mainnet: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  base_testnet: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
};

// USDT on Base (Tether)
const USDT_ADDRESSES: Record<string, string> = {
  base_mainnet: '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2',
  base_testnet: '0x7169D38820dfd117C3FA1f22a697dBA58d90BA06',
};

const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
];

function getRpcUrl(network: Network): string {
  return network === 'mainnet'
    ? 'https://mainnet.base.org'
    : 'https://sepolia.base.org';
}

function getTokenAddress(asset: AssetType, network: Network): string {
  const addresses = asset === 'usdc' ? USDC_ADDRESSES : USDT_ADDRESSES;
  const key = network === 'mainnet' ? 'base_mainnet' : 'base_testnet';
  return addresses[key]!;
}

export function deriveEvmAddress(mnemonic: string, index: number = 0): string {
  const path = `m/44'/60'/0'/0/${index}`;
  const wallet = ethers.HDNodeWallet.fromMnemonic(
    ethers.Mnemonic.fromPhrase(mnemonic),
    path
  );
  return wallet.address;
}

export function getEvmWallet(mnemonic: string, network: Network, index: number = 0): ethers.HDNodeWallet {
  const path = `m/44'/60'/0'/0/${index}`;
  const provider = new ethers.JsonRpcProvider(getRpcUrl(network));
  const wallet = ethers.HDNodeWallet.fromMnemonic(
    ethers.Mnemonic.fromPhrase(mnemonic),
    path
  ).connect(provider);
  return wallet;
}

export async function fetchTokenBalance(mnemonic: string, asset: AssetType, network: Network, index: number = 0): Promise<string> {
  const wallet = getEvmWallet(mnemonic, network, index);
  const token = new ethers.Contract(getTokenAddress(asset, network), ERC20_ABI, wallet);
  const balance = await token.balanceOf(wallet.address) as bigint;
  const decimals = await token.decimals() as number;
  return ethers.formatUnits(balance, decimals);
}

export async function sendToken(
  mnemonic: string,
  asset: AssetType,
  network: Network,
  to: string,
  amount: string,
  index: number = 0
): Promise<string> {
  const wallet = getEvmWallet(mnemonic, network, index);
  const token = new ethers.Contract(getTokenAddress(asset, network), ERC20_ABI, wallet);
  const decimals = await token.decimals() as number;
  const amountWei = ethers.parseUnits(amount, decimals);
  const tx = await token.transfer(to, amountWei) as ethers.TransactionResponse;
  await tx.wait();
  return tx.hash;
}
