"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;

var _load = _interopRequireDefault(require("./load"));

var _utils = _interopRequireDefault(require("./utils"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function WASM(instance, importObject) {
  var _this = this;

  this.buffer = null;
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

  var init = function init(exports) {
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
  };

  if (typeof instance === 'string') {
    var callback = typeof importObject.ready === 'function' ? importObject.ready : null;
    delete importObject.ready;
    (0, _load["default"])(instance, importObject).then(function (res) {
      init(res.instance.exports);

      if (callback) {
        callback.call(_this, instance);
        callback = null;
      }
    });
  } else {
    init(instance.exports);
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


WASM.prototype.strRead = function (ptr, size) {
  return _utils["default"].UTF8ToString(this.HEAPU8, ptr, size);
};
/*
 * @description: 把字符串放入内存
 * @param {String} str: 字符串
 * @return {Number} buffer offset
 */


WASM.prototype.strWrite = function (str) {
  var exports = this.exports;

  var size = _utils["default"].lengthBytesUTF8(str);

  var ptr = exports.malloc(size + 1);

  _utils["default"].stringToUTF8(str, this.HEAPU8, ptr, size);

  return ptr;
};
/*
 * 慎用
 */


WASM.prototype.grow = function (num) {
  return this.memory.grow(num);
};
/*
 * @description: 生成WASM对象
 * @param {String|Object} instance: wasm资源{url|WebAssembly.Instance}
 * @param {Null|Object} importObject: {env: {}}
 * @return {Proxy}
 */


function _default(instance) {
  var importObject = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var asm = new WASM(instance, importObject);
  return new Proxy(asm, {
    get: function get(obj, k) {
      if (k in obj) {
        return obj[k];
      }

      if (k in obj.exports) {
        return obj.exports[k];
      }
    },
    set: function set(obj, k, val) {
      var exclude = ['exports', 'memory', 'HEAP8', 'HEAP16', 'HEAP32', 'HEAPU8', 'HEAPU16', 'HEAPU32', 'HEAPF32', 'HEAPF64'];

      if (exclude.includes(k)) {
        return false;
      }

      obj[k] = val;
      return true;
    }
  });
}