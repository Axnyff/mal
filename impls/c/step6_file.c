#include <stdio.h>
#include <stdlib.h>
#include <ctype.h>
#include <string.h>

#define MAL_LIST 1
#define MAL_VECTOR 2
#define MAL_HASHMAP 3
#define MAL_NUMBER 4
#define MAL_SYMBOL 5
#define MAL_STRING 6
#define MAL_NIL 7
#define MAL_BOOL 8
#define MAL_FUNC 9
#define MAL_CUSTOM_FUNC 10
#define MAL_ATOM 11
#define MAL_ERROR -1

typedef struct MalVal malval_t;
typedef struct Env env_t;
typedef struct EnvItem envitem_t;

struct Reader {
  char** tokens;
  int position;
};

malval_t read_form(struct Reader *reader);
malval_t read_str(char *s);
malval_t EVAL(malval_t val, env_t *env);
env_t *create_env(env_t *outer);
void set(env_t *env, char *key, malval_t val);
malval_t get(char *key, env_t *env_ptr);
int getLine(char *s);
char *getFile(char *filename);


typedef struct MalList {
  malval_t *items;
  int len;
} mallist_t;

typedef struct MalCustomFunc {
  env_t *env;
  malval_t *ast;
  mallist_t *params;
} malfn_t;

typedef union MalValContent {
  mallist_t list;
  int num;
  char* str;
  malval_t (*fn)(mallist_t l);
  malfn_t custom_fn;
  malval_t *atom;
} malcontent_t;

struct MalVal {
  int vtype;
  malcontent_t val;
};


char *pr_str(malval_t val, int print_readability);

struct EnvItem {
  char *key;
  malval_t val;
  envitem_t *next;
};

struct Env {
  envitem_t *items;
  struct Env *outer;
} *repl_env;

malval_t make_atom(malval_t *val) {
  malval_t res;
  malcontent_t content;
  res.vtype = MAL_ATOM;
  content.atom = val;
  res.val = content;
  return res;
}

malval_t make_list_like(malval_t *items, int len, int vtype) {
  malval_t res;
  malcontent_t content;
  mallist_t list;
  list.items =  items;
  list.len = len;
  res.vtype = vtype;
  content.list = list;
  res.val = content;
  return res;
}

malval_t make_list(malval_t *items, int len) {
  return make_list_like(items, len, MAL_LIST);
}
malval_t make_fn(malval_t (*fn)(mallist_t l)) {
  malval_t res = {
    .vtype = MAL_FUNC,
    .val = { 
      .fn = fn
    }
  };
  return res;
}

malval_t make_custom_fn(malval_t *ast, mallist_t *params, env_t *env) {
  malval_t res = {
    .vtype = MAL_CUSTOM_FUNC,
    .val = {
      .custom_fn = {
        .ast = ast,
        .params = params,
        .env= env
      }
    }
  };
  return res;
}

malval_t make_num(int num) {
  malval_t res;
  malcontent_t content;
  res.vtype = MAL_NUMBER;
  content.num = num;
  res.val = content;
  return res;
}

malval_t make_symbol(char *s) {
  malval_t res;
  malcontent_t content;
  res.vtype = MAL_SYMBOL;
  content.str = s;
  res.val = content;
  return res;
}

malval_t make_bool(int v) {
  malval_t res = make_symbol(v ? "true": "false");
  res.vtype = MAL_BOOL;
  return res;
}

malval_t make_nil() {
  malval_t res = make_symbol("nil");
  res.vtype = MAL_NIL;
  return res;
}

malval_t make_error(char *s) {
  malval_t res;
  malcontent_t content;
  res.vtype = MAL_ERROR;
  content.str = s;
  res.val = content;
  return res;
}

malval_t make_string(char *s) {
  malval_t res;
  malcontent_t content;
  res.vtype = MAL_STRING;
  content.str = s;
  res.val = content;
  return res;
}

int match_symbol(malval_t val, char* s) {
  return val.vtype == MAL_SYMBOL && strcmp(val.val.str, s) == 0;
}

malval_t add(mallist_t l) {
  int count = 0;
  int i;
  for (i = 0; i < l.len; i++) {
    count += l.items[i].val.num;
  }
  return make_num(count);
}

