function(WASMTV_PLUGIN name)
    add_executable(plugin_${name} src/plugin_${name}.c)
    add_custom_command(
        TARGET plugin_${name}
        POST_BUILD
        COMMAND ${CMAKE_COMMAND} -E copy "${CMAKE_CURRENT_BINARY_DIR}/plugin_${name}.wasm" "${CMAKE_CURRENT_SOURCE_DIR}/plugin_${name}.wasm"
    )
endfunction()
