#include <stdio.h>

char * READ(char *s) {
  return s;
}

char * EVAL(char *s) {
  return s;
}

char * PRINT(char *s) {
  return s;
}


int getLine(char *s);

int main() {
  printf("user> ");
  char s[1000];
  while (getLine(s) > 0) {
    printf("%s\n", PRINT(EVAL(READ(s))));
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
  if (c != '\n') {
    *s++ = c;
  }
  *s = '\0';
  return len;
}
