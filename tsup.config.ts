import { defineConfig, type Options } from "tsup";

export default defineConfig(async () => {
  const baseOptions: Options = {
    platform: "node",
    splitting: false,
    format: ["esm", "cjs"],
    skipNodeModulesBundle: true,
    target: "esnext",
    env: {
      // env var `npm_package_version` gets injected in runtime by npm/yarn automatically
      // this replacement is for build time, so it can be used for both
      npm_package_version:
        process.env.npm_package_version ??
        (await import("./package.json")).version,
    },
    minify: false,
    clean: true,
  };

  /**
   * We create distinct options so that no type declarations are reused and
   * exported into a separate file, in other words, we want all `d.ts` files
   * to not contain any imports.
   */
  return [
    {
      ...baseOptions,
      entry: ["src/builder.ts"],
      dts: {
        entry: "src/builder.ts",
        banner: `import '@pothos/core'
import '@pothos/plugin-scope-auth'
import '@pothos/plugin-dataloader'
import '@pothos/plugin-relay'`,
      },
    },
    {
      ...baseOptions,
      entry: ["src/cli.ts"],
      format: ["esm"],
      external: [/builder/],
    },
    {
      ...baseOptions,
      entry: ["src/dev.ts"],
      format: ["esm"],
      external: [/builder/],
    },
    {
      ...baseOptions,
      entry: ["src/adapters/bun.ts"],
      outDir: "dist/adapters",
      format: ["esm"],
      external: [/builder/],
    },
  ];
});
