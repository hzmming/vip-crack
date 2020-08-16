import { convertSourceObj, deferred } from "shared/util";
import Config from "@/utils/Config";
const semver = require("semver");
const config = require("@/config.json");
const pick = require("lodash.pick");

let waitPromise = null;

/**
 * 插件工具类。负责插件相关操作，包括保存插件信息、同步插件等
 * plugins数据结构定义为数组
 * plugins: [{
 *  name,
 *  url,
 *  version,
 *  network,
 *  core
 * }]
 */
class PluginUtil {
  static get({ name } = {}) {
    return new Promise(resolve => {
      chrome.storage.local.get({ plugins: [] }, ({ plugins }) => {
        const result =
          typeof name !== "undefined"
            ? plugins.find(i => i.name === name)
            : plugins;
        resolve(result);
      });
    });
  }
  static async save(plugin) {
    // 并发+异步，会出现数据不同步问题。有点添加同步锁的感觉
    if (waitPromise) {
      await waitPromise;
    }
    waitPromise = deferred();
    const plugins = await PluginUtil.get();
    const target = plugins.find(i => i.name === plugin.name);
    if (target) {
      Object.assign(target, plugin);
    } else {
      plugins.push(plugin);
    }
    new Promise(resolve => {
      chrome.storage.local.set(
        {
          plugins: plugins,
        },
        () => {
          waitPromise.resolve();
          waitPromise = null;
          resolve(true);
        }
      );
    });
  }
  static sync() {
    return new Promise(resolve => {
      const pluginsPath = config.pluginsPath;
      const wait = [];
      pluginsPath.forEach(path => {
        let finalPath = path;
        if (process.env.NODE_ENV === "development") {
          finalPath = chrome.extension.getURL(
            "plugins/" + path.split("/").pop()
          );
        }
        // 此处await只是保证了生产promise，并不保证forEach循环之间的await顺序
        wait.push(fetchAndSave(finalPath));
      });
      Promise.all(wait).then(() => resolve(true));
    });
  }
}

function fetchAndSave(path) {
  return new Promise(resolve => {
    fetch(path)
      .then(res => res.text())
      .then(async sourceCode => {
        const pluginObj = convertSourceObj(sourceCode);
        const plugin = await PluginUtil.get({ name: pluginObj.name });
        if (plugin) {
          // 不是第一次，判断版本是否更新。开发模式不检测版本
          if (
            process.env.NODE_ENV !== "development" &&
            !semver.gt(pluginObj.version, plugin.version)
          )
            return;
        }
        // 保存
        const wrapper = {
          ...pick(pluginObj, [
            "name",
            "nickname",
            "description",
            "url",
            "version",
          ]),
          sourceCode,
        };
        await PluginUtil.save(wrapper);
        // 默认开启
        const enableObj = (await Config.get("enableObj")) || {};
        // 原先有值，则不动
        const preserve = enableObj[pluginObj.name];
        typeof preserve === "undefined" && (enableObj[pluginObj.name] = true);
        await Config.set("enableObj", enableObj);
        resolve(true);
      });
  });
}

export default PluginUtil;
