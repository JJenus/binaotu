import { ApiError } from '~/api'

/** Pending/error/field-error handling for any action that calls the API. */
export function useFormState() {
  const pending = ref(false)
  const error = ref<string | null>(null)
  const issues = ref<Record<string, string>>({})

  async function run<T>(action: () => Promise<T>): Promise<T | undefined> {
    pending.value = true
    error.value = null
    issues.value = {}
    try {
      return await action()
    } catch (e) {
      if (!(e instanceof ApiError)) throw e
      error.value = e.message
      issues.value = Object.fromEntries(e.issues.map(i => [i.path, i.message]))
    } finally {
      pending.value = false
    }
  }
  return { pending, error, issues, run }
}
