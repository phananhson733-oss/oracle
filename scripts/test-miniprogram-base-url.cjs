const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const context = {
  console,
  wx: {
    getStorageSync: () => '',
    setStorageSync: () => {},
    removeStorageSync: () => {},
    request: () => {},
    getAccountInfoSync: () => ({ miniProgram: { envVersion: 'develop' } }),
  },
  getApp: () => ({ globalData: {} }),
};

const resolveModulePath = (baseDir, request) => {
  let resolved = path.resolve(baseDir, request);
  if (!path.extname(resolved)) {
    const withJs = `${resolved}.js`;
    if (fs.existsSync(withJs)) {
      resolved = withJs;
    }
  }
  return resolved;
};

const loadModule = (filePath) => {
  const code = fs.readFileSync(filePath, 'utf8');
  const module = { exports: {} };
  const dirname = path.dirname(filePath);
  const wrapped = `(function (require, module, exports, __filename, __dirname) {\n${code}\n})`;
  const script = new vm.Script(wrapped, { filename: filePath });
  const fn = script.runInNewContext(context);
  const localRequire = (request) => {
    if (request.startsWith('./') || request.startsWith('../')) {
      const resolved = resolveModulePath(dirname, request);
      return loadModule(resolved);
    }
    return require(request);
  };
  fn(localRequire, module, module.exports, filePath, dirname);
  return module.exports;
};

const requestModule = loadModule(path.resolve(__dirname, '../astromind/miniprogram/utils/request.js'));
const baseUrl = requestModule.getBaseUrl();

assert.strictEqual(
  baseUrl,
  'http://127.0.0.1:3001',
  `Expected dev base URL to be http://127.0.0.1:3001, got ${baseUrl}`
);

console.log('OK - dev base URL defaulted to localhost');
