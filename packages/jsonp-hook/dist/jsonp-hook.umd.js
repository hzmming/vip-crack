/*!
 * jsonp-hook.js v0.0.0
 * (c) 2020 Lory Huang
 * Released under the MIT License.
 */
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.jsonpHook = factory());
}(this, (function () { 'use strict';

  function getHookItem(url) {
    return hookList.find(function (i) {
      return i.urls.find(function (u) {
        return url.includes(u);
      });
    });
  }

  function getOriginCallbackName(url, callName) {
    // TODO 动态拼正则，是否一定要eval之后了解
    var regexp = new RegExp(callName + "=[\\s\\S]*?&|" + callName + "=[\\s\\S]*");
    var baseCallbackName = url.match(regexp)[0].replace(callName + "=", "");
    if (baseCallbackName[baseCallbackName.length - 1] === "&") baseCallbackName = baseCallbackName.substring(0, baseCallbackName.length - 1);
    return baseCallbackName;
  }

  function createJSONPCallback(cb) {
    var callbackName = "jsonp" + new Date().getTime();

    window[callbackName] = function () {
      cb.apply(void 0, arguments);
      window[callbackName] = undefined;
    };

    return callbackName;
  }

  function hook(src) {
    //拿到链接，判断是为hook链接
    var hookItem = getHookItem(src);

    if (hookItem) {
      // 设置callback
      try {
        var baseCallbackName = getOriginCallbackName(src, hookItem.callName);

        var cb = function cb() {
          var args = [].slice.call(arguments); //调用callback

          var newArgs = [].concat(hookItem.callback.apply(null, args)); //调用返回的

          if (typeof window[baseCallbackName] === "function") window[baseCallbackName].apply(null, newArgs);
        };

        var callbackName = createJSONPCallback(cb);
        src = src.replace(baseCallbackName, callbackName);
      } catch (e) {
        console.error(e);
      }
    }

    return src;
  }

  var hookList = [];
  var createElement = document.createElement.bind(document);

  document.createElement = function (name) {
    // [native code]
    var xhr = createElement.call(document, name);

    if (name === "script") {
      Object.defineProperty(xhr, "src", {
        configurable: true,
        enumerable: true,
        set: function set(n) {
          n = hook(n); //给真正的tag赋值

          this.setAttribute("src", n);
        },
        get: function get() {
          return this.getAttribute("src");
        }
      });
    }

    return xhr;
  };

  function jsonpHook(urls, callback) {
    var callName = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : "callback";
    var urlList = Array.isArray(urls) ? urls : [urls];
    hookList.push({
      urls: urlList,
      callback: callback,
      callName: callName
    });
  }

  return jsonpHook;

})));
