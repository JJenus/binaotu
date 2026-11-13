export type KinshipErrorCode = 'NOT_FOUND' | 'INVALID' | 'MAX_PARENTS' | 'NOT_RELATED'

export class KinshipError extends Error {
  constructor(public readonly code: KinshipErrorCode, message: string) {
    super(message)
    this.name = 'KinshipError'
  }
}
