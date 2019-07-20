import { ObjectDeserializer } from './objectDeserializer'
import * as fs from 'fs'
import * as path from 'path'
import { performance } from 'perf_hooks'

import { Decoder, encode } from '@msgpack/msgpack'
import { WasmMessagePackDecoder } from './wasmDecoder'

const src2 = encode({
  int0: 0,
  int1: 1,
  'int1-': -1,
  int8: 255,
  'int8-': -255,
  int16: 256,
  'int16-': -256,
  int32: 65536,
  'int32-': -65536,
  nil: null,
  true: true,
  false: false,
  float: 0.5,
  'float-': -0.5,
  string0: '',
  string1: 'A',
  string4: 'foobarbaz',
  string8: 'Omnes viae Romam ducunt.',
  'string-utf16': 'いろは',
  string16:
    'L’homme n’est qu’un roseau, le plus faible de la nature ; mais c’est un roseau pensant. Il ne faut pas que l’univers entier s’arme pour l’écraser : une vapeur, une goutte d’eau, suffit pour le tuer. Mais, quand l’univers l’écraserait, l’homme serait encore plus noble que ce qui le tue, puisqu’il sait qu’il meurt, et l’avantage que l’univers a sur lui, l’univers n’en sait rien. Toute notre dignité consiste donc en la pensée. C’est de là qu’il faut nous relever et non de l’espace et de la durée, que nous ne saurions remplir. Travaillons donc à bien penser : voilà le principe de la morale.',
  array0: [],
  array1: ['foo'],
  array8: [
    1,
    2,
    4,
    8,
    16,
    32,
    64,
    128,
    256,
    512,
    1024,
    2048,
    4096,
    8192,
    16384,
    32768,
    65536,
    131072,
    262144,
    524288,
    1048576,
  ],
  map0: {},
  map1: {
    foo: 'bar',
  },
})

const src = src2

console.log(src.byteLength)

function jsBench() {
  const jsDecoder = new Decoder()

  let now = performance.now()
  while (performance.now() - now < 1000) {
    jsDecoder.setBuffer(src)
    jsDecoder.decodeSync()
  }
  console.time('msgpack-javascript')
  console.log('msgpack-javascript')

  let ops = 0
  now = performance.now()
  while (performance.now() - now < 5000) {
    jsDecoder.setBuffer(src)
    jsDecoder.decodeSync()
    ops++
  }

  jsDecoder.setBuffer(src)
  console.log(jsDecoder.decodeSync())

  console.log(ops)
  return ops
}

function wasmBench() {
  const module = new WebAssembly.Module(fs.readFileSync(path.join(__dirname, './wasm/msgpack.wasm')))

  const d = new ObjectDeserializer()

  const wasmDecoder = new WasmMessagePackDecoder(d, module)

  wasmDecoder.setBuffer(src)

  let now = performance.now()
  while (performance.now() - now < 1000) {
    wasmDecoder.decode()
  }

  console.log('msgpack-wasm')
  let ops = 0
  now = performance.now()
  while (performance.now() - now < 5000) {
    wasmDecoder.setBuffer(src)
    wasmDecoder.decode()
    ops++
  }

  console.log(wasmDecoder.decode())

  console.log(ops)
  return ops
}

const wasmResult = wasmBench()
const jsResult = jsBench()
console.log(wasmResult / jsResult)
