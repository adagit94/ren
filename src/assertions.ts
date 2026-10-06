import { PrimitiveValue } from "./types"

export const isNumber = (x: unknown): x is number =>
  x !== undefined && x !== null && !Number.isNaN(x) && (typeof x === "number" || x instanceof Number);

export const isString = (x: unknown): x is string => typeof x === "string" || x instanceof String;

export const isBoolean = (x: unknown): x is boolean => typeof x === "boolean" || x instanceof Boolean;

export const isPrimitive = (val: unknown): val is PrimitiveValue => isString(val) || isNumber(val) || isBoolean(val);

export const isObject = (x: unknown): x is object => typeof x === "object" && x !== null;

export const isRecord = (x: unknown): x is Record<PropertyKey, unknown> => isObject(x) && !Array.isArray(x);

export const isErr = (x: unknown): x is Error => x instanceof Error