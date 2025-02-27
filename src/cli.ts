#!/usr/bin/env node
import sade from "sade";
import path from "node:path";
import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import { createServer, build } from "vite";
import { VitePluginNode } from "vite-plugin-node";

import { boostrapCodegen } from "./utils/codegen";

const prog = sade("fuse");

prog.version(process.env.npm_package_version ?? "0.0.0");

prog
  .command("build")
  .describe("Creates the build output for server and client.")
  .option(
    "--adapter",
    "Which adapter to use for building, options are lambda, cloudflare, bun and node (default)",
    "node"
  )
  .option(
    "--server",
    'Whether to look for the "types/" directory and create a server build output.'
  )
  .option(
    "--client",
    "Whether to look for GraphQL documents and generate types."
  )
  .option(
    "--schema",
    'Where to find the schema, either a "*.graphql" file or an endpoint that can be introspected.',
    "./schema.graphql"
  )
  .action(async (opts) => {
    if (!opts.server && !opts.client) {
      opts.server = true;
      opts.client = true;
    }

    if (opts.server) {
      const baseDirectory = process.cwd();
      const entryPoint = "bun.js";

      await build({
        build: {
          outDir: path.resolve(baseDirectory, "build"),
          rollupOptions: {
            logLevel: "silent",
          },
        },
        plugins: [
          ...VitePluginNode({
            async adapter() {
              // Redundant during build
            },
            appName: "fuse",
            appPath: path.resolve(
              baseDirectory,
              "../../node_modules",
              "fuse",
              "dist",
              "adapters",
              entryPoint
            ),
            exportName: "main",
          }),
        ],
      });

      console.log("Server build output created in ./build");
    }
  })
  .command("dev")
  .describe("Runs the dev-server for the client and server by default.")
  .option(
    "--port",
    "Which port to use for the dev-server (default: 4000)",
    4000
  )
  .option(
    "--server",
    'Whether to look for the "types/" directory and create a server build output.'
  )
  .option(
    "--client",
    "Whether to look for GraphQL documents and generate types."
  )
  .option(
    "--schema",
    'Where to find the schema, either a "*.graphql" file or an endpoint that can be introspected.',
    "./schema.graphql"
  )
  .action(async (opts) => {
    if (!opts.server && !opts.client) {
      opts.server = true;
      opts.client = true;
    }

    const baseDirectory = process.cwd();
    const hasTadaWatcherRunning = false;

    if (opts.server) {
      let yoga;
      const server = await createServer({
        plugins: [
          ...VitePluginNode({
            initAppOnBoot: true,
            async adapter({ app, req, res }) {
              yoga = await app(opts).then((yo) => {
                fs.writeFile(
                  path.resolve(baseDirectory, "schema.graphql"),
                  yo.stringifiedSchema,
                  "utf-8"
                );

                return yo;
              });
              await yoga.handle(req, res);
            },
            appPath: path.resolve(
              baseDirectory,
              "../../node_modules",
              "fuse",
              "dist",
              "dev.js"
            ),
            exportName: "main",
          }),
        ],
      });

      server.watcher.on("change", async (file) => {
        if (file.includes("types/")) {
          server.restart();
        }
      });

      await server.listen(opts.port);
      console.log(`Server listening on http://localhost:${opts.port}/graphql`);
    }

    if (opts.client) {
      setTimeout(() => {
        fetch(`http://localhost:${opts.port}/graphql?query={__typename}`)
          .then(() => {
            boostrapCodegen(opts.schema, true);
          })
          .catch(() => {});
      }, 1000);
    }
  });

prog.parse(process.argv);
