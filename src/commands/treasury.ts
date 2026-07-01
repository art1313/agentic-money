import { Command } from 'commander';
import { addWallet, getWallet, setTreasuryWallet, listTreasuryWallets, getRevenueSummary, listFees } from '../lib/store.js';
import { generateMnemonic, deriveAddress, getDerivationPath } from '../wallets/bitcoin.js';
import { deriveEvmAddress } from '../wallets/stablecoin.js';
import { deriveSolanaAddress } from '../wallets/solana.js';
import { ok, print } from '../lib/output.js';
import { randomUUID } from 'crypto';
import type { Chain, AssetType, Network, StoredWallet } from '../types.js';

function resolveAddress(w: StoredWallet): string {
  if (w.chain === 'bitcoin') return deriveAddress(w.mnemonic, w.network, w.addressIndex);
  if (w.chain === 'solana') return deriveSolanaAddress(w.mnemonic, w.addressIndex);
  return deriveEvmAddress(w.mnemonic, w.addressIndex);
}

export function registerTreasuryCommands(program: Command): void {
  const treasury = program.command('treasury').description('Manage treasury wallets and revenue');

  treasury
    .command('init')
    .description('Initialize treasury wallets for fee collection')
    .option('--chain <chain>', 'Chain: solana, base, bitcoin', 'solana')
    .option('--asset <asset>', 'Asset: usdc, usdt, bitcoin', 'usdc')
    .option('--network <network>', 'Network: testnet, mainnet', 'testnet')
    .action((opts) => {
      const chain = opts.chain as Chain;
      const asset = opts.asset as AssetType;
      const network = opts.network as Network;

      const mnemonic = generateMnemonic();
      const id = randomUUID().slice(0, 8);

      let derivationPath: string;
      if (chain === 'bitcoin') derivationPath = getDerivationPath(network);
      else if (chain === 'solana') derivationPath = "m/44'/501'/0'/0'";
      else derivationPath = "m/44'/60'/0'/0";

      const wallet: StoredWallet = {
        id, name: `treasury-${asset}-${chain}`, asset, chain,
        role: 'spending', network, mnemonic, derivationPath, addressIndex: 0,
      };

      addWallet(wallet);
      setTreasuryWallet({ chain, asset, network, walletId: id });

      print(ok({
        message: `Treasury wallet created for ${asset} on ${chain}`,
        walletId: id,
        address: resolveAddress(wallet),
        chain, asset, network,
      }));
    });

  treasury
    .command('list')
    .description('List all treasury wallets')
    .action(() => {
      const wallets = listTreasuryWallets();
      const enriched = wallets.map(t => {
        const w = getWallet(t.walletId);
        return {
          ...t,
          address: w ? resolveAddress(w) : 'unknown',
        };
      });
      print(ok(enriched));
    });

  treasury
    .command('revenue')
    .description('Show revenue summary')
    .action(() => {
      const summary = getRevenueSummary();
      const fees = listFees();
      print(ok({
        totalTransactions: fees.length,
        byAsset: summary,
        recentFees: fees.slice(-10),
      }));
    });
}
