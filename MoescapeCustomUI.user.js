// ==UserScript==
// @name         Moescape Customizer
// @version      Alpha-v11

// @namespace    MOESCAPE

// @description  Fully Customize Moescape Chats
// @author       Pervertir

// @homepageURL  https://github.com/pervertir/Yodayo-Chat-Customizer/tree/main
// @updateURL    https://github.com/pervertir/Yodayo-Chat-Customizer/raw/main/MoescapeCustomUI.user.js
// @downloadURL  https://github.com/pervertir/Yodayo-Chat-Customizer/raw/main/MoescapeCustomUI.user.js
// @supportURL   https://github.com/pervertir/Yodayo-Chat-Customizer/issues

// @match        https://moescape.ai/*
// @run-at       document-end
// @grant        GM_getResourceURL
// @grant        GM_xmlhttpRequest

// @resource     chat_customizer_body        https://raw.githubusercontent.com/pervertir/Yodayo-Chat-Customizer/main/HTML/chat_customizer_popup.html
// @resource     customize_chat_button       https://raw.githubusercontent.com/pervertir/Yodayo-Chat-Customizer/main/HTML/customize_chat_button.html
// @resource     db_connect                  https://raw.githubusercontent.com/pervertir/Yodayo-Chat-Customizer/main/HTML/db_connect_button.html
// @resource     character_image_container   https://raw.githubusercontent.com/pervertir/Yodayo-Chat-Customizer/main/HTML/character_image_container.html
// @resource     image_viewer_popup          https://raw.githubusercontent.com/pervertir/Yodayo-Chat-Customizer/main/HTML/image_viewer_popup.html
// @resource     injection_notification      https://raw.githubusercontent.com/pervertir/Yodayo-Chat-Customizer/main/HTML/notification.html

// @require      file://D:\Workspace\Yodayo-Chat-Customizer\JS\constants.js
// @require      file://D:\Workspace\Yodayo-Chat-Customizer\JS\database_handler.js
// @require      file://D:\Workspace\Yodayo-Chat-Customizer\JS\utils.js
// @require      file://D:\Workspace\Yodayo-Chat-Customizer\JS\chat_customizer_popup.js
// @require      file://D:\Workspace\Yodayo-Chat-Customizer\JS\image_viewer_popup.js
// @require      file://D:\Workspace\Yodayo-Chat-Customizer\JS\moescape_chat_customizer.js

// @icon         https://moescape.ai/assets/images/logo.svg

// @connect      *
// ==/UserScript==
