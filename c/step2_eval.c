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


struct MalList {
  struct MalVal *items;
  int len;
};


union MalValContent {
  struct MalList list;
  int num;
  char* str;
  struct MalVal (*fn)(struct MalList l);
};

struct MalVal {
  int vtype;
  union MalValContent val;
};


struct MalVal add(struct MalList l) {
  printf("goo");
  return l.items[0];
  int count = 0;
  int i;
  struct MalVal res;
  union MalValContent val;
  for (i = 0; i < l.len; i++) {
    count += l.items[i].val.num;
  }
  val.num = count;
  res.val = val;
  res.vtype = MAL_NUMBER;

  return res;
}

struct MalVal sub(struct MalList l) {
  struct MalVal res;
  union MalValContent val;
  int count = l.items[0].val.num - l.items[1].val.num;
  val.num = count;
  res.val = val;
  res.vtype = MAL_NUMBER;

  return res;
}

typedef struct EnvItem {
  char *key;
  struct MalVal val;
  struct EnvItem *next;
} env_t;


env_t *create_env() {
  struct MalVal (*fns[])(struct MalList l) = {*add, *sub, *sub};
  char *s[] = {"+", "-", "/"};
  int i;
  int len = sizeof(fns) / sizeof(fns[0]);

  env_t *result = malloc(sizeof (env_t) * len);
  env_t *cur = result;

  for (i = 0; i < len; i++) {
    if (i != 0) {
      cur->next = malloc(sizeof (env_t));
      cur = cur->next;
    }
    union MalValContent content;
    struct MalVal val;
    val.vtype = MAL_FUNC;
    content.fn = fns[i];
    val.val = content;

    cur->key= s[i];
    cur->val = val;
    cur->next = NULL;
  };
  return result;
}

struct MalVal get(char *key, env_t *env) {
  struct MalVal val;
  union MalValContent content;
  for (; env->next != NULL; env= env->next) {
    if (strcmp(env->key, key) == 0) {
      return env->val;
    }
  }
  val.vtype = MAL_ERROR;
  content.str = "NOT FOUND";
  val.val = content;
  return val;

}

struct MalVal EVAL(struct MalVal val, env_t *env);
struct MalVal eval_ast(struct MalVal val, env_t *env) {
  if (val.vtype == MAL_SYMBOL) {
    return get(val.val.str, env);
  }

  if (val.vtype == MAL_LIST) {
    return val;
    struct MalVal res;
    union MalValContent content;
    struct MalList list;
    int i;
    struct MalVal *items = malloc(val.val.list.len * sizeof(struct MalVal));
    for (i = 0; i < val.val.list.len; i++) {
      *(items + i) = EVAL(val.val.list.items[i], env);
    }

    list.items = items;
    list.len = val.val.list.len;
    content.list = list;
    res.val = content;
    return res;
  }
  return val;
}

struct MalVal EVAL(struct MalVal val, env_t *env) {
  if (val.vtype != MAL_LIST) {
    return eval_ast(val, env);
  }
  if (val.val.list.len == 0) {
    return val;
  }
  struct MalVal newVal = eval_ast(val, env);
  struct MalList newList;
  struct MalVal *items = (newVal.val.list.items + 1);
  struct MalVal (*fn)(struct MalList l) = newVal.val.list.items[0].val.fn;
  /* return newVal.val.list.items[0]; */
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
  int count;
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
  reader.count = i;
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

struct MalVal read_form(struct Reader *reader);

struct MalVal read_list(struct Reader *reader) {
  struct MalVal res;
  union MalValContent content;
  struct MalVal *items = malloc(1000 * sizeof(struct MalVal));
  struct MalList list;
  int i = 0;
  char *token;
  next(reader);
  while ((token = peek(reader)) && token[0] != '\0' && token[0] != ')') {
    items[i++] = read_form(reader);
  }
  if (token && token[0] == ')') {
    next(reader);
  } else {
    content.str = "EOF";
    res.vtype = MAL_ERROR;
    res.val = content;
    return res;
  }

  list.len = i;
  list.items = items;
  res.vtype = MAL_LIST;
  content.list = list;
  res.val = content;
  return res;
}

struct MalVal read_vector(struct Reader *reader) {
  struct MalVal res;
  union MalValContent content;
  struct MalVal *items = malloc(1000 * sizeof(struct MalVal));
  struct MalList list;
  int i = 0;
  char *token;
  next(reader);
  while ((token = peek(reader)) && token[0] != '\0' && token[0] != ']') {
    items[i++] = read_form(reader);
  }
  if (token && token[0] == ']') {
    next(reader);
  } else {
    content.str = "EOF";
    res.vtype = MAL_ERROR;
    res.val = content;
    return res;
  }

