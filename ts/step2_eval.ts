import { pr_str } from "./printer";
import { read_str } from "./reader";
const readline = require("readline");
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: true
});

const repl_env: Env = {
  "+": {
    type: "function",
    value: (a: number, b: number) => ({
      type: "number",
      value: a + b
    })
  },
  "-": {
    type: "function",
    value: (a: number, b: number) => ({
      type: "number",
      value: a - b
    })
  },
  "*": {
    type: "function",
    value: (a: number, b: number) => ({
      type: "number",
      value: a * b
    })
  },
  "/": {
    type: "function",
    value: (a: number, b: number) => ({
      type: "number",
      value: a / b
    })
  }
};

const eval_ast = (ast: Data, env: Env): Data => {
  if (ast.type === "symbol") {
    const val = env[ast.value];
    if (val === undefined) {
      return {
        type: "symbol",
        value: "erreur"
      };
    }
    return val;
  }
  if (ast.type === "list") {
    return {
      type: "list",
      value: ast.value.map(val => EVAL(val, env))
    };
  }
  return ast;
};

const EVAL = (ast: Data, env: Env): Data => {
  if (ast.type !== "list") {
    return eval_ast(ast, env);
  }
  if (ast.value.length === 0) {
    return ast;
  }
  const evaluated = eval_ast(ast, env);
  if (evaluated.type !== "list") {
    throw new Error("Should be a list");
  }
  if (evaluated.value[0].type !== "function") {
    return {
      type: "symbol",
      value: "erreur"
    };
  }
  return evaluated.value[0].value(
    ...evaluated.value.slice(1).map(el => el.value)
  );
};

const rep = (input: string) => pr_str(EVAL(read_str(input), repl_env));

process.stdout.write("user> ");
rl.on("line", (line: string) => {
  console.log(rep(line));
  process.stdout.write("user> ");
});

export = {};
