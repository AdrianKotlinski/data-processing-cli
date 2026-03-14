import { up, cd, ls } from "./navigation.js";
import { csvToJson } from "./commands/csvToJson.js";
import { jsonToCsv } from "./commands/jsonToCsv.js";
import { count } from "./commands/count.js";
import { hash } from "./commands/hash.js";
import { hashCompare } from "./commands/hashCompare.js";
import { encrypt } from "./commands/encrypt.js";
import { decrypt } from "./commands/decrypt.js";
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
        const { input: inputFile } = args;
        if (!inputFile) {
          throw new InvalidInputError("Usage: count --input <file>");
        }
        const result = await count(resolvePath(state.cwd, inputFile));
        const output = `Lines: ${result.lines}\nWords: ${result.words}\nCharacters: ${result.chars}`;
        return { cwd: state.cwd, output };
      }

      case "hash": {
        const { input: inputFile, algorithm, save } = args;
        if (!inputFile) {
          throw new InvalidInputError(
            "Usage: hash --input <file> [--algorithm sha256|md5|sha512] [--save]",
          );
        }
        const algoStr = typeof algorithm === "string" ? algorithm : "sha256";
        const resolvedInput = resolvePath(state.cwd, inputFile);
        const savePath = save ? `${resolvedInput}.${algoStr}` : null;
        const result = await hash(resolvedInput, algoStr, savePath);
        return {
          cwd: state.cwd,
          output: `${result.algorithm}: ${result.digest}`,
        };
      }

      case "hash-compare": {
        const { input: inputFile, hash: hashFile, algorithm } = args;
        if (!inputFile || !hashFile) {
          throw new InvalidInputError(
            "Usage: hash-compare --input <file> --hash <hashfile> [--algorithm sha256|md5|sha512]",
          );
        }
        const algoStr = typeof algorithm === "string" ? algorithm : "sha256";
        const result = await hashCompare(
          resolvePath(state.cwd, inputFile),
          resolvePath(state.cwd, hashFile),
          algoStr,
        );
        return { cwd: state.cwd, output: result.match ? "OK" : "MISMATCH" };
      }

      case "encrypt": {
        const { input: inputFile, output: outputFile, password } = args;
        if (!inputFile || !outputFile || !password) {
          throw new InvalidInputError(
            "Usage: encrypt --input <file> --output <file> --password <password>",
          );
        }
        await encrypt(
          resolvePath(state.cwd, inputFile),
          resolvePath(state.cwd, outputFile),
          password,
        );
        return { cwd: state.cwd, output: `Encrypted to ${outputFile}` };
      }

      case "decrypt": {
        const { input: inputFile, output: outputFile, password } = args;
        if (!inputFile || !outputFile || !password) {
          throw new InvalidInputError(
            "Usage: decrypt --input <file> --output <file> --password <password>",
          );
        }
        await decrypt(
          resolvePath(state.cwd, inputFile),
          resolvePath(state.cwd, outputFile),
          password,
        );
        return { cwd: state.cwd, output: `Decrypted to ${outputFile}` };
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
