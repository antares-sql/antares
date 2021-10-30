const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { VueLoaderPlugin } = require('vue-loader');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const { dependencies, devDependencies, version } = require('./package.json');

const externals = Object.keys(dependencies).concat(Object.keys(devDependencies));
const isDevMode = process.env.NODE_ENV === 'development';
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
      path: path.resolve(__dirname, 'dist/app'),
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
         vue$: 'vue/dist/vue.common.js',
         common: path.resolve(__dirname, 'src/common'),
         '@': path.resolve(__dirname, 'src/renderer')
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
         'process.env': {
            PACKAGE_VERSION: `"${version}"`
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
                     additionalData: '@import "@/scss/_variables.scss";'
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
