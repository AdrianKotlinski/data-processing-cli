import readline from "readline";
import { stdin, stdout } from "process";

import os from "os";
import { handleCommand } from "./repl.js";

const state = { cwd: os.homedir() };

const rl = readline.createInterface({
  input: stdin,
  output: stdout,
});

function goodbye() {
  console.log("\nGoodbye! Thank you for using Data Processing CLI!");
  process.exit(0);
}

rl.on("close", goodbye);
rl.on("SIGINT", goodbye);

console.log("Welcome to Data Processing CLI!");
console.log("CLI programmed by Adrian Kotlinski, enjoy!");
console.log(`You are currently in ${state.cwd}`);

function prompt() {
  rl.question("> ", async (input) => {
    if (input.trim() === ".exit") {
      goodbye();
    }

    const result = await handleCommand(input, state);
    state.cwd = result.cwd;

    if (result.error) {
      console.log(result.error);
    } else {
      if (result.output) {
        console.log(result.output);
      }
      console.log(`You are currently in ${state.cwd}`);
    }

    prompt();
  });
}

prompt();
