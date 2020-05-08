module.exports = {
   module: {
      rules: [
         {
            test: /\.scss$/,
            use: [
               {
                  loader: 'sass-loader',
                  options: {
                     prependData: '@import "@/scss/_variables.scss";'
                  }
               }
            ]
         }
      ]
   }
};
