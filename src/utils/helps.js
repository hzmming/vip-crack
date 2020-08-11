export function uuid() {
  return performance.now().toString();
}

const isSuit = pluginObj => {
  return pluginObj.url && location.origin.includes(pluginObj.url);
};

export function getActivePlugins(plugins) {
  const activePlugins = plugins.filter(plugin => {
    return isSuit(plugin);
  });
  return activePlugins;
}
