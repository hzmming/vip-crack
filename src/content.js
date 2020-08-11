import PluginUtil from "@/utils/PluginUtil";
import { getActivePlugins } from "@/utils/helps";
// 判断是否开启

// 1. 获取插件
PluginUtil.get().then(plugins => {
  const activePlugins = getActivePlugins(plugins);
  if (activePlugins.length) {
    // 2. 点亮图标
    chrome.runtime.sendMessage({ enableVipCrack: true });
    // 3. 启动破解
    window.postMessage(
      { registerCrackPlugin: true, plugins: activePlugins },
      "*"
    );
  }
});
