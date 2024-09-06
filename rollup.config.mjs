import commonjs from "@rollup/plugin-commonjs"
import resolve from "@rollup/plugin-node-resolve"
import typescript from "@rollup/plugin-typescript"
import copy from "rollup-plugin-copy"
import dts from "rollup-plugin-dts"
import css from "rollup-plugin-import-css"
import peerDepsExternal from "rollup-plugin-peer-deps-external"

import packageJson from "./package.json" with { type: "json" }

export default [
  {
    input: "src/index.ts",
    output: [
      {
        file: packageJson.main,
        format: "cjs",
      },
      {
        file: packageJson.module,
        format: "esm",
      },
    ],
    plugins: [
      resolve(),
      commonjs(),
      typescript({ tsconfig: "./tsconfig.json" }),
      copy({
        targets: [
          { src: "node_modules/@fortawesome/fontawesome-free/webfonts/*", dest: "dist/webfonts" },
        ],
      }),
      css({ output: "styles.css", minify: true }),
      peerDepsExternal(),
    ],
  },
  {
    input: "dist/esm/types/index.d.ts",
    output: [{ file: "dist/index.d.ts", format: "esm" }],
    external: [/\.css$/],
    plugins: [dts()],
  },
]
