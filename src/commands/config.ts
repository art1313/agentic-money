import { Command } from 'commander';
import { getConfig, setConfig } from '../lib/store.js';
import { ok, err, print } from '../lib/output.js';

export function registerConfigCommands(program: Command): void {
  const config = program.command('config').description('Manage configuration');

  config
    .command('show')
    .description('Show current configuration')
    .action(() => {
      print(ok(getConfig()));
    });

  config
    .command('set <key> <value>')
    .description('Set a configuration value')
    .action((key: string, value: string) => {
      const validKeys = ['defaultNetwork', 'defaultChain', 'jsonOutput', 'feePercent'];
      if (!validKeys.includes(key)) {
        print(err(`Invalid config key: ${key}. Valid keys: ${validKeys.join(', ')}`));
        return;
      }
      setConfig(key, value);
      print(ok({ [key]: value }));
    });
}
