import load from './load';
import utils from './utils';
/* split_flag */
function WASM(instance, importObject) {
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
  this.table = null;
  this.stack = 0;

  const callbacks = [];
  const errCallbacks = [];
  let isInit = false;
  let error = null;
  let functionsInTableMap = null;
  const init = (exports) => {
    isInit = true;
    if (typeof exports.memory === 'object') {
      this.memory = exports.memory;
    } else if (typeof importObject.env.memory === 'object') {
      this.memory = importObject.env.memory;
    } else {
      throw new Error('no memory buffer');
    }
    const buf = this.memory.buffer;
    this.HEAP8 = new Int8Array(buf);
    this.HEAP16 = new Int16Array(buf);
    this.HEAP32 = new Int32Array(buf);
    this.HEAPU8 = new Uint8Array(buf);
    this.HEAPU16 = new Uint16Array(buf);
    this.HEAPU32 = new Uint32Array(buf);
    this.HEAPF32 = new Float32Array(buf);
    this.HEAPF64 = new Float64Array(buf);
    this.exports = exports;
    this.table = exports.__indirect_function_table;
    callbacks.forEach(fn => fn.call(this, false));
    callbacks.length = 0;
  };
  const emitError = (e) => {
    error = e;
    errCallbacks.forEach(fn => fn.call(this, e));
    errCallbacks.length = 0;
    utils.warnOnce(e.message);
  };
  this.ready = (fn) => {
    if (typeof fn !== 'function') return;
    if (isInit) fn.call(this, true);
    else callbacks.push(fn);
  };
  this.error = (fn) => {
    if (typeof fn !== 'function') return;
    if (error) fn.call(this, error);
    else errCallbacks.push(fn);
  };
  this.fn2wasm = function (func, sig = '') {
    if (typeof func !== 'function') return 0;
    if (!sig || typeof sig !== 'string') sig = 'v';
    if (!functionsInTableMap) {
      functionsInTableMap = new WeakMap;
      for (var i = 0; i < this.table.length; i++) {
        var item = this.table.get(i);
        if (item) {
          functionsInTableMap.set(item, i);
        }
      }
    }
    if (functionsInTableMap.has(func)) {
      return functionsInTableMap.get(func);
    }
    try {
      this.table.grow(1);
    } catch (err) {
      if (!(err instanceof RangeError)) {
        throw err;
      }
      throw 'Unable to grow wasm table. Set ALLOW_TABLE_GROWTH.';
    }
    var ret = this.table.length - 1;
    try {
      this.table.set(ret, func);
    } catch (err) {
      if (!(err instanceof TypeError)) {
        throw err;
      }
      var wrapped = utils.convertJsFunctionToWasm(func, sig);
      this.table.set(ret, wrapped);
    }
    functionsInTableMap.set(func, ret);
    return ret;
  };
  try {
    if (instance instanceof WebAssembly.Instance) {
      init(instance.exports);
    } else {
      load(instance, importObject).then((res) => {
        this.module = res.module;
        init(res.instance.exports);
      }).catch((e) => {
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
  const exports = this.exports;
  const self = this;
  var toC = {
    'string': function (str) {
      var ret = 0;
      if (str !== null && str !== undefined && str !== 0) {
        var len = (str.length << 2) + 1;
        ret = exports.stackAlloc(len);
        utils.stringToUTF8(str, self.HEAPU8, ret, len);
      }
      return ret;
    },
    'array': function (arr) {
      const bytes = self.HEAP32.BYTES_PER_ELEMENT;
      var ret = exports.stackAlloc(arr.length * bytes);
      self.HEAP32.set(arr, ret / bytes);
      return ret;
    }
  };

  function convertReturnValue(ret) {
    if (returnType === 'string') return utils.UTF8ToString(self.HEAPU8, ret);
    if (returnType === 'boolean') return Boolean(ret);
    return ret;
  }
  var cArgs = [];
  var stack = 0;
  if (args) {
    for (var i = 0; i < args.length; i++) {
      const type = Array.isArray(args[i]) ? 'array' : typeof args[i];
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
  return utils.UTF8ToString(this.HEAPU8, ptr, size);
};
/*
 * @description: 把字符串放入内存
 * @param {String} str: 字符串
 * @return {Number} buffer offset
 */
WASM.prototype.str2mem = function (str) {
  const size = utils.lengthBytesUTF8(str);
  const ptr = this.malloc(size + 1);
  utils.stringToUTF8(str, this.HEAPU8, ptr, size);
  return ptr;
};
/*
 * @description: 把数组放入内存
 * @param {Array} arr: 数组
 * @param {String} type: 类型（可选）
 * @return {Number} buffer offset
 */
WASM.prototype.arr2mem = function (arr, type = 'i32') {
  const heap = this.heap(type);
  const bytes = heap.BYTES_PER_ELEMENT;
  const ptr = this.malloc(arr.length * bytes);
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
WASM.prototype.mem2arr = function (ptr, length, type = 'i32') {
  const heap = this.heap(type);
  const pos = ptr / heap.BYTES_PER_ELEMENT;
  return Array.from(heap.subarray(pos, pos + length));
};
/*
 * @description: 分配内存
 * @param {Number} bytes: 字节长度
 * @return {Number}
 */
WASM.prototype.malloc = function (bytes) {
  const exports = this.exports;
  let ptr = 0;
  if (typeof exports.malloc === 'function') {
    ptr = exports.malloc(bytes);
  } else {
    const stack = exports.stackSave();
    if (bytes > stack) {
      const msg = 'stack overflow, '+ bytes +' larger than ' + stack;
      utils.warnOnce(msg);
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
WASM.prototype.free = function (...args) {
  const exports = this.exports;
  if (typeof exports.free === 'function') {
    args.forEach((ptr) => {
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
WASM.prototype.heap = function (type = 'i32') {
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

export default WASM;
