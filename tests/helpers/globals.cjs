const fs = require('node:fs');
const vm = require('node:vm');
exports.load = (file, name, overrides = {}) => {
  const ctx = { window: overrides }; vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(file, 'utf8'), ctx);
  return ctx.window[name];
};
