import { MessagePackSerde } from './serde'
import { WASM_STR_THRESHOLD } from '@msgpack/msgpack/dist/wasmFunctions'
import { runInThisContext } from 'vm'

const ST_NONE = -1
const ST_ARRAY = 0
const ST_MAP_KEY = 1
const ST_MAP_VALUE = 2

type State =
  | {
      type: typeof ST_NONE
    }
  | {
      type: typeof ST_ARRAY
      position: number
      size: number
      array: Array<unknown>
    }
  | {
      type: typeof ST_MAP_KEY | typeof ST_MAP_VALUE
      remains: number
      key: string
      map: Record<string, unknown>
    }

export class ObjectDeserializer implements MessagePackSerde<unknown> {
  private stack: State[] = []
  private stackTop: State = { type: -1 }
  private value: unknown

  getResult(): unknown {
    if (this.stack.length !== 0) throw new Error('Cannot get result when processing')
    return this.value
  }

  clear(): void {
    this.stack = []
    this.stackTop = { type: -1 }
    this.value = undefined
  }

  addValue(value: unknown) {
    this.value = value
    while (true) {
      const item = this.stackTop
      switch (item.type) {
        case -1 /* ST_NONE */:
          return
        case 0 /* ST_ARRAY */:
          item.array[item.position] = this.value
          item.position++
          if (item.position === item.size) {
            this.value = item.array
            break
          }
          return
        case 1 /*ST_MAP_KEY */:
          if (typeof this.value !== 'string') throw new Error('The type of key must be string')
          item.key = this.value
          item.type = 2 // ST_MAP_VALUE
          return
        case 2 /* ST_MAP_VALUE */:
          item.map[item.key] = this.value
          if (--item.remains !== 0) {
            item.type = 1 // ST_MAP_KEY
            return
          } else {
            this.value = item.map
            break
          }
      }
      this.stack.pop()
      if (this.stack.length === 0) {
        this.stackTop = { type: -1 }
        return
      }
      this.stackTop = this.stack[this.stack.length - 1]
    }
  }

  enterArray(size: number) {
    if (size === 0) {
      this.addValue([])
      return
    }
    const state: State = {
      type: ST_ARRAY,
      position: 0,
      size: size | 0,
      array: new Array(size),
    }
    this.stackTop = state
    this.stack.push(state)
  }

  enterMap(size: number) {
    if (size === 0) {
      this.addValue({})
      return
    }
    const state: State = {
      type: ST_MAP_KEY,
      key: '',
      remains: size | 0,
      map: {},
    }
    this.stackTop = state
    this.stack.push(state)
  }
}
