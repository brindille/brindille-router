const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
  entry: './index.js',
  mode: process.env.NODE_ENV,
  output: {
    filename: 'bundle.js',
    path: __dirname
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: 'template.html',
      page: 'home'
    }),
    new HtmlWebpackPlugin({
      filename: 'home/index.html',
      page: 'home',
      template: 'template.html'
    }),
    new HtmlWebpackPlugin({
      filename: 'about/index.html',
      page: 'about',
      template: 'template.html'
    })
  ]
}