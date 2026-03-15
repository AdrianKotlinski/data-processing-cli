import { createReadStream, createWriteStream } from "fs";
import { pipeline } from "stream/promises";
import crypto from "crypto";
import fs from "fs/promises";

export async function decrypt(inputPath, outputPath, password) {
  const stat = await fs.stat(inputPath);
  const fileSize = stat.size;

  const HEADER_SIZE = 28; // 16 (salt) + 12 (iv)
  const AUTH_TAG_SIZE = 16;
  const MIN_FILE_SIZE = HEADER_SIZE + AUTH_TAG_SIZE;

  if (fileSize < MIN_FILE_SIZE) {
    throw new Error("File too small to be a valid encrypted file");
  }

  const fd = await fs.open(inputPath, "r");
  let salt, iv, authTagBuf;

  try {
    const headerBuf = Buffer.alloc(HEADER_SIZE);
    await fd.read(headerBuf, 0, HEADER_SIZE, 0);
    salt = Buffer.from(headerBuf.subarray(0, AUTH_TAG_SIZE));
    iv = Buffer.from(headerBuf.subarray(AUTH_TAG_SIZE, HEADER_SIZE));

    authTagBuf = Buffer.alloc(AUTH_TAG_SIZE);
    await fd.read(authTagBuf, 0, AUTH_TAG_SIZE, fileSize - AUTH_TAG_SIZE);
  } finally {
    await fd.close();
  }

  const key = crypto.scryptSync(password, salt, 32);
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTagBuf);

  const readStream = createReadStream(inputPath, {
    start: HEADER_SIZE,
    end: fileSize - AUTH_TAG_SIZE - 1,
  });
  const writeStream = createWriteStream(outputPath);

  await pipeline(readStream, decipher, writeStream);
}
