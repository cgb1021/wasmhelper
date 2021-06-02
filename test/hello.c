#ifndef EM_PORT_API
#if defined(__EMSCRIPTEN__)
#include <emscripten.h>
#if defined(__cplusplus)
#define EM_PORT_API(rettype) extern "C" rettype EMSCRIPTEN_KEEPALIVE
#else
#define EM_PORT_API(rettype) rettype EMSCRIPTEN_KEEPALIVE
#endif
#else
#if defined(__cplusplus)
#define EM_PORT_API(rettype) extern "C" rettype
#else
#define EM_PORT_API(rettype) rettype
#endif
#endif
#endif

#include <string.h>
#include <stdlib.h>
#include <stdio.h>

int count = 0;
EM_PORT_API(int) size() {
  int len = 0;
  int res = count;
  do {
    res /= 10;
    len++;
  } while(res);

  return len;
}
EM_PORT_API(int) counter()
{
  return ++count;
}
EM_PORT_API(char *) hello(char * str)
{
  char numStr[16];
  char *newStr = (char *)malloc(strlen(str) + size() + 1);
  strcpy(newStr, str);
  sprintf(numStr, "%d", count);
  strcat(newStr, numStr);
  return newStr;
}
EM_PORT_API(int) reduce(int *list, int len)
{
  int sum = 0;
  for(int i = 0; i < len; i++) {
    sum += list[i];
  }
  return sum;
}

/* int main() {
  int num[3] = {1, 2, 3};
  int sum = add(num, 3);
  printf("%d\n", sum);
  return 0;
} */