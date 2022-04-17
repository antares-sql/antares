const path = require('path');
const webpack = require('webpack');
const ProgressPlugin = require('progress-webpack-plugin');

const { dependencies, devDependencies, version } = require('./package.json');

const externals = Object.keys(dependencies).concat(Object.keys(devDependencies));
const isDevMode = process.env.NODE_ENV === 'development';
const whiteListedModules = [];

const config = {
   name: 'workers',
   mode: process.env.NODE_ENV,
   devtool: isDevMode ? 'eval-source-map' : false,
   entry: {
      exporter: path.join(__dirname, './src/main/workers/exporter.ts'),
      importer: path.join(__dirname, './src/main/workers/importer.ts')
   },
   target: 'node',
   output: {
      libraryTarget: 'commonjs2',
      path: path.join(__dirname, 'dist'),
      filename: '[name].js'
   },
   node: {
      global: true,
      __dirname: isDevMode,
      __filename: isDevMode
   },
   externals: externals.filter((d) => !whiteListedModules.includes(d)),
   module: {
      rules: [
         {
            test: /\.ts$/,
            exclude: /node_modules/,
            loader: 'ts-loader'
         },
         {
            test: /\.js$/,
            use: 'babel-loader',
            exclude: /node_modules/
         },
         {
            test: /\.node$/,
            use: 'node-loader'
         }
      ]
   },
   resolve: {
      extensions: ['.js', '.json', '.ts'],
      alias: {
         src: path.join(__dirname, 'src/'),
         common: path.resolve(__dirname, 'src/common')
      },
      fallback: {
         'pg-native': false,
         'cpu-features': false,
         cardinal: false
      }
   },
   plugins: [
      new ProgressPlugin(true),
      new webpack.DefinePlugin({
         'process.env': {
            PACKAGE_VERSION: `"${version}"`
         }
      })
   ]
};

/**
 * Adjust rendererConfig for production settings
 */
if (isDevMode) {
   // any dev only config
   config.plugins.push(new webpack.HotModuleReplacementPlugin());
}
else {
   config.plugins.push(
      new webpack.LoaderOptionsPlugin({
         minimize: true
      })
   );
}

module.exports = config;
