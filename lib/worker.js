"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _load = _interopRequireDefault(require("./load"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var type = 'webassemblyinit';
var scripts = "\nconst UTF8Decoder = typeof TextDecoder !== 'undefined' ? new TextDecoder('utf8') : undefined;\nconst err = console.warn.bind(console);\nfunction warnOnce(text) {\n  if (!warnOnce.shown) warnOnce.shown = {};\n  if (!warnOnce.shown[text]) {\n    warnOnce.shown[text] = 1;\n    err(text);\n  }\n}\nfunction lengthBytesUTF8(str) {\n  var len = 0;\n  for (var i = 0; i < str.length; ++i) {\n    var u = str.charCodeAt(i);\n    if (u >= 55296 && u <= 57343) u = 65536 + ((u & 1023) << 10) | str.charCodeAt(++i) & 1023;\n    if (u <= 127) ++len;\n    else if (u <= 2047) len += 2;\n    else if (u <= 65535) len += 3;\n    else len += 4;\n  }\n  return len;\n}\n/*\n * @description: c\u5B57\u7B26\u6570\u7EC4\u8F6Cjs\u5B57\u7B26\u4E32\n * @param {TpyeArray|ArrayBuffer} buffOrArr: \n * @param {Number} idx: \u5F00\u59CB\u5730\u5740\n * @param {Number} maxBytesToRead: \u8BFB\u53D6\u6570\u91CF\uFF08\u53EF\u9009\uFF09\n */\nfunction UTF8ToString(buffOrArr, idx, maxBytesToRead) {\n  const heap = buffOrArr instanceof ArrayBuffer ? new Uint8Array(buffOrArr) : buffOrArr;\n  var endIdx = idx + maxBytesToRead;\n  var endPtr = idx;\n  while (heap[endPtr] && !(endPtr >= endIdx)) ++endPtr;\n  if (endPtr - idx > 16 && heap.subarray && UTF8Decoder) {\n    return UTF8Decoder.decode(heap.subarray(idx, endPtr));\n  } else {\n    var str = '';\n    while (idx < endPtr) {\n      var u0 = heap[idx++];\n      if (!(u0 & 128)) {\n        str += String.fromCharCode(u0);\n        continue;\n      }\n      var u1 = heap[idx++] & 63;\n      if ((u0 & 224) == 192) {\n        str += String.fromCharCode((u0 & 31) << 6 | u1);\n        continue;\n      }\n      var u2 = heap[idx++] & 63;\n      if ((u0 & 240) == 224) {\n        u0 = (u0 & 15) << 12 | u1 << 6 | u2;\n      } else {\n        if ((u0 & 248) != 240) warnOnce('Invalid UTF-8 leading byte 0x' + u0.toString(16) + ' encountered when deserializing a UTF-8 string in wasm memory to a JS string!');\n        u0 = (u0 & 7) << 18 | u1 << 12 | u2 << 6 | heap[idx++] & 63;\n      }\n      if (u0 < 65536) {\n        str += String.fromCharCode(u0);\n      } else {\n        var ch = u0 - 65536;\n        str += String.fromCharCode(55296 | ch >> 10, 56320 | ch & 1023);\n      }\n    }\n  }\n  return str;\n}\n/*\n * @description: c\u5B57\u7B26\u6570\u7EC4\u8F6Cjs\u5B57\u7B26\u4E32\n * @param {String} buffOrArr: \n * @param {TpyeArray|ArrayBuffer} heap: \n * @param {Number} outIdx: \u5F00\u59CB\u5730\u5740\n * @param {Number} maxBytesToWrite: \n */\nfunction stringToUTF8(str, buffOrArr, outIdx, maxBytesToWrite) {\n  if (!(maxBytesToWrite > 0)) return 0;\n  const heap = buffOrArr instanceof ArrayBuffer ? new Uint8Array(buffOrArr) : buffOrArr;\n  var startIdx = outIdx;\n  var endIdx = outIdx + maxBytesToWrite;\n  for (var i = 0; i < str.length; ++i) {\n    var u = str.charCodeAt(i);\n    if (u >= 55296 && u <= 57343) {\n      var u1 = str.charCodeAt(++i);\n      u = 65536 + ((u & 1023) << 10) | u1 & 1023;\n    }\n    if (u <= 127) {\n      if (outIdx >= endIdx) break;\n      heap[outIdx++] = u;\n    } else if (u <= 2047) {\n      if (outIdx + 1 >= endIdx) break;\n      heap[outIdx++] = 192 | u >> 6;\n      heap[outIdx++] = 128 | u & 63;\n    } else if (u <= 65535) {\n      if (outIdx + 2 >= endIdx) break;\n      heap[outIdx++] = 224 | u >> 12;\n      heap[outIdx++] = 128 | u >> 6 & 63;\n      heap[outIdx++] = 128 | u & 63;\n    } else {\n      if (outIdx + 3 >= endIdx) break;\n      if (u >= 2097152) warnOnce('Invalid Unicode code point 0x' + u.toString(16) + ' encountered when serializing a JS string to a UTF-8 string in wasm memory! (Valid unicode code points should be in range 0-0x1FFFFF).');\n      heap[outIdx++] = 240 | u >> 18;\n      heap[outIdx++] = 128 | u >> 12 & 63;\n      heap[outIdx++] = 128 | u >> 6 & 63;\n      heap[outIdx++] = 128 | u & 63;\n    }\n  }\n  heap[outIdx] = 0;\n  return outIdx - startIdx;\n}\n\nvar utils = {\n  lengthBytesUTF8,\n\tstringToUTF8,\n\tUTF8ToString\n}\n/*{{WASM}}*/\nlet _instance = null;\nvar wasm = null;\nlet _defaultFn = function () {}\nif (typeof importObject !== 'object') {\n  importObject = {};\n}\nif (typeof importObject.env !== 'object') {\n  importObject.env = {}\n}\nimportObject.env.emscripten_resize_heap = importObject.env.emscripten_resize_heap || _defaultFn;\nimportObject.env.emscripten_memcpy_big = importObject.env.emscripten_memcpy_big || _defaultFn;\nlet _initWASM = function (e) {\n  if (e.data.type === '".concat(type, "') {\n    WebAssembly.instantiate(e.data.mod, importObject).then(function(instance) {\n      _instance = instance;\n      wasm = new Proxy(new WASM(instance), {\n        get: (obj, k) => {\n          if (k in obj) {\n            return obj[k]\n          }\n          if (k in obj.exports) {\n            return obj.exports[k]\n          }\n        },\n        set: (obj, k, val) => {\n          const exclude = [\n            'malloc',\n            'free',\n            'exports',\n            'memory',\n            'HEAP8',\n            'HEAP16',\n            'HEAP32',\n            'HEAPU8',\n            'HEAPU16',\n            'HEAPU32',\n            'HEAPF32',\n            'HEAPF64',\n          ]\n          if (exclude.includes(k)) {\n            return false\n          }\n          obj[k] = val\n          return true\n        }\n      })\n      postMessage({\n        type: 'webassemblyready'\n      })\n    });\n    removeEventListener('message', _initWASM);\n    _initWASM = null;\n  }\n}\naddEventListener('message', _initWASM)\n");

function createWorker(urlOrModule, workerSelector) {
  // 把wasm塞入worker
  var url = null;
  var dom = document.querySelector(workerSelector);

  if (dom) {
    url = window.URL.createObjectURL(new Blob([scripts + dom.textContent]));
  }

  var worker = new Worker(url);

  if (typeof urlOrModule === 'string') {
    (0, _load["default"])(urlOrModule).then(function (mod) {
      worker.postMessage({
        type: type,
        mod: mod
      });
    });
  } else {
    worker.postMessage({
      type: type,
      mod: urlOrModule
    });
  }

  return worker;
}

var _default = createWorker;
exports["default"] = _default;