malval_t sub(mallist_t l) {
  return make_num(l.items[0].val.num - l.items[1].val.num);
}

malval_t divide(mallist_t l) {
  return make_num(l.items[0].val.num / l.items[1].val.num);
}

malval_t mult(mallist_t l) {
  return make_num(l.items[0].val.num * l.items[1].val.num);
}

malval_t prstr(mallist_t l) {
  char *s = malloc(100);
  int i;
  for (i = 0; i < l.len; i++) {
    if (i != 0) {
      strcat(s, " ");
    }
    strcat(s, pr_str(l.items[i], 1));
  }
  return make_string(s);
}

malval_t str(mallist_t l) {
  char *s = malloc(10000000);
  int i;
  for (i = 0; i < l.len; i++) {
    strcat(s, pr_str(l.items[i], 0));
  }
  return make_string(s);
}

malval_t prn(mallist_t l) {
  char *s = malloc(100);
  int i;
  for (i = 0; i < l.len; i++) {
    if (i != 0) {
      strcat(s, " ");
    }
    strcat(s, pr_str(l.items[i], 1));
  }
  printf("%s\n", s);
  return make_nil();
}

malval_t println(mallist_t l) {
  char *s = malloc(100);
  int i;
  for (i = 0; i < l.len; i++) {
    if (i != 0) {
      strcat(s, " ");
    }
    strcat(s, pr_str(l.items[i], 0));
  }
  printf("%s\n", s);
  return make_nil();
}

malval_t list(mallist_t l) {
  return make_list(l.items, l.len);
}

malval_t is_list(mallist_t l) {
  return make_bool(l.items[0].vtype == MAL_LIST);
}

malval_t is_empty(mallist_t l) {
  return make_bool(l.items[0].val.list.len == 0);
}

malval_t count(mallist_t l) {
  if (l.items[0].vtype == MAL_NIL) {
    return make_num(0);
  }
  return make_num(l.items[0].val.list.len);
}

int _equal(malval_t item1, malval_t item2) {
  if (
      (item1.vtype == MAL_LIST || item1.vtype == MAL_VECTOR || item1.vtype == MAL_HASHMAP)
      && (item2.vtype == MAL_LIST || item2.vtype == MAL_VECTOR || item2.vtype == MAL_HASHMAP)
      ) {
    int i;
    if (item1.val.list.len != item2.val.list.len) {
      return 0;
    }
    for (i = 0; i < item1.val.list.len; i++) {
      if (!_equal(item1.val.list.items[i], item2.val.list.items[i])) {
        return 0;
      }
    }
    return 1;
  }
  if (item1.vtype != item2.vtype) {
    return 0;
  }
  if (item1.vtype == MAL_LIST || item1.vtype == MAL_VECTOR || item1.vtype == MAL_HASHMAP) {
    int i;
    if (item1.val.list.len != item2.val.list.len) {
      return 0;
    }
    for (i = 0; i < item1.val.list.len; i++) {
      if (!_equal(item1.val.list.items[i], item2.val.list.items[i])) {
        return 0;
      }
    }
    return 1;
  }
  if (item1.vtype == MAL_NUMBER){
    return item1.val.num == item2.val.num;
    return 0;
  }

  return strcmp(item1.val.str,item2.val.str) == 0;
}

malval_t equal(mallist_t l) {
  return make_bool(_equal(l.items[0], l.items[1]));
}

malval_t inf(mallist_t l) {
  return make_bool(l.items[0].val.num < l.items[1].val.num);
}

malval_t infeq(mallist_t l) {
  return make_bool(l.items[0].val.num <= l.items[1].val.num);
}

malval_t sup(mallist_t l) {
  return make_bool(l.items[0].val.num > l.items[1].val.num);
}

malval_t supeq(mallist_t l) {
  return make_bool(l.items[0].val.num >= l.items[1].val.num);
}

malval_t readstring(mallist_t l) {
  if (l.len == 0) {
    return make_nil();
  }
  return read_str(l.items[0].val.str);
}

malval_t slurp(mallist_t l) {
  char* s = getFile(l.items[0].val.str);
  if (s == 0) {
    return make_error("File not found");
  }
  return make_string(getFile(l.items[0].val.str));
}

