import { assert } from 'chai';
import { load, worker as createWorker } from '../es/index';
const url = 'http://localhost:8080/hello.wasm';
const workerUrl = 'http://localhost:8080/worker.js';

describe('worker.js', function() {
  beforeEach(function() {
    // runs once before the first test in this block
    document.body.innerHTML = `<script id="worker" type="text/js-worker">
    addEventListener('message', function (e) {
      if (e.data.type !== 'wasminit') {
        // 自动注入wasm对象
        const helloStr = 'hello worker:'
        const counter = wasm.counter();
        const ptr = wasm.str2mem(helloStr)
        const retPtr = wasm.hello(ptr)
        const result = wasm.mem2str(retPtr)
        wasm.free(ptr, retPtr)
        console.log('worker2 say hello', result) 
      }
    }, false);
    </script>`;
  });
  it('url<->url', function () {
    return createWorker(url, workerUrl).then(function (worker) {
      worker.addEventListener('message', (e) => {
        assert.strictEqual(e.data.type, 'wasmready');
      });
    });
  });
  it('module<->url', function (done) {
    load(url).then(module => {
      createWorker(module, workerUrl).then(function (worker) {
        worker.addEventListener('message', (e) => {
          assert.strictEqual(e.data.type, 'wasmready');
          done();
        });
      });
    });
  });
  it('url<->selector', function () {
    return createWorker(url, '#worker').then(function (worker) {
      worker.addEventListener('message', (e) => {
        assert.strictEqual(e.data.type, 'wasmready');
      });
    });
  });
  it('module<->selector', function (done) {
    load(url).then(module => {
      createWorker(module, '#worker').then(function (worker) {
        worker.addEventListener('message', (e) => {
          assert.strictEqual(e.data.type, 'wasmready');
          done();
        });
      });
    });
  });
  it('no dom', function (done) {
    createWorker(url, '#worker2').catch(done);
  });
  it('wrong worker url', function (done) {
    createWorker(url, 'http://localhost:8080/worker2.js').catch(() => done());
  });
  it('wrong module url', function (done) {
    createWorker('http://localhost:8080/hello2.wasm', '#worker').catch(() => done());
  });
});