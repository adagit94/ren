import { CodeError } from "./errors"

export type PrimitiveValue = string | number | boolean;

export type SafeTuple<T, U = CodeError> = [T, null] | [null, U];