/*
 * @description: 生成WASM对象
 * @param {String} instance: wasm资源{url|WebAssembly.Instance}
 * @param {Null|Object} importObject: {env: {}}
 * @return {Object} 传入importObject，返回WebAssembly.Instance，否则返回WebAssembly.Module
 */
const load = function (url, importObject) {
	if (importObject) {
		if (typeof importObject.env === 'undefined') {
			importObject.env = {}
		}
		['emscripten_resize_heap', 'emscripten_memcpy_big', 'emscripten_notify_memory_growth'].forEach(key => {
			if (typeof importObject.env[key] !== 'function') {
				importObject.env[key] = () => {}
			}
		})
		return WebAssembly.instantiateStreaming(fetch(url), importObject)
	} else {
		return WebAssembly.compileStreaming(fetch(url))
	}
}

export default load