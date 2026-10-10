import { createCodeErrWithExcep, ErrCode } from "../errors"
import { RecordOptionals, SafeTuple } from "../types"
import { safely } from "../utils"

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

type NewBuffConfBase = RecordOptionals<GPUBufferDescriptor, "usage">
type NewBuffConfWithData = RecordOptionals<NewBuffConfBase, "size"> & { data: AllowSharedBufferSource }
type NewBuffConfWithoutData = NewBuffConfBase

export function newBuff(dev: GPUDevice, enc: GPUCommandEncoder, conf: NewBuffConfWithData): SafeTuple<GPUBuffer>
export function newBuff(dev: GPUDevice, enc: GPUCommandEncoder, conf: NewBuffConfWithoutData): SafeTuple<GPUBuffer>
export function newBuff(
  dev: GPUDevice,
  enc: GPUCommandEncoder,
  conf: NewBuffConfWithData | NewBuffConfWithoutData,
): SafeTuple<GPUBuffer> {
  try {
    const [size, data] = "data" in conf ? [conf.size ?? conf.data.byteLength, conf.data] : [conf.size, null]
    let buff = dev.createBuffer({
      ...conf,
      size,
      usage: conf.usage ?? UNI_BUFFER_USAGE,
    })

    if (data) {
      const [writtenBuff, err] = writeBuff(dev, enc, buff, data)

      if (err) return [null, err]
      buff = writtenBuff
    }

    return [buff, null]
  } catch (err) {
    return [null, createCodeErrWithExcep(ErrCode.WebGpuCreateBufferFailure, "WebGPU buffer creation failed.", err)]
  }
}

export const writeBuff = (
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

export const reallocBuff = (
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

export const mapBuff = async (
  buff: GPUBuffer,
  mapper: (buff: ArrayBuffer) => void,
  { offset, length }: Partial<{ offset: GPUSize64; length: GPUSize64 }> = {},
) => {
  await buff.mapAsync(GPUMapMode.READ | GPUMapMode.WRITE, offset, length)
  mapper(buff.getMappedRange(offset, length))
  buff.unmap()
}
