#!/usr/bin/env node

import { Command } from 'commander';
import { registerWalletCommands } from './commands/wallet.js';
import { registerBalanceCommands } from './commands/balance.js';
import { registerSendCommands } from './commands/send.js';
import { registerReceiveCommands } from './commands/receive.js';
import { registerConfigCommands } from './commands/config.js';
import { registerServeCommands } from './commands/serve.js';
import { registerTreasuryCommands } from './commands/treasury.js';

const program = new Command();

program
  .name('agm')
  .description('Agentic Money — Bitcoin for savings, stablecoins for spending. Built for AI agents.')
  .version('0.1.0');

registerWalletCommands(program);
registerBalanceCommands(program);
registerSendCommands(program);
registerReceiveCommands(program);
registerConfigCommands(program);
registerServeCommands(program);
registerTreasuryCommands(program);

program.parse();
