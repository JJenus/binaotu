/** A failure the caller can act on, with the HTTP status it maps to. */
export class AppError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message)
    this.name = 'AppError'
  }
}
