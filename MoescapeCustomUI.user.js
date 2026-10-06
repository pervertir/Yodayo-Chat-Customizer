// ==UserScript==
// @name         Yodayo/ Moescape Customizer
// @version      1.11.0

// @namespace    MOESCAPE

// @description  Fully Customize Yodayo/ Moescape Chats
// @author       Pervertir

// @homepageURL  https://github.com/pervertir/Yodayo-Chat-Customizer
// @updateURL    https://github.com/pervertir/Yodayo-Chat-Customizer/raw/refs/heads/main/MoescapeCustomUI.user.js
// @downloadURL  https://github.com/pervertir/Yodayo-Chat-Customizer/raw/refs/heads/main/MoescapeCustomUI.user.js
// @supportURL   https://github.com/pervertir/Yodayo-Chat-Customizer/issues

// @match        https://moescape.ai/*
// @match        https://yodayo.com/*

// @run-at       document-end
// @grant        GM_getResourceURL
// @grant        GM_addStyle
// @grant        GM_getResourceText
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_listValues

// @resource     chat_customizer_body        https://github.com/pervertir/Yodayo-Chat-Customizer/raw/refs/heads/main/HTML/chat_customizer_popup.html
// @resource     customize_chat_button       https://github.com/pervertir/Yodayo-Chat-Customizer/raw/refs/heads/main/HTML/customize_chat_button.html
// @resource     db_connect                  https://github.com/pervertir/Yodayo-Chat-Customizer/raw/refs/heads/main/HTML/db_connect_button.html
// @resource     character_image_container   https://github.com/pervertir/Yodayo-Chat-Customizer/raw/refs/heads/main/HTML/character_image_container.html
// @resource     image_viewer_popup          https://github.com/pervertir/Yodayo-Chat-Customizer/raw/refs/heads/main/HTML/image_viewer_popup.html
// @resource     injection_notification      https://github.com/pervertir/Yodayo-Chat-Customizer/raw/refs/heads/main/HTML/notification.html
// @resource     card_layout                 https://github.com/pervertir/Yodayo-Chat-Customizer/raw/refs/heads/main/HTML/card_layout.html
// @resource     pickr_css                https://cdn.jsdelivr.net/npm/@simonwep/pickr/dist/themes/nano.min.css

// Pickr ends with a "//# sourceMappingURL" comment and no newline, so it must come first: whatever
// follows it on the same line is commented out (constants.js starts with a comment, so that is harmless).
// Tailwind is pinned to the unminified file, which ends with a newline and no comment, so it is safe last.
// @require      https://cdn.jsdelivr.net/npm/@simonwep/pickr@1.9.1/dist/pickr.min.js
// @require      https://github.com/pervertir/Yodayo-Chat-Customizer/raw/refs/heads/main/JS/constants.js
// @require      https://github.com/pervertir/Yodayo-Chat-Customizer/raw/refs/heads/main/JS/backup_storage.js
// @require      https://github.com/pervertir/Yodayo-Chat-Customizer/raw/refs/heads/main/JS/database_handler.js
// @require      https://github.com/pervertir/Yodayo-Chat-Customizer/raw/refs/heads/main/JS/utils.js
// @require      https://github.com/pervertir/Yodayo-Chat-Customizer/raw/refs/heads/main/JS/background_removal.js
// @require      https://github.com/pervertir/Yodayo-Chat-Customizer/raw/refs/heads/main/JS/ui_setters.js
// @require      https://github.com/pervertir/Yodayo-Chat-Customizer/raw/refs/heads/main/JS/chat_customizer_popup.js
// @require      https://github.com/pervertir/Yodayo-Chat-Customizer/raw/refs/heads/main/JS/background_browser.js
// @require      https://github.com/pervertir/Yodayo-Chat-Customizer/raw/refs/heads/main/JS/image_viewer_popup.js
// @require      https://github.com/pervertir/Yodayo-Chat-Customizer/raw/refs/heads/main/JS/moescape_chat_customizer.js
// @require      https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4.3.3/dist/index.global.js



// @icon         https://moescape.ai/assets/images/logo.svg

// @connect      *
// ==/UserScript==
