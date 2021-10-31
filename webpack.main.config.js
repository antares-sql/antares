const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const ProgressPlugin = require('progress-webpack-plugin');

const { dependencies, devDependencies } = require('./package.json');

const externals = Object.keys(dependencies).concat(Object.keys(devDependencies));
const isDevMode = process.env.NODE_ENV === 'development';
const whiteListedModules = [];

module.exports = [
   { // Main
      name: 'main',
      mode: process.env.NODE_ENV,
      devtool: isDevMode ? 'eval-source-map' : false,
      entry: {
         main: path.join(__dirname, './src/main/main.js')
      },
      target: 'electron-main',
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
      resolve: {
         extensions: ['.js', '.json'],
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
         new CleanWebpackPlugin({ root: path.join(__dirname, 'dist') })
      ],
      module: {
         rules: [
            {
               test: /\.node$/,
               loader: 'node-loader',
               options: {
                  name: '[path][name].[ext]'
               }
            },
            {
               test: /\.js$/,
               exclude: /node_modules/,
               loader: 'babel-loader'
            },
            {
               test: /\.(png|jpg|gif)$/,
               use: [{
                  loader: 'file-loader'
               }]
            }
         ]
      }
   }
];
