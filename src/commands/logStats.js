import { Worker } from 'worker_threads';
import { fileURLToPath } from 'url';
import path from 'path';
import os from 'os';
import { createWriteStream } from 'fs';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import fs from 'fs/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WORKER_PATH = path.resolve(__dirname, '../workers/logWorker.js');

function mergeCountMap(target, source) {
  for (const [key, value] of Object.entries(source)) {
    target[key] = (target[key] || 0) + value;
  }
}

function mergeWorkerResults(workerResults) {
  const merged = {
    total: 0,
    levels: {},
    status: {},
    pathCounts: {},
    responseTimeSum: 0,
  };

  for (const workerResult of workerResults) {
    merged.total += workerResult.total;
    merged.responseTimeSum += workerResult.responseTimeSum;
    mergeCountMap(merged.levels, workerResult.levels);
    mergeCountMap(merged.status, workerResult.status);
    mergeCountMap(merged.pathCounts, workerResult.pathCounts);
  }

  return merged;
}

const NEWLINE_SCAN_BUFFER_SIZE = 1024;

async function findNextNewlineByte(fileHandle, fromPosition, fileSize) {
  const buffer = Buffer.alloc(NEWLINE_SCAN_BUFFER_SIZE);
  const { bytesRead } = await fileHandle.read(buffer, 0, NEWLINE_SCAN_BUFFER_SIZE, fromPosition);
  const newlineOffset = buffer.indexOf('\n');
  if (newlineOffset !== -1 && newlineOffset < bytesRead) {
    return fromPosition + newlineOffset;
  }
  return fileSize - 1;
}

async function buildLineAlignedChunks(fileSize, numWorkers, inputPath) {
  const nominalChunkSize = Math.ceil(fileSize / numWorkers);
  const fileHandle = await fs.open(inputPath, 'r');

  try {
    const chunks = [];
    let chunkStart = 0;

    for (let i = 0; i < numWorkers; i++) {
      const isLastChunk = i === numWorkers - 1;

      if (isLastChunk) {
        chunks.push({ start: chunkStart, end: fileSize - 1 });
        break;
      }

      const nominalEnd = Math.min(chunkStart + nominalChunkSize - 1, fileSize - 1);
      const newlinePosition = await findNextNewlineByte(fileHandle, nominalEnd, fileSize);
      chunks.push({ start: chunkStart, end: newlinePosition });
      chunkStart = newlinePosition + 1;
    }

    return chunks;
  } finally {
    await fileHandle.close();
  }
}

function computeAvgResponseTime(totalLines, responseTimeSum) {
  if (totalLines === 0) return 0;
  return Math.round((responseTimeSum / totalLines) * 100) / 100;
}

function rankPathsByRequestCount(pathCounts) {
  return Object.entries(pathCounts)
    .sort(([, countA], [, countB]) => countB - countA)
    .map(([urlPath, count]) => ({ path: urlPath, count }));
}

function buildFinalOutput(merged) {
  return {
    total: merged.total,
    levels: merged.levels,
    status: merged.status,
    avgResponseTimeMs: computeAvgResponseTime(merged.total, merged.responseTimeSum),
    topPaths: rankPathsByRequestCount(merged.pathCounts),
  };
}

function spawnWorker(chunk, inputPath) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(WORKER_PATH, {
      workerData: { filePath: inputPath, ...chunk },
    });
    worker.on('message', message => {
      if (message.error) reject(new Error(`Worker error: ${message.error}`));
      else resolve(message);
    });
    worker.on('error', reject);
    worker.on('exit', exitCode => {
      if (exitCode !== 0) reject(new Error(`Worker exited with code ${exitCode}`));
    });
  });
}

export async function logStats(inputPath, outputPath) {
  const { size: fileSize } = await fs.stat(inputPath);
  const numWorkers = os.cpus().length;

  const chunks = await buildLineAlignedChunks(fileSize, numWorkers, inputPath);
  const workerResults = await Promise.all(chunks.map(chunk => spawnWorker(chunk, inputPath)));

  const merged = mergeWorkerResults(workerResults);
  const output = buildFinalOutput(merged);

  await pipeline(
    Readable.from([JSON.stringify(output, null, 2)]),
    createWriteStream(outputPath),
  );

  return output;
}