malval_t atom(mallist_t l) {
  return make_atom(&l.items[0]);
}

malval_t is_atom(mallist_t l) {
  return make_bool(l.items[0].vtype == MAL_ATOM);
}

malval_t deref(mallist_t l) {
  return *(l.items[0].val.atom);
}

malval_t reset(mallist_t l) {
  *l.items[0].val.atom = l.items[1];
  return l.items[1];
}

malval_t eval(mallist_t l) {
  return EVAL(l.items[0], repl_env);
}

malval_t swap(mallist_t l) {
  malval_t *items = malloc((l.len + 1)* sizeof(malval_t));
  int i;

  *items = *l.items[0].val.atom;
  for (i = 1; i < l.len; i++) {
    *(items + i) = l.items[i + 1];
  }
  malval_t list_val = make_list(items, l.len -1);
  mallist_t list = list_val.val.list;

  malval_t res;
  if (l.items[1].vtype == MAL_CUSTOM_FUNC) {
    malfn_t custom_fn = l.items[1].val.custom_fn;
    env_t *new_env = create_env(custom_fn.env);
    for (i = 0; i < custom_fn.params->len; i++) {
      if (strcmp(custom_fn.params->items[i].val.str, "&") == 0) {
        set(new_env, custom_fn.params->items[i+1].val.str,
            make_list(list.items + i, list.len - i)
           );
        break;
      }
      set(new_env, custom_fn.params->items[i].val.str, list.items[i + 0]);
    }
    res = EVAL(*custom_fn.ast, new_env);
  } else {
    res = l.items[1].val.fn(list);
  }
  malval_t **atomval = &l.items[0].val.atom;
  **atomval = res;
  return res;
}

malval_t cons(mallist_t l) {
  malval_t *items = malloc(100 * sizeof(malval_t));
  int i;
  mallist_t old = l.items[1].val.list;

  *items = l.items[0];
  for (i = 0; i <= old.len; i++) {
    *(items + i + 1) = old.items[i];
  }
  return make_list(items, old.len + 1);
}

malval_t concat(mallist_t l) {
  malval_t *items = malloc(100 * sizeof(malval_t));
  int i, j, k = 0;
  for (i = 0; i < l.len; i++) {
    for (j = 0; j < l.items[i].val.list.len; j++) {
      *(items + k++) = l.items[i].val.list.items[j];
    }
  }

  return make_list(items, k);
}

void gen_repl_env() {
  struct Funcs {
    char *key;
    malval_t (*fn)(mallist_t l);
  } funcs[] = {
    {"+", *add},
    {"-", *sub},
    {"/", *divide},
    {"*", *mult},
    {"pr-str", *prstr},
    {"str", *str},
    {"prn", *prn},
    {"println", *println},
    {"list", *list},
    {"list?", *is_list},
    {"empty?", *is_empty},
    {"count", *count},
    {"=", *equal},
    {"<", *inf},
    {"<=", *infeq},
    {">", *sup},
    {">=", *supeq},
    {"eval", *eval},
    {"read-string", *readstring},
    {"slurp", *slurp},
    {"atom", *atom},
    {"atom?", *is_atom},
    {"deref", *deref},
    {"reset!", *reset},
    {"swap!", *swap},
    {"cons", *cons},
    {"concat", *concat},
  };

  int i;
  int len = sizeof(funcs) / sizeof(funcs[0]);

  repl_env = malloc(sizeof(env_t));
  envitem_t *result = malloc(sizeof (envitem_t));
  envitem_t *cur = result;

  repl_env->outer = NULL;
  repl_env->items = result;

  for (i = 0; i <= len; i++) {
    if (i != 0) {
      cur->next = malloc(sizeof (envitem_t));
      cur = cur->next;
    }
    cur->key = funcs[i].key;
    cur->val = make_fn(funcs[i].fn);
  }
  repl_env->outer = NULL;
  repl_env->items = result;
}

malval_t get(char *key, env_t *env_ptr) {
  envitem_t *item = env_ptr->items;
  for (; item != NULL; item = item->next) {
    if (strcmp(item->key, key) == 0) {
      return item->val;
    }
  }
  if (env_ptr->outer != NULL) {
    return get(key, env_ptr->outer);
  }
  char *s = malloc(100);
  strcat(s, key);
  strcat(s, " not found");

  return make_error(s);
}

