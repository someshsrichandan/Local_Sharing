const webpack = require('webpack');

module.exports = function override(config) {
  // Polyfill Node.js process in the browser
  config.resolve.fallback = {
    ...config.resolve.fallback,
    process: require.resolve('process/browser'),
  };

  // Provide the polyfill for the process global variable
  config.plugins = (config.plugins || []).concat([
    new webpack.ProvidePlugin({
      process: 'process/browser',
    }),
  ]);

  return config;
};
