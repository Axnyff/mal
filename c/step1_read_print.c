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
};

char **tokenize(char *s) {
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
          token[j++] = *s;
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
      int j = 0;
      while (*s) {
        token[j++] = *s++;
      }
      tokens[i++] = token;
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
  return tokens;
}

struct Reader read_str(char *s) {
  char **tokens = tokenize(s);
  struct Reader reader = {
    tokens,
    0
  };
  return reader;
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
} list;

struct MalNumber {
  int number;
};

struct MalSymbol {
  char* symbol;
};

union MalValContent {
  struct MalList list;
  struct MalNumber number;
  struct MalSymbol symbol;
};

struct MalVal {
  int vtype;
  union MalValContent val;
};

#define MAL_LIST 1
#define MAL_NUMBER 2
#define MAL_SYMBOL 3

struct MalVal read_form(struct Reader *reader);

struct MalVal read_list(struct Reader *reader) {
  struct MalVal res;
  union MalValContent content;
  struct MalVal *items = malloc(1000 * sizeof(struct MalVal));
  struct MalList list;
  int i = 0;
  char *token;
  next(reader);
  while ((token = peek(reader)) && token[0] != ')') {
    items[i++] = read_form(reader);
  }
  if (token[0] == ')') {
    next(reader);
  }

  list.len = i;
  list.items = items;
  res.vtype = MAL_LIST;
  content.list = list;
  res.val = content;
  return res;
}

struct MalVal read_atom(struct Reader *reader) {
  char* token = next(reader);
  struct MalVal val;
  union MalValContent content;
  struct MalNumber number;
  struct MalSymbol symbol;
  if (token[0] >= '0' && token[0] <= '9') {
    number.number = atoi(token);
    content.number = number;
    val.vtype = MAL_NUMBER;
    val.val = content;
    return val;
  }
  symbol.symbol = token;
  content.symbol = symbol;
  val.vtype = MAL_SYMBOL;
  val.val = content;
  return val;
}

struct MalVal read_form(struct Reader *reader) {
  char *token = peek(reader);
  if (strcmp("(", token) == 0) {
    return read_list(reader);
  } else {
    return read_atom(reader);
  }
}


int getLine(char *s);

char *pr_str(struct MalVal val) {
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
      char *s2 = pr_str(val.val.list.items[i]);
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
}

int main() {
  printf("user> ");
  char s[1000];
  char **tokens;
  char *p;
  int i = 0;
  int len;
  while ((len = getLine(s)) > 0) {
    if (s[0] != '\n' || len > 1) {
      struct Reader reader = read_str(s);
      struct MalVal val = read_form(&reader);
      printf("%s\n", pr_str(val));
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
