"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

/*
 * @description: 生成WASM对象
 * @param {String|Object} urlOrModule: wasm资源{urlOrModule|WebAssembly.Instance}
 * @param {Null|Object} importObject: {env: {}}
 * @return {Object} 传入importObject，返回WebAssembly.Instance，否则返回WebAssembly.Module
 */
var load = function load(urlOrModule, importObject) {
  if (importObject) {
    // instantiate
    if (typeof importObject.env === 'undefined') {
      importObject.env = {};
    }

    ['emscripten_resize_heap', 'emscripten_memcpy_big', 'emscripten_notify_memory_growth', 'emscripten_asm_const_int'].forEach(function (key) {
      if (typeof importObject.env[key] !== 'function') {
        importObject.env[key] = function () {};
      }
    });

    if (typeof importObject.wasi_snapshot_preview1 === 'undefined') {
      importObject.wasi_snapshot_preview1 = {};
    }

    ['proc_exit'].forEach(function (key) {
      if (typeof importObject.wasi_snapshot_preview1[key] !== 'function') {
        importObject.wasi_snapshot_preview1[key] = function () {};
      }
    });

    if (urlOrModule instanceof WebAssembly.Module) {
      return WebAssembly.instantiate(urlOrModule, importObject);
    } else if (typeof WebAssembly.instantiateStreaming === 'function') {
      return WebAssembly.instantiateStreaming(fetch(urlOrModule), importObject);
    } else {
      return fetch(urlOrModule).then(function (response) {
        return response.arrayBuffer();
      }).then(function (bytes) {
        return WebAssembly.instantiate(bytes, importObject);
      });
    }
  } else {
    // compile
    if (typeof WebAssembly.compileStreaming === 'function') {
      return WebAssembly.compileStreaming(fetch(urlOrModule));
    } else {
      return fetch(urlOrModule).then(function (response) {
        return response.arrayBuffer();
      }).then(function (bytes) {
        return WebAssembly.compile(bytes);
      });
    }
  }
};

var _default = load;
exports["default"] = _default;