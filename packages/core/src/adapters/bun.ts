/// <reference types="bun" />
import { createYoga } from 'graphql-yoga'
// @ts-ignore
import { builder } from 'fuse'
import { getYogaPlugins, wrappedContext } from '../utils/yoga-helpers'

export async function main() {
  let ctx, yogaPlugins
  import.meta.glob('/types/**/*.ts', { eager: true })

  const context = import.meta.glob('/_context.ts', { eager: true })
  const yogaPluginsFile = import.meta.glob('/_yoga-plugins.ts', { eager: true })

  if (context['/_context.ts']) {
    const mod = context['/_context.ts']
    if ((mod as any).getContext) {
      ctx = (mod as any).getContext
    }
  }

  if (yogaPluginsFile['/_yoga-plugins.ts']) {
    const mod = yogaPluginsFile['/_yoga-plugins.ts']
    if ((mod as any).getYogaPlugins) {
      yogaPlugins = (mod as any).getYogaPlugins
    }
  }

  const completedSchema = builder.toSchema({})

  const yoga = createYoga({
    graphiql: false,
    maskedErrors: true,
    schema: completedSchema,
    // We allow batching by default
    batching: true,
    context: wrappedContext(ctx),
    plugins: getYogaPlugins(yogaPlugins),
  })

  Bun.serve(
    // @ts-ignore this is a typing bug, it works. https://github.com/dotansimha/graphql-yoga/issues/3003
    yoga,
  )
}

main()