void set(env_t *env, char *key, malval_t val) {
  if (val.vtype == MAL_ERROR) {
    return;
  }
  envitem_t *item = malloc(sizeof (envitem_t));
  item->key = key;
  item->val = val;
  item->next = env->items;
  env->items = item;
}

env_t *create_env(env_t *outer) {
  env_t *env = malloc(sizeof (env_t));
  env->outer = outer;
  return env;
}

malval_t eval_ast(malval_t val, env_t *env) {
  if (val.vtype == MAL_SYMBOL && val.val.str[0] != ':') {
    return get(val.val.str, env);
  }

  if (val.vtype == MAL_LIST || val.vtype == MAL_VECTOR || val.vtype == MAL_HASHMAP) {
    int i;
    malval_t *items = malloc(val.val.list.len * sizeof(malval_t));
    for (i = 0; i < val.val.list.len; i++) {
      *(items + i) = EVAL(val.val.list.items[i], env);
    }
    return make_list_like(items, val.val.list.len, val.vtype);
  }
  return val;
}

int is_pair(malval_t a) {
  return (a.vtype == MAL_LIST || a.vtype == MAL_VECTOR) &&
    a.val.list.len != 0;
}

malval_t quasiquote(malval_t ast) {
  if (!is_pair(ast)) {
    malval_t *items = malloc(2 * sizeof(malval_t));
    items[0] = make_symbol("quote");
    items[1] = ast;
    return make_list(items, 2);
  }
  if (match_symbol(ast.val.list.items[0], "unquote")) {
    return ast.val.list.items[1];
  }

  if (is_pair(ast.val.list.items[0])
      && match_symbol(ast.val.list.items[0].val.list.items[0], "splice-unquote")) {
    malval_t *items = malloc(3 * sizeof(malval_t));
    items[0] = make_symbol("concat");
    items[1] = quasiquote(ast.val.list.items[0].val.list.items[1]);

    malval_t *items2 = malloc(100 * sizeof(malval_t));
    for (int i = 0; i < ast.val.list.len - 1; i++) {
      items2[i] = ast.val.list.items[i + 1];
    }

    items[2] = quasiquote(make_list(items2, ast.val.list.len - 1));
    return make_list(items, 3);
  }
  {
    malval_t *items = malloc(3 * sizeof(malval_t));
    items[0] = make_symbol("cons");
    items[1] = quasiquote(ast.val.list.items[0]);


    malval_t *items2 = malloc(100 * sizeof(malval_t));
    for (int i = 0; i < ast.val.list.len; i++) {
      items2[i] = ast.val.list.items[i + 1];
    }

    items[2] = make_list(items2, ast.val.list.len - 1);
    return make_list(items, 3);
  }

  return ast;
}

