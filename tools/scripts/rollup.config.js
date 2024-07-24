/** @type {import("rollup").RollupOptionsFunction} */
const rollupConfig = (config) => {
  return {
    ...config,
    external: (source, importer, isResolved) => {
      if (source.startsWith('@ts-rest/')) {
        return true;
      }
      return config.external(source, importer, isResolved);
    },
    plugins: [...config.plugins]
  }
}

module.exports = rollupConfig
