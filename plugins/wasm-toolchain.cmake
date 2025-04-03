set(CMAKE_SYSTEM_NAME Generic)
set(CMAKE_SYSTEM_PROCESSOR wasm32)

# Specify your compiler
set(CMAKE_C_COMPILER clang)

# Skip compiler tests
set(CMAKE_C_COMPILER_WORKS TRUE)
set(CMAKE_TRY_COMPILE_TARGET_TYPE STATIC_LIBRARY)

# Flags for WebAssembly compilation
set(CMAKE_C_FLAGS "--target=wasm32 -Oz -nostdlib -fvisibility=hidden")

# Ensure we use wasm-ld for linking
set(CMAKE_LINKER wasm-ld)

# WebAssembly-specific linker flags
set(CMAKE_EXE_LINKER_FLAGS "-Wl,--no-entry -Wl,--strip-all -O3")

# Disable shared libraries by default (they're not standard for wasm)
set(BUILD_SHARED_LIBS OFF)
