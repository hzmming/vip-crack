const webpack = require("webpack"),
  path = require("path"),
  fs = require("fs"),
  env = require("./scripts/env"),
  CleanWebpackPlugin = require("clean-webpack-plugin").CleanWebpackPlugin,
  CopyWebpackPlugin = require("copy-webpack-plugin"),
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
  "woff2"
];

if (fs.existsSync(secretsPath)) {
  alias["secrets"] = secretsPath;
}

let options = {
  mode: process.env.NODE_ENV || "development",
  entry: {
    popup: resolve("src", "popup/popup.js"),
    options: resolve("src", "options/options.js"),
    background: resolve("src", "background.js")
  },
  output: {
    path: resolve("build"),
    filename: "[name].bundle.js"
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: "babel-loader",
        exclude: /node_modules/
      },
      {
        test: /\.css$/,
        loader: "style-loader!css-loader",
        exclude: /node_modules/
      },
      {
        test: new RegExp(".(" + fileExtensions.join("|") + ")$"),
        loader: "file-loader?name=[name].[ext]",
        exclude: /node_modules/
      },
      {
        test: /\.html$/,
        loader: "html-loader",
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    alias: {
      ...alias,
      "@": resolve("src")
    }
  },
  plugins: [
    // clean the build folder
    new CleanWebpackPlugin(),
    // expose and write the allowed env vars on the compiled bundle
    new webpack.EnvironmentPlugin(["NODE_ENV"]),
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
                ...JSON.parse(content.toString())
              })
            );
          }
        },
        { from: "src/assets", to: "assets" },
        { from: "src/icons", to: "icons" }
      ]
    }),
    new HtmlWebpackPlugin({
      template: resolve("src", "popup/popup.html"),
      filename: "popup.html",
      chunks: ["popup"]
    }),
    new HtmlWebpackPlugin({
      template: resolve("src", "options/options.html"),
      filename: "options.html",
      chunks: ["options"]
    }),
    new WriteFilePlugin()
  ]
};

if (env.NODE_ENV === "development") {
  options.devtool = "cheap-module-eval-source-map";
}

module.exports = options;
