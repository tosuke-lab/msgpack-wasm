import { MessagePackSerde } from './serde'

export class WasmMessagePackDecoder {
  public serializer: MessagePackSerde<unknown>
  private instance: WebAssembly.Instance
  private memory: WebAssembly.Memory
  private arrayView: Uint8Array
  private dataView: DataView
  private begin: number = 0
  private end: number = 0
  private keyCache: Array<string> = new Array(256)

  constructor(serializer: MessagePackSerde<unknown>, module: WebAssembly.Module) {
    this.serializer = serializer
    this.memory = new WebAssembly.Memory({ initial: 1 })
    this.arrayView = new Uint8Array(this.memory.buffer)
    this.dataView = new DataView(this.memory.buffer)

    const textDecoder = new TextDecoder('utf-8')

    const addNum = (num: number) => {
      this.serializer.addValue(num)
    }

    this.instance = new WebAssembly.Instance(module, {
      env: {
        memory: this.memory,
      },
      index: {
        enterArray: (length: number) => {
          this.serializer.enterArray(length)
        },
        enterMap: (size: number) => {
          this.serializer.enterMap(size)
        },
        addNil: () => {
          this.serializer.addValue(null)
        },
        addFalse: () => {
          this.serializer.addValue(false)
        },
        addTrue: () => {
          this.serializer.addValue(true)
        },
        addI32: addNum,
        addU32: addNum,
        addF32: addNum,
        addF64: addNum,
        addHitKey: (entry: number) => {
          this.serializer.addValue(this.keyCache[entry])
        },
        addUnHitKey: (entry: number, begin: number, end: number) => {
          const str = decodeUtf8(this.arrayView, begin, end)
          this.keyCache[entry] = str
          this.serializer.addValue(str)
        },
        addUtf8ShortString: (begin: number, end: number) => {
          this.serializer.addValue(decodeUtf8(this.arrayView, begin, end))
        },
        addUtf8LongString: (begin: number, end: number) => {
          const str = textDecoder.decode(this.arrayView.subarray(begin, end))
          this.serializer.addValue(str)
        },
      },
    })
  }

  setBuffer(u8buf: Uint8Array) {
    this.arrayView.set(u8buf, 8192)
    this.begin = 8192
    this.end = 8192 + u8buf.length
  }

  decode(): unknown {
    this.serializer.clear()
    this.instance.exports.decode(this.begin, this.end)
    return this.serializer.getResult()
  }
}

function decodeUtf8(buf: Uint8Array, begin: number, end: number): string {
  let str = ''
  let ptr = begin
  while (ptr < end) {
    const b1 = buf[ptr++]
    if ((b1 & 0b1000_0000) === 0) {
      // 1 byte
      str += String.fromCharCode(b1)
    } else if ((b1 & 0b0010_0000) === 0) {
      // 2 bytes
      const b2 = buf[ptr++] & 0x3f
      str += String.fromCharCode(((b1 & 0b11111) << 6) | b2)
    } else if ((b1 & 0b0001_0000) === 0) {
      // 3 bytes
      const b2 = buf[ptr++] & 0x3f
      const b3 = buf[ptr++] & 0x3f
      str += String.fromCharCode(((b1 & 0b1111) << 12) | (b2 << 6) | b3)
    } else if ((b1 & 0b1000) === 0) {
      // 4 bytes
      const b2 = buf[ptr++] & 0x3f
      const b3 = buf[ptr++] & 0x3f
      const b4 = buf[ptr++] & 0x3f
      let codepoint = ((b1 & 0b111) << 18) | (b2 << 12) | (b3 << 6) | b4
      if (codepoint < 0xffff) {
        str += String.fromCharCode(codepoint)
      } else {
        codepoint -= 0x1_0000
        str += String.fromCharCode(
          0b1101_1000_0000_0000 | ((codepoint >>> 10) & 0x3ff),
          0b1101_1100_0000_0000 | (codepoint & 0x3ff),
        )
      }
    }
  }
  return str
}
