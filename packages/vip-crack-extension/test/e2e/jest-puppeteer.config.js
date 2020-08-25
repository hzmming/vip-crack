const pathToExtension =
  "F:/demo/vip-crack-pro/vip-crack-refactor/packages/vip-crack-extension/build";

module.exports = {
  launch: {
    headless: false,
    defaultViewport: null,
    executablePath:
      "c:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    args: [
      "--start-maximized",
      "--autoplay-policy=no-user-gesture-required",
      `--disable-extensions-except=${pathToExtension}`,
      `--load-extension=${pathToExtension}`,
      // 静音
      "--mute-audio",
    ],
  },
};
