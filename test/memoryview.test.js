import { test } from 'node:test'

import { MemoryView, loadPlugin } from '../src/utils.js'

// this lets me test plugin-memory as well as non-wasm
const { TEST_PLUGIN } = process.env
let m
let ptr
if (TEST_PLUGIN) {
  const p = await loadPlugin('test_mem')
  m = p.mem
  ptr = p.on_test_mem()
} else {
  const memory = new WebAssembly.Memory({ initial: 1024, maximum: 1024 })
  m = new MemoryView(memory)
  ptr = 0
}

test('string', async ({ assert }) => {
  m.setString(ptr, "cool, ok")
  assert.equal(m.getString(ptr), 'cool, ok')
})

test('bytes', async ({ assert }) => {
  const bytes = new Uint8Array(100)
  bytes[0]=1
  bytes[1]=2
  bytes[2]=3
  bytes[3]=4
  m.setBytes(ptr, bytes)
  assert.deepEqual(m.getBytes(ptr, 100), bytes)
})

test('Int8', async ({ assert }) => {
  m.setInt8(ptr, 127)
  assert.equal(m.getInt8(ptr), 127)

  m.setInt8(ptr, -128)
  assert.equal(m.getInt8(ptr), -128)

  // Test overflow wrapping
  m.setInt8(ptr, 128)
  assert.equal(m.getInt8(ptr), -128)
})

test('Uint8', async ({ assert }) => {
  m.setUint8(ptr, 255)
  assert.equal(m.getUint8(ptr), 255)

  m.setUint8(ptr, 0)
  assert.equal(m.getUint8(ptr), 0)

  // Test overflow wrapping
  m.setUint8(ptr, 256)
  assert.equal(m.getUint8(ptr), 0)
})

test('Int16', async ({ assert }) => {
  m.setInt16(ptr, 32767)
  assert.equal(m.getInt16(ptr), 32767)

  m.setInt16(ptr, -32768)
  assert.equal(m.getInt16(ptr), -32768)

  // Test little-endian byte order
  m.setUint8(ptr, 0x34)
  m.setUint8(ptr + 1, 0x12)
  assert.equal(m.getInt16(ptr), 0x1234)
})

test('Uint16', async ({ assert }) => {
  m.setUint16(ptr, 65535)
  assert.equal(m.getUint16(ptr), 65535)

  m.setUint16(ptr, 0)
  assert.equal(m.getUint16(ptr), 0)

  // Test little-endian byte order
  m.setUint8(ptr, 0xCD)
  m.setUint8(ptr + 1, 0xAB)
  assert.equal(m.getUint16(ptr), 0xABCD)
})

test('Int32', async ({ assert }) => {
  m.setInt32(ptr, 2147483647)
  assert.equal(m.getInt32(ptr), 2147483647)

  m.setInt32(ptr, -2147483648)
  assert.equal(m.getInt32(ptr), -2147483648)

  // Test little-endian byte order
  m.setUint8(ptr, 0x78)
  m.setUint8(ptr + 1, 0x56)
  m.setUint8(ptr + 2, 0x34)
  m.setUint8(ptr + 3, 0x12)
  assert.equal(m.getInt32(ptr), 0x12345678)
})

test('Uint32', async ({ assert }) => {
  m.setUint32(ptr, 4294967295)
  assert.equal(m.getUint32(ptr), 4294967295)

  m.setUint32(ptr, 0)
  assert.equal(m.getUint32(ptr), 0)

  // Test little-endian byte order
  m.setUint8(ptr, 0xEF)
  m.setUint8(ptr + 1, 0xCD)
  m.setUint8(ptr + 2, 0xAB)
  m.setUint8(ptr + 3, 0x89)
  assert.equal(m.getUint32(ptr), 0x89ABCDEF)
})

