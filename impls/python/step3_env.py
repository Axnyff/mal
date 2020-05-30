from readerimport read_str
from printer import pr_str
from env import Env


def add(val_a, val_b):
    return {
            "type": "number",
            "value": val_a["value"] + val_b["value"]
    }

def sub(val_a, val_b):
    return {
            "type": "number",
            "value": val_a["value"] - val_b["value"]
    }

def mult(val_a, val_b):
    return {
            "type": "number",
            "value": val_a["value"] * val_b["value"]
    }

def div(val_a, val_b):
    return {
            "type": "number",
            "value": val_a["value"] / val_b["value"]
    }

repl_env = Env()
repl_env.set('+', {"type": "fn", "value": add})
repl_env.set('-', {"type": "fn", "value": sub})
repl_env.set('*', {"type": "fn", "value": mult})
repl_env.set('/', {"type": "fn", "value": div})

def eval_ast(ast, env):
    if ast["type"] == "symbol":
        return env.get(ast["value"])
    if ast["type"] in ("list", "vector"):
        items = map(lambda ast: eval(ast, env), ast["value"])
        return {
            "type": ast["type"],
            "value": items,
            }
    if ast["type"] == "hashmap":
        new_val = {}
        for key, value in ast["value"].items():
            new_val[key] = eval(value, env)
        return {
            "type": "hashmap",
            "value": new_val
            }
    return ast

def eval(ast, env):
    if ast["type"] != "list":
        return eval_ast(ast, env)
    if len(ast["value"]) == 0:
        return ast

    symbol = ast["value"][0]["value"]
    if symbol == "def!":
        evaluated = eval(ast["value"][2], env)
        env.set(ast["value"][1]["value"], evaluated)
        return evaluated

    if symbol == "let*":
        new_env = Env(env)
        params = ast["value"][1]["value"]

        i = 0
        while i < len(params):
            new_env.set(params[i]["value"], eval(params[i + 1], new_env))
            i += 2
        return eval(ast["value"][2], new_env)

    new_ast = eval_ast(ast, env)
    fn = new_ast["value"][0]

    if fn["type"] == "error":
        return fn

    return fn["value"](*new_ast["value"][1:])

def rep(line):
    print(pr_str(eval(read_str(line), repl_env)))

while True:
    line = raw_input("user> ")
    if (len(line) != 0):
        rep(line)
