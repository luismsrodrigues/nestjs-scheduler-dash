const path = require('path');

const SCHEDULER_DASH_SRC = path.resolve(__dirname, '../../packages/scheduler-dash/src/index.ts');

module.exports = (options) => ({
  ...options,
  node: {
    __dirname: true, // webpack replaces __dirname with the source file's path at build time
  },
  externals: [
    (ctx, callback) => {
      const req = ctx.request;
      if (!req) return callback();

      // Bundle the workspace package directly from source — never externalize it
      if (req === '@luisrodrigues/nestjs-scheduler-dashboard') return callback();

      // Externalize all other node_modules (anything that isn't a relative or absolute path)
      if (!req.startsWith('.') && !path.isAbsolute(req)) {
        return callback(null, `commonjs ${req}`);
      }

      return callback();
    },
  ],
  resolve: {
    ...options.resolve,
    alias: {
      ...options.resolve?.alias,
      '@luisrodrigues/nestjs-scheduler-dashboard': SCHEDULER_DASH_SRC,
    },
  },
});
