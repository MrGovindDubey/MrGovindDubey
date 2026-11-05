// Verify README.md against identity.pub, and that the README names this key's fingerprint.
import { ml_dsa65 } from '@noble/post-quantum/ml-dsa.js';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const b64 = (f) => Buffer.from(readFileSync(join(root, f), 'utf8').trim(), 'base64');
const pub = b64('identity.pub');
const msg = readFileSync(join(root, 'README.md'));
const fp = createHash('sha256').update(pub).digest('hex');
const sigOk = ml_dsa65.verify(b64('README.md.sig'), msg, pub, { context: Buffer.from('MrGovindDubey/README.md') });
const fpOk = msg.includes(fp);
console.log(`ML-DSA-65 signature: ${sigOk ? 'valid' : 'INVALID'}\nfingerprint ${fp}: ${fpOk ? 'named in README' : 'NOT in README'}`);
process.exit(sigOk && fpOk ? 0 : 1);
