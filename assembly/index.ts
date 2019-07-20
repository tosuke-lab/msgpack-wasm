import { xxhash64, fnv64 } from './hash'

export declare function enterArray(size: u32): void
export declare function enterMap(size: u32): void
export declare function addNil(): void
export declare function addFalse(): void
export declare function addTrue(): void
export declare function addI32(num: i32): void
export declare function addU32(num: u32): void
export declare function addF32(num: f32): void
export declare function addF64(num: f64): void
export declare function addHitKey(entry: usize): void
export declare function addUnHitKey(entry: usize, begin: usize, end: usize): void
export declare function addUtf8ShortString(begin: usize, end: usize): void
export declare function addUtf8LongString(begin: usize, end: usize): void

export function decode(begin: usize, end: usize): usize {
  let ptr: usize = begin

  let size: usize
  let valueEnd: usize
  do {
    const headByte = load<u8>(ptr)
    ptr++
    switch (headByte) {
      // positive fixint
      default:
        addI32(headByte)
        break

      // fixmap
      case 0x80:
      case 0x81:
      case 0x82:
      case 0x83:
      case 0x84:
      case 0x85:
      case 0x86:
      case 0x87:
      case 0x88:
      case 0x89:
      case 0x8a:
      case 0x8b:
      case 0x8c:
      case 0x8d:
      case 0x8e:
      case 0x8f:
        enterMap(headByte & 0b1111)
        break

      // fixarray
      case 0x90:
      case 0x91:
      case 0x92:
      case 0x93:
      case 0x94:
      case 0x95:
      case 0x96:
      case 0x97:
      case 0x98:
      case 0x99:
      case 0x9a:
      case 0x9b:
      case 0x9c:
      case 0x9d:
      case 0x9e:
      case 0x9f:
        enterArray(headByte & 0b1111)
        break

      // fixstr
      case 0xa0:
      case 0xa1:
      case 0xa2:
      case 0xa3:
      case 0xa4:
      case 0xa5:
      case 0xa6:
      case 0xa7:
      case 0xa8:
      case 0xa9:
      case 0xaa:
      case 0xab:
      case 0xac:
      case 0xad:
      case 0xae:
      case 0xaf:
      case 0xb0:
      case 0xb1:
      case 0xb2:
      case 0xb3:
      case 0xb4:
      case 0xb5:
      case 0xb6:
      case 0xb7:
      case 0xb8:
      case 0xb9:
      case 0xba:
      case 0xbb:
      case 0xbc:
      case 0xbd:
      case 0xbe:
      case 0xbf:
        size = headByte & 0b11111
        valueEnd = ptr + size
        if (valueEnd > end) return ptr - 1
        if (size <= 16) {
          addKeyCacheString(ptr, valueEnd)
        } else {
          addUtf8ShortString(ptr, valueEnd)
        }
        ptr += size
        break

      // nil
      case 0xc0:
        addNil()
        break

      // never used
      case 0xc1:
        // TODO
        break

      // false
      case 0xc2:
        addFalse()
        break

      // true
      case 0xc3:
        addTrue()
        break

      // bin 8
      case 0xc4:
        // TODO
        break

      // bin 16
      case 0xc5:
        // TODO
        break

      // bin 32
      case 0xc6:
        // TODO
        break

      // ext 8
      case 0xc7:
        // TODO
        break

      // ext 16
      case 0xc8:
        // TODO
        break

      // ext 32
      case 0xc9:
        // TODO
        break

      // float 32
      case 0xca:
        if (ptr + sizeof<f32>() > end) return ptr - 1
        addF32(reinterpret<f32>(bswap<u32>(load<u32>(ptr))))
        ptr += sizeof<f32>()
        break

      // float 64
      case 0xcb:
        if (ptr + sizeof<f64>() > end) return ptr - 1
        addF64(reinterpret<f64>(bswap<u64>(load<u64>(ptr))))
        ptr += sizeof<f64>()
        break

      // uint 8
      case 0xcc:
        if (ptr + sizeof<u8>() > end) return ptr - 1
        addU32(load<u8>(ptr))
        ptr += sizeof<u8>()
        break

      // uint 16
      case 0xcd:
        if (ptr + sizeof<u16>() > end) return ptr - 1
        addU32(bswap<u16>(load<u16>(ptr)))
        ptr += sizeof<u16>()
        break

      // uint 32
      case 0xce:
        if (ptr + sizeof<u32>() > end) return ptr - 1
        addU32(bswap<u32>(load<u32>(ptr)))
        ptr += sizeof<u32>()
        break

      // uint 64
      case 0xcf:
        // TODO
        break

      // int 8
      case 0xd0:
        if (ptr + sizeof<i8>() > end) return ptr - 1
        addI32(load<i8>(ptr))
        ptr += sizeof<i8>()
        break

      // int 16
      case 0xd1:
        if (ptr + sizeof<i16>() > end) return ptr - 1
        addI32(bswap<i16>(load<i16>(ptr)))
        ptr += sizeof<i16>()
        break

      // int 32
      case 0xd2:
        if (ptr + sizeof<i32>() > end) return ptr - 1
        addI32(bswap<i32>(load<i32>(ptr)))
        ptr += sizeof<i32>()
        break

      // int 64
      case 0xd3:
        // TODO
        break

      // fixext 1
      case 0xd4:
        // TODO
        break

      // fixext 2
      case 0xd5:
        // TODO
        break

      // fixext 4
      case 0xd6:
        // TODO
        break

      // fixext 8
      case 0xd7:
        // TODO
        break

      // fixext 16
      case 0xd8:
        // TOOD
        break

      // str 8
      case 0xd9:
        size = load<u8>(ptr)
        if (ptr + sizeof<u8>() + size > end) return ptr - 1
        ptr += sizeof<u8>()
        addUtf8LongString(ptr, ptr + size)
        ptr += size
        break

      // str 16
      case 0xda:
        size = bswap<u16>(load<u16>(ptr))
        if (ptr + sizeof<u16>() + size > end) return ptr - 1
        ptr += sizeof<u16>() + size
        addUtf8LongString(ptr - size, ptr)
        break

      // str 32
      case 0xdb:
        size = bswap<u32>(load<u32>(ptr))
        if (ptr + sizeof<u32>() + size > end) return ptr - 1
        ptr += sizeof<u32>()
        addUtf8LongString(ptr, ptr + size)
        ptr += size
        break

      // array 16
      case 0xdc:
        if (ptr + sizeof<u16>() > end) return ptr - 1
        enterArray(bswap<u16>(load<u16>(ptr)))
        ptr += sizeof<u16>()
        break

      // array 32
      case 0xdd:
        if (ptr + sizeof<u32>() > end) return ptr - 1
        enterArray(bswap<u32>(load<u32>(ptr)))
        ptr += sizeof<u32>()
        break

      // map 16
      case 0xde:
        if (ptr + sizeof<u16>() > end) return ptr - 1
        enterMap(bswap<u16>(load<u16>(ptr)))
        ptr += sizeof<u16>()
        break

      // map 32
      case 0xdf:
        if (ptr + sizeof<u32>() > end) return ptr - 1
        enterMap(bswap<u32>(load<u32>(ptr)))
        ptr += sizeof<u32>()
        break

      // negative fixint
      case 0xe0:
      case 0xe1:
      case 0xe2:
      case 0xe3:
      case 0xe4:
      case 0xe5:
      case 0xe6:
      case 0xe7:
      case 0xe8:
      case 0xe9:
      case 0xea:
      case 0xeb:
      case 0xec:
      case 0xed:
      case 0xee:
      case 0xef:
      case 0xf0:
      case 0xf1:
      case 0xf2:
      case 0xf3:
      case 0xf4:
      case 0xf5:
      case 0xf6:
      case 0xf7:
      case 0xf8:
      case 0xf9:
      case 0xfa:
      case 0xfb:
      case 0xfc:
      case 0xfd:
      case 0xfe:
      case 0xff:
        addI32(headByte - 0x100)
        break
    }
  } while (ptr < end)
  return ptr
}

