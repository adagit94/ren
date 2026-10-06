import { CodeError, createCodeErrWithExcep, ErrorCode } from "../errors"
import { SafeTuple } from "../types"

// restoreLostDevice: boolean;

type GpuAdapterInfo = Omit<GPUAdapter, "__brand" | "requestDevice">
type InitDeviceParams = Partial<{
  requestAdapterOptions: GPURequestAdapterOptions
  getDeviceDescriptor: (adapterInfo: GpuAdapterInfo) => GPUDeviceDescriptor
  onDeviceLost: (info: GPUDeviceLostInfo) => void
}>
type InitDeviceResult = GPUDevice

/**
 * @description Function request's adapter and then device, if appropriate. In case of success, function returns [{@link GPUDevice}, null]. [null, {@link CodeError}] is returned in case of an error.
 * @param params - {@link InitDeviceParams}
 * @property params.requestAdapterOptions? - {@link GPURequestAdapterOptions}
 * @property params.getDeviceDescriptor?: (adapterInfo: {@link GpuAdapterInfo}) => {@link GPUDeviceDescriptor} - Function that can be used to configure {@link GPUDeviceDescriptor} appropriately based on the {@link GpuAdapterInfo} received after successfull adapter retrieval.
 * @property params.onDeviceLost?: (info: {@link GPUDeviceLostInfo}) => void - Function to run when {@link GPUDevice} get's lost - e.g. to attempt reinitialization and request {@link GPUDevice} again.
 * @returns [{@link GPUDevice}, null] in case of success or [null, {@link CodeError}] in case of an error.
 */
export const initDevice = async ({
  requestAdapterOptions,
  getDeviceDescriptor,
  onDeviceLost,
}: InitDeviceParams = {}): Promise<SafeTuple<InitDeviceResult>> => {
  if (!navigator.gpu) [null, new CodeError(ErrorCode.WebGpuUnavailable, "WebGPU unavailable.")]

  const adapter = await navigator.gpu.requestAdapter(requestAdapterOptions)

  if (!adapter) return [null, new CodeError(ErrorCode.WebGpuAdapterRequestFailure, "WebGPU adapter request failed.")]

  try {
    const device = await adapter.requestDevice(getDeviceDescriptor?.(adapter))

    device.lost.then((info) => {
      console.error(`WebGPU device was lost.\n${info.message}`)
      onDeviceLost?.(info)
    })

    return [device, null]
  } catch (err) {
    return [null, createCodeErrWithExcep(ErrorCode.WebGpuDeviceRequestFailure, "WebGPU device request failed.", err)]
  }
}

// Omit<GPUCanvasConfiguration, "device">
export const initContext = (
  canvas: HTMLCanvasElement | OffscreenCanvas,
  conf: GPUCanvasConfiguration,
): SafeTuple<GPUCanvasContext> => {
  try {
    const ctx = canvas.getContext("webgpu")

    if (!ctx) {
      return [
        null,
        new CodeError(ErrorCode.WebGpuContextFailure, "Canvas context already set or webgpu not supported."),
      ]
    }

    try {
      ctx.configure({
        ...conf,
        format: conf.format ?? navigator.gpu.getPreferredCanvasFormat(),
        alphaMode: conf.alphaMode ?? "premultiplied",
      })

      return [ctx, null]
    } catch (err) {
      return [null, createCodeErrWithExcep(ErrorCode.WebGpuContextFailure, "WebGPU context configuration failed.", err)]
    }
  } catch (err) {
    return [null, createCodeErrWithExcep(ErrorCode.WebGpuContextFailure, "WebGPU context retrieval failed.", err)]
  }
}

export const createView = (ctx: GPUCanvasContext, descriptor: GPUTextureViewDescriptor) =>
  ctx.getCurrentTexture().createView(descriptor)
