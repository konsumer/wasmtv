import path from 'node:path'
import { readFile } from 'node:fs/promises'
import MemoryView from 'cmem_helpers'
import WasiPreview1 from 'easywasi'

const { PLUGIN_DIR = path.join(import.meta.dirname, '..', 'plugins'), KV_FILE = path.join(import.meta.dirname, 'kv.json') } = process.env

// simple KV system that stores arrays of bytes
let KV = {}
try {
  KV = JSON.parse(await readFile(KV_FILE, 'utf8'))
} catch (e) {}

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

// load a single plugin by name
export async function loadPlugin(name) {
  let pendingPromises = {}
  let promiseCounter = 0

  const wasi_snapshot_preview1 = new WasiPreview1()

  // this is the environment that will be passed to the plugins
  const wasm_env = {
    wasi_snapshot_preview1,
    wasmtv: {
      trace(s) {
        console.log(mem.getString(s))
      },

      is_promise_complete(promiseId) {
        if (!pendingPromises[promiseId]) {
          return 2 // Error: no such promise
        }
        if (pendingPromises[promiseId].status === 'fulfilled') {
          return 1 // Complete
        } else if (pendingPromises[promiseId].status === 'rejected') {
          return -1 // Error
        } else {
          return 0 // Still pending
        }
      },

      get_promise_result(promiseId, vPtr, vLenPtr) {
        if (!pendingPromises[promiseId]) {
          throw new Error('No such promise')
        }
        if (pendingPromises[promiseId].status !== 'fulfilled') {
          throw new Error('Promise not complete')
        }
        const result = pendingPromises[promiseId].value
      },

      http_get(urlPtr, outPtr, outLenPtr) {},
      kv_set(kPtr, vPtr, vLen) {},
      kv_get(kPtr, vPtr, vLenPtr) {
        pendingPromises[promiseCounter++] = wrappedKvGet(mem, kPtr, vPtr, vLenPtr)
        return promiseCounter
      }
    }
  }

  const wasmBytes = await readFile(path.join(PLUGIN_DIR, `plugin_${name}.wasm`))
  const module = await WebAssembly.compile(wasmBytes)
  const instance = await WebAssembly.instantiate(module, wasm_env)
  const mem = new MemoryView(instance.exports.memory, instance.exports.malloc)
  return { ...instance.exports, mem }
}
