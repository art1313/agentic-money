import type { AgmOutput } from '../types.js';

export function ok<T>(data: T): AgmOutput<T> {
  return { ok: true, data };
}

export function err(error: string): AgmOutput {
  return { ok: false, error };
}

export function print(output: AgmOutput): void {
  console.log(JSON.stringify(output, null, 2));
  if (!output.ok) process.exit(1);
}
