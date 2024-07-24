const fs = require('fs-extra');
const path = require('path');
const { logger } = require('@nx/devkit');
const { preserveDirectives } = require('rollup-plugin-preserve-directives');
const rootRollupConfig = require('../../../tools/scripts/rollup.config');

const rootDir = process.cwd();
const v4BuildDir = path.join(rootDir, 'dist/libs/ts-rest/react-query/');
const v5BuildDir = path.join(rootDir, 'dist/libs/ts-rest/react-query-v5/');

// spy on logger.info, and start merge process after @nx:rollup logs that it has finished
logger.info = new Proxy(logger.info, {
  apply(target, thisArg, args) {
    target.apply(thisArg, args);

    if (args[0].includes('Done in')) {
      const packageJson = fs.readJsonSync(
        path.join(v4BuildDir, 'package.json'),
      );

      packageJson['peerDependencies']['@tanstack/react-query'] =
        '^4.0.0 || ^5.0.0';

      packageJson['exports']['./v5'] = Object.fromEntries(
        Object.entries(packageJson['exports']['.']).map(([key, value]) => {
          return [key, value.replace('index', 'v5')];
        }),
      );

      fs.writeJsonSync(path.join(v4BuildDir, 'package.json'), packageJson, {
        flag: 'w+',
        replacer: null,
        spaces: 2,
      });

      fs.copySync(v5BuildDir, v4BuildDir, {
        filter: (src) => {
          return path.basename(src) !== 'package.json';
        },
      });

      fs.rmdirSync(v5BuildDir, { recursive: true });

      logger.info(
        '\nMerged @ts-rest/react-query-v5 into @ts-rest/react-query/v5',
      );
    }
  },
});

/** @type {import("rollup").RollupOptionsFunction} */
const rollupConfig = (config) => {
  const rootConfig = rootRollupConfig(config);

  return {
    ...rootConfig,
    /** @type {import("rollup").OutputOptions} */
    output: {
      ...rootConfig.output,

      // do not bundle all modules into one file, since some modules have "use client" directives
      preserveModules: true,
    },
    plugins: [
      ...rootConfig.plugins,

      // rollup strips directives, so we use this plugin to preserve them
      preserveDirectives(),
    ],
    onwarn(warning, rollupWarn) {
      if (warning.code === 'MODULE_LEVEL_DIRECTIVE') {
        return;
      }
      rollupWarn(warning);
    },
  };
};

module.exports = rollupConfig;
