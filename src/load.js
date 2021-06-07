/*
 * @description: 生成WASM对象
 * @param {String} instance: wasm资源{url|WebAssembly.Instance}
 * @param {Null|Object} importObject: {env: {}}
 * @return {Object} 传入importObject，返回WebAssembly.Instance，否则返回WebAssembly.Module
 */
const load = function (url, importObject) {
  if (importObject) {
    if (typeof importObject.env === 'undefined') {
      importObject.env = {};
    }
    ['emscripten_resize_heap',
      'emscripten_memcpy_big',
      'emscripten_notify_memory_growth',
      'emscripten_asm_const_int'
    ].forEach(key => {
      if (typeof importObject.env[key] !== 'function') {
        importObject.env[key] = () => {};
      }
    });
    if (typeof importObject.wasi_snapshot_preview1 === 'undefined') {
      importObject.wasi_snapshot_preview1 = {};
    }
    ['proc_exit'].forEach(key => {
      if (typeof importObject.wasi_snapshot_preview1[key] !== 'function') {
        importObject.wasi_snapshot_preview1[key] = () => {};
      }
    });
    if (typeof WebAssembly.instantiateStreaming === 'function') {
      return WebAssembly.instantiateStreaming(fetch(url), importObject);
    } else {
      return fetch(url)
        .then(response => response.arrayBuffer())
        .then(bytes => WebAssembly.instantiate(bytes, importObject));
    }
  } else {
    if (typeof WebAssembly.compileStreaming === 'function') {
      return WebAssembly.compileStreaming(fetch(url));
    } else {
      return fetch(url)
        .then(response => response.arrayBuffer())
        .then(bytes => WebAssembly.compile(bytes));
    }
  }
};

export default load;