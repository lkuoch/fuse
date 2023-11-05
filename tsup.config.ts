import { defineConfig, Options } from 'tsup'

export default defineConfig(async () => {
  const baseOptions: Options = {
    platform: 'node',

    splitting: false,
    format: ['esm'],
    target: 'node18',
    env: {
      NODE_ENV: 'production',
      // env var `npm_package_version` gets injected in runtime by npm/yarn automatically
      // this replacement is for build time, so it can be used for both
      npm_package_version:
        process.env.npm_package_version ??
        (await import('./package.json')).version,
    },
    minify: false,
    clean: true,
  }

  /**
   * We create distinct options so that no type declarations are reused and
   * exported into a separate file, in other words, we want all `d.ts` files
   * to not contain any imports.
   */
  return [
    {
      ...baseOptions,
      entry: ['src/bin.ts'],
    },
    {
      ...baseOptions,
      entry: ['src/adapters/node.ts'],
    },
    {
      ...baseOptions,
      entry: ['src/adapters/lambda.ts'],
    },
    {
      ...baseOptions,
      entry: ['src/index.ts'],
      dts: {
        entry: 'src/index.ts',
        resolve: true,
      },
    },
  ]
})