  list.len = i;
  list.items = items;
  res.vtype = MAL_VECTOR;
  content.list = list;
  res.val = content;
  return res;
}

struct MalVal read_hashmap(struct Reader *reader) {
  struct MalVal res;
  union MalValContent content;
  struct MalVal *items = malloc(1000 * sizeof(struct MalVal));
  struct MalList list;
  int i = 0;
  char *token;
  next(reader);
  while ((token = peek(reader)) && token[0] != '\0' && token[0] != '}') {
    items[i++] = read_form(reader);
  }
  if (token && token[0] == '}' && i % 2 == 0) {
    next(reader);
  } else {
    content.str = "EOF";
    res.vtype = MAL_ERROR;
    res.val = content;
    return res;
  }

  list.len = i;
  list.items = items;
  res.vtype = MAL_HASHMAP;
  content.list = list;
  res.val = content;
  return res;
}


struct MalVal read_atom(struct Reader *reader) {
  char* token = next(reader);
  struct MalVal val;
  union MalValContent content;
  if (token[0] >= '0' && token[0] <= '9') {
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
      content.str = "EOF";
      val.vtype = MAL_ERROR;
      val.val = content;
      return val;
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

char *pr_str(struct MalVal val, int print_readability) {
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

struct MalVal read_form(struct Reader *reader) {
  char *token = peek(reader);
  if (strcmp("(", token) == 0) {
    return read_list(reader);
  }
  if (strcmp("[", token) == 0) {
    return read_vector(reader);
  }
  if (strcmp("{", token) == 0) {
    return read_hashmap(reader);
  }
  if (strcmp("'", token) == 0) {
    next(reader);
    struct MalVal res;
    union MalValContent val;
    struct MalList list;

    struct MalVal *items = malloc(1000 * sizeof(struct MalVal));
    struct MalVal quote;
    union MalValContent quoteVal;
    quote.vtype = MAL_SYMBOL;
    quoteVal.str = "quote";
    quote.val = quoteVal;

    items[0] = quote;
    items[1] = read_form(reader);
    list.items = items;

    list.len = 2;
    val.list = list;
    res.vtype = MAL_LIST;
    res.val = val;
    return res;
  }

  if (strcmp("`", token) == 0) {
    next(reader);
    struct MalVal res;
    union MalValContent val;
    struct MalList list;

    struct MalVal *items = malloc(1000 * sizeof(struct MalVal));
    struct MalVal quote;
    union MalValContent quoteVal;
    quote.vtype = MAL_SYMBOL;
    quoteVal.str = "quasiquote";
    quote.val = quoteVal;

    items[0] = quote;
    items[1] = read_form(reader);
    list.items = items;

    list.len = 2;
    val.list = list;
    res.vtype = MAL_LIST;
    res.val = val;
    return res;
  }

  if (strcmp("~", token) == 0) {
    next(reader);
    struct MalVal res;
    union MalValContent val;
    struct MalList list;

    struct MalVal *items = malloc(1000 * sizeof(struct MalVal));
    struct MalVal quote;
    union MalValContent quoteVal;
    quote.vtype = MAL_SYMBOL;
    quoteVal.str = "unquote";
    quote.val = quoteVal;

    items[0] = quote;
    items[1] = read_form(reader);
    list.items = items;

    list.len = 2;
    val.list = list;
    res.vtype = MAL_LIST;
    res.val = val;
    return res;
  }

  if (strcmp("~@", token) == 0) {
    next(reader);
    struct MalVal res;
    union MalValContent val;
    struct MalList list;

    struct MalVal *items = malloc(1000 * sizeof(struct MalVal));
    struct MalVal quote;
    union MalValContent quoteVal;
    quote.vtype = MAL_SYMBOL;
    quoteVal.str = "splice-unquote";
    quote.val = quoteVal;

    items[0] = quote;
    items[1] = read_form(reader);
    list.items = items;

    list.len = 2;
    val.list = list;
    res.vtype = MAL_LIST;
    res.val = val;
    return res;
  }
  if (strcmp("@", token) == 0) {
    next(reader);
    struct MalVal res;
    union MalValContent val;
    struct MalList list;

    struct MalVal *items = malloc(1000 * sizeof(struct MalVal));
    struct MalVal quote;
    union MalValContent quoteVal;
    quote.vtype = MAL_SYMBOL;
    quoteVal.str = "deref";
    quote.val = quoteVal;

    items[0] = quote;
    items[1] = read_form(reader);
    list.items = items;

    list.len = 2;
    val.list = list;
    res.vtype = MAL_LIST;
    res.val = val;
    return res;
  }

  if (strcmp("^", token) == 0) {
    next(reader);
    struct MalVal res;
    union MalValContent val;
    struct MalList list;

    struct MalVal *items = malloc(1000 * sizeof(struct MalVal));
    struct MalVal quote;
    union MalValContent quoteVal;
    quote.vtype = MAL_SYMBOL;
    quoteVal.str = "with-meta";
    quote.val = quoteVal;

    items[0] = quote;
    items[2] = read_form(reader);
    items[1] = read_form(reader);
    list.items = items;

    list.len = 3;
    val.list = list;
    res.vtype = MAL_LIST;
    res.val = val;
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
      struct MalVal val = read_form(&reader);
      struct MalVal evaluated = EVAL(val, repl_env);
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
