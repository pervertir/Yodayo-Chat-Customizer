// ==UserScript==
// @name         Yodayo/ Moescape Customizer
// @version      1.1.6

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
// @grant        GM_xmlhttpRequest

// @resource     chat_customizer_body        https://github.com/pervertir/Yodayo-Chat-Customizer/raw/refs/heads/main/HTML/chat_customizer_popup.html
// @resource     customize_chat_button       https://github.com/pervertir/Yodayo-Chat-Customizer/raw/refs/heads/main/HTML/customize_chat_button.html
// @resource     db_connect                  https://github.com/pervertir/Yodayo-Chat-Customizer/raw/refs/heads/main/HTML/db_connect_button.html
// @resource     character_image_container   https://github.com/pervertir/Yodayo-Chat-Customizer/raw/refs/heads/main/HTML/character_image_container.html
// @resource     image_viewer_popup          https://github.com/pervertir/Yodayo-Chat-Customizer/raw/refs/heads/main/HTML/image_viewer_popup.html
// @resource     injection_notification      https://github.com/pervertir/Yodayo-Chat-Customizer/raw/refs/heads/main/HTML/notification.html
// @resource     card_layout                 https://github.com/pervertir/Yodayo-Chat-Customizer/raw/refs/heads/main/HTML/card_layout.html

// @require      https://github.com/pervertir/Yodayo-Chat-Customizer/raw/refs/heads/main/JS/constants.js
// @require      https://github.com/pervertir/Yodayo-Chat-Customizer/raw/refs/heads/main/JS/database_handler.js
// @require      https://github.com/pervertir/Yodayo-Chat-Customizer/raw/refs/heads/main/JS/utils.js
// @require      https://github.com/pervertir/Yodayo-Chat-Customizer/raw/refs/heads/main/JS/ui_setters.js
// @require      https://github.com/pervertir/Yodayo-Chat-Customizer/raw/refs/heads/main/JS/chat_customizer_popup.js
// @require      https://github.com/pervertir/Yodayo-Chat-Customizer/raw/refs/heads/main/JS/image_viewer_popup.js
// @require      https://github.com/pervertir/Yodayo-Chat-Customizer/raw/refs/heads/main/JS/moescape_chat_customizer.js

// @icon         https://moescape.ai/assets/images/logo.svg

// @connect      *
// ==/UserScript==
