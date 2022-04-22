const fs = require('fs');
const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { VueLoaderPlugin } = require('vue-loader');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const ProgressPlugin = require('progress-webpack-plugin');

const { dependencies, devDependencies, version } = require('./package.json');
const { contributors } = JSON.parse(fs.readFileSync('./.all-contributorsrc', 'utf-8'));
const parsedContributors = contributors.reduce((acc, c) => {
   acc.push(c.name);
   return acc;
}, []).join(',');

const externals = Object.keys(dependencies).concat(Object.keys(devDependencies));
const isDevMode = process.env.NODE_ENV !== 'production';
const whiteListedModules = ['vue'];

const config = {
   name: 'renderer',
   mode: process.env.NODE_ENV,
   devtool: isDevMode ? 'eval-source-map' : false,
   entry: {
      renderer: path.join(__dirname, './src/renderer/index.js')
   },
   target: 'electron-renderer',
   output: {
      libraryTarget: 'commonjs2',
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].js',
      publicPath: ''
   },
   node: {
      global: true,
      __dirname: isDevMode,
      __filename: isDevMode
   },
   externals: externals.filter((d) => !whiteListedModules.includes(d)),
   resolve: {
      alias: {
         // vue$: 'vue/dist/vue.common.js',
         '@': path.resolve(__dirname, 'src/renderer'),
         common: path.resolve(__dirname, 'src/common')
      },
      extensions: ['', '.js', '.vue', '.json'],
      fallback: {
         fs: false,
         path: false,
         util: false,
         crypto: false,
         assert: false,
         os: false
      }
   },
   plugins: [
      new ProgressPlugin(true),
      new HtmlWebpackPlugin({
         excludeChunks: ['processTaskWorker'],
         filename: 'index.html',
         template: path.resolve(__dirname, 'src/renderer/index.ejs'),
         nodeModules: isDevMode
            ? path.resolve(__dirname, '../node_modules')
            : false
      }),
      new MiniCssExtractPlugin({
         filename: '[name].css',
         chunkFilename: '[id].css'
      }),
      new VueLoaderPlugin(),
      new webpack.DefinePlugin({
         __VUE_OPTIONS_API__: true,
         __VUE_PROD_DEVTOOLS__: isDevMode,
         __VUE_I18N_LEGACY_API__: true,
         __VUE_I18N_FULL_INSTALL__: true,
         __INTLIFY_PROD_DEVTOOLS__: isDevMode,
         'process.env': {
            PACKAGE_VERSION: `"${version}"`,
            APP_CONTRIBUTORS: `"${parsedContributors}"`
         }
      })
   ],
   module: {
      rules: [
         {
            test: /\.js$/,
            use: 'babel-loader',
            exclude: /node_modules/
         },
         {
            test: /\.node$/,
            use: 'node-loader'
         },
         {
            test: /\.vue$/,
            loader: 'vue-loader'
         },
         {
            test: /\.s(c|a)ss$/,
            use: [
               { loader: MiniCssExtractPlugin.loader },
               { loader: 'css-loader' },
               {
                  loader: 'sass-loader',
                  options: {
                     additionalData: '@import "@/scss/_variables.scss";',
                     sassOptions: { quietDeps: true }
                  }
               }
            ]
         },
         {
            test: /\.css$/,
            use: [
               {
                  loader: MiniCssExtractPlugin.loader,
                  options: {
                     publicPath: ''
                  }
               },
               {
                  loader: 'css-loader',
                  options: {
                     url: true
                  }
               }
            ]
         },
         {
            test: /\.(png|jpe?g|gif|tif?f|bmp|webp|svg)(\?.*)?$/,
            type: 'asset/resource',
            generator: {
               filename: 'images/[hash][ext][query]'
            }
         },
         {
            test: /\.(woff|woff2|ttf|eot)$/,
            type: 'asset',
            parser: {
               dataUrlCondition: {
                  maxSize: 8 * 1024
               }
            },
            generator: {
               filename: 'fonts/[hash][ext][query]'
            }
         }
      ]
   }
};

if (isDevMode) {
   // any dev only config
   config.plugins.push(
      new webpack.HotModuleReplacementPlugin()
   );
}

module.exports = config;
