// ==UserScript==
// @name         Yodayo Chat Customizer
// @namespace    YCC
// @version      Alpha-v2.1
// @description  Fully Customize Yodayo Chats
// @author       Pervertir
// @homepageURL  https://github.com/pervertir/Yodayo-Chat-Customizer/tree/main
// @updateURL    https://github.com/pervertir/Yodayo-Chat-Customizer/raw/main/YCC.user.js
// @downloadURL  https://github.com/pervertir/Yodayo-Chat-Customizer/raw/main/YCC.user.js
// @supportURL   https://github.com/pervertir/Yodayo-Chat-Customizer/issues

// @match        https://yodayo.com/tavern/chat/*
// @run-at       document-end
// @grant        GM_getResourceURL
// @grant        GM_xmlhttpRequest

// @resource     chat_customizer_body          https://raw.githubusercontent.com/pervertir/Yodayo-Chat-Customizer/main/HTML/chat_customizer_popup.html
// @resource     customize_chat_button         https://raw.githubusercontent.com/pervertir/Yodayo-Chat-Customizer/main/HTML/customize_chat_button.html
// @resource     db_connect                    https://raw.githubusercontent.com/pervertir/Yodayo-Chat-Customizer/main/HTML/db_connect_button.html
// @resource     character_image_container     https://raw.githubusercontent.com/pervertir/Yodayo-Chat-Customizer/main/HTML/character_image_container.html
// @resource     image_viewer_popup            https://raw.githubusercontent.com/pervertir/Yodayo-Chat-Customizer/main/HTML/image_viewer_popup.html

// @require      file://D:\Workspace\Yodayo-Chat-Customizer\JS\constants.js
// @require      file://D:\Workspace\Yodayo-Chat-Customizer\JS\database_handler.js
// @require      file://D:\Workspace\Yodayo-Chat-Customizer\JS\utils.js
// @require      file://D:\Workspace\Yodayo-Chat-Customizer\JS\chat_customizer_popup.js
// @require      file://D:\Workspace\Yodayo-Chat-Customizer\JS\image_viewer_popup.js
// @require      file://D:\Workspace\Yodayo-Chat-Customizer\JS\yodayo_chat_customizer.js

// @icon         https://www.google.com/s2/favicons?sz=64&domain=yodayo.com
// @connect      *
// ==/UserScript==
