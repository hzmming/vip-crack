/**
 * 拦截时机：创建video节点
 * 备注：第一时间对video节点做hack动作
 */
export function hackCreateElement(hook) {
  const createEle = document.createElement.bind(document);
  document.createElement = (...args) => {
    hook(...args);
    // [native code]
    return createEle(...args);
  };
  return () => {
    // 使用完还原
    document.createElement = createEle;
  };
}

export function hookPushState(hook) {
  const pushState = history.pushState.bind(history);
  history.pushState = (...args) => {
    hook(...args);
    // [native code]
    return pushState(...args);
  };
  return () => {
    // 使用完还原，也可以不还原，长期生效
    history.pushState = pushState;
  };
}

export function filterDomEvt(dom, evtNames) {
  const filterEvtNames = [].concat(evtNames);
  filterEvtNames.forEach(evtName => {
    dom.addEventListener(evtName, e => e.stopImmediatePropagation(), true);
  });
}

export function isHlsType(type) {
  return ["hls", "m3u8"].includes(type);
}

/**
 * TODO 同样有缺陷，只能调用一次
 * @param {*} hook
 */
export function hookApply(hook) {
  Function.prototype.apply = function (context, args = []) {
    const isPrevent = hook.bind(context)(...args);
    if (typeof isPrevent !== "undefined" && !isPrevent) return;
    return this.bind(context)(...args);
  };
}

/**
 * 拦截promise的then和catch方法
 * TODO 现在的设计不能执行多次
 * @param {thenHook, catchHook} opt
 */
export function hookPromise(opt = {}) {
  const { thenHook, catchHook } = opt;
  if (thenHook) {
    const nativeThen = Promise.prototype.then;
    Promise.prototype.then = function (resolveCallback) {
      const wrapperResolveCallback = function (...args) {
        const isPrevent = thenHook(...args);
        if (typeof isPrevent !== "undefined" && !isPrevent) return;
        return resolveCallback(...args);
      };
      // [native code]
      return nativeThen.call(this, wrapperResolveCallback);
    };
  }
  if (catchHook) {
    const nativeCatch = Promise.prototype.catch;
    Promise.prototype.catch = function (rejectCallback) {
      const wrapperRejectCallback = function (...args) {
        const isPrevent = catchHook(...args);
        if (typeof isPrevent !== "undefined" && !isPrevent) return;
        // TODO promise的then和catch回调，this指向谁啊。。。
        // TODO 还有return值不知道有没有处理好，没处理好会影响Promise的执行
        return rejectCallback(...args);
      };
      // [native code]
      return nativeCatch.call(this, wrapperRejectCallback);
    };
  }
}

export function wrapperInstaller(pluginObj) {
  (install => {
    install(pluginObj);
    // eslint-disable-next-line no-undef
  })(VIP_CRACK_INSTALL);
}
