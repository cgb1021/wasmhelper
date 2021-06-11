import load from './load';

const type = 'wasminit';
const scripts = `
/*{{UTILS}}*/
/*{{WASM}}*/
let _instance = null;
var wasm = null;
if (typeof importObject !== 'object') {importObject = {};}
/*{{LOAD}}*/
let _initWASM = function (e) {
  if (e.data.type === '${type}') {
    WebAssembly.instantiate(e.data.mod, importObject).then(function(instance) {
      _instance = instance;
      wasm = new Proxy(new WASM(instance), {
        /*{{INDEX}}*/
      })
      postMessage({type: 'wasmready'})
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
    if (typeof urlOrModule !== 'string' && !(urlOrModule instanceof WebAssembly.Module)) {
      reject(new Error('no module or url'));
    }
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
