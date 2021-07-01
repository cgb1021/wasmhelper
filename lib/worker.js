"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _load = _interopRequireDefault(require("./load"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var type = 'wasminit';
var scripts = "\nconst UTF8Decoder=\"undefined\"!=typeof TextDecoder?new TextDecoder(\"utf8\"):void 0,err=console.warn.bind(console);function warnOnce(e){warnOnce.shown||(warnOnce.shown={}),warnOnce.shown[e]||(warnOnce.shown[e]=1,err(e))}function lengthBytesUTF8(n){var r=0;for(let e=0;e<n.length;++e){var t=n.charCodeAt(e);(t=55296<=t&&t<=57343?65536+((1023&t)<<10)|1023&n.charCodeAt(++e):t)<=127?++r:r+=t<=2047?2:t<=65535?3:4}return r}function UTF8ToString(e,n,r){const t=e instanceof ArrayBuffer?new Uint8Array(e):e;for(var o=n+r,i=n;t[i]&&!(o<=i);)++i;if(16<i-n&&t.subarray&&UTF8Decoder)return UTF8Decoder.decode(t.subarray(n,i));for(var a=\"\";n<i;){var s,c,f=t[n++];128&f?(s=63&t[n++],192!=(224&f)?(c=63&t[n++],(f=224==(240&f)?(15&f)<<12|s<<6|c:(240!=(248&f)&&warnOnce(\"Invalid UTF-8 leading byte 0x\"+f.toString(16)+\" encountered when deserializing a UTF-8 string in wasm memory to a JS string!\"),(7&f)<<18|s<<12|c<<6|63&t[n++]))<65536?a+=String.fromCharCode(f):(c=f-65536,a+=String.fromCharCode(55296|c>>10,56320|1023&c))):a+=String.fromCharCode((31&f)<<6|s)):a+=String.fromCharCode(f)}return a}function stringToUTF8(e,n,r,t){if(!(0<t))return 0;const o=n instanceof ArrayBuffer?new Uint8Array(n):n;for(var n=r,i=r+t,a=0;a<e.length;++a){var s=e.charCodeAt(a);if((s=55296<=s&&s<=57343?65536+((1023&s)<<10)|1023&e.charCodeAt(++a):s)<=127){if(i<=r)break;o[r++]=s}else if(s<=2047){if(i<=r+1)break;o[r++]=192|s>>6,o[r++]=128|63&s}else if(s<=65535){if(i<=r+2)break;o[r++]=224|s>>12,o[r++]=128|s>>6&63,o[r++]=128|63&s}else{if(i<=r+3)break;2097152<=s&&warnOnce(\"Invalid Unicode code point 0x\"+s.toString(16)+\" encountered when serializing a JS string to a UTF-8 string in wasm memory! (Valid unicode code points should be in range 0-0x1FFFFF).\"),o[r++]=240|s>>18,o[r++]=128|s>>12&63,o[r++]=128|s>>6&63,o[r++]=128|63&s}}return o[r]=0,r-n}function convertJsFunctionToWasm(e,n){if(\"function\"==typeof WebAssembly.Function){var r={i:\"i32\",j:\"i64\",f:\"f32\",d:\"f64\"},t={parameters:[],results:\"v\"==n[0]?[]:[r[n[0]]]};for(let e=1;e<n.length;++e)t.parameters.push(r[n[e]]);return new WebAssembly.Function(t,e)}var o=[1,0,1,96],i=n.slice(0,1),a=n.slice(1),s={i:127,j:126,f:125,d:124};o.push(a.length);for(let e=0;e<a.length;++e)o.push(s[a[e]]);\"v\"==i?o.push(0):o=o.concat([1,s[i]]),o[1]=o.length-2;i=new Uint8Array([0,97,115,109,1,0,0,0].concat(o,[2,7,1,1,101,1,102,0,0,7,5,1,1,102,0,0])),i=new WebAssembly.Module(i);return new WebAssembly.Instance(i,{e:{f:e}}).exports.f}var utils={lengthBytesUTF8:lengthBytesUTF8,stringToUTF8:stringToUTF8,UTF8ToString:UTF8ToString,convertJsFunctionToWasm:convertJsFunctionToWasm,warnOnce:warnOnce};\nfunction WASM(t,e={}){this.HEAP8=null,this.HEAP16=null,this.HEAP32=null,this.HEAPU8=null,this.HEAPU16=null,this.HEAPU32=null,this.HEAPF32=null,this.HEAPF64=null,this.exports=null,this.memory=null,this.module=null,this.table=null,this.stack=0,this.byteLength=0;const r=[],s=e&&\"function\"==typeof e.error?e.error:null;let n=!1,i=null;const o=t=>{if(n=!0,\"object\"==typeof t.memory)this.memory=t.memory;else{if(\"object\"!=typeof e.env.memory)throw new Error(\"no memory buffer\");this.memory=e.env.memory}this.setHeap(),this.exports=t,this.table=t.__indirect_function_table,r.forEach(t=>t.call(this)),r.length=0},a=t=>{utils.warnOnce(t.message),s&&s(t)};this.setHeap=()=>{var t=this.memory.buffer;this.byteLength=t.byteLength,this.HEAP8=new Int8Array(t),this.HEAP16=new Int16Array(t),this.HEAP32=new Int32Array(t),this.HEAPU8=new Uint8Array(t),this.HEAPU16=new Uint16Array(t),this.HEAPU32=new Uint32Array(t),this.HEAPF32=new Float32Array(t),this.HEAPF64=new Float64Array(t)},this.ready=t=>(\"function\"==typeof t&&(n?t.call(this):r.push(t)),n),this.fn2wasm=(e,r=\"\")=>{if(\"function\"!=typeof e)return 0;if(r&&\"string\"==typeof r||(r=\"v\"),!i){i=new WeakMap;for(var t=0;t<this.table.length;t++){var s=this.table.get(t);s&&i.set(s,t)}}if(i.has(e))return i.get(e);try{this.table.grow(1)}catch(t){if(!(t instanceof RangeError))throw t;var n=\"Unable to grow wasm table. Set ALLOW_TABLE_GROWTH.\";throw utils.warnOnce(n),n}n=this.table.length-1;try{this.table.set(n,e)}catch(t){if(!(t instanceof TypeError))throw t;r=utils.convertJsFunctionToWasm(e,r);this.table.set(n,r)}return i.set(e,n),n};try{t instanceof WebAssembly.Instance?o(t.exports):(\"object\"==typeof e&&e||(e={}),load(t,e).then(t=>{this.module=t.module,o(t.instance.exports)}).catch(t=>{a(t)}))}catch(t){a(t)}}WASM.prototype.ccall=function(t,e,r){const s=this.exports,n=this;var i={string:function(t){var e,r=0;return null!=t&&0!==t&&(e=1+(t.length<<2),r=s.stackAlloc(e),utils.stringToUTF8(t,n.HEAPU8,r,e)),r},array:function(t){var e=n.HEAP32.BYTES_PER_ELEMENT,r=s.stackAlloc(t.length*e);return n.HEAP32.set(t,r/e),r}};var o=[],a=0;if(r)for(var l=0;l<r.length;l++){var h=i[Array.isArray(r[l])?\"array\":typeof r[l]];h?(0===a&&(a=s.stackSave()),o[l]=h(r[l])):o[l]=r[l]}t=function convertReturnValue(t){return\"string\"===e?utils.UTF8ToString(n.HEAPU8,t):\"boolean\"===e?Boolean(t):t}(t=s[t].apply(null,o));return 0!==a&&s.stackRestore(a),t},WASM.prototype.mem2str=function(t,e){return utils.UTF8ToString(this.HEAPU8,t,e)},WASM.prototype.str2mem=function(t){var e=utils.lengthBytesUTF8(t),r=this.malloc(e+1);return utils.stringToUTF8(t,this.HEAPU8,r,e),r},WASM.prototype.arr2mem=function(t,e=\"i32\"){const r=this.heap(e);var s=r.BYTES_PER_ELEMENT,e=this.malloc(t.length*s);return r.set(t,e/s),e},WASM.prototype.mem2arr=function(t,e,r=\"i32\"){const s=this.heap(r);t/=s.BYTES_PER_ELEMENT;return Array.from(s.subarray(t,t+e))},WASM.prototype.malloc=function(t){const e=this.exports;let r=0;if(\"function\"==typeof e.malloc)r=e.malloc(t);else{var s=e.stackSave();if(s<t){var n=\"stack overflow, \"+t+\" larger than \"+s;throw utils.warnOnce(n),new Error(n)}0===this.stack&&(this.stack=s),r=e.stackAlloc(t)}return this.byteLength!==this.memory.buffer.byteLength&&this.setHeap(),r},WASM.prototype.free=function(...t){const e=this.exports;\"function\"==typeof e.free&&t.forEach(t=>{e.free(t)}),this.stack&&(e.stackRestore(this.stack),this.stack=0)},WASM.prototype.getFree=function(){return this.exports.stackSave()},WASM.prototype.heap=function(t=\"i32\"){switch(t){case\"i8\":return this.HEAP8;case\"i16\":return this.HEAP16;case\"u8\":return this.HEAPU8;case\"u16\":return this.HEAPU16;case\"u32\":return this.HEAPU32;case\"float\":return this.HEAPF32;case\"double\":return this.HEAPF64;default:return this.HEAP32}};\nlet wasm = null;\nif (typeof importObject !== 'object') {importObject = {};}\nvoid 0===importObject.env&&(importObject.env={}),[\"emscripten_resize_heap\",\"emscripten_memcpy_big\",\"emscripten_notify_memory_growth\",\"emscripten_asm_const_int\"].forEach(e=>{\"function\"!=typeof importObject.env[e]&&(importObject.env[e]=()=>{})}),void 0===importObject.wasi_snapshot_preview1&&(importObject.wasi_snapshot_preview1={}),[\"proc_exit\",\"fd_write\"].forEach(e=>{\"function\"!=typeof importObject.wasi_snapshot_preview1[e]&&(importObject.wasi_snapshot_preview1[e]=()=>{})}),\"number\"!=typeof importObject.INITIAL_MEMORY||importObject.env.memory||(importObject.env.memory=new WebAssembly.Memory({initial:importObject.INITIAL_MEMORY,maximum:\"number\"==typeof importObject.MAXIMUM_MEMORY?importObject.MAXIMUM_MEMORY:importObject.INITIAL_MEMORY}));\nlet _initWASM = function (e) {\n  if (e.data.type === '".concat(type, "') {\n    WebAssembly.instantiate(e.data.mod, importObject).then(function(instance) {\n      wasm = new Proxy(new WASM(instance), {\n        get: (obj, k) => {\n      if (k in obj) {\n        return obj[k];\n      }\n      if (k in obj.exports) {\n        return obj.exports[k];\n      }\n    },\n    set: (obj, k, val) => {\n      const exclude = [\n        'exports',\n        'memory',\n        'table',\n        'HEAP8',\n        'HEAP16',\n        'HEAP32',\n        'HEAPU8',\n        'HEAPU16',\n        'HEAPU32',\n        'HEAPF32',\n        'HEAPF64',\n        'bytesLength'\n      ];\n      if (exclude.includes(k)) {\n        return false;\n      }\n      obj[k] = val;\n      return true;\n    }\n      })\n      if (typeof wasmready === 'function') wasmready();\n      else postMessage({type: 'wasmready'});\n    });\n    removeEventListener('message', _initWASM);\n    _initWASM = null;\n  }\n}\naddEventListener('message', _initWASM)\n");
/*
 * @description: 生成worker
 * @param {String|Object} urlOrModule: wasm地址或者已编译module
 * @param {String} urlOrSelector: url地址或者dom选择器
 * @return {Promise<Worker>}
 */

function createWorker(urlOrModule, urlOrSelector) {
  return new Promise(function (resolve, reject) {
    if (typeof urlOrModule !== 'string' && !(urlOrModule instanceof WebAssembly.Module)) {
      reject(new Error('no module or url'));
    } // 把wasm塞入worker


    var init = function init(text) {
      var url = window.URL.createObjectURL(new Blob([scripts + text]));

      if (typeof urlOrModule === 'string') {
        (0, _load["default"])(urlOrModule).then(function (mod) {
          var worker = new Worker(url);
          worker.postMessage({
            type: type,
            mod: mod
          });
          resolve(worker);
        })["catch"](reject);
      } else {
        var worker = new Worker(url);
        worker.postMessage({
          type: type,
          mod: urlOrModule
        });
        resolve(worker);
      }
    };

    if (/\.js\??/.test(urlOrSelector)) {
      fetch(urlOrSelector).then(function (response) {
        return response.text();
      }).then(function (text) {
        return init(text);
      })["catch"](reject);
    } else {
      var dom = document.querySelector(urlOrSelector);

      if (dom) {
        init(dom.textContent);
      } else {
        reject();
      }
    }
  });
}

var _default = createWorker;
exports["default"] = _default;