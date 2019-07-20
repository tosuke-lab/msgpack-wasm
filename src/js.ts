import { MessagePackSerde } from './serde'

const textDecoder = new TextDecoder()

export class JSMessagePackDecoder {
  private pos: number = 0
  private bufLength: number
  private u8array: Uint8Array
  private view: DataView

  constructor(readonly serializer: MessagePackSerde<unknown>, buffer: ArrayBuffer, offset: number = 0, length?: number) {
    length = length ? length + offset : buffer.byteLength
    this.bufLength = length
    this.pos = offset
    this.view = new DataView(buffer)
    this.u8array = new Uint8Array(buffer)
  }

  decode(): boolean {
    const s = this.serializer
    do {
      const head = this.readU8()
      if (head <= 0xbf) {
        if (head <= 0x7f) {
          // positive fixint
          s.addValue(head)
        } else if (head >= 0xa0) {
          // fixstr
          s.addValue(this.readUtf8String(head & 0b11111))
        } else if (head <= 0x8f) {
          // fixmap
          s.enterMap(head & 0b1111)
        } else {
          // fixarray
          s.enterArray(head & 0b1111)
        }
      } else if (head >= 0xe0) {
        // negative fixint
        s.addValue(head - 0x100)
      } else {
        switch (head) {
          case 0xc0:
            // nil
            s.addValue(null)
            break
          case 0xc2:
            // false
            s.addValue(false)
            break
          case 0xc3:
            // true
            s.addValue(true)
            break
          case 0xc4:
            {
              // bin 8
              const size = this.readU8()
              s.addValue(this.readBin(size))
            }
            break
          case 0xc5:
            {
              // bin 16
              const size = this.readU16()
              s.addValue(this.readBin(size))
            }
            break
          case 0xc6:
            {
              // bin 32
              const size = this.readU32()
              s.addValue(this.readBin(size))
            }
            break
        }
      }
    } while (this.pos < this.bufLength)
    return true
  }

  readUtf8String(length: number): string {
    const value = textDecoder.decode(this.u8array.subarray(this.pos, this.pos + length))
    this.pos += length
    return value
  }

  readBin(length: number): Uint8Array {
    const value = this.u8array.slice(this.pos, this.pos + length)
    this.pos += length
    return value
  }

  readU8() {
    const v = this.view.getUint8(this.pos)
    this.pos++
    return v
  }

  readU16() {
    const v = this.view.getUint16(this.pos)
    this.pos += 2
    return v
  }

  readU32() {
    const v = this.view.getUint32(this.pos)
    this.pos += 4
    return v
  }

  readU64() {
    const high = this.view.getUint32(this.pos)
    const low = this.view.getUint32(this.pos + 4)
    this.pos += 8
    return high * 0x1_0000_0000 + low
  }
}
