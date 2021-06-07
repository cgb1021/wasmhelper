import { assert } from 'chai';
import create, { WASM } from '../es/index';
const url = 'http://localhost:8080/hello.wasm';

describe('index.js', function() {
  describe('#create', function() {
    it('ready', function(done) {
      const wasm = create(url);
      wasm.ready(function () {
        assert.isFunction(this.ccall);
        assert.isFunction(this.mem2str);
        assert.isFunction(this.str2mem);
        assert.isFunction(this.arr2mem);
        assert.isFunction(this.mem2arr);
        assert.isFunction(this.malloc);
        assert.isFunction(this.free);
        assert.isFunction(this.heap);
        done();
      });
      assert.instanceOf(wasm, WASM);
    });
  });
});