mod reader;
use rustyline::Editor;

fn main() {
    let mut rl = Editor::<()>::new();
    loop {
        let readline = rl.readline("user> ");
        match readline {
            Ok(line) => {
                if line == "" {
                    continue
                } else {
                    println!("{}", reader::read_str(&line).print(true));
                }
            },
            Err(_) => {
                break
            },
        }
    }
}
