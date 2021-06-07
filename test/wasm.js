const assert = require('chai').assert;
global.fetch = require('node-fetch');
const create = require('../lib/index').default;

describe('init', function() {
  describe('#create', function() {
    it('WebAssembly defined', function() {
      assert.strictEqual(typeof WebAssembly, 'object');
    });
    it('is proxy', function() {
      const wasm = create('./data/hello.wasm');
      assert.strictEqual(wasm instanceof Proxy, true);
    });
  });
});