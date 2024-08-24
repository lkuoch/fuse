import { blockFieldSuggestionsPlugin } from '@escape.tech/graphql-armor-block-field-suggestions'
import { useDeferStream } from '@graphql-yoga/plugin-defer-stream'
import { useDisableIntrospection } from '@graphql-yoga/plugin-disable-introspection'
import type { GraphQLParams, Plugin, YogaInitialContext } from 'graphql-yoga'
import type { ServerResponse } from 'node:http'

export type InitialContext = {
  headers: Headers
  params: GraphQLParams
  request: YogaInitialContext['request']
  response: ServerResponse
}

export type UserContext = any

export type GetContext<AdditionalContext> =
  | ((ctx: InitialContext) => UserContext & AdditionalContext)
  | ((ctx: InitialContext) => Promise<UserContext & AdditionalContext>)
  | (UserContext & AdditionalContext)

export interface StellateOptions {
  loggingToken: string
  serviceName: string
}

export const getYogaPlugins = (stellate?: StellateOptions): Plugin[] => {
  return [
    useDeferStream(),
    process.env.NODE_ENV === 'production' && useDisableIntrospection(),
    process.env.NODE_ENV === 'production' && blockFieldSuggestionsPlugin(),
  ].filter(Boolean) as Plugin[]
}

export const wrappedContext = <AdditionalContext extends Record<string, any>>(
  context?: GetContext<AdditionalContext>,
) => {
  return async (ct) => {
    const baseContext: InitialContext = {
      request: ct.request,
      response: ct.res,
      headers: ct.request.headers,
      params: ct.params,
    }
    if (typeof context === 'function') {
      const userCtx = context(baseContext)
      if (userCtx.then) {
        const result = await userCtx
        return {
          ...baseContext,
          ...result,
        }
      }
      return {
        ...baseContext,
        ...userCtx,
      }
    }

    if (typeof context === 'object') {
      return {
        ...baseContext,
        ...context,
      }
    }

    return baseContext
  }
}
