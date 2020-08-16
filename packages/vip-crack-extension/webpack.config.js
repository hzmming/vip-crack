// eslint-disable-next-line no-unused-vars
const webpack = require("webpack"),
  path = require("path"),
  fs = require("fs"),
  env = require("./scripts/env"),
  { CleanWebpackPlugin } = require("clean-webpack-plugin"),
  CopyWebpackPlugin = require("copy-webpack-plugin"),
  FriendlyErrorsWebpackPlugin = require("friendly-errors-webpack-plugin"),
  HtmlWebpackPlugin = require("html-webpack-plugin"),
  VueLoaderPlugin = require("vue-loader/lib/plugin"),
  WebpackBar = require("webpackbar"),
  WriteFilePlugin = require("write-file-webpack-plugin");

const cwd = process.cwd();
function resolve(...dir) {
  return path.join(cwd, ...dir);
}

// load the secrets
const alias = {};

const secretsPath = resolve("secrets." + env.NODE_ENV + ".js");

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
        test: /\.vue$/,
        use: ["vue-loader"],
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
          "eslint-loader",
        ],
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader", "postcss-loader"],
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
      },
      // images
      {
        test: /\.(png|jpe?g|gif|webp)(\?.*)?$/,
        use: [
          {
            loader: "url-loader",
            options: {
              limit: 4096,
              fallback: {
                loader: "file-loader",
                options: {
                  name: "img/[name].[hash:8].[ext]",
                  // 转成 esModule 的好处我还没体验到，但直接让我图片变成[object%20Module]出不来了~~
                  esModule: false,
                },
              },
            },
          },
        ],
      },
      // svg
      {
        test: /\.(svg)(\?.*)?$/,
        use: [
          {
            loader: "file-loader",
            options: {
              name: "img/[name].[hash:8].[ext]",
              esModule: false,
            },
          },
        ],
      },
      // fonts
      {
        test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/i,
        use: [
          {
            loader: "url-loader",
            options: {
              limit: 4096,
              fallback: {
                loader: "file-loader",
                options: {
                  name: "fonts/[name].[hash:8].[ext]",
                  esModule: false,
                },
              },
            },
          },
        ],
      },
      // media
      {
        test: /\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/,
        use: [
          {
            // 参考 vue-cli 生成的 webpack 配置。话说 url-loader 处理视频会变成什么~~
            loader: "url-loader",
            options: {
              limit: 4096,
              fallback: {
                loader: "file-loader",
                options: {
                  name: "media/[name].[hash:8].[ext]",
                  esModule: false,
                },
              },
            },
          },
        ],
      },
      {
        test: /\.html$/,
        loader: "html-loader",
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".js", ".vue", ".json"],
    alias: {
      ...alias,
      "@": resolve("src"),
    },
  },
  plugins: [
    // clean the build folder
    new CleanWebpackPlugin(),
    new WebpackBar(),
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
    new VueLoaderPlugin(),
  ],
};

if (env.NODE_ENV === "development") {
  // options.devtool = "cheap-module-eval-source-map";
  options.devtool = "inline-source-map";
}

module.exports = options;
