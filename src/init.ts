import { CodeError, ErrorCode } from "./errors"
import { SafeTuple } from "./types/ResultType"

// restoreLostDevice: boolean;

type GpuAdapterInfo = Omit<GPUAdapter, "__brand" | "requestDevice">
type InitWgpuParams = Partial<{ requestAdapterOptions: GPURequestAdapterOptions, getDeviceDescriptor: (adapterInfo: GpuAdapterInfo) => GPUDeviceDescriptor, onDeviceLost: (info: GPUDeviceLostInfo) => void }>
type InitWgpuResult = GPUDevice

/**
 * @description Function request's adapter and then device, if appropriate. In case of success, function returns [{@link GPUDevice}, null]. [null, {@link CodeError}] is returned in case of an error. 
 * @param params - {@link InitWgpuParams}
 * @property params.requestAdapterOptions? - {@link GPURequestAdapterOptions}
 * @property params.getDeviceDescriptor?: (adapterInfo: {@link GpuAdapterInfo}) => {@link GPUDeviceDescriptor} - Function that can be used to configure {@link GPUDeviceDescriptor} appropriately based on the {@link GpuAdapterInfo} received after successfull adapter retrieval.
 * @property params.onDeviceLost?: (info: {@link GPUDeviceLostInfo}) => void - Function to run when {@link GPUDevice} get's lost - e.g. to attempt reinitialization and request {@link GPUDevice} again.
 * @returns [{@link GPUDevice}, null] in case of success or [null, {@link CodeError}] in case of an error.
 */
export const initWgpu = async ({ requestAdapterOptions, getDeviceDescriptor, onDeviceLost }: InitWgpuParams = {}): Promise<SafeTuple<InitWgpuResult>> => {
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
    let message = "WebGPU device request failed."
    let cause: unknown

    if (err instanceof Error) {
      message += `\n${err.message}`
      cause = err.cause
    }

    return [
      null,
      new CodeError(ErrorCode.WebGpuDeviceRequestFailure, message, {
        cause,
      }),
    ]
  }
}
