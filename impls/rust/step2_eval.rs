mod reader;
use reader::MalVal;
use std::collections::HashMap;
use rustyline::Editor;


fn eval_ast(ast: MalVal, env: HashMap<&str, MalVal>) -> MalVal {
    match ast {
        MalVal::MalSymbol(symbol) => {
            env.get(symbol).or_else(MalVal::MalError(Box::new(MalVal::MalString("Not found".to_string())))),
        },
        MalVal::MalList(content) => {
            let items = content.as_ref.to_vec.map(|item| => EVAL(item, env));
            MalVal::MalList(Box::new(items))
        },
        val => val,
    }
}

fn EVAL(ast: MalVal, env: HashMap<&str, MalVal>) -> MalVal {
    match ast {
        MalVal::MalList(content) => {
            if (&content.len() == 0) {
                ast
            } else {
                match eval_ast(ast, env) {
                    MalVal::MalList(content) => {
                        let items = content.as_ref.to_vec.map(|item| => EVAL(item, env));
                        MalVal::MalList(Box::new(items))
                    },
                    _ => MalVal::MalError(Box::new(MalVal::MalString("unexpected".to_string()))),
                }
            }
        },
        _ => eval_ast(ast, env),

    }
    return ast;
}

fn rep(line: &str, env: HashMap<&str, MalVal>) {
    let val = reader::read_str(&line);
    let evaluated = EVAL(val, env);
    println!("{}", evaluated.print(true));
}

fn main() {
    let mut rl = Editor::<()>::new();
    loop {
        let readline = rl.readline("user> ");
        let mut repl_env = HashMap::new();

        repl_env.insert("+",
            MalVal::MalFunc(|args: &[MalVal]| {
                match (&args[0], &args[1]) {
                    (MalVal::MalNumber(a), MalVal::MalNumber(b)) => MalVal::MalNumber(a + b),
                    _ => MalVal::MalError(Box::new(MalVal::MalString("Wrong operation".to_string())))
                }
            }));

        match readline {
            Ok(line) => {
                rep(&line, repl_env);
            },
            Err(_) => {
                break
            },
        }
    }
}
