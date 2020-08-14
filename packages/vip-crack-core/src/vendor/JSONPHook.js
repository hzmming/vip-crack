/*!
 * JSONPHook.js v0.0.1
 * (c) 2020 LoryHuang
 * refer to https://blog.1zyan.cn/1000.html
 * Released under the MIT License.
 */
/* eslint-disable */
(function (global, factory) {
  typeof exports === "object" && typeof module !== "undefined"
    ? (module.exports = factory())
    : typeof define === "function" && define.amd
    ? define(factory)
    : ((global = global || self), (global.JSONPHook = factory()));
})(this, function () {
  "use strict";

  function getHookItem(url) {
    return hookList.find(i => i.urls.find(u => url.includes(u)));
  }

  function getOriginCallbackName(url, callName) {
    // 动态拼正则，是否一定要eval之后了解
    let baseCallbackName = eval(
      "(url.match(/" +
        callName +
        "=[\\s\\S]*?&|" +
        callName +
        "=[\\s\\S]*/)[0])"
    ).replace(callName + "=", "");
    if (baseCallbackName[baseCallbackName.length - 1] === "&")
      baseCallbackName = baseCallbackName.substring(
        0,
        baseCallbackName.length - 1
      );
    return baseCallbackName;
  }

  function createJSONPCallback(cb) {
    let callbackName = "jsonp" + new Date().getTime();
    window[callbackName] = function (...args) {
      cb(...args);
      window[callbackName] = undefined;
    };
    return callbackName;
  }

  function hook(src) {
    //拿到链接，判断是为hook链接
    const hookItem = getHookItem(src);
    if (hookItem) {
      // 设置callback
      try {
        const baseCallbackName = getOriginCallbackName(src, hookItem.callName);

        const cb = function () {
          let args = [].slice.call(arguments);
          //调用callback
          const newArgs = [].concat(hookItem.callback.apply(null, args));
          //调用返回的
          if (typeof window[baseCallbackName] === "function")
            window[baseCallbackName].apply(null, newArgs);
        };
        let callbackName = createJSONPCallback(cb);

        src = src.replace(baseCallbackName, callbackName);
      } catch (e) {}
    }
    return src;
  }

  const hookList = [];

  let createElement = document.createElement.bind(document);
  document.createElement = function (name) {
    // [native code]
    let xhr = createElement.call(document, name);
    if (name === "script") {
      Object.defineProperty(xhr, "src", {
        configurable: true,
        enumerable: true,
        set: function (n) {
          n = hook(n);
          //给真正的tag赋值
          this.setAttribute("src", n);
        },
        get: function () {
          return this.getAttribute("src");
        }
      });
    }
    return xhr;
  };

  function JSONPHook(urls, callback, callName = "callback") {
    const urlList = Array.isArray(urls) ? urls : [urls];
    hookList.push({
      urls: urlList,
      callback,
      callName
    });
  }

  return JSONPHook;
});
