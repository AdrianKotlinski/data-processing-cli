import { workerData, parentPort } from "worker_threads";
import { createReadStream } from "fs";
import { Writable } from "stream";
import { pipeline } from "stream/promises";

const LOG_LINE_FIELDS_COUNT = 7;
const LOG_LINE_FIELD = { LEVEL: 1, STATUS_CODE: 3, RESPONSE_TIME_MS: 4, URL_PATH: 6 };

const { filePath, start, end } = workerData;

const stats = {
  total: 0,
  levels: {},
  status: {},
  pathCounts: {},
  responseTimeSum: 0,
};

function parseLogLine(line) {
  const trimmed = line.trim();
  if (!trimmed) return null;

  const fields = trimmed.split(" ");
  if (fields.length < LOG_LINE_FIELDS_COUNT) return null;

  return {
    level: fields[LOG_LINE_FIELD.LEVEL],
    statusCode: parseInt(fields[LOG_LINE_FIELD.STATUS_CODE], 10),
    responseTimeMs: parseFloat(fields[LOG_LINE_FIELD.RESPONSE_TIME_MS]),
    urlPath: fields[LOG_LINE_FIELD.URL_PATH],
  };
}

function resolveStatusBucket(statusCode) {
  return `${Math.floor(statusCode / 100)}xx`;
}

function accumulateLineIntoStats(parsedLine) {
  const { level, statusCode, responseTimeMs, urlPath } = parsedLine;

  stats.total++;
  stats.levels[level] = (stats.levels[level] || 0) + 1;

  const statusBucket = resolveStatusBucket(statusCode);
  stats.status[statusBucket] = (stats.status[statusBucket] || 0) + 1;

  stats.pathCounts[urlPath] = (stats.pathCounts[urlPath] || 0) + 1;

  if (!isNaN(responseTimeMs)) {
    stats.responseTimeSum += responseTimeMs;
  }
}

function processLine(line) {
  const parsedLine = parseLogLine(line);
  if (parsedLine) accumulateLineIntoStats(parsedLine);
}

let lineBuffer = "";

const sink = new Writable({
  write(chunk, _encoding, callback) {
    lineBuffer += chunk.toString();
    const lines = lineBuffer.split("\n");
    lineBuffer = lines.pop();

    for (const line of lines) {
      processLine(line);
    }
    callback();
  },

  final(callback) {
    if (lineBuffer.trim()) {
      processLine(lineBuffer);
    }
    callback();
  },
});

try {
  await pipeline(createReadStream(filePath, { start, end }), sink);
  parentPort.postMessage(stats);
} catch (err) {
  parentPort.postMessage({ error: err.message });
}
