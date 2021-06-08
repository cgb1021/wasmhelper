import WASM from './wasm';

export { default as load } from './load';
export { default as utils } from './utils';
export { default as worker } from './worker';
export { WASM };
/*
* @description: 生成WASM对象
* @param {String|Object} instance: wasm资源{url|WebAssembly.Instance}
* @param {Null|Object} importObject: {env: {}}
* @return {Proxy}
*/
export default function (instance, importObject = {}) {
  const asm =  new WASM(instance, importObject);
  return new Proxy(asm, {
    get: (obj, k) => {
      if (k in obj) {
        return obj[k];
      }
      if (k in obj.exports) {
        return obj.exports[k];
      }
    },
    set: (obj, k, val) => {
      const exclude = [
        'exports',
        'memory',
        'stack',
        'ccall',
        'malloc',
        'free',
        'HEAP8',
        'HEAP16',
        'HEAP32',
        'HEAPU8',
        'HEAPU16',
        'HEAPU32',
        'HEAPF32',
        'HEAPF64'
      ];
      if (exclude.includes(k)) {
        return false;
      }
      obj[k] = val;
      return true;
    }
  });
}