use regex::Regex;

struct Reader {
    position: usize,
    tokens: Vec<String>
}

impl Reader {
    fn peek(&self) -> Result<String, ()> {
        self.tokens.get(self.position).map(|str| str.to_string()).ok_or(())
    }

    fn next(& mut self) -> Result<String, ()> {
        self.position += 1;
        self.tokens.get(self.position - 1).map(|str| str.to_string()).ok_or(())
    }

}

#[derive(Clone)]
pub enum MalVal {
    MalNil,
    MalNumber(i32),
    MalError(Box<MalVal>),
    MalString(String),
    MalList(Box<Vec<MalVal>>),
    MalVector(Box<Vec<MalVal>>),
    MalHashmap(Box<Vec<MalVal>>),
    MalSymbol(String),
    MalFunc(fn(&[MalVal]) -> MalVal)
}

impl MalVal {
    pub fn print(&self, print_readability: bool) -> String {
        match &self {
            MalVal::MalNil => format!("nil"),
            MalVal::MalNumber(num) => format!("{}", num),
            MalVal::MalError(error) => format!("Error: {}", error.print(print_readability)),
            MalVal::MalString(str) => format!("\"{}\"", str),
            MalVal::MalSymbol(str) => format!("{}", str),
            MalVal::MalList(content) => {
                let items: Vec<MalVal>= content.as_ref().to_vec();
                let content: Vec<String> = items.iter().map(|item| item.print(print_readability)).collect();
                format!("({})", content.join(" "))
            },
            MalVal::MalVector(content) => {
                let items: Vec<MalVal>= content.as_ref().to_vec();
                let content: Vec<String> = items.iter().map(|item| item.print(print_readability)).collect();
                format!("[{}]", content.join(" "))
            },
            MalVal::MalHashmap(content) => {
                let items: Vec<MalVal>= content.as_ref().to_vec();
                let content: Vec<String> = items.iter().map(|item| item.print(print_readability)).collect();
                format!("{{{}}}", content.join(" "))
            },
            MalVal::MalFunc(_) => format!("#function"),
        }
    }
}

fn tokenize(line: &str) -> Reader {
    let re = Regex::new(r#"[\s,]*(~@|[\[\]{}()'`~^@]|"(?:\\.|[^\\"])*"?|;.*|[^\s\[\]{}('"`,;)]*)"#).unwrap();
    let tokens: Vec<_> = re.captures_iter(line).map(|cap| cap[1].to_string()).collect();

    Reader {
        position: 0,
        tokens,
    }
}

fn read_atom(reader: &mut Reader) -> Result<MalVal, ()> {
    let token = reader.next()?;

    if let Ok(number) = token.parse() {
       return Ok(MalVal::MalNumber(number));
    }
    if token == "nil" {
        return Ok(MalVal::MalNil);
    }

    if token.starts_with('"') {
        if token.len() > 1 && token.ends_with('"') {
            return Ok(MalVal::MalString(token[1..token.len() - 1].to_string()))
        } else {
            return Err(())
        }
    }

    Ok(MalVal::MalSymbol(token))
}

fn read_list(reader: &mut Reader) -> Result<MalVal, ()> {
    let mut content: Vec<MalVal>= Vec::new();
    reader.next()?;
    loop {
        let token =  reader.peek()?;
        if token == ")" {
            reader.next()?;
            break  Ok(MalVal::MalList(Box::new(content)));
        }
        let val = read_form(reader)?;
        content.push(val);
    }
}

fn read_vector(reader: &mut Reader) -> Result<MalVal, ()> {
    let mut content: Vec<MalVal>= Vec::new();
    reader.next()?;
    loop {
        let token =  reader.peek()?;
        if token == "]" {
            reader.next()?;
            break  Ok(MalVal::MalVector(Box::new(content)));
        }
        let val = read_form(reader)?;
        content.push(val);
    }
}

fn read_hashmap(reader: &mut Reader) -> Result<MalVal, ()> {
    let mut content: Vec<MalVal>= Vec::new();
    reader.next()?;
    loop {
        let token =  reader.peek()?;
        if token == "}" {
            reader.next()?;
            break  Ok(MalVal::MalHashmap(Box::new(content)));
        }
        let val = read_form(reader)?;
        content.push(val);
    }
}


fn read_macro(reader: &mut Reader, symbol: &str) -> Result<MalVal, ()> {
    reader.next()?;
    let val = read_form(reader)?;
    let content = vec![MalVal::MalSymbol(symbol.to_string()), val];
    Ok(MalVal::MalList(Box::new(content)))
}

fn read_with_meta(reader: &mut Reader) -> Result<MalVal, ()> {
    reader.next()?;
    let meta = read_form(reader)?;
    let val = read_form(reader)?;
    let content = vec![MalVal::MalSymbol("with-meta".to_string()), val, meta];
    Ok(MalVal::MalList(Box::new(content)))
}


fn read_form(reader: &mut Reader) -> Result<MalVal, ()> {
    reader.peek().and_then(|token| {
        match token.as_str() {
            "(" => read_list(reader),
            "[" => read_vector(reader),
            "{" => read_hashmap(reader),
            "'" => read_macro(reader, "quote"),
            "`" => read_macro(reader, "quasiquote"),
            "~" => read_macro(reader, "unquote"),
            "~@" => read_macro(reader, "splice-unquote"),
            "@" => read_macro(reader, "deref"),
            "^" => read_with_meta(reader),
            _ => read_atom(reader)
        }
    })
}

pub fn read_str(line: &str) -> MalVal {
    let mut reader = tokenize(line);
    read_form(&mut reader).unwrap_or(
        MalVal::MalError(Box::new(MalVal::MalString("EOF".to_string()))),
    )
}

