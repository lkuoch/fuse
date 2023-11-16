#!/usr/bin/env node
import sade from "sade";
import path from "path";
import fs from "fs/promises";
import { createServer, build } from "vite";
import { VitePluginNode } from "vite-plugin-node";
import { generate, CodegenContext } from '@graphql-codegen/cli'

const prog = sade("datalayer");

prog.version("0.0.0");

prog
  .command("build")
  .option(
    "--adapter",
    "Which adapter to use for building, options are Lambda, CloudFlare and Node (default)",
    "node",
  )
  .action(async (opts) => {
    const baseDirectory = process.cwd();
    let entryPoint = "node.mjs";
    switch (opts.adapter) {
      case "lambda": {
        entryPoint = "lambda.mjs";
        break;
      }
      case "cloudflare": {
        entryPoint = "cloudflare.mjs";
        break;
      }
      default: {
        entryPoint = "node.mjs";
        break;
      }
    }

    return build({
      plugins: [
        ...VitePluginNode({
          async adapter() {
            // Redundant during build
          },
          appPath: path.resolve(baseDirectory, "..", "dist", entryPoint),
          exportName: "main",
        }),
      ],
    });
  })
  .command("dev")
  .describe("Build the source directory. Expects a `/types` folder.")
  .action(async () => {
    const baseDirectory = process.cwd();

    let yoga;
    let isRunningCodegen = false;
    const server = await createServer({
      plugins: [
        ...VitePluginNode({
          async adapter({ app, req, res }) {
            if (!yoga) {
              yoga = await app().then((yo) => {
                fs.writeFile(
                  path.resolve(baseDirectory, "schema.graphql"),
                  yo.stringifiedSchema,
                  "utf-8",
                ).then(() => {
                  if (!isRunningCodegen) bootGraphQLCodegen();
                });
                return yo;
              });
              await yoga.handle(req, res);
            } else if (yoga.then) {
              yoga.then(async () => {
                await yoga.handle(req, res);
              });
            } else if (yoga) {
              await yoga.handle(req, res);
            }
          },
          appPath: path.resolve(baseDirectory, "..", "dist", "dev.mjs"),
          exportName: "main",
        }),
      ],
    });

    const bootGraphQLCodegen = async () => {
      const ctx = new CodegenContext({
        filepath: 'codgen.yml',
        config: {
          errorsOnly: true,
          silent: true,
          noSilentErrors: true,
          watch: path.resolve(baseDirectory, './src/**/*.tsx'),
          schema: 'http://localhost:4000/graphql',
          documents: './src/**/*.tsx',
          ignoreNoDocuments: true,
          generates: {
            [baseDirectory + '/src/gql/']: {
              preset: 'client',
              config: {
                avoidOptionals: false,
                enumsAsTypes: true,
                nonOptionalTypename: true,
              }
            }
          }
        }
      })
      await generate(ctx, true)
      isRunningCodegen = true;
    }

    await server.listen(4000);

    bootGraphQLCodegen();
    console.log(`Server listening on http://localhost:4000/graphql`);
  });

prog.parse(process.argv);
