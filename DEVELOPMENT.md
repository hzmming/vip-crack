# 开发文档

采用 [yarn workspaces](https://yarnpkg.com/features/workspaces) 进行包管理

`vip-crack-core` 运行于浏览器端，用于支撑视频源替换

`vip-crack-extension` 扩展主体代码

## 本地调试

推荐node版本 v 14.8（本人所使用）

```shell
yarn start
```
构建文件输出目录为：**packages\vip-crack-extension\build**

按以下步骤添加扩展
1. 打开 chrome 扩展管理界面（chrome://extensions/）
2. 打开右上角**开发者模式**
3. 加载已解压的扩展程序
4. 找到扩展构建后的build目录（packages\vip-crack-extension\build）
5. 确定即可

```shell
# 测试远程文件
yarn start:remote
```

## 构建
```shell
yarn build
```

```shell
# 构建本地测试
yarn build:local
```

## 更新日志
```shell
# 提交代码
yarn cz

# 生成CHANGELOG.md（都配置好了，但忘记为什么不用）
yarn log
```

## 插件体系
TODO（当初没整理，现在自己都忘差不多了...）

## 测试

```javascript
yarn test
```
