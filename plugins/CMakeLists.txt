cmake_minimum_required(VERSION 3.18)

project(wasmtv_plugins
  LANGUAGES C
)

# enable colors for ninja
set(CMAKE_COLOR_DIAGNOSTICS ON)

# these are the plugins we want to build
set(CMAKE_EXECUTABLE_SUFFIX ".wasm")
add_executable(plugin_info_tvdb src/plugin_info_tvdb.c)
add_executable(plugin_test_mem src/plugin_test_mem.c)
