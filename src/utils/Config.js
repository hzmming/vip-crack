/**
 * 配置类。负责配置相关操作：包括是否开启、当前选择源等等
 * 数据格式为
 * config: {
 *  enable: true,
 *  selectedSource: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
 *  ...
 * }
 */
class Config {
  static get({ key } = {}) {
    return new Promise(resolve => {
      chrome.storage.sync.get({ config: {} }, ({ config }) => {
        const result = typeof key !== "undefined" ? config[key] : config;
        resolve(result);
      });
    });
  }
  static set(key, val) {
    return new Promise(resolve => {
      chrome.storage.sync.get({ config: {} }, async ({ config }) => {
        config[key] = val;
        await Config.override(config);
        resolve(true);
      });
    });
  }
  static setObj(obj) {
    return new Promise(resolve => {
      chrome.storage.sync.get({ config: {} }, async ({ config }) => {
        Object.assign(config, obj);
        await Config.override(config);
        resolve(true);
      });
    });
  }
  static override(config) {
    return new Promise(resolve => {
      chrome.storage.sync.set(
        {
          config
        },
        () => resolve(true)
      );
    });
  }
}
export default Config;
