import type { H3Event } from 'h3'
import { ZodError, type ZodType } from 'zod'
import { KinshipError, type KinshipErrorCode } from '../../shared/kinship'
import { AppError } from '../services/errors'

const KINSHIP_STATUS: Record<KinshipErrorCode, number> = { NOT_FOUND: 404, INVALID: 400, MAX_PARENTS: 409, NOT_RELATED: 404 }

function toHttpError(e: unknown) {
  if (e instanceof ZodError) {
    return createError({ statusCode: 422, message: 'Check the highlighted fields', data: { issues: e.issues.map(i => ({ path: i.path.join('.'), message: i.message })) } })
  }
  if (e instanceof AppError) return createError({ statusCode: e.status, message: e.message })
  if (e instanceof KinshipError) return createError({ statusCode: KINSHIP_STATUS[e.code], message: e.message, data: { code: e.code } })
  if (isError(e)) return e
  console.error(e)
  return createError({ statusCode: 500, message: 'Something went wrong on our side' })
}

/** Wraps a handler so domain and validation errors become proper HTTP errors. */
export const defineApi = <T>(fn: (event: H3Event) => Promise<T> | T) =>
  defineEventHandler(async (event) => {
    try { return await fn(event) } catch (e) { throw toHttpError(e) }
  })

export const parseBody = async <S extends ZodType>(event: H3Event, schema: S) => schema.parse(await readBody(event)) as S['_output']
export const parseQuery = <S extends ZodType>(event: H3Event, schema: S) => schema.parse(getQuery(event)) as S['_output']
export const param = (event: H3Event, name: string) => String(getRouterParam(event, name) ?? '')
