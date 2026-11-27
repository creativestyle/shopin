// Loads test/boot-error-config.ts wherever the BFF imports the shop config (@shopin/config): main.spec.ts.
/* eslint-disable @typescript-eslint/no-require-imports -- a CommonJS preload (node -r) */
const Module = require('node:module')
const { join } = require('node:path')

const resolve = Module._resolveFilename
Module._resolveFilename = function (request, ...rest) {
  return request === '@shopin/config'
    ? join(__dirname, 'boot-error-config.ts')
    : resolve.call(this, request, ...rest)
}
