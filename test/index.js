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
    it('simple', function() {
      assert.isFunction(wasm.ccall);
    });
  });
  describe('#mem2str', function() {
    it('simple', function() {
      assert.isFunction(wasm.mem2str);
    });
  });
  describe('#str2mem', function() {
    it('simple', function() {
      assert.isFunction(wasm.str2mem);
    });
  });
  describe('#arr2mem', function() {
    it('simple', function() {
      assert.isFunction(wasm.arr2mem);
    });
  });
  describe('#mem2arr', function() {
    it('simple', function() {
      assert.isFunction(wasm.mem2arr);
    });
  });
  describe('#malloc', function() {
    it('simple', function() {
      assert.isFunction(wasm.malloc);
    });
  });
  describe('#free', function() {
    it('simple', function() {
      assert.isFunction(wasm.free);
    });
  });
  describe('#heap', function() {
    it('simple', function() {
      assert.isFunction(wasm.heap);
    });
  });
});