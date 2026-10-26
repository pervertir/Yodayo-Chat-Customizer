# Automatic Version Bumping

This repository includes an automatic version bumping system for the `MoescapeCustomUI.user.js` file.

## How it works

The version number in `MoescapeCustomUI.user.js` is **automatically bumped on EVERY commit**, regardless of which files are changed. The git hooks handle everything automatically:

1. **Pre-commit hook**: Always performs a patch version bump first
2. **Post-commit hook**: If the commit title has `[minor]` or `[major]`, amends the commit so the version is a minor/major bump instead (the version change lands in the same commit, nothing is left staged)

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

- Version is bumped on every new commit. Not bumped again: `git commit --amend`, rebases, cherry-picks and merges (their commits already carry a version), and commits where you changed the version by hand
- Only the `@version` line is changed and included in the commit; other unstaged edits to the userscript stay unstaged
- Keywords `[major]` and `[minor]` can appear anywhere in the commit title; the bump lands in that same commit (nothing is left staged)
- All logic is contained within git hooks (`.github/hooks/pre-commit` and `post-commit`) - set them up once with `bash .github/setup-git-hooks.sh`
- The hooks work on macOS and Linux
- Because every commit changes the version line, merging or cherry-picking branches that both moved on conflicts on that line: keep the higher version

## Examples

```bash
git commit -m "fix typo"                    # 1.7.1 -> 1.7.2
git commit -m "[minor] new feature added"   # 1.7.1 -> 1.8.0  
git commit -m "breaking change [major]"     # 1.7.1 -> 2.0.0
git commit -m "[major] rewrite everything"  # 1.7.1 -> 2.0.0
```
