# Automatic Version Bumping

This repository includes an automatic version bumping system for the `MoescapeCustomUI.user.js` file.

## How it works

The version number in `MoescapeCustomUI.user.js` is **automatically bumped on EVERY commit**, regardless of which files are changed. The git hooks handle everything automatically:

1. **Pre-commit hook**: Always performs a patch version bump first
2. **Commit-msg hook**: Checks your commit message and adjusts to major/minor if needed

## Usage

Simply commit as normal - the version will be bumped automatically:

```bash
# Patch version bump (1.7.1 -> 1.7.2) - default behavior
git commit -m "fix bug in chat customizer"

# Minor version bump (1.7.1 -> 1.8.0)
git commit -m "[minor] add new chat background feature"

# Major version bump (1.7.1 -> 2.0.0)
git commit -m "[major] complete rewrite of the customizer"
```

## Version Bump Types

- **Patch** (default): Increments the last digit (1.7.1 -> 1.7.2)
- **Minor**: Include `[minor]` in commit message - increments middle digit, resets patch to 0 (1.7.1 -> 1.8.0)
- **Major**: Include `[major]` in commit message - increments first digit, resets minor and patch to 0 (1.7.1 -> 2.0.0)

## Notes

- Version is bumped on **every single commit** - no exceptions
- The updated userscript file is automatically staged and included in the commit
- All logic is contained within git hooks - no external scripts needed
- Keywords `[major]` and `[minor]` can appear anywhere in the commit message
- Current version: 1.7.1

## Examples

```bash
git commit -m "fix typo"                    # 1.7.1 -> 1.7.2
git commit -m "[minor] new feature added"   # 1.7.1 -> 1.8.0  
git commit -m "breaking change [major]"     # 1.7.1 -> 2.0.0
git commit -m "[major] rewrite everything"  # 1.7.1 -> 2.0.0
```
