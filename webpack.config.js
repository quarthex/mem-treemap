const path = require('path')

const main = {
  context: path.resolve(__dirname, 'src', 'main'),
  entry: './index.js',
  output: {
    path: path.resolve(__dirname, 'app'),
    filename: 'index.js'
  },
  module: {
    rules: [
      { test: /\.js$/, loader: 'babel-loader' }
    ]
  },
  target: 'electron-main',
  node: {
    __dirname: false
  }
}

const preload = {
  context: path.resolve(__dirname, 'src', 'renderer'),
  entry: './preload.js',
  output: {
    path: path.resolve(__dirname, 'app'),
    filename: 'preload.js'
  },
  module: {
    rules: [
      { test: /\.js$/, loader: 'babel-loader' },
    ]
  },
  target: 'electron-preload'
}

const renderer = {
  context: path.resolve(__dirname, 'src', 'renderer'),
  entry: ['./index.js', './index.html'],
  output: {
    path: path.resolve(__dirname, 'app'),
    filename: 'renderer.js'
  },
  module: {
    rules: [
      { test: /\.js$/, loader: 'babel-loader' },
      { test: /\.html$/, loader: 'file-loader?name=[name].[ext]' }
    ]
  },
  target: 'electron-renderer'
}

module.exports = [main, preload, renderer]
