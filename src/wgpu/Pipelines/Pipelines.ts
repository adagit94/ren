import {
  TGetPipeline,
  TPipeline,
  TPipelines,
  TPipelinesSettings,
  TSetPipeline,
} from "./PipelinesTypes"

interface IPipelines<T extends TPipeline> {
  get: TGetPipeline<T>
  set: TSetPipeline<T>
}

export class Pipelines<T extends TPipeline> implements IPipelines<T> {
  constructor(settings: TPipelinesSettings) {
    this.settings = settings
  }

  private settings: TPipelinesSettings
  private pipelines: TPipelines<T> = {}

  public get: TGetPipeline<T> = (key) => {
    return this.pipelines[key]
  }

  public set: TSetPipeline<T> = async (key, descriptor) => {
    let pipeline: TPipeline

    if ("compute" in descriptor) {
      pipeline = await this.settings.device.createComputePipelineAsync(descriptor)
    } else {
      pipeline = await this.settings.device.createRenderPipelineAsync(descriptor)
    }

    return (this.pipelines[key] = pipeline as T)
  }
}
