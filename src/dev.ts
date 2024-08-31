// @ts-ignore
import { builder } from "fuse";
import { printSchema } from "graphql";
import { createYoga } from "graphql-yoga";

import { getYogaPlugins, wrappedContext } from "./utils/yoga-helpers";

// prettier-ignore
const defaultQuery = /* GraphQL */ `query {
}
`

export async function main() {
  const modules = import.meta.glob("/types/**/*.ts");
  const context = import.meta.glob("/_context.ts");
  const yogaPluginsFile = import.meta.glob("/_yoga-plugins.ts", {
    eager: true,
  });

  const promises: Array<any> = [];
  let ctx, yogaPlugins;

  if (context["/_context.ts"]) {
    promises.push(
      context["/_context.ts"]().then((mod) => {
        if ((mod as any).getContext) {
          ctx = (mod as any).getContext;
        }
      })
    );
  }

  if (yogaPluginsFile["/_yoga-plugins.ts"]) {
    const mod = yogaPluginsFile["/_yoga-plugins.ts"];
    if ((mod as any).getYogaPlugins) {
      yogaPlugins = (mod as any).getYogaPlugins;
    }
  }

  for (const path in modules) {
    promises.push(modules[path]());
  }

  await Promise.all(promises);

  const completedSchema = builder.toSchema({});

  const yoga = createYoga({
    schema: completedSchema,
    // We allow batching by default
    graphiql: {
      title: "Fuse GraphiQL",
      defaultQuery,
    },
    batching: true,
    context: wrappedContext(ctx),
    plugins: getYogaPlugins(yogaPlugins),
  });

  (yoga as any).stringifiedSchema = printSchema(completedSchema);
  return yoga;
}
