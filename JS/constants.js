// constants
// general
const theme = '.text-primaryText';

// Selectors

// Character
const char_id_selector = '.flex.items-end.gap-2.mr-3 > a';
const character_name_selector = 'div.mb-1.flex.items-center.justify-between.gap-4 a.text-xs.font-medium.opacity-50';
const character_name_title = 'p.truncate.text-sm.font-medium';
const character_chat_bubble_background = /^\.bg-black.*85.*/;
const character_dialogue = /^\.text-primaryText\\\/90.*/; // 'p.space-x-1 >span'
const character_narration = '.text-chipText';
const character_image = 'img.mx-auto.h-full.w-auto.object-contain.object-bottom';

// User
const user_name = 'div.mb-1.flex.items-center.justify-between.gap-4 p.text-xs.font-medium.opacity-50';
const user_chat_bubble_background = /^\.bg-primaryText.*85.*/;
const user_message = /\.text-black\b/;

// Background
const bg_color = '.bg-primaryBg';
const bg_img = ['.bg-cover', '.bg-no-repeat']; // Convert array to selector string for better performance


// Styles

// Character
const color_character_name = 'color';
const color_character_chat_bubble_background = '.bg-black\/\[85\%\], .bg-black\/\[\.85\]';
const character_pfp = ' div.hidden.shrink-0.sm\:flex>img';


// Existing UI element ids
const menu_button = 'headlessui-menu-button-:r7u:'
// New UI element ids
const chat_customizer_html_element_id = 'headlessui-menu-item-chat-customizer';
const db_explorer_html_element_id = 'headlessui-menu-item-db-explorer';
const chat_customizer_body_id = 'chat-customizer-ui-popup';
const db_explorer_body_id = "image-viewer-ui-popup";

// Resource Names
const customize_chat_button_html_resource_name = 'customize_chat_button';
const db_connect_button_html_resource_name = 'db_connect';
const chat_customizer_body_resource_name = 'chat_customizer_body';
const image_viewer_popup_resource_name = 'image_viewer_popup';
const notification_resource_name = 'injection_notification';
const character_image_container_resource_name = 'character_image_container';
const card_layout_resource_name = 'card_layout';

// Database Constants
const DB_NAME = 'MYChatCustomizerDB';
const DB_VERSION = 2; // Incremented for new schema with record type tracking
const CHARACTER_OBJECT_STORE_NAME = 'Characters';

// Default color constants (centralized)
const DEFAULT_COLORS = {
    characterName: '#ffffff',
    characterNarration: '#b0d8fb',
    userNameColor: '#000000',
    characterChat: '#ffffff',
    userChat: '#000000',
    characterChatBg: '#000000',
    userChatBg: '#ffffff'
};

// WebP Compression Constants
const WEBP_CONFIG = {
    enabled: true,
    quality: 1.0, // 1.0 = lossless, 0.92 = ~8% quality loss (imperceptible)
    maxImageWidth: 1200, // Resize if wider (optional, set to 0 to disable)
    maxImageHeight: 1200  // Resize if taller (optional, set to 0 to disable)
};

// SQLite Export/Import Constants
const SQLITE_CONFIG = {
    enabled: true,
    databaseName: 'yodayo_customizer.sqlite',
    version: '1.0',
    allowExportFormat: 'sqlite', // 'sqlite' or 'json' for fallback
    schema: {
        characters: {
            name: 'Characters',
            columns: 'CHAR_ID TEXT PRIMARY KEY, NAME TEXT, CREATED_AT DATETIME DEFAULT CURRENT_TIMESTAMP, UPDATED_AT DATETIME DEFAULT CURRENT_TIMESTAMP'
        },
        characterCustomizations: {
            name: 'CharacterCustomizations',
            columns: 'ID INTEGER PRIMARY KEY AUTOINCREMENT, CHAR_ID TEXT, CHAT_ID TEXT, COLOR_DATA TEXT, IMAGE_DATA TEXT, ALIAS TEXT, CREATED_AT DATETIME DEFAULT CURRENT_TIMESTAMP, UPDATED_AT DATETIME DEFAULT CURRENT_TIMESTAMP, UNIQUE(CHAR_ID, CHAT_ID)'
        },
        universalSettings: {
            name: 'UniversalSettings',
            columns: 'KEY TEXT PRIMARY KEY, VALUE TEXT, CREATED_AT DATETIME DEFAULT CURRENT_TIMESTAMP, UPDATED_AT DATETIME DEFAULT CURRENT_TIMESTAMP'
        },
        metadata: {
            name: 'Metadata',
            columns: 'KEY TEXT PRIMARY KEY, VALUE TEXT'
        }
    }
};
