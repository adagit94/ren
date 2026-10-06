import { CommonSettings } from "../../types/CommonTypes"

export type TPipeline = GPURenderPipeline | GPUComputePipeline

export type TDescriptor = GPURenderPipelineDescriptor

export type TGetPipeline<T extends TPipeline> = (key: string | number) => T

export type TSetPipeline<T extends TPipeline> = (
  key: string | number,
  descriptor: T extends GPURenderPipeline
    ? GPURenderPipelineDescriptor
    : GPUComputePipelineDescriptor
) => Promise<T>

export type TPipelines<T extends TPipeline> = Record<string | number, T>

export type TPipelinesSettings = {} & CommonSettings