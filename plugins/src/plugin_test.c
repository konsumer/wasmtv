// simple tests on host functions

#include "wasmtv_plugin.h"

char buffer[1024];

// return a pointer to buffer
WASM_EXPORT("on_test_mem")
char* on_test_mem() {
  return buffer;
}
