addEventListener('message', function (e) {
  if (e.data.type !== 'wasminit') {
    // 自动注入wasm对象
    const helloStr = 'hello worker:';
    const counter = wasm.counter();
    const ptr = wasm.str2mem(helloStr);
    const retPtr = wasm.hello(ptr);
    const result = wasm.mem2str(retPtr);
    wasm.free(ptr, retPtr);
    console.log('worker2 say hello', result);
  }
}, false);