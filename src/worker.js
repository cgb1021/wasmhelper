import load from './load';

const type = 'wasminit';
const scripts = `
/*{{UTILS}}*/
var utils = {
  lengthBytesUTF8,
  stringToUTF8,
  UTF8ToString,
  convertJsFunctionToWasm,
  warnOnce
};
/*{{WASM}}*/
let _instance = null;
var wasm = null;
let _defaultFn = function () {}
if (typeof importObject !== 'object') {
  importObject = {};
}
if (typeof importObject.env !== 'object') {
  importObject.env = {}
}
['emscripten_resize_heap',
  'emscripten_memcpy_big',
  'emscripten_notify_memory_growth',
  'emscripten_asm_const_int'
].forEach(key => {
  if (typeof importObject.env[key] !== 'function') {
    importObject.env[key] = _defaultFn;
  }
});
if (typeof importObject.wasi_snapshot_preview1 !== 'object') {
  importObject.wasi_snapshot_preview1 = {};
}
['proc_exit', 'fd_write'].forEach(key => {
  if (typeof importObject.wasi_snapshot_preview1[key] !== 'function') {
    importObject.wasi_snapshot_preview1[key] = _defaultFn;
  }
});
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
    if (/\.js\??/.test(urlOrSelector)) {
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
