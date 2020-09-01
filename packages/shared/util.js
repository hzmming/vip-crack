import { v4 } from "uuid";
import { log } from "./message";

export function uuid() {
  return v4();
}

export const isSuit = pluginObj => {
  return pluginObj.url && location.href.includes(pluginObj.url);
};

export function getActivePlugins(plugins) {
  const activePlugins = plugins.filter(plugin => {
    return isSuit(plugin);
  });
  log(`匹配${activePlugins.length ? "成功" : "失败"}，网址：${location.href}`);
  return activePlugins;
}

export function deferred() {
  // 搜索关键字：how to resolve promise outside
  // https://stackoverflow.com/questions/26150232/resolve-javascript-promise-outside-function-scope
  let resolveOut, rejectOut;
  const defer = new Promise((resolve, reject) => {
    resolveOut = resolve;
    rejectOut = reject;
  });
  defer.resolve = resolveOut;
  defer.reject = rejectOut;
  defer
    .catch(() => {})
    .then(() => {
      // 连个查看pending状态都没有，还得自己hack，我服了
      // https://stackoverflow.com/questions/36294109/how-to-check-if-a-promise-is-pending
      defer.done = true;
    });
  return defer;
}

export function hasOwnProperty(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

export function getPrototype(obj) {
  return Object.prototype.toString.call(obj).slice(8, -1);
}

/**
 * query格式化
 * @param {参数} data
 */
export function queryStringify(data) {
  const keyValues = [];
  Object.keys(data).forEach(key => {
    keyValues.push(`${key}=${data[key]}`);
  });
  return keyValues.join("&");
}

export function generateRequestParams(
  videoUrl,
  { url, method, param, headers }
) {
  const isPost = method === "POST";
  const keyParam = queryStringify({ [param]: videoUrl });
  const options = {
    url: url + (isPost ? "" : `?${keyParam}`),
    options: {
      method: method || "GET",
      headers: headers || {},
      body: isPost ? keyParam : null,
    },
  };
  return options;
}

/**
 * 获取给定url的域名
 */
export function getHostname(url) {
  // 若不存在前缀，默认填充 https://
  let prefix = "https://";
  if (/^https?:\/\//.test(url)) prefix = "";
  const { hostname } = new URL(prefix + url);
  return hostname;
}

/**
 * 返回原始插件数据。包括function
 */
export function convertSourceObj(sourceCode) {
  let originPlugin = null;
  // eslint-disable-next-line no-unused-vars
  const VIP_CRACK_INSTALL = obj => {
    originPlugin = obj;
  };
  eval(sourceCode);
  return originPlugin;
}

/**
 * 将小时转为毫秒
 * @param {小时} hour
 */
export function hourToMillisecond(hour) {
  return hour * 60 * 60 * 1000;
}

/**
 * 获取chrome版本信息
 */
export function getChromeVersion() {
  let pieces = navigator.userAgent.match(
    /Chrom(?:e|ium)\/([0-9]+)\.([0-9]+)\.([0-9]+)\.([0-9]+)/
  );
  if (pieces == null || pieces.length !== 5) {
    return {};
  }
  pieces = pieces.map(piece => parseInt(piece, 10));
  return {
    major: pieces[1],
    minor: pieces[2],
    build: pieces[3],
    patch: pieces[4],
  };
}
