import { up, cd, ls } from "./navigation.js";

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
        // will be filled in later
        return { cwd: state.cwd, output: "" };
      }

      case "json-to-csv": {
        // will be filled in later
        return { cwd: state.cwd, output: "" };
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
