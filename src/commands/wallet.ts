import { randomUUID } from 'crypto';
import { Command } from 'commander';
import { addWallet, listWallets, getWallet, removeWallet, getConfig } from '../lib/store.js';
import { ok, err, print } from '../lib/output.js';
import { generateMnemonic, deriveAddress, getDerivationPath } from '../wallets/bitcoin.js';
import { deriveEvmAddress } from '../wallets/stablecoin.js';
import { deriveSolanaAddress } from '../wallets/solana.js';
import type { AssetType, WalletRole, StoredWallet, Chain, Network } from '../types.js';
import { getDefaultChain, CHAIN_ASSETS } from '../types.js';

function resolveAddress(w: { asset: AssetType; chain: Chain; mnemonic: string; network: Network; addressIndex: number }): string {
  if (w.chain === 'bitcoin') return deriveAddress(w.mnemonic, w.network, w.addressIndex);
  if (w.chain === 'solana') return deriveSolanaAddress(w.mnemonic, w.addressIndex);
  return deriveEvmAddress(w.mnemonic, w.addressIndex); // base
}

export function registerWalletCommands(program: Command): void {
  const wallet = program.command('wallet').description('Manage agent wallets');

  wallet
    .command('create')
    .description('Create a new wallet')
    .option('-n, --name <name>', 'Wallet name')
    .option('-a, --asset <asset>', 'Asset: bitcoin, usdc, or usdt', 'bitcoin')
    .option('-c, --chain <chain>', 'Chain: bitcoin, base, or solana')
    .option('-r, --role <role>', 'Role: savings or spending')
    .option('--network <network>', 'Network: mainnet or testnet')
    .option('--mnemonic <mnemonic>', 'Import existing mnemonic (24 words)')
    .action(async (opts) => {
      try {
        const config = getConfig();
        const asset = opts.asset as AssetType;
        const chain = (opts.chain || getDefaultChain(asset)) as Chain;
        const network = (opts.network || config.defaultNetwork) as Network;

        // Validate chain+asset compatibility
        if (!CHAIN_ASSETS[chain]?.includes(asset)) {
          print(err(`${asset} is not available on ${chain}. Valid chains for ${asset}: ${Object.entries(CHAIN_ASSETS).filter(([, assets]) => assets.includes(asset)).map(([c]) => c).join(', ')}`));
          return;
        }

        const role = (opts.role || (asset === 'bitcoin' ? 'savings' : 'spending')) as WalletRole;
        const name = opts.name || `${asset}-${chain}-${role}`;
        const mnemonic = opts.mnemonic || generateMnemonic();
        const id = randomUUID().slice(0, 8);

        let derivationPath: string;
        if (chain === 'bitcoin') {
          derivationPath = getDerivationPath(network);
        } else if (chain === 'solana') {
          derivationPath = "m/44'/501'/0'/0'";
        } else {
          derivationPath = "m/44'/60'/0'/0";
        }

        const stored: StoredWallet = {
          id, name, asset, chain, role, network,
          mnemonic, derivationPath, addressIndex: 0,
        };

        addWallet(stored);

        const address = resolveAddress(stored);

        print(ok({
          id, name, asset, chain, role, network, address,
          mnemonic,
          createdAt: new Date().toISOString(),
        }));
      } catch (e) {
        print(err((e as Error).message));
      }
    });

  wallet
    .command('list')
    .description('List all wallets')
    .action(() => {
      try {
        const wallets = listWallets();
        const infos = wallets.map(w => ({
          id: w.id,
          name: w.name,
          asset: w.asset,
          chain: w.chain,
          role: w.role,
          network: w.network,
          address: resolveAddress(w),
        }));
        print(ok(infos));
      } catch (e) {
        print(err((e as Error).message));
      }
    });

  wallet
    .command('show <id>')
    .description('Show wallet details')
    .option('--show-mnemonic', 'Include mnemonic in output')
    .action((id: string, opts) => {
      try {
        const w = getWallet(id);
        if (!w) { print(err(`Wallet not found: ${id}`)); return; }

        const info: Record<string, unknown> = {
          id: w.id, name: w.name, asset: w.asset, chain: w.chain,
          role: w.role, network: w.network,
          address: resolveAddress(w),
        };
        if (opts.showMnemonic) info.mnemonic = w.mnemonic;

        print(ok(info));
      } catch (e) {
        print(err((e as Error).message));
      }
    });

  wallet
    .command('remove <id>')
    .description('Remove a wallet')
    .action((id: string) => {
      const removed = removeWallet(id);
      if (removed) print(ok({ removed: id }));
      else print(err(`Wallet not found: ${id}`));
    });
}
