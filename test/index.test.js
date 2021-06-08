import { assert } from 'chai';
import create, { WASM } from '../es/index';
const url = 'http://localhost:8080/hello.wasm';
const wasm = create(url);

describe('index.js', function() {
  describe('#new', function() {
    it('instanceOf WASM', function() {
      assert.instanceOf(wasm, WASM);
    });
    it('has module', function(done) {
      wasm.ready(function () {
        assert.instanceOf(wasm.module, WebAssembly.Module);
        done();
      });
    });
    it('has memory', function(done) {
      wasm.ready(function () {
        assert.instanceOf(wasm.memory, WebAssembly.Memory);
        done();
      });
    });
    it('has exports', function(done) {
      wasm.ready(function () {
        assert.isObject(wasm.exports);
        done();
      });
    });
    it('function in exports', function(done) {
      wasm.ready(function () {
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
    it('isFunction', function() {
      assert.isFunction(wasm.ccall);
    });
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
  });
  describe('#mem2str', function() {
    it('isFunction', function() {
      assert.isFunction(wasm.mem2str);
    });
  });
  describe('#str2mem', function() {
    it('isFunction', function() {
      assert.isFunction(wasm.str2mem);
    });
  });
  describe('#arr2mem', function() {
    it('isFunction', function() {
      assert.isFunction(wasm.arr2mem);
    });
  });
  describe('#mem2arr', function() {
    it('isFunction', function() {
      assert.isFunction(wasm.mem2arr);
    });
  });
  describe('#malloc', function() {
    it('isFunction', function() {
      assert.isFunction(wasm.malloc);
    });
  });
  describe('#free', function() {
    it('isFunction', function() {
      assert.isFunction(wasm.free);
    });
  });
  describe('#heap', function() {
    it('isFunction', function() {
      assert.isFunction(wasm.heap);
    });
  });
});