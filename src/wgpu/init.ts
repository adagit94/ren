import { CodeErr, createCodeErrWithExcep, ErrCode } from "../errors"
import { RecordOptionals, SafeTuple } from "../types"
import { safely, safely2 } from "../utils"

// restoreLostDevice: boolean;

type GpuAdapterInfo = Omit<GPUAdapter, "__brand" | "requestDevice">
type InitDeviceParams = Partial<{
  requestAdapterOptions: GPURequestAdapterOptions
  getDeviceDescriptor: (adapterInfo: GpuAdapterInfo) => GPUDeviceDescriptor
  onDeviceLost: (info: GPUDeviceLostInfo) => void
}>

/**
 * @description Function request's adapter and then device, if appropriate. In case of success, function returns [{@link GPUDevice}, null]. [null, {@link CodeErr}] is returned in case of an error.
 * @param params - {@link InitDeviceParams}
 * @property params.requestAdapterOptions? - {@link GPURequestAdapterOptions}
 * @property params.getDeviceDescriptor?: (adapterInfo: {@link GpuAdapterInfo}) => {@link GPUDeviceDescriptor} - Function that can be used to configure {@link GPUDeviceDescriptor} appropriately based on the {@link GpuAdapterInfo} received after successfull adapter retrieval.
 * @property params.onDeviceLost?: (info: {@link GPUDeviceLostInfo}) => void - Function to run when {@link GPUDevice} get's lost - e.g. to attempt reinitialization and request {@link GPUDevice} again.
 * @returns [{@link GPUDevice}, null] in case of success or [null, {@link CodeErr}] in case of an error.
 */
export const initDevice = async ({
  requestAdapterOptions,
  getDeviceDescriptor,
  onDeviceLost,
}: InitDeviceParams = {}): Promise<SafeTuple<GPUDevice>> => {
  if (!navigator.gpu) [null, new CodeErr(ErrCode.WebGpuUnavailable, "WebGPU unavailable.")]

  const adapter = await navigator.gpu.requestAdapter(requestAdapterOptions)

  if (!adapter) return [null, new CodeErr(ErrCode.WebGpuAdapterRequestFailure, "WebGPU adapter request failed.")]

  try {
    const device = await adapter.requestDevice(getDeviceDescriptor?.(adapter))

    device.lost.then((info) => {
      console.error(`WebGPU device was lost.\n${info.message}`)
      onDeviceLost?.(info)
    })

    return [device, null]
  } catch (err) {
    return [null, createCodeErrWithExcep(ErrCode.WebGpuDeviceRequestFailure, "WebGPU device request failed.", err)]
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
      return [null, new CodeErr(ErrCode.WebGpuContextFailure, "Canvas context already set or webgpu not supported.")]
    }

    try {
      ctx.configure({
        ...conf,
        format: conf.format ?? navigator.gpu.getPreferredCanvasFormat(),
        alphaMode: conf.alphaMode ?? "premultiplied",
      })

      return [ctx, null]
    } catch (err) {
      return [null, createCodeErrWithExcep(ErrCode.WebGpuContextFailure, "WebGPU context configuration failed.", err)]
    }
  } catch (err) {
    return [null, createCodeErrWithExcep(ErrCode.WebGpuContextFailure, "WebGPU context retrieval failed.", err)]
  }
}

const [d] = await initDevice()

if (d) {
  // d.createCommandEncoder()
}

type WgpuConf = {
  device: InitDeviceParams
}

type Wgpu = {
  device: GPUDevice
  encoder: GPUCommandEncoder
}

const init = async (conf: WgpuConf): Promise<SafeTuple<Wgpu>> => {
  const [dev, devErr] = await initDevice(conf.device)

  if (devErr !== null) return [null, devErr]

  const enc = dev.createCommandEncoder()

  return [
    {
      device: dev,
      encoder: enc,
    },
    null,
  ]
}

// export const

export const writeData = (
  dev: GPUDevice,
  enc: GPUCommandEncoder,
  buff: GPUBuffer,
  data: AllowSharedBufferSource,
  { bufferOffset = 0 }: Partial<{ bufferOffset: number }> = {},
): SafeTuple<GPUBuffer> => {
  const buffOverflow = data.byteLength - (buff.size - bufferOffset)

  if (buffOverflow > 0) {
    const [newBuff, err] = reallocBuff(dev, enc, buff, buff.size + buffOverflow)

    if (err) return [null, err]
    buff = newBuff
  }

  return safely(
    () => {
      dev.queue.writeBuffer(buff, bufferOffset, data)
      return buff
    },
    (err) => createCodeErrWithExcep(ErrCode.WebGpuWriteBufferFailure, "WebGPU buffer write operation failed.", err),
  )
}

const reallocBuff = (
  dev: GPUDevice,
  enc: GPUCommandEncoder,
  origBuff: GPUBuffer,
  newSize: number,
): SafeTuple<GPUBuffer> => {
  try {
    const newBuff = dev.createBuffer({ size: newSize, usage: origBuff.usage, label: origBuff.label })

    enc.copyBufferToBuffer(origBuff, newBuff)
    return [newBuff, null]
  } catch (err) {
    return [
      null,
      createCodeErrWithExcep(ErrCode.WebGpuBufferReallocationFailure, "WebGPU buffer reallocation failed.", err),
    ]
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
    return [null, createCodeErrWithExcep(ErrCode.WebGpuCreateBufferFailure, "WebGPU buffer creation failed.", err)]
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
