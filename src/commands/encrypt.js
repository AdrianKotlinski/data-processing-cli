import { createReadStream, createWriteStream } from 'fs';
import { Transform } from 'stream';
import { pipeline } from 'stream/promises';
import crypto from 'crypto';
import fs from 'fs/promises';

function createAuthTagAppender(cipher) {
  return new Transform({
    transform(chunk, _encoding, callback) {
      this.push(chunk);
      callback();
    },

    flush(callback) {
      try {
        this.push(cipher.getAuthTag());
        callback();
      } catch (err) {
        callback(err);
      }
    },
  });
}

export async function encrypt(inputPath, outputPath, password) {
  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(12);
  const key = crypto.scryptSync(password, salt, 32);

  const header = Buffer.concat([salt, iv]);
  await fs.writeFile(outputPath, header);

  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const writeStream = createWriteStream(outputPath, { flags: 'a' });

  await pipeline(createReadStream(inputPath), cipher, createAuthTagAppender(cipher), writeStream);
}
