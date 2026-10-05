import { CodeError } from "../errors"

export type SafeTuple<T, U = CodeError> = [T, null] | [null, U];