test('BigInt64', async ({ assert }) => {
  m.setBigInt64(ptr, BigInt("9223372036854775807"))
  assert.equal(m.getBigInt64(ptr), BigInt("9223372036854775807"))

  m.setBigInt64(ptr, BigInt("-9223372036854775808"))
  assert.equal(m.getBigInt64(ptr), BigInt("-9223372036854775808"))

  // Test little-endian byte order
  for (let i = 0; i < 8; i++) {
    m.setUint8(ptr + i, i + 1)
  }
  assert.equal(m.getBigInt64(ptr), BigInt("0x0807060504030201"))
})

test('BigUint64', async ({ assert }) => {
  m.setBigUint64(ptr, BigInt("18446744073709551615"))
  assert.equal(m.getBigUint64(ptr), BigInt("18446744073709551615"))

  m.setBigUint64(ptr, BigInt(0))
  assert.equal(m.getBigUint64(ptr), BigInt(0))

  // Test little-endian byte order
  for (let i = 0; i < 8; i++) {
    m.setUint8(ptr + i, 0xFF - i)
  }
  assert.equal(m.getBigUint64(ptr), BigInt("0xF8F9FAFBFCFDFEFF"))
})

test('Float32', async ({ assert }) => {
  m.setFloat32(ptr, 3.14159)
  // For floating point, allow some epsilon due to precision limitations
  const epsilon = 0.00001
  const float32Value = m.getFloat32(ptr)
  assert.ok(Math.abs(float32Value - 3.14159) < epsilon,
    `Expected ${float32Value} to be close to 3.14159 within ${epsilon}`)

  m.setFloat32(ptr, -10000.5)
  const float32Value2 = m.getFloat32(ptr)
  assert.ok(Math.abs(float32Value2 - (-10000.5)) < 0.1,
    `Expected ${float32Value2} to be close to -10000.5 within 0.1`)

  m.setFloat32(ptr, 0)
  assert.equal(m.getFloat32(ptr), 0)

  // Test for infinity
  m.setFloat32(ptr, Infinity)
  assert.equal(m.getFloat32(ptr), Infinity)
})

test('Float64', async ({ assert }) => {
  m.setFloat64(ptr, Math.PI)
  assert.equal(m.getFloat64(ptr), Math.PI)

  m.setFloat64(ptr, Number.MAX_VALUE)
  assert.equal(m.getFloat64(ptr), Number.MAX_VALUE)

  m.setFloat64(ptr, Number.MIN_VALUE)
  assert.equal(m.getFloat64(ptr), Number.MIN_VALUE)

  // Test for NaN
  m.setFloat64(ptr, NaN)
  assert.ok(Number.isNaN(m.getFloat64(ptr)), "Expected NaN value")
})

test('Mixed types in memory', async ({ assert }) => {
  // Write different types to consecutive memory locations
  let offset = ptr;

  m.setInt8(offset, -42);
  offset += 1;

  m.setUint16(offset, 12345);
  offset += 2;

  m.setInt32(offset, -1000000);
  offset += 4;

  m.setFloat64(offset, 3.14159265359);
  offset += 8;

  // Read them back in the same order
  offset = ptr;

  assert.equal(m.getInt8(offset), -42);
  offset += 1;

  assert.equal(m.getUint16(offset), 12345);
  offset += 2;

  assert.equal(m.getInt32(offset), -1000000);
  offset += 4;

  assert.equal(m.getFloat64(offset), 3.14159265359);
})

test('Alignment check', async ({ assert }) => {
  // Test that unaligned access works correctly
  const unalignedPtr = ptr + 1; // Making it unaligned for larger types

  m.setUint8(unalignedPtr, 0xAA);
  assert.equal(m.getUint8(unalignedPtr), 0xAA);

  m.setUint16(unalignedPtr, 0xBBCC);
  assert.equal(m.getUint16(unalignedPtr), 0xBBCC);

  m.setUint32(unalignedPtr, 0xDDEEFF00);
  assert.equal(m.getUint32(unalignedPtr), 0xDDEEFF00);

  m.setFloat64(unalignedPtr, 123.456);
  assert.equal(m.getFloat64(unalignedPtr), 123.456);
})
