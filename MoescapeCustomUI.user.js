// ==UserScript==
// @name         Yodayo/ Moescape Customizer
// @version      1.6.3

// @namespace    MOESCAPE

// @description  Fully Customize Yodayo/ Moescape Chats
// @author       Pervertir

// @homepageURL  https://github.com/pervertir/Yodayo-Chat-Customizer
// @updateURL    https://github.com/pervertir/Yodayo-Chat-Customizer/raw/refs/heads/feat/export-db/MoescapeCustomUI.user.js
// @downloadURL  https://github.com/pervertir/Yodayo-Chat-Customizer/raw/refs/heads/feat/export-db/MoescapeCustomUI.user.js
// @supportURL   https://github.com/pervertir/Yodayo-Chat-Customizer/issues

// @match        https://moescape.ai/*
// @match        https://yodayo.com/*

// @run-at       document-end
// @grant        GM_getResourceURL
// @grant        GM_addStyle
// @grant        GM_getResourceText
// @grant        GM_xmlhttpRequest

// @resource     chat_customizer_body        https://github.com/pervertir/Yodayo-Chat-Customizer/raw/refs/heads/feat/export-db/HTML/chat_customizer_popup.html
// @resource     customize_chat_button       https://github.com/pervertir/Yodayo-Chat-Customizer/raw/refs/heads/feat/export-db/HTML/customize_chat_button.html
// @resource     db_connect                  https://github.com/pervertir/Yodayo-Chat-Customizer/raw/refs/heads/feat/export-db/HTML/db_connect_button.html
// @resource     character_image_container   https://github.com/pervertir/Yodayo-Chat-Customizer/raw/refs/heads/feat/export-db/HTML/character_image_container.html
// @resource     image_viewer_popup          https://github.com/pervertir/Yodayo-Chat-Customizer/raw/refs/heads/feat/export-db/HTML/image_viewer_popup.html
// @resource     injection_notification      https://github.com/pervertir/Yodayo-Chat-Customizer/raw/refs/heads/feat/export-db/HTML/notification.html
// @resource     card_layout                 https://github.com/pervertir/Yodayo-Chat-Customizer/raw/refs/heads/feat/export-db/HTML/card_layout.html
// @resource     pickr_css                https://cdn.jsdelivr.net/npm/@simonwep/pickr/dist/themes/nano.min.css

// @require      https://github.com/pervertir/Yodayo-Chat-Customizer/raw/refs/heads/feat/export-db/JS/constants.js
// @require      https://github.com/pervertir/Yodayo-Chat-Customizer/raw/refs/heads/feat/export-db/JS/database_handler.js
// @require      https://github.com/pervertir/Yodayo-Chat-Customizer/raw/refs/heads/feat/export-db/JS/utils.js
// @require      https://github.com/pervertir/Yodayo-Chat-Customizer/raw/refs/heads/feat/export-db/JS/ui_setters.js
// @require      https://github.com/pervertir/Yodayo-Chat-Customizer/raw/refs/heads/feat/export-db/JS/chat_customizer_popup.js
// @require      https://github.com/pervertir/Yodayo-Chat-Customizer/raw/refs/heads/feat/export-db/JS/image_viewer_popup.js
// @require      https://github.com/pervertir/Yodayo-Chat-Customizer/raw/refs/heads/feat/export-db/JS/png_chunk_handler.js
// @require      https://github.com/pervertir/Yodayo-Chat-Customizer/raw/refs/heads/feat/export-db/JS/moescape_chat_customizer.js
// @require      https://cdn.jsdelivr.net/npm/@simonwep/pickr/dist/pickr.min.js
// @require      https://cdn.jsdelivr.net/npm/png-chunk-text/index.js

// @icon         https://moescape.ai/assets/images/logo.svg

// @connect      *
// ==/UserScript==
