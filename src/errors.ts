import { isErr, isPrimitive } from "./assertions"

export enum ErrorCode {
  WebGpuUnavailable,
  WebGpuAdapterRequestFailure,
  WebGpuDeviceRequestFailure,
  WebGpuContextFailure,
  WebGpuCreateBufferFailure,
  WebGpuWriteBufferFailure,
}

export type CodeMessage = [ErrorCode, string]

export class CodeError extends Error {
  constructor(code: number, message: string, options?: ErrorOptions) {
    super(message, options)
    this.code = code
  }

  public code: number
}

export const createCodeErrWithExcep = (
  code: ErrorCode,
  msgBase: string,
  excep: unknown,
): CodeError => {
  let message = msgBase
  let cause: unknown

  if (isErr(excep)) {
    message += `\n${excep.message}`
    cause = excep.cause
  } else if (isPrimitive(excep)) {
    message += `\n${excep}`
  }

  return new CodeError(code, message, {
    cause,
  })
}
