import { convertSourceObj } from "shared/util";
const semver = require("semver");
const config = require("@/config.json");
const pick = require("lodash.pick");

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
    const plugins = await PluginUtil.get();
    const target = plugins.find(i => i.name === plugin.name);
    if (target) {
      Object.assign(target, plugin);
    } else {
      plugins.push(plugin);
    }
    return new Promise(resolve => {
      chrome.storage.local.set(
        {
          plugins: plugins,
        },
        () => resolve(true)
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
          ...pick(pluginObj, ["name", "url", "version"]),
          sourceCode,
        };
        await PluginUtil.save(wrapper);
        resolve(true);
      });
  });
}

export default PluginUtil;
