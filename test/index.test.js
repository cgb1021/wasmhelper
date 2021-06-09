import { assert } from 'chai';
import create, { load, WASM } from '../es/index';
const url = 'http://localhost:8080/hello.wasm';
const wasm = create(url);

describe('index.js', function() {
  describe('#new', function() {
    it('instanceOf WASM', function() {
      assert.instanceOf(wasm, WASM);
    });
    it('correct', function(done) {
      wasm.ready(function () {
        assert.instanceOf(wasm.module, WebAssembly.Module);
        assert.instanceOf(wasm.memory, WebAssembly.Memory);
        done();
      });
    });
    it('function in exports', function(done) {
      wasm.ready(function () {
        assert.isObject(wasm.exports);
        assert.isFunction(wasm.add);
        assert.strictEqual(wasm.add, wasm.exports.add);
        done();
      });
    });
    it('set invalid', function(done) {
      wasm.ready(function () {
        try {
          wasm.memory = { a: 'a' };
        } catch (e) {
          assert.instanceOf(wasm.memory, WebAssembly.Memory);
        }
        done();
      });
    });
    it('set valid', function(done) {
      wasm.ready(function () {
        const memory  = {};
        wasm.xyz = memory;
        assert.strictEqual(wasm.xyz, memory);
        done();
      });
    });
    it('from instance', function(done) {
      load('http://localhost:8080/hello.wasm', {}).then((res) => {
        const wasm = create(res.instance);
        assert.strictEqual(res.instance.exports, wasm.exports);
        done();
      });
    });
  });
  describe('#error', function() {
    const wasm = create('http://localhost:8080/memory2.wasm');
    it('before', function(done) {
      const wasm = create('http://localhost:8080/memory2.wasm');
      wasm.error((e) => {
        assert.isString(e.message);
        done();
      });
    });
    it('after', function(done) {
      wasm.error((e) => {
        assert.isString(e.message);
        done();
      });
    });
    it('no memory', function(done) {
      const wasm = create('http://localhost:8080/memory.wasm', {});
      wasm.error(() => {
        done();
      });
    });
    it('no url', function(done) {
      const wasm = create('no url');
      wasm.error(() => done());
    });
  });
  describe('#ready', function() {
    it('before init', function(done) {
      const wasm2 = create(url);
      wasm2.ready(function (isInit) {
        assert.isFalse(isInit);
        done();
      });
    });
    it('after init', function(done) {
      wasm.ready(function (isInit) {
        assert.isTrue(isInit);
        done();
      });
    });
    it('call this', function(done) {
      wasm.ready(function () {
        assert.instanceOf(this, WASM);
        done();
      });
    });
  });
  describe('#ccall', function() {
    it('return number', function() {
      assert.strictEqual(wasm.ccall('counter', 'number'), 1);
      assert.strictEqual(wasm.ccall('counter', 'number'), 2);
    });
    it('pass[return] number', function() {
      assert.strictEqual(wasm.ccall('add', 'number', [5, 6]), 11);
      assert.strictEqual(wasm.ccall('add', 'number', [345, 1234]), 1579);
    });
    it('pass[return] string', function() {
      const str = 'hello world';
      assert.strictEqual(wasm.ccall('hello', 'string', [str]), 'hello world2');
    });
    it('pass array', function() {
      const array = [3, 10, 100, 50, 80, 1000];
      assert.strictEqual(wasm.ccall('reduce', 'number', [array, array.length]), array.reduce((a, b) => a + b));
    });
    it('return boolean', function() {
      assert.isTrue(wasm.ccall('returnTrue', 'boolean'));
      assert.isFalse(wasm.ccall('returnFalse', 'boolean'));
    });
  });
  describe('#mem2str&str2mem', function() {
    it('callable', function () {
      const helloStr = 'hello world【🎉】:';
      const counter = wasm.counter();
      const ptr = wasm.str2mem(helloStr);
      const retPtr = wasm.hello(ptr);
      const result = wasm.mem2str(retPtr);
      wasm.free(ptr, retPtr);
      assert.strictEqual(result, `${helloStr}${counter}`);
    });
  });
  describe('#arr2mem', function() {
    it('callable', function () {
      const array = [33, 10, 1003, 503, 803, 10030];
      const ptr = wasm.arr2mem(array);
      const result = wasm.reduce(ptr, array.length);
      wasm.free(ptr);
      assert.strictEqual(result, array.reduce((a, b) => a + b));
    });
  });
  describe('#mem2arr', function() {
    it('callable', function () {
      const ptr = wasm.getPrimes(100, 200);
      const size = wasm.getSize();
      const array = wasm.mem2arr(ptr, size);
      wasm.free(ptr);
      assert.strictEqual(array.length, size);
      assert.deepEqual(array, [101, 103, 107, 109, 113, 127, 131, 137, 139, 149, 151, 157, 163, 167, 173, 179, 181, 191, 193, 197, 199]);
    });
  });
  describe('#malloc&free', function() {
    const memory = new WebAssembly.Memory({ initial: 96, maximum: 96 });
    const wasm2 = create('http://localhost:8080/memory.wasm', { env: { memory }});
    it('16aligned', function() {
      const bytes = 32;
      const size1 = wasm2.getFree();
      const ptr = wasm2.malloc(bytes);
      assert.isNumber(ptr);
      const size2 = wasm2.getFree();
      wasm2.free(ptr);
      const size3 = wasm2.getFree();
      assert.strictEqual(size1, size3);
      assert.strictEqual(size2, size1 - bytes);
    });
    it('not 16aligned', function() {
      const bytes = 33;
      const size1 = wasm2.getFree();
      const ptr = wasm2.malloc(bytes);
      const size2 = wasm2.getFree();
      wasm2.free(ptr);
      const size3 = wasm2.getFree();
      const diff = size1 - size2;
      assert.strictEqual(size1, size3);
      assert.isAbove(diff, bytes);
      assert.strictEqual(diff % 16, 0);
    });
    it('stack overflow', function(done) {
      try {
        const size = wasm2.getFree();
        const ptr = wasm2.malloc(size + 64);
        wasm2.free(ptr);
      } catch (err) {
        assert.strictEqual(err.message.indexOf('stack overflow'), 0);
        done();
      }
    });
  });
  describe('#heap', function() {
    it('default', function() {
      const heap = wasm.heap();
      assert.instanceOf(heap, Int32Array);
    });
    it('i8', function() {
      const heap = wasm.heap('i8');
      assert.instanceOf(heap, Int8Array);
    });
    it('i16', function() {
      const heap = wasm.heap('i16');
      assert.instanceOf(heap, Int16Array);
    });
    it('u8', function() {
      const heap = wasm.heap('u8');
      assert.instanceOf(heap, Uint8Array);
    });
    it('u16', function() {
      const heap = wasm.heap('u16');
      assert.instanceOf(heap, Uint16Array);
    });
    it('u32', function() {
      const heap = wasm.heap('u32');
      assert.instanceOf(heap, Uint32Array);
    });
    it('float', function() {
      const heap = wasm.heap('float');
      assert.instanceOf(heap, Float32Array);
    });
    it('double', function() {
      const heap = wasm.heap('double');
      assert.instanceOf(heap, Float64Array);
    });
  });
});