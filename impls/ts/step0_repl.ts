const readline = require("readline");

const rep = (input: string): string => {
  return input;
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
