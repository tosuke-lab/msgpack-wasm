const PRIME64_1 = 11400714785074694791 /* 0b1001111000110111011110011011000110000101111010111100101010000111 */
const PRIME64_2 = 14029467366897019727 /* 0b1100001010110010101011100011110100100111110101001110101101001111 */
const PRIME64_3 = 1609587929392839161 /* 0b0001011001010110011001111011000110011110001101110111100111111001 */
const PRIME64_4 = 9650029242287828579 /* 0b1000010111101011110010100111011111000010101100101010111001100011 */
const PRIME64_5 = 2870177450012600261 /* 0b0010011111010100111010110010111100010110010101100110011111000101 */

export function xxhash64(data0: u64, data1: u64, seed: u64 = 0): u64 {
  let h64: u64 = seed + PRIME64_5 + 16
  let k1: u64
  
  k1 = data0
  k1 *= PRIME64_2
  k1 = rotl<u64>(k1, 31)
  k1 *= PRIME64_1
  h64 ^= k1
  h64 = rotl<u64>(h64, 27) * PRIME64_1 + PRIME64_4

  k1 = data1
  k1 *= PRIME64_2
  k1 = rotl<u64>(k1, 31)
  k1 *= PRIME64_1
  h64 ^= k1
  h64 = rotl<u64>(h64, 27) * PRIME64_1 + PRIME64_4

  h64 ^= h64 >>> 33
  h64 *= PRIME64_2
  h64 ^= h64 >>> 29
  h64 *= PRIME64_3
  h64 ^= h64 >>> 32
  return h64
}

const FNV_PRIME: u64 = 1099511628211
const FNV_BASIS: u64 = 14695981039346656037
export function fnv64(data0: u64, data1: u64): u64 {
  let h: u64 = FNV_BASIS
  h *= FNV_PRIME
  h ^= data0 & 0xff
  h *= FNV_PRIME
  h ^= (data0 >>> 8) & 0xff
  h *= FNV_PRIME
  h ^= (data0 >>> 16) & 0xff
  h *= FNV_PRIME
  h ^= (data0 >>> 24) & 0xff
  h *= FNV_PRIME
  h ^= (data0 >>> 32) & 0xff
  h *= FNV_PRIME
  h ^= (data0 >>> 40) & 0xff
  h *= FNV_PRIME
  h ^= (data0 >>> 48) & 0xff
  h *= FNV_PRIME
  h ^= (data0 >>> 56) & 0xff
  h *= FNV_PRIME
  h ^= data1 & 0xff
  h *= FNV_PRIME
  h ^= (data1 >>> 8) & 0xff
  h *= FNV_PRIME
  h ^= (data1 >>> 16) & 0xff
  h *= FNV_PRIME
  h ^= (data1 >>> 24) & 0xff
  h *= FNV_PRIME
  h ^= (data1 >>> 32) & 0xff
  h *= FNV_PRIME
  h ^= (data1 >>> 40) & 0xff
  h *= FNV_PRIME
  h ^= (data1 >>> 48) & 0xff
  h *= FNV_PRIME
  h ^= (data1 >>> 56) & 0xff
  return h
}