function addKeyCacheString(begin: usize, end: usize): void {
  const size = i32(end - begin)
  if (size === 0) {
    addUtf8ShortString(0, 0)
    return
  }
  let data0: u64 = load<u64>(begin)
  let data1: u64 = size > 8 ? load<u64>(begin, sizeof<u64>()) : 0
  switch(size) {
    case 0:
      data0 = 0
      break
    case 1:
      data0 &= 0xff
      break
    case 2:
      data0 &= 0xffff
      break
    case 3:
      data0 &= 0xff_ffff
      break
    case 4:
      data0 &= 0xffff_ffff
      break
    case 5:
      data0 &= 0xff_ffff_ffff
      break
    case 6:
      data0 &= 0xffff_ffff_ffff
      break
    case 7:
      data0 &= 0xff_ffff_ffff_ffff
      break
    case 9:
      data1 &= 0xff
      break
    case 10:
      data1 &= 0xffff
      break
    case 11:
      data1 &= 0xff_ffff
      break
    case 12:
      data1 &= 0xffff_ffff
      break
    case 13:
      data1 &= 0xff_ffff_ffff
      break
    case 14:
      data1 &= 0xffff_ffff_ffff
      break
    case 15:
      data1 &= 0xff_ffff_ffff_ffff
      break
  }
  const entry: isize = getEntryNum(size, data0, data1)
  if(entry < 0) {
    setEntry(size, data0, data1)
    addUnHitKey(-entry, begin, end)
  } else {
    addHitKey(entry)
  }
}

/* HashTable Entry 
{
  size: u32
  data0: u64
  data1: u64
}
*/
const entryBase = 0
const entrySize = sizeof<u32>() + sizeof<u64>() * 2
function getEntryNum(size: u32, data0: u64, data1: u64): isize {
  const hash = fnv64(data0, data1)
  const num = isize(hash & 0xff)
  const ptr = usize(entryBase + entrySize * num)
  if(size === load<u32>(ptr) && data0 === load<u64>(ptr, 4) && data1 === load<u64>(ptr, 12)) {
    return num
  }
  return -num
}

function setEntry(size: u32, data0: u64, data1: u64): void {
  const num = fnv64(data0, data1) & 0xff
  const ptr = usize(entryBase + entrySize * num)
  store<u32>(ptr, size, 0)
  store<u64>(ptr, data0, sizeof<u32>())
  store<u64>(ptr, data1, sizeof<u32>() + sizeof<u64>())
}
