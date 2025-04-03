import { test } from 'node:test'
import { loadPlugin } from '../src/utils.js'

const p = await loadPlugin('test_mem')
const m = p.mem
const ptr = p.on_test_mem()

test('memory', ({ assert }) => {
  assert.equal(ptr, 1024)
})
