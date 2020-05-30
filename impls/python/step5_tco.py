import sys
from reader import read_str, Val
from printer import pr_str
from env import Env
from core import ns


repl_env = Env()
for key in ns:
    repl_env.set(key, ns[key])

def eval_ast(ast, env):
    if ast.type == "symbol":
        return env.get(ast.value)
    if ast.type in ("list", "vector"):
        items = map(lambda ast: eval(ast, env), ast.value)
        return Val(ast.type, items)
    if ast.type == "hashmap":
        new_val = {}
        for key, value in ast.value.items():
            new_val[key] = eval(value, env)
        return Val("hashmap", new_val)
    return ast

def eval(ast, env):
    while True:
        if ast.type != "list":
            return eval_ast(ast, env)
        if len(ast.value) == 0:
            return ast

        symbol = ast.value[0].value
        if symbol == "def!":
            evaluated = eval(ast.value[2], env)
            env.set(ast.value[1].value, evaluated)
            return evaluated

        if symbol == "let*":
            new_env = Env(env)
            params = ast.value[1].value

            i = 0
            while i < len(params):
                new_env.set(params[i].value, eval(params[i + 1], new_env))
                i += 2
            ast = ast.value[2]
            env = new_env
            continue

        if symbol == "do":
            evaluated = None
            for i in ast.value[1:-1]:
                eval(i, env)
            ast = ast.value[len(ast.value) -1]
            continue

        if symbol == "if":
            evaluated = None
            cond = eval(ast.value[1], env)
            if cond.type != "nil" and (cond.type != "bool" or cond.value == True):
                ast = ast.value[2]
            elif len(ast.value) > 3:
                ast = ast.value[3]
            else: 
                ast = Val("nil", [])
            continue

        if symbol == "fn*":
            def func(*exprs_t):
                new_env = Env(env)
                params = ast.value[1].value
                exprs = list(exprs_t)
                i = 0
                while i < len(params):
                    if params[i].value == "&":
                        new_env.set(params[i + 1].value, Val("list", exprs[i:]))
                        break
                    new_env.set(params[i].value, exprs[i])
                    i += 1

                return eval(ast.value[2], new_env)

            return Val("custom_fn", {
                "fn": func,
                "ast": ast.value[2],
                "params": ast.value[1].value,
                "env": env
            })

        new_ast = eval_ast(ast, env)

        fn = new_ast.value[0]
        if fn.type == 'custom_fn':
            exprs = new_ast.value[1:]
            ast = fn.value["ast"]
            params = fn.value["params"]
            i = 0
            new_env = Env(fn.value["env"])
            while i < len(params):
                if params[i].value == "&":
                    new_env.set(params[i + 1].value, Val("list", exprs[i:]))
                    break
                new_env.set(params[i].value, exprs[i])
                i += 1
            env = new_env
            continue

        return fn.value(*new_ast.value[1:])

def rep(line):
    try:
        print(pr_str(eval(read_str(line), repl_env)))
    except Exception as e:
        if isinstance(e.args[0], Val):
            print(pr_str(Val("error", e.args[0])))
        else:
            raise e
            print(e.traceback)
            print(pr_str(Val("error", Val("string", str(e)))))

rep("(def! not (fn* (a) (if a false true)))")
while True:
    line = raw_input("user> ")
    if (len(line) != 0):
        rep(line)
