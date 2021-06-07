const assert = require('chai').assert;
global.fetch = require('node-fetch');
const load = require('../lib/load').default;
const url = 'http://localhost:8080/hello.wasm';

describe('load', function() {
  it('is Promise', function() {
    const p = load(url);
    assert.strictEqual(p instanceof Promise, true);
  });
  it('load module', function(done) {
    const p = load(url);
    p.then(mod => {
      assert.strictEqual(mod instanceof WebAssembly.Module, true);
      done();
    });
  });
  it('load instance', function(done) {
    const p = load(url, {});
    p.then(instance => {
      assert.strictEqual(instance instanceof WebAssembly.Instance, true);
      done();
    });
  });
});