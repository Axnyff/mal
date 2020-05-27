import { pr_str } from "./printer";
import { read_str } from "./reader";

const readline = require("readline");

const rep = (input: string): string => {
  try {
    return pr_str(read_str(input, true));
  } catch (e) {
    if (e instanceof Error) {
      return pr_str(
        {
          type: "string",
          value: `.*Error.*${e.message}`
        },
        false
      );
    }
    return `.*Error.*${pr_str(e)}`;
  }
};

process.stdout.write("user> ");
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: true
});
rl.on("line", (line: string) => {
  console.log(rep(line));
  process.stdout.write("user> ");
});
