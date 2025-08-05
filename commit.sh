#!/bin/bash

# Wrapper script for git commit with automatic version bumping
# Usage:
#   ./commit.sh "commit message"           # patch bump (1.7.1 -> 1.7.2)
#   ./commit.sh "[minor] commit message"   # minor bump (1.7.1 -> 1.8.0)  
#   ./commit.sh "[major] commit message"   # major bump (1.7.1 -> 2.0.0)

COMMIT_MSG="$1"

if [ -z "$COMMIT_MSG" ]; then
    echo "Usage: $0 \"commit message\""
    echo "Examples:"
    echo "  $0 \"fix bug\"                    # patch bump"
    echo "  $0 \"[minor] add new feature\"    # minor bump"
    echo "  $0 \"[major] breaking changes\"   # major bump"
    exit 1
fi

# Determine version bump type from commit message
if [[ "$COMMIT_MSG" == *"[major]"* ]]; then
    export VERSION_BUMP=major
    echo "Detected major version bump"
elif [[ "$COMMIT_MSG" == *"[minor]"* ]]; then
    export VERSION_BUMP=minor
    echo "Detected minor version bump"
else
    export VERSION_BUMP=patch
    echo "Detected patch version bump (default)"
fi

# Execute git commit
git commit -m "$COMMIT_MSG"
