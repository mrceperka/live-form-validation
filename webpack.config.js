const path = require('path')
const webpack = require('webpack')
const { CheckerPlugin } = require('awesome-typescript-loader')
const nodeExternals = require('webpack-node-externals')

module.exports = {
  entry: path.resolve(__dirname, 'src/index'),
  output: {
    path: path.join(__dirname, 'lib'),
    filename: 'main.js',
    library: 'ContributteLiveForm',
    libraryTarget: 'umd',
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  externals: [nodeExternals()],
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: 'babel-loader',
      },
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: [{ loader: 'awesome-typescript-loader' }],
      },
    ],
  },
  plugins: [new CheckerPlugin()],
}
