#!/bin/bash

# Pack the built files into a DXT extension
# // prometheus-mcp.dxt (ZIP file)
# // ├── manifest.json         # Extension metadata and configuration
# // ├── server/               # Server files
# // │   └── index.js          # Main entry point
# // ├── node_modules/         # Node modules
# // ├── package.json          # Package definition
# // ├── icon.png              # Prometheus icon

set -euo pipefail  # Exit on error, undefined vars, and pipe failures

error_exit() {
    echo "error: $1" >&2
    exit 1
}

check_requirements() {
    local missing_items=()

    echo "Validating requirements..."
    
    # Check if dxt is installed
    command -v dxt &> /dev/null || missing_items+=("dxt is not installed. run 'pnpm install @anthropic-ai/dxt'")
    
    # Check required files and directories
    [[ -f "package.json" ]] || missing_items+=("package.json not found")
    [[ -f "assets/icon.png" ]] || missing_items+=("assets/icon.png not found")
    [[ -d "node_modules" ]] || missing_items+=("node_modules/ not found. run 'pnpm install'")
    [[ -d "dist" ]] || missing_items+=("dist/ not found. run 'pnpm build'")
    [[ -f "manifest.json" ]] || missing_items+=("manifest.json not found. run 'node scripts/generate-dxt-manifest.mjs'")
    
    # Report all missing items at once
    if [[ ${#missing_items[@]} -gt 0 ]]; then
        echo "Missing requirements:" >&2
        printf "  - %s\n" "${missing_items[@]}" >&2
        exit 1
    fi
}

create_package() {
    local pkg_dir="prometheus-mcp"
    
    echo "Creating package directory..."
    rm -rf "$pkg_dir"
    mkdir -p "$pkg_dir/server"
    
    echo "Copying files..."
    cp -r node_modules "$pkg_dir/"
    cp dist/index.mjs "$pkg_dir/server/index.js"
    cp manifest.json "$pkg_dir/"
    cp assets/icon.png "$pkg_dir/"
    cp package.json "$pkg_dir/"
    
    echo "Packing dxt extension..."
    dxt pack "$pkg_dir"
    
    echo "Successfully created prometheus-mcp.dxt"
}

generate_manifest() {
    echo "Generating manifest..."
    node scripts/generate-dxt-manifest.mjs
}

main() {
    generate_manifest
    check_requirements
    create_package
}

main "$@"