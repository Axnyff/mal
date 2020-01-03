import { pr_str } from "./printer";
import { read_str } from "./reader";
const readline = require("readline");
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: true
});

const EVAL = (input: Data) => input;

const rep = (input: string) => pr_str(EVAL(read_str(input)));

process.stdout.write("user> ");
rl.on("line", (line: string) => {
  console.log(rep(line));
  process.stdout.write("user> ");
});

export = {};
