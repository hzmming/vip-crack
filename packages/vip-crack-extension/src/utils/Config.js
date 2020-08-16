import { deferred } from "shared/util";

const waitPromise = {};

/**
 * 配置类。负责配置相关操作：包括是否开启、当前选择源等等
 * 数据格式为
 * config: {
 *  enable: true,
 *  selectedSourceId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
 *  ...
 * }
 */
class Config {
  static async get(key) {
    if (waitPromise[key]) {
      await waitPromise[key];
    }
    return new Promise(resolve => {
      chrome.storage.sync.get({ config: {} }, ({ config }) => {
        const result = typeof key !== "undefined" ? config[key] : config;
        resolve(result);
      });
    });
  }
  static async set(key, val) {
    // 还是用数据库吧。。。这并发异步问题，能整死人
    if (waitPromise[key]) {
      await waitPromise[key];
    }
    waitPromise[key] = deferred();
    return new Promise(resolve => {
      chrome.storage.sync.get({ config: {} }, async ({ config }) => {
        config[key] = val;
        await Config.override(config);
        resolve(true);
        waitPromise[key].resolve();
        waitPromise[key] = undefined;
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
          config,
        },
        () => resolve(true)
      );
    });
  }
}
export default Config;
