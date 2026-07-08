// CJS passthrough shim for next-intl/routing — ESM-only, can't be loaded by Jest directly.
function defineRouting(config) {
  return config
}
module.exports = { defineRouting }
