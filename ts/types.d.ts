import { Env } from "./env";
type Primitive = Sym | Num | Err | Bool | Nil | Str | Keyword;

type Data = Primitive | Seq | Fun | Atom | HashMap;

type Atom = {
  type: "atom";
  value: Data;
};

type Str = {
  type: "string";
  value: string;
};

type Nil = {
  type: "nil";
  value?: never;
};

type Bool = {
  type: "bool";
  value: boolean;
};

type Fun = CustomFun | RegularFun;

type CustomFun = {
  type: "function";
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
  is_macro?: boolean;
  value: {
    params?: never;
    fn: (...args: any[]) => Data;
  };
};

type Err = {
  type: "error";
  value: Data;
};

type Keyword = {
  type: "keyword";
  value: string;
};

type Sym = {
  type: "symbol";
  value: string;
};

type Num = {
  type: "number";
  value: number;
};

type Seq = List | Vector;

type List = {
  type: "list";
  value: Data[];
};

type Vector = {
  type: "vector";
  value: Data[];
};

type HashMap = {
  type: "map";
  value: { [K: string]: Data };
};
