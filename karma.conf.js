module.exports = function(config) {
  config.set({
    // 路径前缀
    basePath: '',

    // 用到的库或框架
    // 添加到这里表示注册为全局变量（不用反复在代码中 import 或 require）
    frameworks: ['mocha', 'chai'],

    // 需要提供给浏览器的源文件和测试文件
    files: ['es/**/*.js', 'test/**/*.js'],

    preprocessors: {
      // 匹配源文件，并使用 webpack 进行预处理
      'es/**/*.js': ['webpack'],
      // 匹配测试文件，并使用 webpack 进行预处理
      'test/**/*.js': ['webpack']
    },

    reporters: ['mocha'],

    // 在浏览器中运行的端口
    port: 8081,

    // 需要测试的浏览器环
    browsers: ['Chrome'],
    webpack: {
      mode: 'development',
      module: {
        rules: [
          {
            // 匹配 JavaScript 文件
            test: /\.js$/,
            // 排除 node_modules 和 bower_components 目录
            exclude: /(node_modules|bower_components)/,
            use: {
              // 使用的 loader
              loader: 'babel-loader',
              // 传递给 babel-loader 的参数
              options: {
                presets: ['@babel/preset-env'],
                plugins: ['@babel/plugin-transform-runtime']
              }
            }
          }
        ]
      }
    },
  });
};