#!/bin/bash
# Setup script for git hooks on new worktrees
# Run this once after creating a new worktree to enable version bumping

BARE_GIT_DIR="$(git rev-parse --git-dir)"
REPO_ROOT="$(git rev-parse --show-toplevel)"

# Configure this worktree to use .github/hooks
if [ -f "$BARE_GIT_DIR/config" ]; then
    # For shared bare repository setup
    git config core.hooksPath ../.github/hooks
    echo "✓ Git hooks configured for this worktree"
    echo "  Hooks path: ../.github/hooks"
else
    # For standalone repository
    git config core.hooksPath .github/hooks
    echo "✓ Git hooks configured for this repository"
    echo "  Hooks path: .github/hooks"
fi

echo ""
echo "Version bumping is now active!"
echo ""
echo "Usage:"
echo "  git commit -m 'message'           # Patch bump (1.7.2 -> 1.7.3)"
echo "  git commit -m '[minor] message'   # Minor bump (1.7.2 -> 1.8.0)"
echo "  git commit -m '[major] message'   # Major bump (1.7.2 -> 2.0.0)"
