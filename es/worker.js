import load from './load';

const type = 'wasminit';
const scripts = `
const UTF8Decoder = typeof TextDecoder !== 'undefined' ? new TextDecoder('utf8') : undefined;
const err = console.warn.bind(console);
function warnOnce(text) {
  if (!warnOnce.shown) warnOnce.shown = {};
  if (!warnOnce.shown[text]) {
    warnOnce.shown[text] = 1;
    err(text);
  }
}
function lengthBytesUTF8(str) {
  var len = 0;
  for (var i = 0; i < str.length; ++i) {
    var u = str.charCodeAt(i);
    if (u >= 55296 && u <= 57343) u = 65536 + ((u & 1023) << 10) | str.charCodeAt(++i) & 1023;
    if (u <= 127) ++len;
    else if (u <= 2047) len += 2;
    else if (u <= 65535) len += 3;
    else len += 4;
  }
  return len;
}
/*
 * @description: c字符数组转js字符串
 * @param {TpyeArray|ArrayBuffer} buffOrArr: 
 * @param {Number} idx: 开始地址
 * @param {Number} maxBytesToRead: 读取数量（可选）
 */
function UTF8ToString(buffOrArr, idx, maxBytesToRead) {
  const heap = buffOrArr instanceof ArrayBuffer ? new Uint8Array(buffOrArr) : buffOrArr;
  var endIdx = idx + maxBytesToRead;
  var endPtr = idx;
  while (heap[endPtr] && !(endPtr >= endIdx)) ++endPtr;
  if (endPtr - idx > 16 && heap.subarray && UTF8Decoder) {
    return UTF8Decoder.decode(heap.subarray(idx, endPtr));
  } else {
    var str = '';
    while (idx < endPtr) {
      var u0 = heap[idx++];
      if (!(u0 & 128)) {
        str += String.fromCharCode(u0);
        continue;
      }
      var u1 = heap[idx++] & 63;
      if ((u0 & 224) == 192) {
        str += String.fromCharCode((u0 & 31) << 6 | u1);
        continue;
      }
      var u2 = heap[idx++] & 63;
      if ((u0 & 240) == 224) {
        u0 = (u0 & 15) << 12 | u1 << 6 | u2;
      } else {
        if ((u0 & 248) != 240) warnOnce('Invalid UTF-8 leading byte 0x' + u0.toString(16) + ' encountered when deserializing a UTF-8 string in wasm memory to a JS string!');
        u0 = (u0 & 7) << 18 | u1 << 12 | u2 << 6 | heap[idx++] & 63;
      }
      if (u0 < 65536) {
        str += String.fromCharCode(u0);
      } else {
        var ch = u0 - 65536;
        str += String.fromCharCode(55296 | ch >> 10, 56320 | ch & 1023);
      }
    }
  }
  return str;
}
/*
 * @description: c字符数组转js字符串
 * @param {String} buffOrArr: 
 * @param {TpyeArray|ArrayBuffer} heap: 
 * @param {Number} outIdx: 开始地址
 * @param {Number} maxBytesToWrite: 
 */
function stringToUTF8(str, buffOrArr, outIdx, maxBytesToWrite) {
  if (!(maxBytesToWrite > 0)) return 0;
  const heap = buffOrArr instanceof ArrayBuffer ? new Uint8Array(buffOrArr) : buffOrArr;
  var startIdx = outIdx;
  var endIdx = outIdx + maxBytesToWrite;
  for (var i = 0; i < str.length; ++i) {
    var u = str.charCodeAt(i);
    if (u >= 55296 && u <= 57343) {
      var u1 = str.charCodeAt(++i);
      u = 65536 + ((u & 1023) << 10) | u1 & 1023;
    }
    if (u <= 127) {
      if (outIdx >= endIdx) break;
      heap[outIdx++] = u;
    } else if (u <= 2047) {
      if (outIdx + 1 >= endIdx) break;
      heap[outIdx++] = 192 | u >> 6;
      heap[outIdx++] = 128 | u & 63;
    } else if (u <= 65535) {
      if (outIdx + 2 >= endIdx) break;
      heap[outIdx++] = 224 | u >> 12;
      heap[outIdx++] = 128 | u >> 6 & 63;
      heap[outIdx++] = 128 | u & 63;
    } else {
      if (outIdx + 3 >= endIdx) break;
      if (u >= 2097152) warnOnce('Invalid Unicode code point 0x' + u.toString(16) + ' encountered when serializing a JS string to a UTF-8 string in wasm memory! (Valid unicode code points should be in range 0-0x1FFFFF).');
      heap[outIdx++] = 240 | u >> 18;
      heap[outIdx++] = 128 | u >> 12 & 63;
      heap[outIdx++] = 128 | u >> 6 & 63;
      heap[outIdx++] = 128 | u & 63;
    }
  }
  heap[outIdx] = 0;
  return outIdx - startIdx;
}

var utils = {
  lengthBytesUTF8,
	stringToUTF8,
	UTF8ToString
}

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
  this.stack = 0;

  const callbacks = [];
  const errCallbacks = [];
  let isInit = false;
  let error = null;
  const init = ({ exports }) => {
    if (!exports) throw new Error('no exports');
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
    callbacks.forEach(fn => fn.call(this, false));
    callbacks.length = 0;
  };
  const emitError = (e) => {
    error = e;
    errCallbacks.forEach(fn => fn.call(this, e));
  }
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
  try {
    if (instance instanceof WebAssembly.Instance) {
      init(instance);
    } else {
      load(instance, importObject).then((res) => {
        try {
          this.module = res.module;
          init(res.instance);
        } catch (e) {
          emitError(e);
        }
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
      console.error(msg);
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

let _instance = null;
var wasm = null;
let _defaultFn = function () {}
if (typeof importObject !== 'object') {
  importObject = {};
}
if (typeof importObject.env !== 'object') {
  importObject.env = {}
}
importObject.env.emscripten_resize_heap = importObject.env.emscripten_resize_heap || _defaultFn;
importObject.env.emscripten_memcpy_big = importObject.env.emscripten_memcpy_big || _defaultFn;
let _initWASM = function (e) {
  if (e.data.type === '${type}') {
    WebAssembly.instantiate(e.data.mod, importObject).then(function(instance) {
      _instance = instance;
      wasm = new Proxy(new WASM(instance), {
        get: (obj, k) => {
          if (k in obj) {
            return obj[k]
          }
          if (k in obj.exports) {
            return obj.exports[k]
          }
        },
        set: (obj, k, val) => {
          const exclude = [
            'malloc',
            'free',
            'exports',
            'memory',
            'HEAP8',
            'HEAP16',
            'HEAP32',
            'HEAPU8',
            'HEAPU16',
            'HEAPU32',
            'HEAPF32',
            'HEAPF64',
          ]
          if (exclude.includes(k)) {
            return false
          }
          obj[k] = val
          return true
        }
      })
      postMessage({
        type: 'wasmready'
      })
    });
    removeEventListener('message', _initWASM);
    _initWASM = null;
  }
}
addEventListener('message', _initWASM)
`;

/*
 * @description: 生成worker
 * @param {String|Object} urlOrModule: wasm地址或者已编译module
 * @param {String} urlOrSelector: url地址或者dom选择器
 * @return {Promise<Worker>}
 */
function createWorker (urlOrModule, urlOrSelector) {
  return new Promise((resolve, reject) => {
    // 把wasm塞入worker
    const init = (text) => {
      let url = window.URL.createObjectURL(new Blob([scripts + text]));
      if (typeof urlOrModule === 'string') {
        load(urlOrModule).then((mod) => {
          const worker = new Worker(url);
          worker.postMessage({
            type,
            mod,
          });
          resolve(worker);
        }).catch(reject);
      } else {
        const worker = new Worker(url);
        worker.postMessage({
          type,
          mod: urlOrModule,
        });
        resolve(worker);
      }
    };
    if (/^https?:\/\//.test(urlOrSelector)) {
      fetch(urlOrSelector)
        .then(response => response.text())
        .then((text) => init(text)).catch(reject);
    } else {
      const dom = document.querySelector(urlOrSelector);
      if (dom) {
        init(dom.textContent);
      } else {
        reject();
      }
    }
  });
}
export default createWorker;
