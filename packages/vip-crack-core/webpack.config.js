// eslint-disable-next-line no-unused-vars
const webpack = require("webpack"),
  path = require("path"),
  fs = require("fs"),
  CleanWebpackPlugin = require("clean-webpack-plugin").CleanWebpackPlugin,
  FriendlyErrorsWebpackPlugin = require("friendly-errors-webpack-plugin"),
  WebpackBar = require("webpackbar");

const cwd = process.cwd();
function resolve(...dir) {
  return path.join(cwd, ...dir);
}

// 扩展插件单独打包
const pluginsPath = resolve("src/plugins");
const pluginsEntry = {};
fs.readdirSync(pluginsPath).forEach(pluginName => {
  pluginsEntry["plugins/" + pluginName.replace(/\.js$/, "")] =
    pluginsPath + "/" + pluginName;
});

const options = {
  mode: process.env.NODE_ENV || "development",
  entry: {
    index: "./src/index.js",
    ...pluginsEntry,
  },
  output: {
    path: resolve("dist"),
    filename: "[name].js",
  },
  module: {
    rules: [
      {
        enforce: "pre",
        test: /\.(js|vue)$/,
        loader: "eslint-loader",
        // TODO 使用 yarn workspace 后，配置文件会往上找到根目录的 .eslintrc，但根目录的 .eslintignore 却不起作用，先用 include 缩小范围
        include: [resolve("src")],
        exclude: /node_modules/,
      },
      {
        test: /\.js$/,
        use: [
          {
            loader: "babel-loader",
            options: {
              // 向上找babel.config.js/json。也可以使用configFile自定义位置
              rootMode: "upward",
            },
          },
        ],
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    alias: {
      "@": resolve("src"),
    },
  },
  plugins: [
    new webpack.EnvironmentPlugin(["NODE_ENV", "ENV"]),
    // clean the build folder
    new CleanWebpackPlugin(),
    new WebpackBar(),
    new FriendlyErrorsWebpackPlugin({
      clearConsole: true,
    }),
  ],
};

if (process.env.NODE_ENV === "development") {
  options.devtool = "inline-source-map";
}

module.exports = options;
