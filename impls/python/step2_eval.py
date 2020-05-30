from reader import read_str
from printer import pr_str


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

repl_env = {
        '+': {"type": "fn", "value": add},
        '-': {"type": "fn", "value": sub},
        '*': {"type": "fn", "value": mult},
        '/': {"type": "fn", "value": div},
}

def eval_ast(ast, env):
    if ast["type"] == "symbol":
        try:
            return env[ast["value"]]
        except:
            return {
                "type": "error",
                "value": {
                    "type": "string",
                    "value": "'" + ast["value"] + "' not found"
                    }
            }
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
