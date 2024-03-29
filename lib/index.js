"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;
Object.defineProperty(exports, "WASM", {
  enumerable: true,
  get: function get() {
    return _wasm["default"];
  }
});
Object.defineProperty(exports, "load", {
  enumerable: true,
  get: function get() {
    return _load["default"];
  }
});
Object.defineProperty(exports, "utils", {
  enumerable: true,
  get: function get() {
    return _utils["default"];
  }
});
Object.defineProperty(exports, "worker", {
  enumerable: true,
  get: function get() {
    return _worker["default"];
  }
});

var _wasm = _interopRequireDefault(require("./wasm"));

var _load = _interopRequireDefault(require("./load"));

var _utils = _interopRequireDefault(require("./utils"));

var _worker = _interopRequireDefault(require("./worker"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

/*
* @description: 生成WASM对象
* @param {String|Object} instance: wasm资源{url|WebAssembly.Instance}
* @param {Null|Object} importObject: {env: {}}
* @return {Proxy}
*/
function _default(instance, importObject) {
  var asm = new _wasm["default"](instance, importObject);
  return new Proxy(asm, {
    /* gulp_split */
    get: function get(obj, k) {
      if (k in obj) {
        return obj[k];
      }

      if (k in obj.exports) {
        return obj.exports[k];
      }
    },
    set: function set(obj, k, val) {
      var exclude = ['exports', 'memory', 'table', 'HEAP8', 'HEAP16', 'HEAP32', 'HEAPU8', 'HEAPU16', 'HEAPU32', 'HEAPF32', 'HEAPF64', 'bytesLength'];

      if (exclude.includes(k)) {
        return false;
      }

      obj[k] = val;
      return true;
    }
    /* gulp_split */

  });
}