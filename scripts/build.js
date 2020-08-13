const webpack = require("webpack"),
  config = require("../webpack.config");

delete config.chromeExtensionBoilerplate;

webpack(config, function (err, stats) {
  // https://webpack.js.org/api/node/#error-handling
  if (err) {
    console.error(err.stack || err);
    if (err.details) {
      console.error(err.details);
    }
    return;
  }

  const info = stats.toJson();

  if (stats.hasErrors()) {
    console.error(info.errors);
  }

  if (stats.hasWarnings()) {
    console.warn(info.warnings);
  }
});
