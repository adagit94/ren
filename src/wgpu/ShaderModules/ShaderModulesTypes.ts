import { CommonSettings } from "../../types/CommonTypes"

export type TShaderModules = Record<string | number, GPUShaderModule>

export type TShaderModulesSettings = {} & CommonSettings

export type TGetShaderModule = (key: string | number) => GPUShaderModule

export type TSetShaderModule = (
  key: string | number,
  descriptor: GPUShaderModuleDescriptor
) => GPUShaderModule
