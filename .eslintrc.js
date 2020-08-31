module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es2020: true,
    jest: true,
    webextensions: true,
  },
  extends: [
    "plugin:vue/recommended",
    // 使用eslint-plugin-vue，如若又使用了prettier，且以prettier为准，
    // 则要添加prettier/vue，用于关闭eslint-plugin-vue中不符合prettier的规则
    "prettier/vue",
    "eslint:recommended",
    "plugin:prettier/recommended",
  ],
  // QUESTION 这个 parser 我保留意见，加不加好像都没啥影响。没体会到用外。
  parser: "vue-eslint-parser",
  parserOptions: {
    ecmaVersion: 11,
    sourceType: "module",
    // 使用eslint-plugin-vue，自定义的parser要写到parserOptions里面，不然本身配置文件就会报错，module.export默认的画红线
    parser: "babel-eslint",
  },
  rules: {
    "no-console": process.env.NODE_ENV === "production" ? "warn" : "off",
    "no-debugger": process.env.NODE_ENV === "production" ? "warn" : "off",
  },
};
