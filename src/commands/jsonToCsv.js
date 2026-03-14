import { createReadStream, createWriteStream } from "fs";
import { Transform } from "stream";
import { pipeline } from "stream/promises";

function extractHeaders(firstRow) {
  return Object.keys(firstRow);
}

function escapeValue(value) {
  const str = value != null ? String(value) : "";
  if (str.includes(",") || str.includes("\n") || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function objectToCsvRow(headers, row) {
  return headers.map((h) => escapeValue(row[h])).join(",");
}

function emitCsvRows(stream, data) {
  const headers = extractHeaders(data[0]);
  stream.push(headers.join(",") + "\n");
  for (const row of data) {
    stream.push(objectToCsvRow(headers, row) + "\n");
  }
}

function createJsonToCsvTransform() {
  let rawBuffer = "";

  return new Transform({
    transform(chunk, _encoding, callback) {
      rawBuffer += chunk.toString();
      callback();
    },

    flush(callback) {
      try {
        const data = JSON.parse(rawBuffer);
        if (!Array.isArray(data) || data.length === 0) {
          return callback(new Error("Input JSON must be a non-empty array"));
        }
        emitCsvRows(this, data);
        callback();
      } catch (err) {
        callback(err);
      }
    },
  });
}

export async function jsonToCsv(inputPath, outputPath) {
  return await pipeline(
    createReadStream(inputPath),
    createJsonToCsvTransform(),
    createWriteStream(outputPath),
  );
}