malval_t EVAL(malval_t val, env_t *env) {
  pr_str(val, 1);
  while (1) {
    if (val.vtype != MAL_LIST) {
      return eval_ast(val, env);
    }
    if (val.val.list.len == 0) {
      return val;
    }

    if (val.val.list.items[0].vtype == MAL_SYMBOL) {
      if (strcmp(val.val.list.items[0].val.str, "quote") == 0) {
        return val.val.list.items[1];
      }

      if (strcmp(val.val.list.items[0].val.str, "quasiquote") == 0) {
        val = quasiquote(val.val.list.items[1]);
        continue;
      }

      if (strcmp(val.val.list.items[0].val.str, "def!") == 0) {
        malval_t evaluated = EVAL(val.val.list.items[2], env);
        set(env,
            val.val.list.items[1].val.str,
            evaluated);
        return evaluated;
      }

      if (strcmp(val.val.list.items[0].val.str, "let*") == 0) {
        mallist_t bindings = val.val.list.items[1].val.list;
        env_t *new_env = create_env(env);
        int i;
        for (i = 0; i < bindings.len; i += 2) {
          set(new_env,
              bindings.items[i].val.str,
              EVAL(bindings.items[i + 1], new_env)
             );
        }
        val = val.val.list.items[2];
        env = new_env;
        continue;
      }

      if (strcmp(val.val.list.items[0].val.str, "fn*") == 0) {
        return make_custom_fn(
            &val.val.list.items[2],
            &val.val.list.items[1].val.list,
            env
            );
      }


      if (strcmp(val.val.list.items[0].val.str, "do") == 0) {
        int i;
        for (i = 1; i < val.val.list.len - 1; i++) {
          EVAL(val.val.list.items[i], env);
        }
        val = val.val.list.items[i];
        continue;
      }

      if (strcmp(val.val.list.items[0].val.str, "if") == 0) {
        malval_t cond = EVAL(val.val.list.items[1], env);

        if (cond.vtype == MAL_NIL || (cond.vtype == MAL_BOOL && strcmp(cond.val.str, "false") == 0)) {
          if (val.val.list.len >= 4) {
            return EVAL(val.val.list.items[3], env);
          }
          return make_nil();
        }
        return EVAL(val.val.list.items[2], env);
      }
    }

    malval_t new_val = eval_ast(val, env);
    mallist_t new_list;
    malval_t *items = (new_val.val.list.items + 1);
    if (new_val.val.list.items[0].vtype == MAL_FUNC) {
      malval_t (*fn)(mallist_t l) = new_val.val.list.items[0].val.fn;
      new_list.items = items;
      new_list.len = new_val.val.list.len -1;
      return fn(new_list);
    }
    if (new_val.val.list.items[0].vtype == MAL_CUSTOM_FUNC) {
      malfn_t custom_fn = new_val.val.list.items[0].val.custom_fn;
      env_t *new_env = create_env(custom_fn.env);
      int i = 0;
      for (i = 0; i < custom_fn.params->len; i++) {
        if (strcmp(custom_fn.params->items[i].val.str, "&") == 0) {
          set(new_env, custom_fn.params->items[i+1].val.str,
              make_list(new_val.val.list.items + i + 1, new_val.val.list.len - i - 1)
             );
          break;
        }
        set(new_env, custom_fn.params->items[i].val.str, new_val.val.list.items[i + 1]);
      }
      val = *custom_fn.ast;
      env = new_env;
      continue;
    }
    if (new_val.val.list.items[0].vtype == MAL_ERROR) {
      return new_val.val.list.items[0];
    }
    return make_error("NOFN");

  }
}

struct Reader tokenize(char s[]) {
  struct Reader reader;
  char** tokens = malloc(sizeof(char *) * 100000);
  int i = 0;
  while (*s != '\0') {
    char *token = malloc(1000);
    int j;
    while (isspace(*s) || *s == ',') {
      s++;
    }
    if (*s == '~' && *(s + 1) == '@') {
      token = "~@";
      s += 2;
      tokens[i++] = token;
      continue;
    }
    if (strchr("[]{}()'`~^@]", *s)) {
      *token = *s;
      *(token + 1) = '\0';
      tokens[i++] = token;
      s++;
      continue;
    }
    if (*s == '"') {
      int j = 1;
      *token = *s++;

      for (; *s && *s != '"'; s++) {
        token[j++] = *s;
        if (*s == '\\' && *(s +1) == '"') {
          token[j++] = *(s+1);
          s++;
        } else if (*s == '\\' && *(s +1) == '\\') {
          token[j++] = *(s+1);
          s++;
        }
      }
      if (*s == '"') {
        token[j++] = *s++;
      }
      token[j] = '\0';
      tokens[i++] = token;
      continue;
    }
    if (*s == ';') {
      while (*s && *s != '\n') {
        s++;
      }
      continue;
    }
    j = 0;
    if(!strchr("[]{}()'\"`,;", *s) && !isspace(*s)) {
      while (!strchr("[]{}()'\"`,;", *s) && !isspace(*s)) {
        token[j++] = *s++;
      }
      token[j] = '\0';
      tokens[i++] = token;
      continue;
    }
  }
  reader.tokens = tokens;
  reader.position = 0;
  return reader;
}

malval_t read_str(char s[]) {
  struct Reader reader = tokenize(s);
  return read_form(&reader);
}

char *peek(struct Reader *reader) {
  return reader->tokens[reader->position];
}

char *next(struct Reader *reader) {
  return reader->tokens[reader->position++];
}

