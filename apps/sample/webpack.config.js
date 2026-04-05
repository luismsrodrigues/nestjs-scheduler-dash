const path = require('path');

const WORKSPACE_PACKAGES = ['scheduler-dash'];

module.exports = (options) => {
  const originalExternals = options.externals ?? [];

  return {
    ...options,
    externals: [
      (ctx, callback) => {
        if (WORKSPACE_PACKAGES.includes(ctx.request)) {
          return callback(); // bundle workspace packages instead of externalizing
        }
        const first = Array.isArray(originalExternals)
          ? originalExternals.find((e) => typeof e === 'function')
          : typeof originalExternals === 'function'
          ? originalExternals
          : null;

        return first ? first(ctx, callback) : callback();
      },
    ],
    resolve: {
      ...options.resolve,
      alias: {
        ...options.resolve?.alias,
        'scheduler-dash': path.resolve(__dirname, '../../packages/scheduler-dash/src/index.ts'),
      },
    },
  };
};
