export enum ErrorCode {
  WebGpuUnavailable,
  WebGpuAdapterRequestFailure,
  WebGpuDeviceRequestFailure,
}

export class CodeError extends Error {
  constructor(code: number, message: string, options?: ErrorOptions) {
    super(message, options);
    this.code = code;
  }

  public code: number;
}
