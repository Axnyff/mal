import { Env } from "./env";
type Primitive = Sym | Num | Err | Bool | Nil | Str | Keyword;

type Data = Primitive | Seq | Fun | Atom | HashMap;

type Atom = {
  type: "atom";
  value: Data;
  meta?: Data;
};

type Str = {
  type: "string";
  value: string;
  meta?: Data;
};

type Nil = {
  type: "nil";
  value?: never;
  meta?: Data;
};

type Bool = {
  type: "bool";
  value: boolean;
  meta?: Data;
};

type Fun = CustomFun | RegularFun;

type CustomFun = {
  type: "function";
  meta?: Data;
  is_macro?: boolean;
  value: {
    ast: Data;
    params: List | Vector;
    env: Env;
    fn: (...args: any[]) => Data;
  };
};

type RegularFun = {
  type: "function";
  meta?: Data;
  is_macro?: boolean;
  value: {
    params?: never;
    fn: (...args: any[]) => Data;
  };
};

type Err = {
  type: "error";
  meta?: Data;
  value: Data;
};

type Keyword = {
  type: "keyword";
  meta?: Data;
  value: string;
};

type Sym = {
  type: "symbol";
  meta?: Data;
  value: string;
};

type Num = {
  type: "number";
  meta?: Data;
  value: number;
};

type Seq = List | Vector;

type List = {
  type: "list";
  meta?: Data;
  value: Data[];
};

type Vector = {
  type: "vector";
  meta?: Data;
  value: Data[];
};

type HashMap = {
  type: "map";
  meta?: Data;
  value: { [K: string]: Data };
};
