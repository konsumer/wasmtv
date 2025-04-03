#include "wasmtv_plugin.h"
#include <stdio.h>

// called when this plugin is loaded
WASM_EXPORT("on_load")
int on_load() {
  return 0;
}

// called when this plugin is unloaded
WASM_EXPORT("on_unload")
void on_unload() {
}

// called on every file that is added to a library
WASM_EXPORT("on_file_found")
int on_file_found(FileInfo* file) {
  char buffer[100];
  sprintf(buffer, "file found: %s:%s", file->library, file->name);
  trace(buffer);
  return 0;
}
