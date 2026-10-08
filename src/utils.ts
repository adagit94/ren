import { CodeErr, OnErr } from "./errors"
import { SafeTuple } from "./types"

export const safely = <R>(f: () => R, onErr: OnErr): SafeTuple<R, CodeErr> => {
  try {
    const r = f()

    return [r, null]
  } catch (err) {
    return [null, onErr(err)]
  }
}

export const safely2 = <R1, R2>(f1: () => R1, f2: (r1: R1) => R2, onErr: OnErr): SafeTuple<R2> => {
  const [r1, err1] = safely(f1, onErr)

  if (err1 !== null) {
    return [null, err1]
  }

  const [r2, err2] = safely(() => f2(r1), onErr)

  if (err2 !== null) {
    return [null, err2]
  }

  return [r2, null]
}

export const safely3 = <R1, R2, R3>(
  f1: () => R1,
  f2: (r1: R1) => R2,
  f3: (r2: R2) => R3,
  onErr: OnErr
): SafeTuple<R3> => {
  const [r1, err1] = safely(f1, onErr)

  if (err1 !== null) {
    return [null, err1]
  }

  const [r2, err2] = safely(() => f2(r1), onErr)

  if (err2 !== null) {
    return [null, err2]
  }

  const [r3, err3] = safely(() => f3(r2), onErr)

  if (err3 !== null) {
    return [null, err3]
  }

  return [r3, null]
}

export const safely4 = <R1, R2, R3, R4>(
  f1: () => R1,
  f2: (r1: R1) => R2,
  f3: (r2: R2) => R3,
  f4: (r3: R3) => R4,
  onErr: OnErr,
): SafeTuple<R4> => {
  const [r1, err1] = safely(f1, onErr)

  if (err1 !== null) {
    return [null, err1]
  }

  const [r2, err2] = safely(() => f2(r1), onErr)

  if (err2 !== null) {
    return [null, err2]
  }

  const [r3, err3] = safely(() => f3(r2), onErr)

  if (err3 !== null) {
    return [null, err3]
  }

  const [r4, err4] = safely(() => f4(r3), onErr)

  if (err4 !== null) {
    return [null, err4]
  }

  return [r4, null]
}
