const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

const READ = (input: string) => input;

const EVAL = (input: string) => input;

const PRINT = (input: string) => input;

const rep = (input: string) => PRINT(EVAL(READ(input)));

process.stdout.write('user> ');
rl.on('line', (line: string) => {
  console.log(rep(line));
  process.stdout.write('user> ');
});
