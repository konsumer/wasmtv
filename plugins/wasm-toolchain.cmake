set(CMAKE_SYSTEM_NAME Generic)
set(CMAKE_SYSTEM_PROCESSOR wasm32)

# Specify your compiler
set(CMAKE_C_COMPILER /opt/wasi-sdk/bin/clang)

# Skip compiler tests
set(CMAKE_C_COMPILER_WORKS TRUE)
set(CMAKE_TRY_COMPILE_TARGET_TYPE STATIC_LIBRARY)

# Flags for WebAssembly compilation
set(CMAKE_C_FLAGS "-Oz -fvisibility=hidden")

# Ensure we use wasm-ld for linking
set(CMAKE_LINKER /opt/wasi-sdk/bin/wasm-ld)

# WebAssembly-specific linker flags
set(CMAKE_EXE_LINKER_FLAGS "-Wl,--no-entry -Wl,--strip-all -O3 -Wl,--export=malloc -Wl,--export=free")

# Disable shared libraries by default (they're not standard for wasm)
set(BUILD_SHARED_LIBS OFF)
