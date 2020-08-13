import inject from "@/utils/inject";
// import App from "@/app";

// inject(App);

// TODO 让webpack打包后的文件，支持以script内容形式嵌入
// 解释：以script内容形式的嵌入webpack打包后的文件会报错，目前无能为力，虽然append script的形式会慢点，但勉强可以接受吧
inject("app.js");
