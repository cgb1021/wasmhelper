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
#include <math.h>

int count = 0;
int count2 = 0;

EM_PORT_API(int) size() {
  int len = 0;
  int res = count;
  do {
    res /= 10;
    len++;
  } while(res);

  return len;
}
EM_PORT_API(int) add(int n1, int n2)
{
  return n1 + n2;
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
EM_PORT_API(int *) getPrimes(int n1, int n2) {
  count2 = 0;
  int *list = NULL;
  int nBytes = sizeof(int);
  int x = n1 > n2 ? n2 : n1;
  int end = n1 > n2 ? n1 : n2;
  for (; x <= end; x++) {
    int mid = sqrt((double)x);
    int y = 2;
    int is = 1;
    for (; y <= mid; y++) {
      if (x % y == 0) {
        is = 0;
        break;
      }
    }
    if (is) {
      if (list == NULL) {
        list = (int *)malloc(nBytes);
      } else {
        list = (int *)realloc(list, nBytes);
      }
      if (list == NULL) {
        return list;
      }
      list[count2++] = x;
    }
  }
  return list;
}
EM_PORT_API(int) getSize()
{
  return count2;
}

EM_PORT_API(int) returnTrue()
{
  return 1;
}
EM_PORT_API(int) returnFalse()
{
  return 0;
}
EM_PORT_API(void) callJS() {
}

int main(void) {
  return 0;
}