malval_t read_list_like(struct Reader *reader, int vtype, char end) {
  malval_t res;
  malcontent_t content;
  malval_t *items = malloc(1000 * sizeof(malval_t));
  mallist_t list;
  int i = 0;
  char *token;
  next(reader);
  while ((token = peek(reader)) && token[0] != '\0' && token[0] != end) {
    items[i++] = read_form(reader);
  }
  if (token && token[0] == end) {
    next(reader);
  } else {
    return make_error("EOF");
  }

  list.len = i;
  list.items = items;
  res.vtype = vtype;
  content.list = list;
  res.val = content;
  return res;
}

malval_t read_atom(struct Reader *reader) {
  char* token = next(reader);
  if ((token[0] >= '0' && token[0] <= '9') || (token[0] == '-' && token[1] >= '0' && token[1] <= '9')) {
    return make_num(atoi(token));
  }
  if (token[0] == '"') {
    char *s = malloc(1000);
    int i = 0;
    token++;
    while (*token) {

      if (*token == '\\') {
        token++;
        switch(*token) {
          case '\\':
            s[i++] = '\\';
            break;
          case 'n':
            s[i++] = '\n';
            break;
          case '"':
            s[i++] = '"';
            break;
        }
        token++;
        continue;
      }
      if (*token == '\0') {
        break;
      }
      if (*token == '"') {
        break;
      }
      s[i++] = *token++;
    }
    if (*token != '"') {
      return make_error("EOF");
    }
    s[i] = '\0';
    return make_string(s);
  }

  if (strcmp(token, "nil") == 0) {
    return make_nil();
  }

  if (strcmp(token, "false") == 0 || strcmp(token, "true") == 0) {
    return make_bool(strcmp(token, "false") != 0);
  }

  return make_symbol(token);
}

char *pr_str(malval_t val, int print_readability) {
  char *s = malloc(1000);

  if (val.vtype == MAL_NUMBER) {
    sprintf(s, "%d", val.val.num);
    return s;
  }
  if (val.vtype == MAL_SYMBOL || val.vtype == MAL_ERROR || val.vtype == MAL_BOOL || val.vtype == MAL_NIL) {
    return val.val.str;
  }
  if (val.vtype == MAL_LIST) {
    int i;
    int j = 0;
    int k;
    *(s + j++) = '(';
    for (i = 0; i < val.val.list.len; i++) {
      char *s2 = pr_str(val.val.list.items[i], print_readability);
      if (i != 0) {
        *(s + j++) = ' ';
      }
      for (k = 0; s2[k]; k++) {
        *(s + j++) = s2[k];
      }

    }
    *(s + j++) = ')';
    *(s + j) = '\0';
    return s;
  }
  if (val.vtype == MAL_VECTOR) {
    int i;
    int j = 0;
    int k;
    *(s + j++) = '[';
    for (i = 0; i < val.val.list.len; i++) {
      char *s2 = pr_str(val.val.list.items[i], print_readability);
      if (i != 0) {
        *(s + j++) = ' ';
      }
      for (k = 0; s2[k]; k++) {
        *(s + j++) = s2[k];
      }

    }
    *(s + j++) = ']';
    *(s + j) = '\0';
    return s;
  }
  if (val.vtype == MAL_HASHMAP) {
    int i;
    int j = 0;
    int k;
    *(s + j++) = '{';
    for (i = 0; i < val.val.list.len; i++) {
      char *s2 = pr_str(val.val.list.items[i], print_readability);
      if (i != 0) {
        *(s + j++) = ' ';
      }
      for (k = 0; s2[k]; k++) {
        *(s + j++) = s2[k];
      }

    }
    *(s + j++) = '}';
    *(s + j) = '\0';
    return s;
  }
  if (val.vtype == MAL_STRING) {
    if (print_readability) {
      int i = 0;
      int j = 0;
      s[i++] = '"';
      while (val.val.str[j]) {
        if (val.val.str[j] == '\\') {
          s[i++] = '\\';
          s[i++] = '\\';
        } else if (val.val.str[j] == '\n') {
          s[i++] = '\\';
          s[i++] = 'n';
        } else if (val.val.str[j] == '"') {
          s[i++] = '\\';
          s[i++] = '"';
        } else {
          s[i++] = val.val.str[j];
        }
        j++;
      }

      s[i++] = '"';
      s[i++] = '\0';
      return s;
    } else {
      sprintf(s, "%s", val.val.str);
      return s;
    }
  }
  if (val.vtype == MAL_FUNC || val.vtype == MAL_CUSTOM_FUNC) {
    return "#function";
  }
  if (val.vtype == MAL_ATOM) {
    char *atom_content = pr_str(*val.val.atom, print_readability);
    sprintf(s, "(atom %s)", atom_content);
    return s;
  }
  return "WTF";
}


