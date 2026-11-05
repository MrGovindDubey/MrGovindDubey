// Sign README.md with ML-DSA-65 (FIPS 204). The key lives outside the repo and never touches CI.
// Usage: cd tools && npm ci --ignore-scripts && node sign.mjs
import { ml_dsa65 } from '@noble/post-quantum/ml-dsa.js';
import { randomBytes } from '@noble/post-quantum/utils.js';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const dir = join(homedir(), '.config', 'mrgovinddubey-profile');
const seedPath = join(dir, 'mldsa65.seed');
if (!existsSync(seedPath)) {
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  writeFileSync(seedPath, Buffer.from(randomBytes(32)).toString('base64'), { mode: 0o600, flag: 'wx' });
}
const { publicKey, secretKey } = ml_dsa65.keygen(Buffer.from(readFileSync(seedPath, 'utf8'), 'base64'));
const msg = readFileSync(join(root, 'README.md'));
const sig = ml_dsa65.sign(msg, secretKey, { context: Buffer.from('MrGovindDubey/README.md') });
writeFileSync(join(root, 'identity.pub'), Buffer.from(publicKey).toString('base64') + '\n');
writeFileSync(join(root, 'README.md.sig'), Buffer.from(sig).toString('base64') + '\n');
console.log('fingerprint', createHash('sha256').update(publicKey).digest('hex'));
