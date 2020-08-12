const semver = require("semver");
const config = require("@/config.json");

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
      chrome.storage.sync.get({ plugins: [] }, ({ plugins }) => {
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
      chrome.storage.sync.set(
        {
          plugins
        },
        () => resolve(true)
      );
    });
  }
  static sync() {
    return new Promise(resolve => {
      const pluginsPath = config.pluginsPath;
      const wait = [];
      pluginsPath.forEach(async path => {
        let finalPath = path;
        if (process.env.NODE_ENV === "development") {
          finalPath = chrome.extension.getURL(
            "plugins/" + path.split("/").pop()
          );
        }
        // 此处await只是保证了生产promise，并不保证forEach循环之间的await顺序
        wait.push(await fetchAndSave(finalPath));
      });
      Promise.all(wait).then(() => resolve(true));
    });
  }
}

async function fetchAndSave(path) {
  const sourceCode = await fetch(path).then(res => res.text());
  // eslint-disable-next-line no-unused-vars
  const VIP_CRACK_INSTALL = async pluginObj => {
    const plugin = await PluginUtil.get({ name: pluginObj.name });
    // 不是第一次，判断版本是否更新
    if (plugin && !semver.gt(pluginObj.version, plugin.version)) return;
    // 保存
    PluginUtil.save(plugin);
  };
  eval(sourceCode);
}

export default PluginUtil;
