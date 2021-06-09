/*
 * @description: 加载编译wasm资源
 * @param {String|Object} urlOrModule: wasm资源{urlOrModule|WebAssembly.Instance}
 * @param {Null|Object} importObject: {env: {}}
 * @return {Promise<WebAssembly.Instance|WebAssembly.Module>} 传入importObject，返回WebAssembly.Instance，否则返回WebAssembly.Module
 */
const load = function (urlOrModule, importObject) {
  const isModule = urlOrModule instanceof WebAssembly.Module;
  if (!isModule && (typeof urlOrModule !== 'string' || !/\.wasm\??/.test(urlOrModule))) {
    throw new Error('no url');
  }
  if (isModule || importObject) {
    // instantiate
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
    ['proc_exit', 'fd_write'].forEach(key => {
      if (typeof importObject.wasi_snapshot_preview1[key] !== 'function') {
        importObject.wasi_snapshot_preview1[key] = () => {};
      }
    });
    if (isModule) {
      return WebAssembly.instantiate(urlOrModule, importObject);
    } else if (typeof WebAssembly.instantiateStreaming === 'function') {
      return WebAssembly.instantiateStreaming(fetch(urlOrModule), importObject);
    } else {
      return fetch(urlOrModule)
        .then(response => response.arrayBuffer())
        .then(bytes => WebAssembly.instantiate(bytes, importObject));
    }
  } else {
    // compile
    if (typeof WebAssembly.compileStreaming === 'function') {
      return WebAssembly.compileStreaming(fetch(urlOrModule));
    } else {
      return fetch(urlOrModule)
        .then(response => response.arrayBuffer())
        .then(bytes => WebAssembly.compile(bytes));
    }
  }
};

export default load;