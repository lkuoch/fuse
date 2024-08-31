import { generate, CodegenContext } from "@graphql-codegen/cli";
import { DateTimeResolver, JSONResolver } from "graphql-scalars";
import { existsSync } from "node:fs";
import path from "node:path";

export async function boostrapCodegen(location: string, watch: boolean) {
  const baseDirectory = process.cwd();
  const hasSrcDir = existsSync(path.resolve(baseDirectory, "src"));

  const ctx = new CodegenContext({
    filepath: "codgen.yml",
    config: {
      ignoreNoDocuments: true,
      errorsOnly: true,
      noSilentErrors: true,
      watch: watch
        ? [
            hasSrcDir
              ? `${baseDirectory}/src/**/*.{ts,tsx}`
              : `${baseDirectory}/**/*.{ts,tsx}`,
            "!./{node_modules,.next,.git}/**/*",
          ]
        : false,
      schema: location,
      generates: {
        // Generate schema.graphql in the root directory
        [`${baseDirectory}/schema.graphql`]: {
          plugins: ["schema-ast"],
        },
      },
    },
  });

  await generate(ctx, true);
}
