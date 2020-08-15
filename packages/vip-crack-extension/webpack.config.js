// eslint-disable-next-line no-unused-vars
const webpack = require("webpack"),
  path = require("path"),
  fs = require("fs"),
  env = require("./scripts/env"),
  CleanWebpackPlugin = require("clean-webpack-plugin").CleanWebpackPlugin,
  CopyWebpackPlugin = require("copy-webpack-plugin"),
  FriendlyErrorsWebpackPlugin = require("friendly-errors-webpack-plugin"),
  HtmlWebpackPlugin = require("html-webpack-plugin"),
  WriteFilePlugin = require("write-file-webpack-plugin");

const cwd = process.cwd();
function resolve(...dir) {
  return path.join(cwd, ...dir);
}

// load the secrets
const alias = {};

const secretsPath = resolve("secrets." + env.NODE_ENV + ".js");

const fileExtensions = [
  "jpg",
  "jpeg",
  "png",
  "gif",
  "eot",
  "otf",
  "svg",
  "ttf",
  "woff",
  "woff2",
];

if (fs.existsSync(secretsPath)) {
  alias["secrets"] = secretsPath;
}

let options = {
  mode: process.env.NODE_ENV || "development",
  entry: {
    popup: resolve("src", "popup/popup.js"),
    options: resolve("src", "options/options.js"),
    background: resolve("src", "background.js"),
    injects: resolve("src", "injects.js"),
    content: resolve("src", "content.js"),
  },
  chromeExtensionBoilerplate: {
    notHotReload: [resolve("src", "injects.js"), resolve("src", "content.js")],
  },
  output: {
    path: resolve("build"),
    filename: "[name].js",
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: [
          {
            loader: "babel-loader",
            options: {
              configFile: resolve("../..", "babel.config.js"),
            },
          },
          "eslint-loader",
        ],
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader", "postcss-loader"],
        exclude: /node_modules/,
      },
      {
        test: /\.s[ac]ss$/i,
        use: [
          // Creates `style` nodes from JS strings
          "style-loader",
          // Translates CSS into CommonJS
          {
            loader: "css-loader",
            // 官方说，css-loader 前面有几个 loader，就设置多少。默认值：0
            // TODO 但我不设置，也没影响啊，不懂
            options: {
              importLoaders: 2,
            },
          },
          "postcss-loader",
          // Compiles Sass to CSS
          "sass-loader",
        ],
        exclude: /node_modules/,
      },
      {
        test: new RegExp(".(" + fileExtensions.join("|") + ")$"),
        loader: "file-loader?name=[name].[ext]",
        exclude: /node_modules/,
      },
      {
        test: /\.html$/,
        loader: "html-loader",
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    alias: {
      ...alias,
      "@": resolve("src"),
    },
  },
  plugins: [
    // clean the build folder
    new CleanWebpackPlugin(),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: "src/manifest.json",
          transform: function (content) {
            // generates the manifest file using the package.json information
            return Buffer.from(
              JSON.stringify({
                description: process.env.npm_package_description,
                version: process.env.npm_package_version,
                ...JSON.parse(content.toString()),
              })
            );
          },
        },
        { from: "src/assets", to: "assets" },
        { from: "src/icons", to: "icons" },
        // 配置就不做动态获取了，省点事
        // { from: "src/config.json", to: "config.json" }
        { from: "src/apiList.json", to: "apiList.json" },
        {
          from: "plugins",
          to: "plugins",
          context: resolve("../vip-crack-core/dist"),
        },
      ],
    }),
    new HtmlWebpackPlugin({
      template: resolve("src", "popup/popup.html"),
      filename: "popup.html",
      chunks: ["popup"],
    }),
    new HtmlWebpackPlugin({
      template: resolve("src", "options/options.html"),
      filename: "options.html",
      chunks: ["options"],
    }),
    new WriteFilePlugin(),
    new FriendlyErrorsWebpackPlugin({
      clearConsole: true,
    }),
  ],
};

if (env.NODE_ENV === "development") {
  // options.devtool = "cheap-module-eval-source-map";
  options.devtool = "inline-source-map";
}

module.exports = options;
