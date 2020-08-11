const semver = require("semver");

/**
 * 插件工具类。负责插件相关操作，包括保存插件信息、同步插件等
 * plugins数据结构定义为对象吧
 * plugins: {
 *  name: "plugin source code"
 * }
 */
class PluginUtil {
  static get({ name } = {}) {
    return new Promise(resolve => {
      chrome.storage.sync.get({ plugins: {} }, ({ plugins }) => {
        const result = typeof name !== "undefined" ? plugins[name] : plugins;
        resolve(result);
      });
    });
  }
  static async save(plugin) {
    const plugins = await PluginUtil.get();
    plugins[plugin.name] = plugin;
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
    chrome.storage.sync.get({ config: {} }, ({ config }) => {
      const pluginsPath = config.pluginsPath;
      pluginsPath.forEach(async path => {
        await fetchAndSave(path);
      });
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
