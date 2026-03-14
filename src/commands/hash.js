import { createReadStream } from 'fs';
import { Writable } from 'stream';
import { pipeline } from 'stream/promises';
import crypto from 'crypto';
import fs from 'fs/promises';

const SUPPORTED_ALGORITHMS = ['sha256', 'md5', 'sha512'];

export async function hash(inputPath, algorithm = 'sha256', savePath = null) {
  if (!SUPPORTED_ALGORITHMS.includes(algorithm)) {
    throw new Error(`Unsupported algorithm: ${algorithm}. Supported: ${SUPPORTED_ALGORITHMS.join(', ')}`);
  }

  const hashObj = crypto.createHash(algorithm);

  const sink = new Writable({
    write(chunk, _encoding, callback) {
      hashObj.update(chunk);
      callback();
    },
  });

  await pipeline(createReadStream(inputPath), sink);

  const digest = hashObj.digest('hex');

  if (savePath) {
    await fs.writeFile(savePath, digest);
  }

  return { algorithm, digest };
}
