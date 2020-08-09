目标
- [] 使用插件体系构建扩展
- [] 使用 webpack 工程化
- [] e2e测试
- [] popup面板支持视频源选择
- [] 视频源支持官方获取（类似gfwlist，不过内置）、手动设置【默认自动同步，也可手动同步。同步不影响手动添加】
- [] 视频源导入导出

### 插件体系
插件化的核心在于 理清生命周期
而理清生命周期，先把整个运行过程梳理出来，再提取几个关键节点，就大功造成了

如何选择 拦截创建dom与挂载dom
1.时机。是否需要尽早拿到dom并做相关处理

腾讯篇
获取videoDom（拦截创建dom） - 拦截事件监听器 - 阻止自动播放 - 结合底下两个条件 - 更新（hls特殊处理、更新视频源地址） - 还原播放
获取可播放视频源信息（拦截ajax）
判断是否需要破解

优酷篇
获取videoDom（拦截挂载dom）- 获取完videoDom处理（拦截了apply，并做了强耦合的处理）- 更新后（补事件） - 结合底下两个条件 - 播放
获取可播放视频源信息（拦截jsonp）
判断是否需要破解

**生命周期**：getVideoDom - afterGetVideoDom - updateVideo - afterUpdateVideo - play

### webpack 工程化
参考之前star的webpack extension template
简单记录下
```shell
yarn add clean-webpack-plugin copy-webpack-plugin css-loader file-loader html-loader html-webpack-plugin style-loader webpack webpack-dev-server write-file-webpack-plugin webpack-cli -D
```
```shell
yarn add @babel/core @babel/plugin-proposal-optional-chaining @babel/preset-env @babel/runtime-corejs3 babel-loader -D
```
```shell
yarn add eslint babel-eslint eslint-config-prettier eslint-plugin-prettier prettier -D
```
```shell
yarn add husky lint-staged -D
```
```shell
yarn add @types/chrome -D
```
html-loader 使 html 支持 webpack 别名
html、css中需在别名前加波浪号~，不然解析失败（除了vue-loader有稍微讲到，webpack官网没找着。。。）

html引入样式，两种方案
1. popup.html使用link引入css，则webpack不能使用style-loader，因为target环境不是浏览器web，会报document is not undefined，改用mini-css-extract-plugin，单独生成css文件
2. popup.html不使用link引入css，webpack继续使用style-loader，样式在js里引入，如import "./popup.css"
本来想着 css 还是尽早加载比较好，谁知道 mini-css-extract-plugin 和 html-webpack-plugin 结合使用会报错。。。[issue](https://github.com/webpack-contrib/mini-css-extract-plugin/issues/489)
### e2e测试
使用karma集成浏览器测试？
使用puppeteer无头浏览器测试？
几个行为的保证：
1. video 标签是否正确获取
2. 破解标志 有没有正确获取
3. 各网站强耦合处理 是否失效
4. 各类型视频（动漫、电影、综艺）是否正确播放（并测试几个节点，如6min，10min，14min等）
5. 历史记录是否正确同步
6. 视频播放结束能否自动续播
7. 选集面板能否正确使用
8. 暂停、下一集，能否正常使用
9. 友好地错误提示（并提示到 github 上提交issue）