malval_t simple_reader_macro(struct Reader * reader, char *s) {
  next(reader);

  malval_t *items = malloc(1000 * sizeof(malval_t));
  items[0] = make_symbol(s);
  items[1] = read_form(reader);
  return make_list(items, 2);
}

malval_t read_form(struct Reader *reader) {
  char *token = peek(reader);
  if (!token) {
    return make_nil();
  }
  if (strcmp("(", token) == 0) {
    return read_list_like(reader, MAL_LIST, ')');
  }
  if (strcmp("[", token) == 0) {
    return read_list_like(reader, MAL_VECTOR, ']');
  }
  if (strcmp("{", token) == 0) {
    return read_list_like(reader, MAL_HASHMAP, '}');
  }
  if (strcmp("'", token) == 0) {
    return simple_reader_macro(reader, "quote");
  }

  if (strcmp("`", token) == 0) {
    return simple_reader_macro(reader, "quasiquote");
  }

  if (strcmp("~", token) == 0) {
    return simple_reader_macro(reader, "unquote");
  }

  if (strcmp("~@", token) == 0) {
    return simple_reader_macro(reader, "splice-unquote");
  }

  if (strcmp("@", token) == 0) {
    return simple_reader_macro(reader, "deref");
  }

  if (strcmp("^", token) == 0) {
    malval_t res = simple_reader_macro(reader, "with-meta");
    malval_t temp = read_form(reader);

    res.val.list.items[2] = res.val.list.items[1];
    res.val.list.items[1] = temp;
    res.val.list.len = 3;
    return res;
  }

  return read_atom(reader);
}

int getLine(char *s);

int main(int argc, char* argv[]) {
  char s[1000] = "";

  gen_repl_env();
  malval_t val = read_str("(def! not (fn* (a) (if a false true)))");
  EVAL(val, repl_env);

  val = read_str("(def! load-file (fn* (f) (eval (read-string (str \"(do \" (slurp f) \"\nnil)\")))))");
  EVAL(val, repl_env);

  if (argc > 1) {
    argc -= 2;
    argv++;
    char* filename = *argv++;
    malval_t* items = malloc(argc * sizeof(malval_t));
    for (int i = 0; i < argc; i++) {
      items[i] = make_string(*argv++);
    }
    set(repl_env, "*ARGV*", make_list(items, argc));

    strcat(s, "(load-file \"");
    strcat(s, filename);
    strcat(s, "\")");
    val = read_str(s);
    EVAL(val, repl_env);
    return 1;
  }


  set(repl_env, "*ARGV*", make_list(0, 0));
  printf("user> ");
  while ((getLine(s)) > 0) {
    struct Reader reader = tokenize(s);
    if (reader.tokens[0] && strcmp(reader.tokens[0], "") != 0) {
      malval_t val = read_form(&reader);
      malval_t evaluated = EVAL(val, repl_env);
      printf("%s\n", pr_str(evaluated, 1));
    }
    printf("user> ");
  }
  return 1;
}

int getLine(char *s) {
  int c;
  int len = 0;
  while ((c = getchar()) != '\n' && c != EOF) {
    len++;
    *s++ = c;
  }
  if (c == '\n') {
    len++;
    *s++ = c;
  }
  *s = '\0';
  return len;
}

char *getFile(char *filename) {
  FILE* fp = fopen(filename, "r");
  int c;
  int i = 0;
  if (fp == 0) {
    return 0;
  }
  fseek(fp, 0L, SEEK_END);
  int size = ftell(fp);
  char* s = malloc(size + 1);
  rewind(fp);

  while ((c = fgetc(fp)) && c != EOF) {
    *(s + i++) = c;
  }
  *(s + i) = '\0';
  fclose(fp);
  return s;
}
