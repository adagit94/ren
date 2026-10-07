import { CodeError, createCodeErrWithExcep, ErrorCode } from "../errors"
import { RecordOptionals, SafeTuple } from "../types"

// restoreLostDevice: boolean;

type GpuAdapterInfo = Omit<GPUAdapter, "__brand" | "requestDevice">
type InitDeviceParams = Partial<{
  requestAdapterOptions: GPURequestAdapterOptions
  getDeviceDescriptor: (adapterInfo: GpuAdapterInfo) => GPUDeviceDescriptor
  onDeviceLost: (info: GPUDeviceLostInfo) => void
}>

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
}: InitDeviceParams = {}): Promise<SafeTuple<GPUDevice>> => {
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

const [d] = await initDevice()

// export const 

export const writeBuffer = (
  device: GPUDevice,
  buff: GPUBuffer,
  data: AllowSharedBufferSource,
  { bufferOffset = 0 }: Partial<{ bufferOffset: number }> = {},
): SafeTuple<GPUBuffer> => {
  const overflow = data.byteLength - (buff.size - bufferOffset)

  if (overflow > 0) {
    const [newBuff, err] = createBuffer(device, { size: buff.size + overflow, usage: buff.usage, label: buff.label})

    if (err) return [null, err]

    // device.co
    device.queue.writeBuffer(buff, bufferOffset, data)
    buff = newBuff
  }

  try {
    device.queue.writeBuffer(buff, bufferOffset, data)

    return [buff, null]
  } catch (err) {
    return [null, createCodeErrWithExcep(ErrorCode.WebGpuWriteBufferFailure, "WebGPU buffer write operation failed.", err)]
  }
}

export const createVertexBuffer = (device: GPUDevice, data: Float32Array = new Float32Array()): GPUBuffer => {
  const buff = device.createBuffer({
    size: data.byteLength,
    usage:
      GPUBufferUsage.VERTEX |
      GPUBufferUsage.COPY_SRC |
      GPUBufferUsage.COPY_DST |
      GPUBufferUsage.MAP_READ |
      GPUBufferUsage.MAP_WRITE,
  })

  device.queue.writeBuffer(buff, 0, data)

  return buff
}

const UNI_BUFFER_USAGE =
  GPUBufferUsage.COPY_SRC |
  GPUBufferUsage.COPY_DST |
  GPUBufferUsage.INDEX |
  GPUBufferUsage.MAP_READ |
  GPUBufferUsage.MAP_WRITE |
  GPUBufferUsage.STORAGE |
  GPUBufferUsage.UNIFORM |
  GPUBufferUsage.VERTEX |
  GPUBufferUsage.QUERY_RESOLVE |
  GPUBufferUsage.INDIRECT

export const createBuffer = (
  device: GPUDevice,
  settings: RecordOptionals<GPUBufferDescriptor, "usage">,
): SafeTuple<GPUBuffer> => {
  try {
    const buff = device.createBuffer({
      ...settings,
      usage: settings.usage ?? UNI_BUFFER_USAGE,
    })

    return [buff, null]
  } catch (err) {
    return [null, createCodeErrWithExcep(ErrorCode.WebGpuCreateBufferFailure, "WebGPU buffer creation failed.", err)]
  }
}

export const updateBuffer = async (
  buff: GPUBuffer,
  mapMode: GPUMapModeFlags,
  mapper: (buff: ArrayBuffer) => void,
  { offset, length }: Partial<{ offset: GPUSize64; length: GPUSize64 }> = {},
) => {
  await buff.mapAsync(mapMode, offset, length)
  mapper(buff.getMappedRange(offset, length))
  buff.unmap()
}

export const createView = (ctx: GPUCanvasContext, descriptor: GPUTextureViewDescriptor) =>
  ctx.getCurrentTexture().createView(descriptor)
