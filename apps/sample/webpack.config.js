const path = require('path');

const SCHEDULER_DASH_SRC = path.resolve(__dirname, '../../packages/scheduler-dash/src/index.ts');

module.exports = (options) => {
  const originalExternals = options.externals ?? [];

  return {
    ...options,
    externals: [
      (ctx, callback) => {
        // Bundle the workspace package directly from source — never externalize it
        if (
          ctx.request === '@luisrodrigues/nestjs-scheduler-dashboard' ||
          (ctx.request && ctx.request.startsWith(SCHEDULER_DASH_SRC))
        ) {
          return callback();
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
        '@luisrodrigues/nestjs-scheduler-dashboard': SCHEDULER_DASH_SRC,
      },
    },
  };
};
