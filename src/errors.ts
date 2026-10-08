import { isErr, isPrimitive } from "./assertions"

export enum ErrCode {
  WebGpuUnavailable,
  WebGpuAdapterRequestFailure,
  WebGpuDeviceRequestFailure,
  WebGpuContextFailure,
  WebGpuCreateBufferFailure,
  WebGpuWriteBufferFailure,
  WebGpuBufferReallocationFailure,
}

export type CodeMessage = [ErrCode, string]

export type OnErr = (err: unknown) => CodeErr

export class CodeErr extends Error {
  constructor(code: number, message: string, options?: ErrorOptions) {
    super(message, options)
    this.code = code
  }

  public code: number
}

export const createCodeErrWithExcep = (
  code: ErrCode,
  msgBase: string,
  excep: unknown,
): CodeErr => {
  let message = msgBase
  let cause: unknown

  if (isErr(excep)) {
    message += `\n${excep.message}`
    cause = excep.cause
  } else if (isPrimitive(excep)) {
    message += `\n${excep}`
  }

  return new CodeErr(code, message, {
    cause,
  })
}
