import babel from "@rollup/plugin-babel";
import { terser } from "rollup-plugin-terser";
import pkg from "./package.json";

const banner =
  "/*!\n" +
  ` * jsonp-hook.js v${pkg.version}\n` +
  ` * (c) 2020 Lory Huang\n` +
  " * Released under the MIT License.\n" +
  " */";

export default [
  // browser-friendly UMD build
  {
    input: "src/main.js",
    output: {
      name: "jsonpHook",
      file: pkg.browser,
      format: "umd",
      banner,
      // 使用 export.default 导出模块，rollup 打包提示设置 output.exports 为 auto 或 default
      exports: "auto",
    },
    plugins: [
      babel({
        babelHelpers: "bundled",
        exclude: ["node_modules/**"],
      }),
    ],
  },
  {
    input: "src/main.js",
    output: {
      name: "jsonpHook",
      file: "dist/jsonp-hook.umd.min.js",
      format: "umd",
      banner,
      exports: "auto",
    },
    plugins: [
      babel({
        babelHelpers: "bundled",
        exclude: ["node_modules/**"],
      }),
      terser(),
    ],
  },

  // CommonJS (for Node) and ES module (for bundlers) build.
  // (We could have three entries in the configuration array
  // instead of two, but it's quicker to generate multiple
  // builds from a single configuration where possible, using
  // an array for the `output` option, where we can specify
  // `file` and `format` for each target)
  {
    input: "src/main.js",
    output: [
      { file: pkg.main, format: "cjs", banner, exports: "auto" },
      { file: pkg.module, format: "es", banner, exports: "auto" },
    ],
    plugins: [
      babel({
        babelHelpers: "bundled",
        exclude: ["node_modules/**"],
      }),
    ],
  },
  {
    input: "src/main.js",
    output: [
      {
        file: "dist/jsonp-hook.cjs.min.js",
        format: "cjs",
        banner,
        exports: "auto",
      },
      {
        file: "dist/jsonp-hook.esm.min.js",
        format: "es",
        banner,
        exports: "auto",
      },
    ],
    plugins: [
      babel({
        babelHelpers: "bundled",
        exclude: ["node_modules/**"],
      }),
      terser(),
    ],
  },
];
