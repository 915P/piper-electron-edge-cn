# How to Compile and Install Piper on Apple Silicon (macOS 12+)

This guide provides step-by-step instructions for compiling Piper text-to-speech software on Apple Silicon Macs. Due to compatibility issues with the default espeak-ng installation, we need to build a custom version to ensure proper functionality.

> **Note:** Compiling Piper on Apple Silicon can be challenging due to dependency conflicts. This guide documents the exact steps used to successfully create the compiled version included in this repository.

## Prerequisites

Before starting, install the required development tools using Homebrew:

```bash
brew install cmake rust git automake libtool pkg-config espeak-ng
```

## 🔧 Step 1: Build Custom espeak-ng

The Homebrew version of espeak-ng places phoneme data in a location that Piper doesn't recognize. We need to build a custom version with the correct configuration.

### 1.1 Clone and Configure espeak-ng

```bash
git clone https://github.com/espeak-ng/espeak-ng.git
cd espeak-ng
./autogen.sh
```

### 1.2 Configure Build with Custom Paths

```bash
./configure --prefix=/usr/local/espeak-ng \
            --with-espeak-ng-data=/usr/local/espeak-ng/share/espeak-ng-data
```

### 1.3 Compile and Install

```bash
make -j$(sysctl -n hw.logicalcpu)
sudo make install
```

This creates `libespeak-ng.dylib` and installs the phoneme data in the correct location that Piper expects.

## 🛠 Step 2: Clone and Build Piper

### 2.1 Clone Piper Repository

```bash
git clone https://github.com/rhasspy/piper.git
cd piper
mkdir build && cd build
```

### 2.2 Configure CMake with Custom espeak-ng

Configure the build to use our custom espeak-ng installation:

```bash
cmake .. \
  -DCMAKE_BUILD_TYPE=Release \
  -DCMAKE_PREFIX_PATH=/usr/local/espeak-ng \
  -DESPEAKNG_INCLUDE_DIR=/usr/local/espeak-ng/include \
  -DESPEAKNG_LIBRARY=/usr/local/espeak-ng/lib/libespeak-ng.dylib
```

### 2.3 Compile Piper

```bash
make -j$(sysctl -n hw.logicalcpu)
```

## 📁 Step 3: Fix Library Dependencies

Piper may build and bundle its own version of libespeak-ng that's incompatible with our custom build. We need to replace it with our version.

### 3.1 Backup Original Library

```bash
mv ./pi/lib/libespeak-ng.*.dylib ./pi/lib/libespeak-ng.bak.dylib
```

### 3.2 Copy Custom Library

```bash
cp /usr/local/espeak-ng/lib/libespeak-ng.1.dylib ./pi/lib/libespeak-ng.1.52.0.1.dylib
```

## 🚀 Step 4: Verify Installation

Test that Piper is working correctly:

```bash
./pi/piper --help
```

If successful, you should see Piper's help output without any library loading errors.

## 📝 Notes

- This process creates a fully functional Piper installation optimized for Apple Silicon
- The custom espeak-ng build ensures proper phoneme data access
- Library replacement in Step 3 is crucial for avoiding runtime errors
- Build times may vary depending on your Mac's specifications

## 🛠 Troubleshooting

- **Library not found errors**: Ensure the custom espeak-ng paths are correctly specified in the CMake configuration
- **Compilation errors**: Verify all prerequisites are installed via Homebrew
- **Runtime errors**: Double-check that Step 3 (library replacement) was completed successfully
