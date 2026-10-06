import { TBuffersSettings, TGetBuffer, TSetBuffer, TBuffers, TWriteBuffer } from "./BuffersTypes"

interface IBuffers {
    get: TGetBuffer
    set: TSetBuffer
    write: TWriteBuffer
}

export class Buffers implements IBuffers {
    constructor(settings: TBuffersSettings) {
        this.settings = settings
    }

    private settings: TBuffersSettings
    private buffers: TBuffers = {}

    public get: TGetBuffer = (key) => {
        return this.buffers[key]
    }

    public set: TSetBuffer = (key, descriptor) => {
        const buffer = (this.buffers[key] = this.settings.device.createBuffer(descriptor))

        return buffer
    }

    public write: TWriteBuffer = (key, settings) => {
        const buffer = this.get(key)

        this.settings.device.queue.writeBuffer(
            buffer,
            settings.bufferOffset,
            settings.data,
            settings.dataOffset,
            settings.size
        )
    }
}
