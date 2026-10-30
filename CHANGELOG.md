# Changelog

All notable changes to the Yodayo/Moescape Chat Customizer are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
Versions are the `@version` of `MoescapeCustomUI.user.js`; the right-click scripts in
`context-menu/` have their own versions, noted where they changed.

## [Unreleased]

## [1.17.2] - 2026-10-30

### Fixed
- Customize Chat now closes when you leave the chat it was opened in. Before, it stayed on screen on the next page, with its colour pickers showing unstyled outside chats.

## [1.17.1] - 2026-10-29

### Fixed
- Colour pickers from Customize Chat no longer flash on screen when you open a chat from another page. Closing Customize Chat left the pickers' panels in the page, where they showed unstyled outside chats until the next chat loaded.

## [1.17.0] - 2026-10-29

### Added
- **Automatic Backups** shows how many images are stored, how much space they take, and how much of the browser's allowance the site uses.

### Changed
- The customizer asks the browser to keep the site's data when disk space runs low (it may decline; clearing site data yourself still removes it).

### Fixed
- When saving fails (for example because the browser's storage for the site is full), Customize Chat now says so, and your changes stay in the form so you can save again. Before, nothing happened.

## [1.16.0] - 2026-10-29

### Changed
- Images (uploads, cut-outs, saved backgrounds) are now stored as image files in their own place in the browser's site data instead of as text inside each setting. They take about a quarter less space, an image used by several chats or characters is stored once, and settings load faster. Existing images are moved over automatically the first time the new version runs; other open tabs of the site need a reload for that to happen.
- The automatic Tampermonkey backups and snapshots now keep which image each chat uses, so **Recover** brings a chat's images back too (as long as the site data wasn't cleared).
- JSON exports include every image once, in a separate `images` list. Older exports, with images inside the records, still import.
- Images no chat, character or snapshot uses any more are deleted on startup.

### Fixed
- The Card Viewer reopened the database every time it was shown.
- The right-click **Remove background** script can use the Customizer's saved images (right-click script 1.4.3).

## [1.15.0] - 2026-10-29

### Added
- **Placement** controls for the character image in Customize Chat (and in each group chat character's tab): next to **Size** there are now **Rotation**, **Opacity**, **Left/right** and **Up/down** sliders, **Flip horizontal** and **Flip vertical** toggles, and **Reset placement**. Rotation and flips turn the image around its middle; size still grows from the feet up.
- The character image can be dragged in single-character chats too, as in group chats. The new spot is saved for the chat when you let go; double-click the image to put it back. In wide windows the image can now be moved all the way to the window's left edge instead of being cut off at the chat column.

### Fixed
- Blue buttons in Customize Chat (Remove background, Bring forward, Send backward) had no background colour.

## [1.14.0] - 2026-10-29

### Added
- **Reset** next to the character **Image** in Customize Chat (and in each group chat character's tab): removes the custom image or cut-out and brings back the site's own image. Once saved, that character is no longer cut out of its background automatically.

### Fixed
- Animated images (GIF, animated WebP, APNG) stay animated: character images, backgrounds and cut-outs are no longer flattened to their first frame when saved. Cut-outs of animated backgrounds come back animated from ImageTools (right-click "Remove background" 1.4.2 too).
- Character Settings **Reset** now also restores the site's own full-body image after a custom one replaced it, and in group chats it removes an automatic cut-out too.

## [1.13.2] - 2026-10-26

### Fixed
- Card Viewer: chats set up by 1.13.0 (cut-out on the character, random background on the chat) showed as two cards; the background is now moved onto the character, leaving one card.
- Card Viewer: cards no longer show broken-image icons and "Background" while their images load; they shimmer until the images arrive, and images load as cards scroll into view, so the visible ones fill in first.
- Card Viewer: cards for characters with only a background now show that background at full brightness, chat cards use their character's saved images when the chat has none, private characters' images and names load, and deleted characters are tagged **Deleted**.

## [1.13.1] - 2026-10-26

### Added
- **Size** slider for the character image in single-character chats too (saved with the chat or character theme).

### Changed
- New chats: the automatic cut-out and the random background are both saved on the character, so the Card Viewer shows one card instead of a character card and a chat card.

### Fixed
- Card Viewer: cards showed "Character Name" when no alias was saved; names now come from the chat name, alias or the site (deleted chats and characters are labelled as such), and search and sort use them.
- Card Viewer: group chat cards show all their characters side by side and are tagged **Group**.
- Card Viewer: backgrounds and character images that were only stored as links, or not stored at all, didn't show; they are now downloaded reliably (as small copies) and fall back to the site's images.
- Card Viewer: bigger Delete and Open buttons, and deleting a card removes just that card instead of reloading the whole viewer.
- The character **Reset** button in Customize Chat failed with an error, and Reset values weren't kept on Save.

## [1.13.0] - 2026-10-26

### Added
- **Chat Name** in Customize Chat (and in the group window's Common tab): the name shown at the top of the chat, separate from the character's name. It is always saved for the chat only, even with "Set as Character Theme" checked.
- New chats whose character only has a background: the character is cut out of that background with the background-removal API, saved as the character's image (so later chats with that character reuse it), and the chat gets a random background from the collection, saved for the chat.
- New group chats where every character only has a background also get a random background once the cut-outs are shown.
- Group chats: **Bring forward** and **Send backward** in each character's tab to change which character is in front; the order is saved for the chat.

### Changed
- Character images use the full height of the window in every chat (the image area used to start below the header, cutting off the top of tall images).
- Right-click **Remove background** (v1.4.1) shows its result at full height too.

## [1.12.6] - 2026-10-26

### Removed
- `backgrounds.md`. Its list was out of date and most links were broken; the README now points to **Browse collection** in Customize Chat and to the background folder on GitHub.

### Changed
- README screenshots moved to `.github/resources` (1.12.5).

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
[1.17.2]: https://github.com/pervertir/Yodayo-Chat-Customizer/commits/main
[1.17.1]: https://github.com/pervertir/Yodayo-Chat-Customizer/commit/4a48cf3
[1.17.0]: https://github.com/pervertir/Yodayo-Chat-Customizer/commit/7b90e61
[1.16.0]: https://github.com/pervertir/Yodayo-Chat-Customizer/commit/5981c18
[1.15.0]: https://github.com/pervertir/Yodayo-Chat-Customizer/commit/fcb86fd
[1.14.0]: https://github.com/pervertir/Yodayo-Chat-Customizer/commit/8316746
[1.13.2]: https://github.com/pervertir/Yodayo-Chat-Customizer/commit/46b237f
[1.13.1]: https://github.com/pervertir/Yodayo-Chat-Customizer/commit/ef21663
[1.13.0]: https://github.com/pervertir/Yodayo-Chat-Customizer/commit/2954951
[1.12.6]: https://github.com/pervertir/Yodayo-Chat-Customizer/commits/main
[1.12.4]: https://github.com/pervertir/Yodayo-Chat-Customizer/commit/7c68b91
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
