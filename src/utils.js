import path from 'node:path'
import { readFile  } from 'node:fs/promises'

const {
  PLUGIN_DIR = path.join(import.meta.dirname, '..', 'plugins', 'build'),
  KV_FILE = path.join(import.meta.dirname, 'kv.json')
} = process.env

// simple KV system that stores arrays of bytes
let KV = {}
try {
  KV = JSON.parse(await readFile(KV_FILE, 'utf8'))
} catch (e) { }

export async function kv_get(key) {
  return new Uint8Array(KV[key])
}
export async function kv_set(key, value) {
  KV[key] = [...value]
  await writeFile(KV_FILE, JSON.stringify(KV, null, 2))
}


async function wrappedKvGet(memory, kPtr, vPtr, vLenPtr) {
  const value = await kv_get(memory.getString(kPtr))
  const valuePtr = memory.setBytes(vPtr)
  memory.setUint32(vPtr, valuePtr)
  memory.setUint32(vLenPtr, value.length)
  return value
}

export class MemoryView {
  constructor(memory) {
    this.memory = memory
    this.view = new DataView(memory.buffer)
    this.decoder = new TextDecoder('utf-8')
    this.encoder = new TextEncoder('utf-8')

    // WASM is always little-endian, so we can use the same methods for all

    // 8-bit (1 byte) methods - no endianness needed
    this.setInt8 = (p, v) => this.view.setInt8(p, v)
    this.getInt8 = (p) => this.view.getInt8(p)
    this.setUint8 = (p, v) => this.view.setUint8(p, v)
    this.getUint8 = (p) => this.view.getUint8(p)

    // 16-bit (2 byte) methods
    this.setInt16 = (p, v) => this.view.setInt16(p, v, true)
    this.getInt16 = (p) => this.view.getInt16(p, true)
    this.setUint16 = (p, v) => this.view.setUint16(p, v, true)
    this.getUint16 = (p) => this.view.getUint16(p, true)

    // 32-bit (4 byte) methods
    this.setInt32 = (p, v) => this.view.setInt32(p, v, true)
    this.getInt32 = (p) => this.view.getInt32(p, true)
    this.setUint32 = (p, v) => this.view.setUint32(p, v, true)
    this.getUint32 = (p) => this.view.getUint32(p, true)

    // 64-bit (8 byte) methods
    this.setBigInt64 = (p, v) => this.view.setBigInt64(p, v, true)
    this.getBigInt64 = (p) => this.view.getBigInt64(p, true)
    this.setBigUint64 = (p, v) => this.view.setBigUint64(p, v, true)
    this.getBigUint64 = (p) => this.view.getBigUint64(p, true)

    // Floating point methods
    this.setFloat32 = (p, v) => this.view.setFloat32(p, v, true)
    this.getFloat32 = (p) => this.view.getFloat32(p, true)
    this.setFloat64 = (p, v) => this.view.setFloat64(p, v, true)
    this.getFloat64 = (p) => this.view.getFloat64(p, true)
  }

  getString(ptr) {
    const buffer = new Uint8Array(this.memory.buffer, ptr)
    return this.decoder.decode(buffer.slice(0, buffer.indexOf(0)))
  }

  setString(ptr, value) {
    let p = ptr
    for (const b of this.encoder.encode(value)) {
      this.view.setUint8(p++, b)
    }
    this.view.setUint8(value.length, 0)
  }

  getBytes(ptr, len) {
    const buffer = new Uint8Array(this.memory.buffer)
    return buffer.slice(ptr, ptr+len)
  }

  setBytes(ptr, value) {
    const buffer = new Uint8Array(this.memory.buffer)
    buffer.set(value, ptr)
  }
}

// load a single plugin by name
export async function loadPlugin(name) {
  let pendingPromises = {}
  let promiseCounter = 0

  // this is the environment that will be passed to the plugins
  const wasm_env = {
    wasmtv: {
      trace() { },

      is_promise_complete(promiseId) {
        if (!pendingPromises[promiseId]) {
          return 2; // Error: no such promise
        }
        if (pendingPromises[promiseId].status === 'fulfilled') {
          return 1; // Complete
        } else if (pendingPromises[promiseId].status === 'rejected') {
          return -1; // Error
        } else {
          return 0; // Still pending
        }
      },

      get_promise_result(promiseId, vPtr, vLenPtr) {
        if (!pendingPromises[promiseId]) {
          throw new Error("No such promise");
        }
        if (pendingPromises[promiseId].status !== 'fulfilled') {
          throw new Error("Promise not complete")
        }
        const result = pendingPromises[promiseId].value

      },

      http_get(urlPtr, outPtr, outLenPtr) {},
      kv_set(kPtr, vPtr, vLen) { },
      kv_get(kPtr, vPtr, vLenPtr) {
        pendingPromises[promiseCounter++] = wrappedKvGet(mem, kPtr, vPtr, vLenPtr)
        return promiseCounter
      }
    }
  }

  const wasmBytes = await readFile(path.join(PLUGIN_DIR, `plugin_${name}.wasm`))
  const module = await WebAssembly.compile(wasmBytes)
  const instance = await WebAssembly.instantiate(module,  wasm_env)
  const mem = new MemoryView(instance.exports.memory)
  return { ...instance.exports, mem }
}
