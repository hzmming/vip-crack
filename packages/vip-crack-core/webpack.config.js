// eslint-disable-next-line no-unused-vars
const webpack = require("webpack"),
  path = require("path"),
  fs = require("fs"),
  CleanWebpackPlugin = require("clean-webpack-plugin").CleanWebpackPlugin;

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
        test: /\.js$/,
        loader: "babel-loader",
        exclude: /node_modules/,
        options: {
          configFile: resolve("../..", "babel.config.js"),
        },
      },
    ],
  },
  resolve: {
    alias: {
      "@": resolve("src"),
    },
  },
  plugins: [
    // clean the build folder
    new CleanWebpackPlugin(),
  ],
};

if (process.env.NODE_ENV === "development") {
  options.devtool = "inline-source-map";
}

module.exports = options;
