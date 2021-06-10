"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var UTF8Decoder = typeof TextDecoder !== 'undefined' ? new TextDecoder('utf8') : undefined;
var err = console.warn.bind(console);

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
    if (u <= 127) ++len;else if (u <= 2047) len += 2;else if (u <= 65535) len += 3;else len += 4;
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
  var heap = buffOrArr instanceof ArrayBuffer ? new Uint8Array(buffOrArr) : buffOrArr;
  var endIdx = idx + maxBytesToRead;
  var endPtr = idx;

  while (heap[endPtr] && !(endPtr >= endIdx)) {
    ++endPtr;
  }

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
  var heap = buffOrArr instanceof ArrayBuffer ? new Uint8Array(buffOrArr) : buffOrArr;
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
/*
 * @description: c字符数组转js字符串
 * @param {Function} func: 
 * @param {String} sig: 'v': void type, 'i': 32-bit integer type, 'j': 64-bit integer type (currently does not exist in JavaScript), 'f': 32-bit float type, 'd': 64
 * @return {Function} 
 */


function convertJsFunctionToWasm(func, sig) {
  if (typeof WebAssembly.Function === 'function') {
    var typeNames = {
      'i': 'i32',
      'j': 'i64',
      'f': 'f32',
      'd': 'f64'
    };
    var type = {
      parameters: [],
      results: sig[0] == 'v' ? [] : [typeNames[sig[0]]]
    };

    for (var i = 1; i < sig.length; ++i) {
      type.parameters.push(typeNames[sig[i]]);
    }

    return new WebAssembly.Function(type, func);
  }

  var typeSection = [1, 0, 1, 96];
  var sigRet = sig.slice(0, 1);
  var sigParam = sig.slice(1);
  var typeCodes = {
    'i': 127,
    'j': 126,
    'f': 125,
    'd': 124
  };
  typeSection.push(sigParam.length);

  for (var _i = 0; _i < sigParam.length; ++_i) {
    typeSection.push(typeCodes[sigParam[_i]]);
  }

  if (sigRet == 'v') {
    typeSection.push(0);
  } else {
    typeSection = typeSection.concat([1, typeCodes[sigRet]]);
  }

  typeSection[1] = typeSection.length - 2;
  var bytes = new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0].concat(typeSection, [2, 7, 1, 1, 101, 1, 102, 0, 0, 7, 5, 1, 1, 102, 0, 0]));
  var module = new WebAssembly.Module(bytes);
  var instance = new WebAssembly.Instance(module, {
    'e': {
      'f': func
    }
  });
  var wrappedFunc = instance.exports['f'];
  return wrappedFunc;
}
/* split_flag */


var _default = {
  lengthBytesUTF8: lengthBytesUTF8,
  stringToUTF8: stringToUTF8,
  UTF8ToString: UTF8ToString,
  convertJsFunctionToWasm: convertJsFunctionToWasm,
  warnOnce: warnOnce
};
exports["default"] = _default;