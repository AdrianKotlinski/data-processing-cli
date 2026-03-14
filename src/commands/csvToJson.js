import { createReadStream, createWriteStream } from "fs";
import { Transform } from "stream";
import { pipeline } from "stream/promises";

function parseCsvLine(line) {
  return line
    .trim()
    .split(",")
    .map((s) => s.trim());
}

function rowToObject(headers, values) {
  return Object.fromEntries(
    headers.map((header, i) => [header, values[i] ?? ""]),
  );
}

function formatJsonRow(obj, isFirst) {
  const prefix = isFirst ? "\n  " : ",\n  ";
  return prefix + JSON.stringify(obj);
}

function detachIncompleteTrailingLine(lines) {
  return lines.pop();
}

function createCsvToJsonTransform() {
  let lineBuffer = "";
  let headers = null;
  let isFirst = true;

  function handleHeader(stream, line) {
    headers = parseCsvLine(line);
    stream.push("[");
  }

  function handleDataRow(stream, line) {
    const obj = rowToObject(headers, parseCsvLine(line));
    stream.push(formatJsonRow(obj, isFirst));
    isFirst = false;
  }

  function handleLine(stream, line) {
    if (!line.trim()) return;
    if (!headers) handleHeader(stream, line);
    else handleDataRow(stream, line);
  }

  return new Transform({
    transform(chunk, _encoding, callback) {
      lineBuffer += chunk.toString();
      const lines = lineBuffer.split("\n");
      lineBuffer = detachIncompleteTrailingLine(lines);

      for (const line of lines) {
        handleLine(this, line);
      }
      callback();
    },

    flush(callback) {
      if (lineBuffer.trim()) handleLine(this, lineBuffer);
      this.push(headers ? "\n]" : "[]");
      callback();
    },
  });
}

export async function csvToJson(inputPath, outputPath) {
  return await pipeline(
    createReadStream(inputPath),
    createCsvToJsonTransform(),
    createWriteStream(outputPath),
  );
}
