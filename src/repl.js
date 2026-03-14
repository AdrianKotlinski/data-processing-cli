import { up, cd, ls } from "./navigation.js";
import { csvToJson } from "./commands/csvToJson.js";
import { jsonToCsv } from "./commands/jsonToCsv.js";
import { parseArgs } from "./utils/argParser.js";
import resolvePath from "./utils/pathResolver.js";

class InvalidInputError extends Error {
  constructor(message) {
    super(message);
    this.name = "InvalidInputError";
  }
}

export async function handleCommand(input, state) {
  const trimmed = input.trim();
  if (!trimmed) return { cwd: state.cwd };

  const tokens = trimmed.split(/\s+/);
  const command = tokens[0];
  const args = parseArgs(tokens.slice(1));

  try {
    switch (command) {
      case "up": {
        const newCwd = up(state.cwd);
        return { cwd: newCwd, output: "" };
      }

      case "cd": {
        const target = tokens[1];
        if (!target) throw new InvalidInputError("Usage: cd <directory>");
        const newCwd = await cd(state.cwd, target);
        return { cwd: newCwd, output: "" };
      }

      case "ls": {
        const output = await ls(state.cwd);
        return { cwd: state.cwd, output };
      }

      case "csv-to-json": {
        const { input: inputFile, output: outputFile } = args;
        if (!inputFile || !outputFile) {
          throw new InvalidInputError(
            "Usage: csv-to-json --input <file> --output <file>",
          );
        }
        await csvToJson(
          resolvePath(state.cwd, inputFile),
          resolvePath(state.cwd, outputFile),
        );
        return { cwd: state.cwd, output: `Converted to ${outputFile}` };
      }

      case "json-to-csv": {
        const { input: inputFile, output: outputFile } = args;
        if (!inputFile || !outputFile) {
          throw new InvalidInputError(
            "Usage: json-to-csv --input <file> --output <file>",
          );
        }
        await jsonToCsv(
          resolvePath(state.cwd, inputFile),
          resolvePath(state.cwd, outputFile),
        );
        return { cwd: state.cwd, output: `Converted to ${outputFile}` };
      }

      case "count": {
        // will be filled in later
        return { cwd: state.cwd, output: "" };
      }

      case "hash": {
        // will be filled in later
        return { cwd: state.cwd, output: "" };
      }

      case "hash-compare": {
        // will be filled in later
        return { cwd: state.cwd, output: "" };
      }

      case "encrypt": {
        // will be filled in later
        return { cwd: state.cwd, output: "" };
      }

      case "decrypt": {
        // will be filled in later
        return { cwd: state.cwd, output: "" };
      }

      case "log-stats": {
        // will be filled in later
        return { cwd: state.cwd, output: "" };
      }

      default:
        throw new InvalidInputError(`Unknown command: ${command}`);
    }
  } catch (err) {
    if (err instanceof InvalidInputError) {
      return { cwd: state.cwd, error: `Invalid input: ${err.message}` };
    }
    return { cwd: state.cwd, error: `Operation failed: ${err.message}` };
  }
}
