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
#define MAL_FUNC 7
#define MAL_ERROR -1


//TODO : make_fn
//TODO : make_num

typedef struct MalList {
  struct MalVal *items;
  int len;
} mallist_t;

typedef union MalValContent {
  mallist_t list;
  int num;
  char* str;
  struct MalVal (*fn)(mallist_t l);
} malcontent_t;

typedef struct MalVal {
  int vtype;
  malcontent_t val;
} malval_t;

malval_t make_symbol(char *s) {
  malval_t res;
  malcontent_t content;
  res.vtype = MAL_SYMBOL;
  content.str = s;
  res.val = content;
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

malval_t add(mallist_t l) {
  int count = 0;
  int i;
  malval_t res;
  malcontent_t val;
  for (i = 0; i < l.len; i++) {
    count += l.items[i].val.num;
  }
  val.num = count;
  res.val = val;
  res.vtype = MAL_NUMBER;

  return res;
}

malval_t sub(mallist_t l) {
  malval_t res;
  malcontent_t val;
  int count = l.items[0].val.num - l.items[1].val.num;
  val.num = count;
  res.val = val;
  res.vtype = MAL_NUMBER;

  return res;
}

malval_t divide(mallist_t l) {
  malval_t res;
  malcontent_t val;
  int count = l.items[0].val.num / l.items[1].val.num;
  val.num = count;
  res.val = val;
  res.vtype = MAL_NUMBER;

  return res;
}

malval_t mult(mallist_t l) {
  malval_t res;
  malcontent_t val;
  int count = l.items[0].val.num * l.items[1].val.num;
  val.num = count;
  res.val = val;
  res.vtype = MAL_NUMBER;

  return res;
}

typedef struct EnvItem {
  char *key;
  malval_t val;
  struct EnvItem *next;
} env_t;

env_t *create_env() {
  struct Funcs {
    char *key;
    malval_t (*fn)(mallist_t l);
  } funcs[] = {
    "+", *add,
    "-", *sub,
    "/", *divide,
    "*", *mult,
  };

  int i;
  int len = sizeof(funcs) / sizeof(funcs[0]);

  env_t *result = malloc(sizeof (env_t) * len);
  env_t *cur = result;

  for (i = 0; i <= len; i++) {
    if (i != 0) {
      cur->next = malloc(sizeof (env_t));
      cur = cur->next;
    }
    malcontent_t content;
    malval_t val;
    val.vtype = MAL_FUNC;
    content.fn = funcs[i].fn;
    val.val = content;

    cur->key= funcs[i].key;
    cur->val = val;
  };

  return result;
}

malval_t get(char *key, env_t *env) {
  malval_t val;
  malcontent_t content;
  for (; env->next != NULL; env= env->next) {
    if (strcmp(env->key, key) == 0) {
      return env->val;
    }
  }
  return make_error("NOT FOUND");
}

malval_t EVAL(malval_t val, env_t *env);
malval_t eval_ast(malval_t val, env_t *env) {
  if (val.vtype == MAL_SYMBOL && val.val.str[0] != ':') {
    return get(val.val.str, env);
  }

  if (val.vtype == MAL_LIST || val.vtype == MAL_VECTOR || val.vtype == MAL_HASHMAP) {
    malval_t res;
    malcontent_t content;
    mallist_t list;
    int i;
    malval_t *items = malloc(val.val.list.len * sizeof(malval_t));
    for (i = 0; i < val.val.list.len; i++) {
      *(items + i) = EVAL(val.val.list.items[i], env);
    }

    list.items = items;
    list.len = val.val.list.len;
    content.list = list;
    res.val = content;
    res.vtype = val.vtype;
    return res;
  }
  return val;
}

malval_t EVAL(malval_t val, env_t *env) {
  if (val.vtype != MAL_LIST) {
    return eval_ast(val, env);
  }
  if (val.val.list.len == 0) {
    return val;
  }

  malval_t newVal = eval_ast(val, env);
  mallist_t newList;
  malval_t *items = (newVal.val.list.items + 1);
  malval_t (*fn)(mallist_t l) = newVal.val.list.items[0].val.fn;
  if (newVal.val.list.items[0].vtype != MAL_FUNC) {
    if (newVal.val.list.items[0].vtype == MAL_ERROR) {
      return newVal.val.list.items[0];
    }
    return make_error("NOFN");
  }
  newList.items = items;
  newList.len = newVal.val.list.len -1;

  return fn(newList);
}


char * PRINT(char *s) {
  return s;
}

struct Reader {
  char** tokens;
  int position;
};

struct Reader tokenize(char *s) {
  struct Reader reader;
  char** tokens = malloc(sizeof(char *) * 1000);
  int i = 0;
  while (*s != '\0') {
    char *token = malloc(100);
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
      while (*s) {
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

struct Reader read_str(char *s) {
  return tokenize(s);
}

char *peek(struct Reader *reader) {
  return reader->tokens[reader->position];
}

char *next(struct Reader *reader) {
  return reader->tokens[reader->position++];
}

malval_t read_form(struct Reader *reader);

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
  malval_t val;
  malcontent_t content;
  if ((token[0] >= '0' && token[0] <= '9') || (token[0] == '-' && token[1] >= '0' && token[1] <= '9')) {
    content.num = atoi(token);
    val.vtype = MAL_NUMBER;
    val.val = content;
    return val;
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
    val.vtype = MAL_STRING;
    content.str = s;
    val.val = content;
    return val;
  }
  content.str = token;
  val.vtype = MAL_SYMBOL;
  val.val = content;
  return val;
}

char *pr_str(malval_t val, int print_readability) {
  char *s = malloc(100);
  if (val.vtype == MAL_NUMBER) {
    sprintf(s, "%d", val.val.num);
    return s;
  }
  if (val.vtype == MAL_SYMBOL) {
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
  if (val.vtype == MAL_ERROR) {
    return val.val.str;
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
      sprintf(s, "\"%s\"", val.val.str);
      return s;
    }
  }
  if (val.vtype == MAL_FUNC) {
    return "#function";
  }
  return "WTF";
}

malval_t make_list(malval_t *items, int len) {
  malval_t res;
  malcontent_t content;
  mallist_t list;
  list.items =  items;
  list.len = len;
  res.vtype = MAL_LIST;
  content.list = list;
  res.val = content;
  return res;
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

int main() {
  printf("user> ");
  char s[1000];
  int len;
  env_t *repl_env = create_env();
  while ((len = getLine(s)) > 0) {
    struct Reader reader = read_str(s);
    if (strcmp(reader.tokens[0], "") != 0) {
      malval_t val = read_form(&reader);
      malval_t evaluated = EVAL(val, repl_env);
      printf("%s\n", pr_str(evaluated, 1));
    }
    printf("user> ");
  }
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
