import { CommonSettings } from "../../types/CommonTypes"

export type TBuffersSettings = {} & CommonSettings

export type TBuffers = Record<string | number, GPUBuffer>

export type TGetBuffer = (key: string | number) => GPUBuffer

export type TSetBuffer = (
  key: string | number,
  descriptor: GPUBufferDescriptor
) => GPUBuffer

export type TWriteBuffer = (
  key: string | number,
  settings: {
    bufferOffset: number
    data: BufferSource | SharedArrayBuffer
    dataOffset?: number
    size?: number
  }
) => void