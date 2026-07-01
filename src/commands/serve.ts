import { Command } from 'commander';
import { createApiKey, listApiKeys } from '../api/auth.js';
import { ok, print } from '../lib/output.js';

export function registerServeCommands(program: Command): void {
  program
    .command('serve')
    .description('Start the Agentic Money API server')
    .option('-p, --port <port>', 'Port to listen on')
    .action(async (opts) => {
      const port = parseInt(opts.port || process.env.PORT || '3141');
      const { startServer } = await import('../api/server.js');
      startServer(port);
    });

  const apiKey = program.command('api-key').description('Manage API keys');

  apiKey
    .command('create')
    .description('Create a new API key')
    .option('-n, --name <name>', 'Key name', 'default')
    .action((opts) => {
      const key = createApiKey(opts.name);
      print(ok({ key, name: opts.name, message: 'Save this key — it won\'t be shown again.' }));
    });

  apiKey
    .command('list')
    .description('List API keys')
    .action(() => {
      print(ok(listApiKeys()));
    });
}
