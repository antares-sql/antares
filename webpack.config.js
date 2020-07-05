
const webpack = require('webpack');

module.exports = {
   plugins: [
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
