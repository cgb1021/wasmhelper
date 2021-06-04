import load from './load'

const type = 'webassemblyinit'
const scripts = `
/*{{UTILS}}*/
var utils = {
  lengthBytesUTF8,
	stringToUTF8,
	UTF8ToString
}
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
        type: 'webassemblyready'
      })
    });
    removeEventListener('message', _initWASM);
    _initWASM = null;
  }
}
addEventListener('message', _initWASM)
`

function createWorker (urlOrModule, workerSelector) {
	// 把wasm塞入worker
	let url = null
	const dom = document.querySelector(workerSelector)
	if (dom) {
		url = window.URL.createObjectURL(new Blob([scripts + dom.textContent]))
	}
	const worker = new Worker(url)
	if (typeof urlOrModule === 'string') {
		load(urlOrModule).then((mod) => {
			worker.postMessage({
				type,
				mod,
			})
		})
	} else {
		worker.postMessage({
			type,
			mod: urlOrModule,
		})
	}
	
	return worker
}
export default createWorker
