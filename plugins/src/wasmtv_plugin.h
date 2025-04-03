#pragma once

#include <stdbool.h>
#include <stdint.h>
#include <string.h>

#define WASM_EXPORT(n) __attribute__((export_name(n)))

#define WASM_IMPORT(n) __attribute__((import_module("wasmtv"), import_name(n)))

typedef struct FileInfo {
  char* name;
  char* library;
} FileInfo;

// simple string log
WASM_IMPORT("trace")
void trace(char* message);

// simple HTTP get
WASM_IMPORT("http_get")
void http_get(char* url, char** out, int* len);

// set a value in KV store
WASM_IMPORT("kv_set")
void kv_set(char* key, char* value, int len);

// get a value from KV store
WASM_IMPORT("kv_get")
void kv_get(char* key, char** value, int* len);
