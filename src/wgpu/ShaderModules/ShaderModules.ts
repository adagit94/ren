import {
    TGetShaderModule,
    TSetShaderModule,
    TShaderModules,
    TShaderModulesSettings,
} from "./ShaderModulesTypes"

interface IShaderModules {
    get: TGetShaderModule
    set: TSetShaderModule
}

export class ShaderModules implements IShaderModules {
    constructor(settings: TShaderModulesSettings) {
        this.settings = settings
    }

    private settings: TShaderModulesSettings
    private shaderModules: TShaderModules = {}

    public get: TGetShaderModule = (key) => {
        return this.shaderModules[key]
    }

    public set: TSetShaderModule = (key, descriptor) => {
        const shaderModule = (this.shaderModules[key] = this.settings.device.createShaderModule(descriptor))

        return shaderModule
    }
}
