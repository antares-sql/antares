const webpack = require('webpack');
const MonacoEditorPlugin = require('monaco-editor-webpack-plugin');

module.exports = {
   plugins: [
      new MonacoEditorPlugin({
         languages: ['sql']
      }),
      new webpack.DefinePlugin({
         'process.env': {
            PACKAGE_VERSION: JSON.stringify(require('./package.json').version)
         }
      })
   ],
   module: {
      rules: [
         {
            test: /\.scss$/,
            use: [
               {
                  loader: 'sass-loader',
                  options: {
                     additionalData: '@import "@/scss/_variables.scss";'
                  }
               }
            ]
         }
      ]
   }
};
