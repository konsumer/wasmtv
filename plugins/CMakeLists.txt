cmake_minimum_required(VERSION 3.18)

project(wasmtv_plugins
  LANGUAGES C
)

# enable colors for ninja
set(CMAKE_COLOR_DIAGNOSTICS ON)

# all plugins are wasm files
set(CMAKE_EXECUTABLE_SUFFIX ".wasm")

# these are the plugins we want to build

add_executable(plugin_info_tvdb src/plugin_info_tvdb.c)
add_custom_command(
    TARGET plugin_info_tvdb
    POST_BUILD
    COMMAND ${CMAKE_COMMAND} -E copy "${CMAKE_CURRENT_BINARY_DIR}/plugin_info_tvdb.wasm" "${CMAKE_CURRENT_SOURCE_DIR}/plugin_info_tvdb.wasm"
)

add_executable(plugin_test_mem src/plugin_test_mem.c)
add_custom_command(
    TARGET plugin_test_mem
    POST_BUILD
    COMMAND ${CMAKE_COMMAND} -E copy "${CMAKE_CURRENT_BINARY_DIR}/plugin_test_mem.wasm" "${CMAKE_CURRENT_SOURCE_DIR}/plugin_test_mem.wasm"
)
