#!/bin/bash

# Setup script to initialize git hooks for this repository
# Run this once after cloning: bash .github/setup-git-hooks.sh

set -e

HOOKS_DIR=".github/hooks"

# Check if hooks directory exists
if [ ! -d "$HOOKS_DIR" ]; then
    echo "Error: $HOOKS_DIR directory not found"
    exit 1
fi

# Configure git to use hooks from .github/hooks
git config core.hooksPath "$HOOKS_DIR"

# Make hooks executable
chmod +x "$HOOKS_DIR"/*

echo "✓ Git hooks configured successfully"
echo "✓ Version bumping is now active"
echo ""
echo "Usage:"
echo "  git commit -m 'your message'              # Patch: 1.7.4 → 1.7.5"
echo "  git commit -m '[minor] new feature'       # Minor: 1.7.4 → 1.8.0"
echo "  git commit -m '[major] breaking change'   # Major: 1.7.4 → 2.0.0"
