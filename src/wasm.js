import load from './load'
import utils from './utils'

function WASM(instance, importObject) {
	this.buffer = null
	this.HEAP8 = null
	this.HEAP16 = null
	this.HEAP32 = null
	this.HEAPU8 = null
	this.HEAPU16 = null
	this.HEAPU32 = null
	this.HEAPF32 = null
	this.HEAPF64 = null
	this.exports = null
	this.memory = null
	const init = (exports) => {
		if (typeof exports.memory === 'object') {
			this.memory = exports.memory
		} else if (typeof importObject.env.memory === 'object') {
			this.memory = importObject.env.memory
		} else {
			throw new Error('no memory buffer')
		}
		const buf = this.memory.buffer
		this.HEAP8 = new Int8Array(buf)
		this.HEAP16 = new Int16Array(buf)
		this.HEAP32 = new Int32Array(buf)
		this.HEAPU8 = new Uint8Array(buf)
		this.HEAPU16 = new Uint16Array(buf)
		this.HEAPU32 = new Uint32Array(buf)
		this.HEAPF32 = new Float32Array(buf)
		this.HEAPF64 = new Float64Array(buf)
		this.exports = exports
	}
	if (typeof instance === 'string') {
		let callback = typeof importObject.ready === 'function' ? importObject.ready : null
		delete importObject.ready
		load(instance, importObject).then((res) => {
			init(res.instance.exports)
			if (callback) {
				callback.call(this, instance)
				callback = null
			}
		})
	} else {
		init(instance.exports)
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
	const exports = this.exports
	const self = this
	var toC = {
		'string': function (str) {
			var ret = 0
			if (str !== null && str !== undefined && str !== 0) {
				var len = (str.length << 2) + 1
				ret = exports.stackAlloc(len)
				utils.stringToUTF8(str, self.HEAPU8, ret, len)
			}
			return ret
		},
		'array': function (arr) {
			const bytes = self.HEAP32.BYTES_PER_ELEMENT
			var ret = exports.stackAlloc(arr.length * bytes)
			self.HEAP32.set(arr, ret / bytes)
			return ret
		}
	}

	function convertReturnValue(ret) {
		if (returnType === 'string') return utils.UTF8ToString(self.HEAPU8, ret)
		if (returnType === 'boolean') return Boolean(ret)
		return ret
	}
	var cArgs = []
	var stack = 0
	if (args) {
		for (var i = 0; i < args.length; i++) {
			const type = Array.isArray(args[i]) ? 'array' : typeof args[i]
			var converter = toC[type]
			if (converter) {
				if (stack === 0) stack = exports.stackSave()
				cArgs[i] = converter(args[i])
			} else {
				cArgs[i] = args[i]
			}
		}
	}
	var ret = exports[ident].apply(null, cArgs)
	ret = convertReturnValue(ret)
	if (stack !== 0) exports.stackRestore(stack)
	return ret
}
/*
 * @description: 从内存获取字符串
 * @param {Number} ptr: buffer offset
 * @param {Number} size: 字符串长度（可选）
 * @return {String}
 */
WASM.prototype.mem2str = function (ptr, size) {
	return utils.UTF8ToString(this.HEAPU8, ptr, size)
}
/*
 * @description: 把字符串放入内存
 * @param {String} str: 字符串
 * @return {Number} buffer offset
 */
WASM.prototype.str2mem = function (str) {
	const size = utils.lengthBytesUTF8(str)
	const ptr = this.exports.malloc(size + 1)
	utils.stringToUTF8(str, this.HEAPU8, ptr, size)
	return ptr
}
/*
 * @description: 把数组放入内存
 * @param {Array} arr: 数组
 * @return {Number} buffer offset
 */
WASM.prototype.arr2mem = function (arr, type = 'i32') {
	const heap = this.heap(type)
	const bytes = heap.BYTES_PER_ELEMENT
	const ptr = this.exports.malloc(arr.length * bytes)
	heap.set(arr, ptr / bytes)
	return ptr
}
/*
 * @description: 获取内存
 * @param {String} type: i32:HEAP32,i8:HEAP8,i16:HEAP16,u8:HEAPU8,u16:HEAPU16,u32:HEAPU32,float:HEAPF32,double:HEAPF64
 * @return {TypeArray}
 */
WASM.prototype.heap = function (type = 'i32') {
	switch (type) {
	case 'i8':
		return this.HEAP8
	case 'i16':
		return this.HEAP16
	case 'u8':
		return this.HEAPU8
	case 'u16':
		return this.HEAPU16
	case 'u32':
		return this.HEAPU32
	case 'float':
		return this.HEAPF32
	case 'double':
		return this.HEAPF64
	default:
		return this.HEAP32
	}
}
/*
 * 慎用
 */
WASM.prototype.grow = function (num) {
	return this.memory.grow(num)
}

export default WASM
