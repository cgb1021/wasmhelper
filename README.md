# webassembly工具

##生成wasm
\#默认
emcc hello.c --no-entry -s "EXPORTED_FUNCTIONS=['_malloc','_free']" -o ../../data/hello/hello.wasm

\#定义内存
emcc hello.c --no-entry -s INITIAL_MEMORY=6291456 -s "EXPORTED_FUNCTIONS=['_malloc','_free']" -o ../../data/hello/hello.wasm

\#使用WebAssembly.Memory定义内存
emcc hello.c --no-entry -s IMPORTED_MEMORY -s INITIAL_MEMORY=6291456 -s ALLOW_MEMORY_GROWTH=1 -s "EXPORTED_FUNCTIONS=['_malloc','_free']" -o ../../data/hello/hello.wasm


##初始化
import { wasm } from 'wasmhelper';
const url = './assets/data/hello/hello.wasm';
const asm = wasm(url, {
  ready: () => console.log('load wasm ready')
})


##使用
/* 使用ccall */
const helloStr = 'hello world';
const result = asm.ccall('hello', 'string', [helloStr])
const arr = [1000,2200,320,61,50128];
const sum = asm.ccall('reduce', 'number', [arr, arr.length]);
console.log(sum === arr.reduce((a, b) => a + b))
/* 直接调用c函数 */
const counter = asm.counter();
const ptr = asm.str2mem(helloStr)
const retPtr = asm.hello(ptr)
const result = asm.mem2str(retPtr)
asm.free(ptr)
asm.free(retPtr)
