import fs from 'fs/promises';
import { hash } from './hash.js';

export async function hashCompare(inputPath, hashFilePath, algorithm = 'sha256') {
  const { digest } = await hash(inputPath, algorithm);
  const expected = (await fs.readFile(hashFilePath, 'utf-8')).trim();
  const match = digest.toLowerCase() === expected.toLowerCase();
  return { match, actual: digest, expected };
}
