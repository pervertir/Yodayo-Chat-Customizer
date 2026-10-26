# Changelog

All notable changes to the Yodayo/Moescape Chat Customizer are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
Versions are the `@version` of `MoescapeCustomUI.user.js`; the right-click scripts in
`context-menu/` have their own versions, noted where they changed.

## [Unreleased]

## [1.12.4] - 2026-10-26

### Added
- This changelog. The README now links here instead of keeping its own changelog.

## [1.12.3] - 2026-10-26

### Changed
- `[minor]`/`[major]` version bumps now land in the same commit (a post-commit hook replaces the commit-msg hook, which left the new version staged for the next commit).
- The version hooks change only the `@version` line, skip amends, rebases, cherry-picks and hand-set versions, and work on Linux as well as macOS.
- README documents group chats, the right-click scripts and the version hooks.

## [1.12.0] - 2026-10-26

### Added
- Group chat support. Group chats are detected from the character avatars next to the chat title, and the members (including ones who haven't spoken yet) are read from the site's chat data.
- Group chat customization window: a **Common** tab for shared settings and one tab per character for its name, image, size, and name, narration, dialogue and bubble colors.
- All characters' full-body images are shown side by side, slightly overlapping, in a character area that widens as needed and reaches the left edge of the window.
- Character images can be dragged; each position is saved for the chat when the drag ends. Double-click resets it.
- Characters that only have a background are cut out of it with the background-removal API, all in parallel; the cut-out is saved for the chat so it is made once.
- Without a custom background, a group chat uses the background of a character that also has a full-body image.
- "Also Save Characters as Their Theme" saves each character's name, image and colors to its own theme.

### Changed
- The Customizer and the right-click **Remove background** script (v1.4.0) share the ImageTools API key, so it is entered once; a rejected key is dropped by both.

## [1.11.3] - 2026-10-15

### Fixed
- The chat's settings menu scrolls with the Customizer items in it instead of being cut off at the bottom.

## [1.11.2] - 2026-10-06

### Fixed
- Right-click commands stay in the menu after being used once.
- A right-click **Remove background** result is kept for Customize Chat's Save button.

## [1.11.1] - 2026-10-06

### Changed
- Right-click **Remove background** uses the right-clicked image (or one just inside the clicked element), falling back to the chat background.

## [1.11.0] - 2026-10-06

### Added
- **Remove background & use as character** button in Customize Chat: cuts the character out of the current background with the ImageTools API. The API key is asked for once and kept in Tampermonkey storage.

## [1.10.2] - 2026-10-06

### Added
- Background collection browser: an **Update** button, with badges for new and updated backgrounds.

## [1.10.1] - 2026-10-06

### Fixed
- Background collection cards no longer collapse to zero height.

## [1.10.0] - 2026-10-06

### Added
- Browse the background collection from Customize Chat and apply a background with one click.
- Right-click scripts (Tampermonkey menu): **Open background in new tab**, **Open character in new tab** and **Remove background**.

## [1.9.8] - 2026-10-04

### Fixed
- The character alias is shown on every message, including new, streamed and re-rendered ones.

## [1.9.7] - 2026-10-03

### Fixed
- Customizations are applied when switching to another chat without a page reload.

## [1.9.6] - 2026-10-03

### Changed
- The Customizer's styles are only active on tavern chat pages, so the rest of the site looks unchanged.

## [1.9.5] - 2026-10-03

### Fixed
- Embedded images are kept out of the Tampermonkey backup. Backups that were too large stopped every userscript from running on the page.

## [1.9.4] - 2026-10-03

### Fixed
- The script failed to load: Tailwind is pinned to a fixed version and Pickr is loaded first.

## [1.9.3] - 2026-09-29

### Changed
- The Character Chat color only changes the dialogue text, not every primary-colored element.

### Fixed
- The site's toggle switch knobs moved too far because of a Tailwind v4 transform conflict.
- Backups skip duplicate snapshots and take snapshots before and after a JSON import.

## [1.9.0] - 2026-09-29

### Added
- Automatic backup of all settings to Tampermonkey storage, restored automatically if the site's data is cleared, with rotating daily snapshots that can be restored from Customize Chat.

## [1.8.1] - 2026-07-29

### Added
- Search and sort (by name or date) in the Card Viewer.
- Records keep a timestamp of when they were created.

## [1.7.5] - 2026-07-28

### Added
- Images are stored as WebP (quality 0.92), and resized when larger than 2000px, to save space.
- Git hooks that bump the version automatically (`bash .github/setup-git-hooks.sh`).

### Fixed
- Line ending issues in `utils.js`.

## [1.7.1] - 2025-08-05

### Added
- Export the whole database to a JSON file and import it again, optionally clearing existing data first.

### Changed
- Uniform styling for the Customize Chat form, with blue file inputs.

### Fixed
- The settings modal sometimes didn't open correctly.
- Image Viewer size.

## [1.6.2] - 2025-07-20

### Added
- More backgrounds in the background collection.

## [1.6.0] - 2025-07-20

### Added
- Opacity control for every color.

## [1.5.2] - 2025-07-19

### Added
- **No Universal colors** checkbox, to use the default colors in a chat instead of the universal ones.

### Changed
- Chat changes are detected every 250ms instead of every second.

## [1.4.2] - 2025-07-18

### Added
- Reset buttons for character, background and color settings.

## [1.4.1] - 2025-07-16

### Fixed
- The Customizer closed when a text selection was dragged outside it.

## [1.4.0] - 2025-07-16

### Changed
- DB Viewer renamed to Card Viewer.

## [1.3.0] - 2025-07-16

### Added
- Card Viewer: open a card's chat or character, and delete it from the database.

## [1.2.0] - 2025-07-16

### Added
- Records store whether they are a chat, character or universal theme.

## [1.1.5] - 2025-07-16

### Changed
- Uploaded images are stored as raw base64.

### Fixed
- Universal colors were not applied in some cases.

## [1.1.2] - 2025-07-15

### Changed
- Universal settings store only colors, not backgrounds or images.

## [1.1.0] - 2025-07-14

### Added
- Per-chat styling: uncheck **Set as Character Theme** to save settings for the current chat only.

## [1.0.3] - 2025-07-14

### Changed
- Code reorganization.

## [1.0.2] - 2025-07-14

### Changed
- Repository moved to pervertir; install and update URLs updated.

## [1.0.1] - 2025-07-13

### Changed
- Semantic versioning replaces the Alpha version numbers.

## [Alpha] - 2024-06-03 to 2025-07-13

Development versions Alpha-v9 to Alpha-v36.

### Added
- Customize Chat popup, from the chat's settings menu or Alt + Shift + /: character name and name color, character image, background (URL or file), and colors for narration, dialogue, user name, user messages and both message bubbles.
- Settings saved per character in IndexedDB, with universal colors applied to every chat.
- Image Viewer listing all saved characters as animated cards.
- Unsaved changes are kept while the popup is closed and reopened.
- Notifications when customizations are loaded or saved.
- Delete buttons for the current chat's style and for all of a character's styles.
- Background image collection (`backgrounds.md`).
- Support for moescape.ai and yodayo.com.

[Unreleased]: https://github.com/pervertir/Yodayo-Chat-Customizer/commits/main
[1.12.4]: https://github.com/pervertir/Yodayo-Chat-Customizer/commits/main
[1.12.3]: https://github.com/pervertir/Yodayo-Chat-Customizer/commit/c4c4942
[1.12.0]: https://github.com/pervertir/Yodayo-Chat-Customizer/commit/16fac60
[1.11.3]: https://github.com/pervertir/Yodayo-Chat-Customizer/commit/d002b00
[1.11.2]: https://github.com/pervertir/Yodayo-Chat-Customizer/commit/81b4720
[1.11.1]: https://github.com/pervertir/Yodayo-Chat-Customizer/commit/e9244d2
[1.11.0]: https://github.com/pervertir/Yodayo-Chat-Customizer/commit/5211d35
[1.10.2]: https://github.com/pervertir/Yodayo-Chat-Customizer/commit/3aa2aed
[1.10.1]: https://github.com/pervertir/Yodayo-Chat-Customizer/commit/03304ec
[1.10.0]: https://github.com/pervertir/Yodayo-Chat-Customizer/commit/be9470f
[1.9.8]: https://github.com/pervertir/Yodayo-Chat-Customizer/commit/e473e9d
[1.9.7]: https://github.com/pervertir/Yodayo-Chat-Customizer/commit/51ad831
[1.9.6]: https://github.com/pervertir/Yodayo-Chat-Customizer/commit/0d87e34
[1.9.5]: https://github.com/pervertir/Yodayo-Chat-Customizer/commit/458a82b
[1.9.4]: https://github.com/pervertir/Yodayo-Chat-Customizer/commit/d4604a2
[1.9.3]: https://github.com/pervertir/Yodayo-Chat-Customizer/commit/52d415d
[1.9.0]: https://github.com/pervertir/Yodayo-Chat-Customizer/commit/ec084b1
[1.8.1]: https://github.com/pervertir/Yodayo-Chat-Customizer/commit/021596f
[1.7.5]: https://github.com/pervertir/Yodayo-Chat-Customizer/commit/6e5bb6f
[1.7.1]: https://github.com/pervertir/Yodayo-Chat-Customizer/commit/77fc6ed
[1.6.2]: https://github.com/pervertir/Yodayo-Chat-Customizer/commit/0bfc99c
[1.6.0]: https://github.com/pervertir/Yodayo-Chat-Customizer/commit/e570bf6
[1.5.2]: https://github.com/pervertir/Yodayo-Chat-Customizer/commit/ec2ac9e
[1.4.2]: https://github.com/pervertir/Yodayo-Chat-Customizer/commit/6bc04bb
[1.4.1]: https://github.com/pervertir/Yodayo-Chat-Customizer/commit/e6f2634
[1.4.0]: https://github.com/pervertir/Yodayo-Chat-Customizer/commit/da5b2f5
[1.3.0]: https://github.com/pervertir/Yodayo-Chat-Customizer/commit/a1a13f4
[1.2.0]: https://github.com/pervertir/Yodayo-Chat-Customizer/commit/3c734cf
[1.1.5]: https://github.com/pervertir/Yodayo-Chat-Customizer/commit/fba2586
[1.1.2]: https://github.com/pervertir/Yodayo-Chat-Customizer/commit/c869c0a
[1.1.0]: https://github.com/pervertir/Yodayo-Chat-Customizer/commit/2ffd77b
[1.0.3]: https://github.com/pervertir/Yodayo-Chat-Customizer/commit/02d1c2d
[1.0.2]: https://github.com/pervertir/Yodayo-Chat-Customizer/commit/481446c
[1.0.1]: https://github.com/pervertir/Yodayo-Chat-Customizer/commit/86a9879
[Alpha]: https://github.com/pervertir/Yodayo-Chat-Customizer/commit/f479a03
