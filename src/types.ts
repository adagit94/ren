import { CodeError } from "./errors"

export type PrimitiveValue = string | number | boolean

export type SafeTuple<T, U = CodeError> = [T, null] | [null, U]

/**
@description
A utility type that makes just specific properties of record required (non-optional) in case they aren't already.

@example
type Rec = RecordRequired<{ a?: number; b?: string }, "b"> // { a?: number; b: string }
*/
export type RecordRequired<R extends Record<PropertyKey, unknown>, Ks extends keyof R> = Omit<R, Ks> &
  Required<Pick<R, Ks>>

/**
@description
A utility type that makes just specific properties of record optional in case they aren't already.

@example
type Rec = RecordOptionals<{ a: number; b: string }, "b"> // { a: number; b?: string }
*/
export type RecordOptionals<R extends object, Ks extends keyof R> = Omit<R, Ks> &
  Partial<Pick<R, Ks>>

interface T { a: number }
type T2 = RecordOptionals<T, "a">
