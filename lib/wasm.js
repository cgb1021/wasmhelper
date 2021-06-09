"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _load = _interopRequireDefault(require("./load"));

var _utils = _interopRequireDefault(require("./utils"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

/* split_flag */
function WASM(instance, importObject) {
  var _this = this;

  this.HEAP8 = null;
  this.HEAP16 = null;
  this.HEAP32 = null;
  this.HEAPU8 = null;
  this.HEAPU16 = null;
  this.HEAPU32 = null;
  this.HEAPF32 = null;
  this.HEAPF64 = null;
  this.exports = null;
  this.memory = null;
  this.module = null;
  this.stack = 0;
  var callbacks = [];
  var errCallbacks = [];
  var isInit = false;
  var error = null;

  var init = function init(exports) {
    isInit = true;

    if (_typeof(exports.memory) === 'object') {
      _this.memory = exports.memory;
    } else if (_typeof(importObject.env.memory) === 'object') {
      _this.memory = importObject.env.memory;
    } else {
      throw new Error('no memory buffer');
    }

    var buf = _this.memory.buffer;
    _this.HEAP8 = new Int8Array(buf);
    _this.HEAP16 = new Int16Array(buf);
    _this.HEAP32 = new Int32Array(buf);
    _this.HEAPU8 = new Uint8Array(buf);
    _this.HEAPU16 = new Uint16Array(buf);
    _this.HEAPU32 = new Uint32Array(buf);
    _this.HEAPF32 = new Float32Array(buf);
    _this.HEAPF64 = new Float64Array(buf);
    _this.exports = exports;
    callbacks.forEach(function (fn) {
      return fn.call(_this, false);
    });
    callbacks.length = 0;
  };

  var emitError = function emitError(e) {
    error = e;
    errCallbacks.forEach(function (fn) {
      return fn.call(_this, e);
    });
    errCallbacks.length = 0;

    _utils["default"].warnOnce(e.message);
  };

  this.ready = function (fn) {
    if (typeof fn !== 'function') return;
    if (isInit) fn.call(_this, true);else callbacks.push(fn);
  };

  this.error = function (fn) {
    if (typeof fn !== 'function') return;
    if (error) fn.call(_this, error);else errCallbacks.push(fn);
  };

  try {
    if (instance instanceof WebAssembly.Instance) {
      init(instance.exports);
    } else {
      (0, _load["default"])(instance, importObject).then(function (res) {
        _this.module = res.module;
        init(res.instance.exports);
      })["catch"](function (e) {
        emitError(e);
      });
    }
  } catch (e) {
    emitError(e);
  }
}
/*
 * @description: 调用c函数
 * @param {String} ident: c函数名称
 * @param {String} returnType: 返回值类型{string|number|boolean|null}
 * @param {Array} args: 参数数组
 * @return {Any}
 */


WASM.prototype.ccall = function (ident, returnType, args) {
  var exports = this.exports;
  var self = this;
  var toC = {
    'string': function string(str) {
      var ret = 0;

      if (str !== null && str !== undefined && str !== 0) {
        var len = (str.length << 2) + 1;
        ret = exports.stackAlloc(len);

        _utils["default"].stringToUTF8(str, self.HEAPU8, ret, len);
      }

      return ret;
    },
    'array': function array(arr) {
      var bytes = self.HEAP32.BYTES_PER_ELEMENT;
      var ret = exports.stackAlloc(arr.length * bytes);
      self.HEAP32.set(arr, ret / bytes);
      return ret;
    }
  };

  function convertReturnValue(ret) {
    if (returnType === 'string') return _utils["default"].UTF8ToString(self.HEAPU8, ret);
    if (returnType === 'boolean') return Boolean(ret);
    return ret;
  }

  var cArgs = [];
  var stack = 0;

  if (args) {
    for (var i = 0; i < args.length; i++) {
      var type = Array.isArray(args[i]) ? 'array' : _typeof(args[i]);
      var converter = toC[type];

      if (converter) {
        if (stack === 0) stack = exports.stackSave();
        cArgs[i] = converter(args[i]);
      } else {
        cArgs[i] = args[i];
      }
    }
  }

  var ret = exports[ident].apply(null, cArgs);
  ret = convertReturnValue(ret);
  if (stack !== 0) exports.stackRestore(stack);
  return ret;
};
/*
 * @description: 从内存获取字符串
 * @param {Number} ptr: buffer offset
 * @param {Number} size: 字符串长度（可选）
 * @return {String}
 */


WASM.prototype.mem2str = function (ptr, size) {
  return _utils["default"].UTF8ToString(this.HEAPU8, ptr, size);
};
/*
 * @description: 把字符串放入内存
 * @param {String} str: 字符串
 * @return {Number} buffer offset
 */


WASM.prototype.str2mem = function (str) {
  var size = _utils["default"].lengthBytesUTF8(str);

  var ptr = this.malloc(size + 1);

  _utils["default"].stringToUTF8(str, this.HEAPU8, ptr, size);

  return ptr;
};
/*
 * @description: 把数组放入内存
 * @param {Array} arr: 数组
 * @param {String} type: 类型（可选）
 * @return {Number} buffer offset
 */


WASM.prototype.arr2mem = function (arr) {
  var type = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'i32';
  var heap = this.heap(type);
  var bytes = heap.BYTES_PER_ELEMENT;
  var ptr = this.malloc(arr.length * bytes);
  heap.set(arr, ptr / bytes);
  return ptr;
};
/*
 * @description: 从内存读取数组
 * @param {Number} ptr: buffer offset
 * @param {Number} length: 读取长度
 * @param {String} type: 类型（可选）
 * @return {Array}
 */


WASM.prototype.mem2arr = function (ptr, length) {
  var type = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 'i32';
  var heap = this.heap(type);
  var pos = ptr / heap.BYTES_PER_ELEMENT;
  return Array.from(heap.subarray(pos, pos + length));
};
/*
 * @description: 分配内存
 * @param {Number} bytes: 字节长度
 * @return {Number}
 */


WASM.prototype.malloc = function (bytes) {
  var exports = this.exports;
  var ptr = 0;

  if (typeof exports.malloc === 'function') {
    ptr = exports.malloc(bytes);
  } else {
    var stack = exports.stackSave();

    if (bytes > stack) {
      var msg = 'stack overflow, ' + bytes + ' larger than ' + stack;

      _utils["default"].warnOnce(msg);

      throw new Error(msg);
    }

    if (this.stack === 0) {
      this.stack = stack;
    }

    ptr = exports.stackAlloc(bytes);
  }

  return ptr;
};
/*
 * @description: 释放内存
 * @param {...Number} args: buffer offset
 */


WASM.prototype.free = function () {
  var exports = this.exports;

  if (typeof exports.free === 'function') {
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    args.forEach(function (ptr) {
      exports.free(ptr);
    });
  }

  if (this.stack) {
    exports.stackRestore(this.stack);
    this.stack = 0;
  }
};
/*
 * @description: 获取剩余内存数量
 * @return {Number}
 */


WASM.prototype.getFree = function () {
  return this.exports.emscripten_stack_get_free();
};
/*
 * @description: 获取内存
 * @param {String} type: i32:HEAP32,i8:HEAP8,i16:HEAP16,u8:HEAPU8,u16:HEAPU16,u32:HEAPU32,float:HEAPF32,double:HEAPF64
 * @return {TypeArray}
 */


WASM.prototype.heap = function () {
  var type = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'i32';

  switch (type) {
    case 'i8':
      return this.HEAP8;

    case 'i16':
      return this.HEAP16;

    case 'u8':
      return this.HEAPU8;

    case 'u16':
      return this.HEAPU16;

    case 'u32':
      return this.HEAPU32;

    case 'float':
      return this.HEAPF32;

    case 'double':
      return this.HEAPF64;

    default:
      return this.HEAP32;
  }
};
/* split_flag */

/*
 * 慎用
 */


WASM.prototype.grow = function (num) {
  return this.memory.grow(num);
};

var _default = WASM;
exports["default"] = _default;