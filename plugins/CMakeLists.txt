cmake_minimum_required(VERSION 3.18)

project(wasmtv_plugins
  LANGUAGES C
)

# enable colors for ninja
set(CMAKE_COLOR_DIAGNOSTICS ON)

# get WASMTV_PLUGIN
set(CMAKE_MODULE_PATH "${CMAKE_CURRENT_SOURCE_DIR}/cmake")
FIND_PACKAGE(wasmtv_plugin REQUIRED)

set(CMAKE_EXECUTABLE_SUFFIX ".wasm")
WASMTV_PLUGIN(info_tvdb)
WASMTV_PLUGIN(test)
