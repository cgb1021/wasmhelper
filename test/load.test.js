import { assert } from 'chai';
import load from '../es/load';
const url = 'http://localhost:8080/hello.wasm';

describe('load.js', function() {
  it('load module', function() {
    return load(url).then(mod => {
      assert.instanceOf(mod, WebAssembly.Module);
    });
  });
  it('load instance', function() {
    return load(url, {}).then(res => {
      assert.instanceOf(res.instance, WebAssembly.Instance);
      assert.instanceOf(res.module, WebAssembly.Module);
    });
  });
  it('from module', function() {
    return load(url).then(mod => {
      load(mod, {}).then(res => {
        assert.instanceOf(res.instance, WebAssembly.Instance);
        assert.instanceOf(res.module, WebAssembly.Module);
      });
    });
  });
  it('no module', function (done) {
    load('http://localhost:8080/hello2.wasm').catch(() => done());
  });
  it('fetch instance', function (done) {
    delete WebAssembly.instantiateStreaming;
    load('http://localhost:8080/hello.wasm', {}).then(() => done());
  });
  it('fetch module', function (done) {
    delete WebAssembly.compileStreaming;
    load('http://localhost:8080/hello.wasm').then(() => done());
  });
});