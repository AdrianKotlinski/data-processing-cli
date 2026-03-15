import { createReadStream } from 'fs';
import { Writable } from 'stream';
import { pipeline } from 'stream/promises';

export async function count(inputPath) {
  let chars = 0;
  let lines = 0;
  let words = 0;
  let lastChunkEndedWithNonWS = false;

  const sink = new Writable({
    write(chunk, _encoding, callback) {
      const str = chunk.toString();
      chars += str.length;

      for (const ch of str) {
        if (ch === '\n') lines++;
      }

      const matches = str.match(/\S+/g);
      if (matches) {
        let wordCount = matches.length;
        if (lastChunkEndedWithNonWS && /^\S/.test(str)) {
          wordCount--;
        }
        words += wordCount;
      }

      lastChunkEndedWithNonWS = /\S$/.test(str);
      callback();
    },
  });

  await pipeline(createReadStream(inputPath), sink);
  return { lines, words, chars };
}
