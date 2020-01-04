import { Num, Data, List } from "./types";
import { pr_str } from "./printer";
import { read_str } from "./reader";
import { Env } from "./env";
import { ns } from "./core";

const readline = require("readline");
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: true
});

const repl_env = new Env();
const eval_ast = (ast: Data, env: Env): Data => {
  if (ast.type === "symbol") {
    try {
      const val = env.get(ast.value);
      return val;
    } catch (err) {
      return {
        type: "error",
        value: `.*'${ast.value}' not found.*'`
      };
    }
  }
  if (ast.type === "list") {
    return {
      type: "list",
      value: ast.value.map(val => EVAL(val, env))
    };
  }
  return ast;
};

const isPair = (ast: Data): ast is List =>
  ast.type === "list" && ast.value.length !== 0;

const quasiquote = (ast: Data): Data => {
  if (!isPair(ast)) {
    return {
      type: "list",
      value: [
        {
          type: "symbol",
          value: "quote"
        },
        ast
      ]
    };
  }
  if (ast.value[0].value === "unquote") {
    return ast.value[1];
  }

  if (isPair(ast.value[0])) {
    if (ast.value[0].value[0].value === "splice-unquote") {
      return {
        type: "list",
        value: [
          {
            type: "symbol",
            value: "concat"
          },
          ast.value[0].value[1],
          quasiquote({ type: "list", value: ast.value.slice(1)})
        ]
      };
    }
  }
  return {
    type: "list",
    value: [
      {
        type: "symbol",
        value: "cons"
      },
      quasiquote(ast.value[0]),
      quasiquote({ type: "list", value: ast.value.slice(1)})
    ]
  };
};

const EVAL = (ast: Data, env: Env): Data => {
  return ast;
};

const rep = (input: string) =>
  console.log(pr_str(EVAL(read_str(input), repl_env)));

process.stdout.write("user> ");
rl.on("line", (line: string) => {
  rep(line);
  process.stdout.write("user> ");
});

export = {};
