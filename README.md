目标

- [] 使用插件体系构建扩展
- [] 使用 webpack 工程化
- [] e2e 测试
- [] popup 面板支持视频源选择
- [] 视频源支持官方获取（类似 gfwlist，不过内置）、手动设置【默认自动同步，也可手动同步。同步不影响手动添加】
- [] 视频源导入导出

### 插件体系

插件化的核心在于 理清生命周期
而理清生命周期，先把整个运行过程梳理出来，再提取几个关键节点，就大功造成了

如何选择 拦截创建 dom 与挂载 dom 1.时机。是否需要尽早拿到 dom 并做相关处理

腾讯篇
获取 videoDom（拦截创建 dom） - 拦截事件监听器 - 阻止自动播放 - 结合底下两个条件 - 更新（hls 特殊处理、更新视频源地址） - 还原播放
获取可播放视频源信息（拦截 ajax）
判断是否需要破解

优酷篇
获取 videoDom（拦截挂载 dom）- 获取完 videoDom 处理（拦截了 apply，并做了强耦合的处理）- 更新后（补事件） - 结合底下两个条件 - 播放
获取可播放视频源信息（拦截 jsonp）
判断是否需要破解

### 插件更新

1. 插件自身维持版本号（版本号递增并符合规范由我手动保持）
2. 扩展自动获取插件内容，若版本号变动，则更新插件内容（chrome 扩展避开了跨域问题）（远程加载还可以看下 [runtime-import](https://www.npmjs.com/package/runtime-import，不确定)

插件动态获取，是为了避免视频网站的更新而造成的 chrome 扩展频繁更新
插件目录位置等动态信息最好再写个配置文件 config.js。先获取配置文件内容，再获取插件内容

使用 jsdelivr 避开 raw.githubusercontent.com 域名国内被墙的问题

**生命周期**：getVideoDom - afterGetVideoDom - updateVideo - afterUpdateVideo - play

### webpack 工程化

参考之前 star 的 webpack extension template
简单记录下

```shell
yarn add clean-webpack-plugin copy-webpack-plugin css-loader file-loader html-loader html-webpack-plugin style-loader webpack webpack-dev-server webpack-cli -D
```

```shell
yarn add write-file-webpack-plugin -D
```

```shell
yarn add cross-env -D
```

```shell
yarn add @babel/core @babel/preset-env @babel/runtime-corejs3 babel-loader -D
yarn add @babel/plugin-proposal-optional-chaining @babel/plugin-proposal-class-properties -D
```

```shell
yarn add eslint babel-eslint eslint-config-prettier eslint-plugin-prettier prettier eslint-loader -D
```

注意，eslint-loader 必须配置在最后面（webpack loader 顺序为从右到左）。或者声明为 pre loader

```shell
yarn add husky lint-staged -D
```

```shell
yarn add @types/chrome -D
```

```shell
yarn add sass sass-loader -D
```

```shell
yarn add postcss-loader autoprefixer -D
# 配置文件为 postcss.config.js
```

```shell
yarn add hls.js ajax-hook
```

```shell
yarn add lodash.pick
```

```shell
yarn add semver
```

```shell
yarn add uuid
```

```shell
yarn add friendly-errors-webpack-plugin -D
```

控制台更友好地输出信息
需要关闭 webpack-dev-server 的信息输出

```javascript
new WebpackDevServer(compiler, {
  quiet: true,
});
```

html-loader 使 html 支持 webpack 别名
html、css 中需在别名前加波浪号~，不然解析失败（除了 vue-loader 有稍微讲到，webpack 官网没找着。。。）

html 引入样式，两种方案

1. popup.html 使用 link 引入 css，则 webpack 不能使用 style-loader，因为 target 环境不是浏览器 web，会报 document is not undefined，改用 mini-css-extract-plugin，单独生成 css 文件
2. popup.html 不使用 link 引入 css，webpack 继续使用 style-loader，样式在 js 里引入，如 import "./popup.css"
   本来想着 css 还是尽早加载比较好，谁知道 mini-css-extract-plugin 和 html-webpack-plugin 结合使用会报错。。。[issue](https://github.com/webpack-contrib/mini-css-extract-plugin/issues/489)

### e2e 测试

使用 karma 集成浏览器测试？
使用 puppeteer 无头浏览器测试？
参考下 [hls.js](https://github.com/video-dev/hls.js)，看它是怎么使用 karma 进行测试的
几个行为的保证：

1. video 标签是否正确获取
2. 破解标志 有没有正确获取
3. 各网站强耦合处理 是否失效
4. 各类型视频（动漫、电影、综艺）是否正确播放（并测试几个节点，如 6min，10min，14min 等）
5. 历史记录是否正确同步
6. 视频播放结束能否自动续播
7. 选集面板能否正确使用
8. 暂停、下一集，能否正常使用
9. 友好地错误提示（并提示到 github 上提交 issue）
