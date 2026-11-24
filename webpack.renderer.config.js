const fs = require('fs');
const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { VueLoaderPlugin } = require('vue-loader');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const ProgressPlugin = require('progress-webpack-plugin');

const { version } = require('./package.json');
const { contributors } = JSON.parse(fs.readFileSync('./.all-contributorsrc', 'utf-8'));
const parsedContributors = contributors.reduce((acc, c) => {
   acc.push(c.name);
   return acc;
}, []).join(',');

const isDevMode = process.env.NODE_ENV !== 'production';
// Right-to-left languages: adds [dir="rtl"] overrides that mirror the direction-dependent declarations
// (margins, paddings, positions, floats, text alignment...); the left-to-right CSS stays unchanged.
// The prefix is wrapped in :where() so an override has the specificity of the rule it mirrors
// and doesn't beat rules that win over that one in LTR (e.g. `[dir="rtl"] ul` over `.tab`).
const rtlCssLoader = {
   loader: 'postcss-loader',
   options: {
      postcssOptions: {
         plugins: [require('postcss-rtlcss')({
            mode: require('postcss-rtlcss/options').Mode.override,
            prefixSelectorTransformer: (prefix, selector) => /^(html|:root)(?=\W|$)/.test(selector)
               ? undefined // Default handling: html[dir="rtl"]
               : `:where(${prefix}) ${selector}`
         })]
      }
   }
};

const whiteListedModules = ['.bin'];
const externals = {};

fs.readdirSync('node_modules')
   .filter(x => whiteListedModules.indexOf(x) === -1)
   .forEach(mod => {
      externals[mod] = `commonjs ${mod}`;
   });

const config = {
   name: 'renderer',
   mode: process.env.NODE_ENV,
   devtool: isDevMode ? 'eval-source-map' : false,
   entry: path.join(__dirname, './src/renderer/index.ts'),
   target: 'electron-renderer',
   output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'renderer.js'
   },
   node: {
      global: true,
      __dirname: isDevMode,
      __filename: isDevMode
   },
   externals: externals,
   resolve: {
      alias: {
         '@': path.resolve(__dirname, 'src/renderer'),
         common: path.resolve(__dirname, 'src/common')
      },
      extensions: ['', '.js', '.vue', '.ts', '.json'],
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
         __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false,
         __VUE_I18N_LEGACY_API__: false,
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
            test: /\.vue$/,
            loader: 'vue-loader'
         },
         {
            test: /\.node$/,
            use: 'node-loader'
         },
         {
            test: /\.ts$/,
            exclude: /node_modules/,
            loader: 'ts-loader',
            options: {
               appendTsSuffixTo: [/.vue$/],
               transpileOnly: true
            }
         },
         {
            test: /\.s(c|a)ss$/,
            use: [
               { loader: MiniCssExtractPlugin.loader },
               { loader: 'css-loader' },
               rtlCssLoader,
               {
                  loader: 'sass-loader',
                  options: {
                     additionalData: `
                        $platform: ${process.platform};
                        @import "@/scss/_variables.scss";`,
                     // charset: false → no BOM/@charset in compressed (production) output: once the
                     // stylesheets are concatenated, a BOM in the middle breaks the next selector
                     sassOptions: { quietDeps: true, charset: false }
                  }
               }
            ]
         },
         {
            test: /\.css$/,
            // Plain <style> blocks of the components are mirrored too, third party stylesheets aren't
            oneOf: [false, true].map(mirror => ({
               ...(mirror ? {} : { include: /node_modules/ }),
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
                  },
                  ...(mirror ? [rtlCssLoader] : [])
               ]
            }))
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
