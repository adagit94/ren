export const bindGroupsLayouts: Record<string | number, GPUBindGroupLayout> = {};
export const bindGroups: Record<string | number, GPUBindGroup> = {};

export const getBindingIdentifier = (() => {
    let bindingIdentifier = 0;

    return () => bindingIdentifier++;
})();
