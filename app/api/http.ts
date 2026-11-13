export interface FieldIssue { path: string, message: string }

/** The one error type the rest of the app sees, whatever the transport. */
export class ApiError extends Error {
  constructor(readonly status: number, message: string, readonly issues: FieldIssue[] = []) {
    super(message)
    this.name = 'ApiError'
  }
}

function toApiError(e: any): ApiError {
  const status = e?.statusCode ?? e?.response?.status ?? 0
  const message = e?.data?.message ?? e?.data?.statusMessage ?? (status ? 'Something went wrong' : 'We couldn’t reach the server. Check your connection.')
  return new ApiError(status, message, e?.data?.data?.issues ?? [])
}

/** Single place that knows the base URL and how failures are shaped. */
export async function request<T>(path: string, options: Parameters<typeof $fetch>[1] = {}): Promise<T> {
  try {
    return await $fetch<T>(path, { baseURL: '/api', ...options }) as T
  } catch (e) {
    throw toApiError(e)
  }
}
