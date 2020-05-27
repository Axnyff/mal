#include <stdio.h>
#include <stdlib.h>
#include <ctype.h>
#include <string.h>

char * READ(char *s) {
  return s;
}

char * EVAL(char *s) {
  return s;
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

struct MalList {
  struct MalVal *items;
  int len;
};

struct MalVector {
  struct MalVal *items;
  int len;
};

struct MalHashmap {
  struct MalVal *items;
  int len;
};

struct MalNumber {
  int number;
};

struct MalSymbol {
  char* symbol;
};

struct MalError {
  char* error;
};

struct MalString {
  char* string;
};

union MalValContent {
  struct MalList list;
  struct MalVector vector;
  struct MalHashmap hashmap;
  struct MalNumber number;
  struct MalSymbol symbol;
  struct MalError error;
  struct MalString string;
};

struct MalVal {
  int vtype;
  union MalValContent val;
};

#define MAL_LIST 1
#define MAL_VECTOR 2
#define MAL_HASHMAP 3
#define MAL_NUMBER 4
#define MAL_SYMBOL 5
#define MAL_STRING 6
#define MAL_ERROR -1

struct MalVal read_form(struct Reader *reader);

struct MalVal read_list(struct Reader *reader) {
  struct MalVal res;
  union MalValContent content;
  struct MalVal *items = malloc(1000 * sizeof(struct MalVal));
  struct MalList list;
  struct MalError error;
  int i = 0;
  char *token;
  next(reader);
  while ((token = peek(reader)) && token[0] != '\0' && token[0] != ')') {
    items[i++] = read_form(reader);
  }
  if (token && token[0] == ')') {
    next(reader);
  } else {
    error.error = "EOF";
    content.error = error;
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
  struct MalVector vector;
  struct MalError error;
  int i = 0;
  char *token;
  next(reader);
  while ((token = peek(reader)) && token[0] != '\0' && token[0] != ']') {
    items[i++] = read_form(reader);
  }
  if (token && token[0] == ']') {
    next(reader);
  } else {
    error.error = "EOF";
    content.error = error;
    res.vtype = MAL_ERROR;
    res.val = content;
    return res;
  }

  vector.len = i;
  vector.items = items;
  res.vtype = MAL_VECTOR;
  content.vector = vector;
  res.val = content;
  return res;
}

struct MalVal read_hashmap(struct Reader *reader) {
  struct MalVal res;
  union MalValContent content;
  struct MalVal *items = malloc(1000 * sizeof(struct MalVal));
  struct MalHashmap hashmap;
  struct MalError error;
  int i = 0;
  char *token;
  next(reader);
  while ((token = peek(reader)) && token[0] != '\0' && token[0] != '}') {
    items[i++] = read_form(reader);
  }
  if (token && token[0] == '}' && i % 2 == 0) {
    next(reader);
  } else {
    error.error = "EOF";
    content.error = error;
    res.vtype = MAL_ERROR;
    res.val = content;
    return res;
  }

  hashmap.len = i;
  hashmap.items = items;
  res.vtype = MAL_HASHMAP;
  content.hashmap = hashmap;
  res.val = content;
  return res;
}


struct MalVal read_atom(struct Reader *reader) {
  char* token = next(reader);
  struct MalVal val;
  union MalValContent content;
  struct MalNumber number;
  struct MalSymbol symbol;
  struct MalString string;
  if (token[0] >= '0' && token[0] <= '9') {
    number.number = atoi(token);
    content.number = number;
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
      struct MalError error;
      error.error = "EOF";
      content.error = error;
      val.vtype = MAL_ERROR;
      val.val = content;
      return val;
    }
    s[i] = '\0';
    string.string = s;
    val.vtype = MAL_STRING;
    content.string = string;
    val.val = content;
    return val;
  }
  symbol.symbol = token;
  content.symbol = symbol;
  val.vtype = MAL_SYMBOL;
  val.val = content;
  return val;
}

char *pr_str(struct MalVal val, int print_readability) {
  char *s = malloc(100);
  if (val.vtype == MAL_NUMBER) {
    sprintf(s, "%d", val.val.number.number);
    return s;
  }
  if (val.vtype == MAL_SYMBOL) {
    return val.val.symbol.symbol;
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
    for (i = 0; i < val.val.vector.len; i++) {
      char *s2 = pr_str(val.val.vector.items[i], print_readability);
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
    for (i = 0; i < val.val.hashmap.len; i++) {
      char *s2 = pr_str(val.val.hashmap.items[i], print_readability);
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
    return val.val.error.error;
  }
  if (val.vtype == MAL_STRING) {
    if (print_readability) {
      int i = 0;
      int j = 0;
      s[i++] = '"';
      while (val.val.string.string[j]) {
        if (val.val.string.string[j] == '\\') {
          s[i++] = '\\';
          s[i++] = '\\';
        } else if (val.val.string.string[j] == '\n') {
          s[i++] = '\\';
          s[i++] = 'n';
        } else if (val.val.string.string[j] == '"') {
          s[i++] = '\\';
          s[i++] = '"';
        } else {
          s[i++] = val.val.string.string[j];
        }
        j++;
      }

      s[i++] = '"';
      s[i++] = '\0';
      return s;
    } else {
      sprintf(s, "\"%s\"", val.val.string.string);
      return s;
    }
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
    struct MalSymbol symbol;
    symbol.symbol = "quote";
    quote.vtype = MAL_SYMBOL;
    quoteVal.symbol = symbol;
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
    struct MalSymbol symbol;
    symbol.symbol = "quasiquote";
    quote.vtype = MAL_SYMBOL;
    quoteVal.symbol = symbol;
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
    struct MalSymbol symbol;
    symbol.symbol = "unquote";
    quote.vtype = MAL_SYMBOL;
    quoteVal.symbol = symbol;
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
    struct MalSymbol symbol;
    symbol.symbol = "splice-unquote";
    quote.vtype = MAL_SYMBOL;
    quoteVal.symbol = symbol;
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
    struct MalSymbol symbol;
    symbol.symbol = "deref";
    quote.vtype = MAL_SYMBOL;
    quoteVal.symbol = symbol;
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
    struct MalSymbol symbol;
    symbol.symbol = "with-meta";
    quote.vtype = MAL_SYMBOL;
    quoteVal.symbol = symbol;
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
  while ((len = getLine(s)) > 0) {
    struct Reader reader = read_str(s);
    if (reader.count != 0) {
      struct MalVal val = read_form(&reader);
      printf("%s\n", pr_str(val, 1));
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
