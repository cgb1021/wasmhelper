# webassembly工具

## webassembly介绍
https://webassembly.org/

## 生成wasm
安装编译工具：https://emscripten.org/docs/getting_started/downloads.html
```
#默认
emcc hello.c --no-entry -s "EXPORTED_FUNCTIONS=['_malloc','_free']" -o ./hello.wasm

emcc memory.c -s IMPORTED_MEMORY -s INITIAL_MEMORY=6291456 -s ALLOW_MEMORY_GROWTH=1 -o ./memory.wasm

#定义内存
emcc hello.c --no-entry -s INITIAL_MEMORY=6291456 -s "EXPORTED_FUNCTIONS=['_malloc','_free']" -o ./hello.wasm

#使用WebAssembly.Memory定义内存
emcc hello.c --no-entry -s IMPORTED_MEMORY -s INITIAL_MEMORY=6291456 -s ALLOW_MEMORY_GROWTH=1 -s "EXPORTED_FUNCTIONS=['_malloc','_free']" -o ./hello.wasm
```

## 初始化
```
import create from 'wasmhelper';
const url = './hello.wasm';
const asm = create(url);
asm.ready(() => {
  console.log('ready');
})
asm.error((e) => {
  console.log(e.message);
})
```

## 使用
```
/* 使用ccall */
const helloStr = 'hello world';
const fromCStr = asm.ccall('hello', 'string', [helloStr]);
console.log(fromCStr);
const arr = [1000,2200,320,61,50128];
const sum = asm.ccall('reduce', 'number', [arr, arr.length]);
console.log(sum === arr.reduce((a, b) => a + b));
/* 直接调用c函数 */
const counter = asm.counter();
console.log(counter);
const ptr = asm.str2mem(helloStr);
const retPtr = asm.hello(ptr);
const result = asm.mem2str(retPtr);
asm.free(ptr, retPtr);
console.log(result);
```

## 注入web worker
```
// html定义web worker代码
<script id="worker" type="text/js-worker">
addEventListener('message', function (e) {
  if (e.data.type !== 'wasminit') {
    // 自动注入wasm对象
    const helloStr = 'hello worker:'
    const counter = wasm.counter();
    const ptr = wasm.str2mem(helloStr)
    const retPtr = wasm.hello(ptr)
    const result = wasm.mem2str(retPtr)
    wasm.free(ptr, retPtr)
    console.log('worker2 say hello', result) 
  }
}, false);
</script>

// index.js
import { worker as createWorker, load } from 'wasmhelper';
createWorker('./hello.wasm', '#worker').then(function (worker) {
  worker.addEventListener('message', (e) => {
    if (e.data.type === 'wasmready') {
      worker.postMessage('say hello');
    }
  })
});

```

## WASM对象方法
```
/*
 * @description: 调用c函数
 * @param {String} ident: c函数名称
 * @param {String} returnType: 返回值类型{string|number|boolean|null}
 * @param {Array} args: 参数数组
 * @return {Any}
 */
ccall (ident, returnType, args)
/*
 * @description: 从内存获取字符串
 * @param {Number} ptr: buffer offset
 * @param {Number} size: 字符串长度（可选）
 * @return {String}
 */
mem2str (ptr, size)
/*
 * @description: 把字符串放入内存
 * @param {String} str: 字符串
 * @return {Number} buffer offset
 */
str2mem (str)
/*
 * @description: 把数组放入内存
 * @param {Array} arr: 数组
 * @param {String} type: 类型（可选）
 * @return {Number} buffer offset
 */
arr2mem (arr, type = 'i32')
/*
 * @description: 从内存读取数组
 * @param {Number} ptr: buffer offset
 * @param {Number} length: 读取长度
 * @param {String} type: 类型（可选）
 * @return {Array}
 */
mem2arr (ptr, length, type = 'i32')
/*
 * @description: 传递js函数
 * @param {Function} func: js function
 * @param {String} sig: v(void) i(32-bit integer) j(64-bit integer) f(32-bit float), d(64-bit float)
 * @return {Number}
 */
fn2wasm (func, sig = 'v')
/*
 * @description: 分配内存
 * @param {Number} bytes: 字节长度
 * @return {Number}
 */
malloc (bytes)
/*
 * @description: 释放内存
 * @param {...Number} args: buffer offset
 */
free (...args)
/*
 * @description: 获取内存
 * @param {String} type: i32:HEAP32,i8:HEAP8,i16:HEAP16,u8:HEAPU8,u16:HEAPU16,u32:HEAPU32,float:HEAPF32,double:HEAPF64
 * @return {TypeArray}
 */
heap (type)
```