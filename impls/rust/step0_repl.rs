use rustyline::Editor;

fn main() {
    let mut rl = Editor::<()>::new();
    loop {
        let readline = rl.readline("user> ");
        match readline {
            Ok(line) => {
                println!("{}", line);
            },
            Err(_) => {
                break
            },
        }
    }
}
