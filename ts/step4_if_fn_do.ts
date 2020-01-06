import { Num, Data, List, HashMap } from "./types";
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
repl_env.set("+", {
  type: "function",
  value: {
    fn: (a: Num, b: Num) => ({
      type: "number",
      value: a.value + b.value
    })
  }
});
repl_env.set("-", {
  type: "function",
  value: {
    fn: (a: Num, b: Num) => ({
      type: "number",
      value: a.value - b.value
    })
  }
});
repl_env.set("*", {
  type: "function",
  value: {
    fn: (a: Num, b: Num) => ({
      type: "number",
      value: a.value * b.value
    })
  }
});
repl_env.set("/", {
  type: "function",
  value: {
    fn: (a: Num, b: Num) => ({
      type: "number",
      value: a.value / b.value
    })
  }
});

repl_env.set("eval", {
  type: "function",
  value: {
    fn: (ast: Data) => EVAL(ast, repl_env)
  }
});

Object.entries(ns).forEach(([key, value]) => repl_env.set(key, value));

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
  if (ast.type === "vector") {
    return {
      type: "vector",
      value: ast.value.map(val => EVAL(val, env))
    };
  }
  if (ast.type === "map") {
    return {
      type: "map",
      value: Object.entries(ast.value).reduce((acc, [key, val]) => {
        acc[key] = EVAL(val, env);
        return acc;
      }, {} as HashMap["value"])
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
          quasiquote({ type: "list", value: ast.value.slice(1) })
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
      quasiquote({ type: "list", value: ast.value.slice(1) })
    ]
  };
};

const EVAL = (ast: Data, env: Env): Data => {
  while (true) {
    if (ast.type !== "list") {
      return eval_ast(ast, env);
    }
    if (ast.value.length === 0) {
      return ast;
    }
    if (ast.value[0].value === "quote") {
      return ast.value[1];
    }
    if (ast.value[0].value === "quasiquote") {
      ast = quasiquote(ast.value[1]);
      continue;
    }

    if (ast.value[0].value === "def!") {
      if (ast.value[1].type !== "symbol") {
        throw new Error("Should be a symbol");
      }
      const evaluated = EVAL(ast.value[2], env);
      if (evaluated.type !== "error") {
        env.set(ast.value[1].value, evaluated);
      }
      return evaluated;
    }
    if (ast.value[0].value === "let*") {
      const new_env = new Env(env);
      if (ast.value[1].type !== "list" && ast.value[1].type !== "vector") {
        throw new Error("Bindings should be a list");
      }
      const bindings = ast.value[1].value;
      if (bindings.length % 2 !== 0) {
        throw new Error("Bindings should not be odd length");
      }
      let i = 0;
      while (i < bindings.length) {
        if (bindings[i].type !== "symbol") {
          throw new Error("Bindings should be a symbol");
        } else {
          new_env.set(
            bindings[i].value as string,
            EVAL(bindings[i + 1], new_env)
          );
        }
        i += 2;
      }
      ast = ast.value[2];
      env = new_env;
      continue;
    }

    if (ast.value[0].value === "do") {
      const evaluated = ast.value.slice(1, -1).map(val => EVAL(val, env));
      ast = ast.value[ast.value.length - 1];
      continue;
    }

    if (ast.value[0].value === "if") {
      const cond = EVAL(ast.value[1], env);
      if (cond.value !== false && cond.type !== "nil") {
        ast = ast.value[2];
      } else if (ast.value.length === 4) {
        ast = ast.value[3];
      } else {
        ast = {
          type: "nil"
        };
      }
      continue;
    }

    if (ast.value[0].value === "fn*") {
      const bindings = ast.value[1];
      const content = ast.value[2];
      if (bindings.type !== "list" && bindings.type !== 'vector') {
        return {
          type: "error",
          value: "Function bindings should be a list"
        };
      }
      return {
        type: "function",
        value: {
          params: bindings,
          ast: content,
          env: env,
          fn: (...args: Data[]) => {
            try {
              const new_env = new Env(env);
              for (let i = 0; i < args.length; i++) {
                if (bindings.value[i].type !== "symbol") {
                  return {
                    type: "error",
                    value: "Function bindings should all be args"
                  };
                }
                new_env.set(bindings.value[i].value as string, args[i]);
              }
              return EVAL(content, new_env);
            } catch (e) {
              return {
                type: "error",
                value: "Unexpected error"
              };
            }
          }
        }
      };
    }

    const evaluated = eval_ast(ast, env);
    if (evaluated.type !== "list") {
      return {
        type: "error",
        value: "Should be a function"
      };
    }
    if (evaluated.value[0].type === "error") {
      return evaluated.value[0];
    }
    if (evaluated.value[0].type !== "function") {
      return {
        type: "error",
        value: "Should be a function"
      };
    }
    const fnValue = evaluated.value[0].value;
    if (fnValue.params) {
      const args = evaluated.value.slice(1);
      ast = fnValue.ast;
      const new_env = new Env(env);
      for (let i = 0; i < args.length; i++) {
        if (fnValue.params.value[i].type !== "symbol") {
          return {
            type: "error",
            value: "Function bindings should all be args"
          };
        }
        // variadic arguments
        if (fnValue.params.value[i].value === "&") {
          new_env.set(fnValue.params.value[i + 1].value as string, {
            type: "list",
            value: args.slice(i)
          });
          break;
        } else {
          new_env.set(fnValue.params.value[i].value as string, args[i]);
        }
      }
      env = new_env;
      continue;
    }
    return evaluated.value[0].value.fn(...evaluated.value.slice(1));
  }
};

const rep = (input: string) =>
  console.log(pr_str(EVAL(read_str(input), repl_env)));

rep(
  `(def! load-file (fn* (f) (eval (read-string (str "(do " (slurp f) "\\nnil)")))))`
);
rep(`(def! not (fn* (a) (if a false true)))`);

process.stdout.write("user> ");
rl.on("line", (line: string) => {
  rep(line);
  process.stdout.write("user> ");
});

export = {};
