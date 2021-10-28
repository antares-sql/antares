const path = require('path');
const webpack = require('webpack');
const { VueLoaderPlugin } = require('vue-loader');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = [
   { // Main
      mode: 'development',
      entry: './src/main/main.js',
      target: 'electron-main',
      output: {
         path: path.resolve(__dirname, 'dist/main'),
         filename: 'main.js',
         publicPath: ''
      },
      node: {
         __dirname: true
      },
      resolve: {
         alias: {
            common: path.resolve(__dirname, 'src/common')
         },
         fallback: {
            'pg-native': false,
            'cpu-features': false,
            cardinal: false
         }
      },
      plugins: [
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
            // {
            //    test: /\.js$/,
            //    exclude: /node_modules/,
            //    use: {
            //       loader: 'babel-loader',
            //       options: {
            //          presets: ['@babel/preset-env']
            //       }
            //    }
            // },
            {
               test: /\.(png|jpg|gif)$/,
               use: [{
                  loader: 'file-loader',
                  options: {}
               }]
            }
         ]
      }
   },
   { // Renderer
      mode: 'development',
      entry: './src/renderer/index.js',
      target: ['web', 'electron-renderer'],
      output: {
         path: path.resolve(__dirname, 'dist/renderer'),
         filename: 'index.js',
         publicPath: ''
      },
      resolve: {
         alias: {
            common: path.resolve(__dirname, 'src/common'),
            '@': path.resolve(__dirname, 'src/renderer')
         },
         extensions: ['', '.js', '.vue'],
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
         new CleanWebpackPlugin({ root: path.join(__dirname, 'dist') }),
         new CopyPlugin({
            patterns: [
               {
                  from: 'src/renderer/index.html',
                  to: 'index.html',
                  toType: 'file'
               }
            ]
         }),
         new VueLoaderPlugin(),
         new webpack.DefinePlugin({
            'process.env': {
               PACKAGE_VERSION: JSON.stringify(require('./package.json').version)
            }
         })
      ],
      module: {
         rules: [
            {
               test: /\.css$/i,
               use: ['style-loader', 'css-loader']
            },
            {
               test: /\.scss$/,
               use: [
                  'style-loader',
                  'css-loader',
                  {
                     loader: 'sass-loader',
                     options: {
                        additionalData: '@import "@/scss/_variables.scss";'
                     }
                  }
               ]
            },
            {
               test: /\.(woff|woff2|ttf|eot)$/,
               loader: 'file-loader',
               options: {
                  name: '[name].[ext]',
                  outputPath: 'fonts',
                  publicPath: 'fonts'
               },
               include: /node_modules/
            },
            {
               test: /\.vue$/,
               loader: 'vue-loader'
            },
            {
               test: /\.(png|svg|jpg|jpeg|gif)$/i,
               type: 'asset/resource'
            }
         ]
      }
   }
];
