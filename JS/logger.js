// logger
//
// yccLog.error/warn/info/debug print to the console when the Log Level chosen in Customize
// Chat allows it. Every message, whatever the level, is also kept as text in a small in-memory
// buffer, so a problem can be reported without reproducing it at a higher level. The buffer is
// lost when the page reloads, and nothing leaves the browser unless the user sends it.
//
// Reports get posted on a public issue tracker, so messages are made safe when they are logged:
// images, query strings and fields that look like secrets don't reach the buffer.

const LOG_LEVEL_KEY = 'ycc_log_level';
const LOG_LEVELS = ['error', 'warn', 'info', 'debug'];
const DEFAULT_LOG_LEVEL = 'warn';
const LOG_BUFFER_SIZE = 1000;
const LOG_MAX_ENTRY_CHARS = 2000;
const LOG_MAX_STRING_CHARS = 500;
const LOG_MAX_ITEMS = 20;
const LOG_MAX_DEPTH = 2;
const LOG_SENSITIVE_FIELD = /api.?key|token|secret|password|authorization|cookie/i;
const ISSUE_URL = 'https://github.com/pervertir/Yodayo-Chat-Customizer/issues/new';
const ISSUE_URL_MAX_CHARS = 7000; // longer prefilled links are refused by GitHub

/** @type {{time: string, level: string, text: string}[]} */
const logBuffer = [];
let logLevel = readLogLevel();

/**
 * @returns {string} the saved log level
 */
function readLogLevel() {
    const saved = typeof GM_getValue === 'function' ? GM_getValue(LOG_LEVEL_KEY, DEFAULT_LOG_LEVEL) : DEFAULT_LOG_LEVEL;
    return LOG_LEVELS.includes(saved) ? saved : DEFAULT_LOG_LEVEL;
}

/**
 * @returns {string}
 */
function getLogLevel() {
    return logLevel;
}

/**
 * Changes and saves the level of messages printed to the console.
 * @param {string} level
 * @returns {void}
 */
function setLogLevel(level) {
    if (!LOG_LEVELS.includes(level)) return;
    logLevel = level;
    if (typeof GM_setValue === 'function') GM_setValue(LOG_LEVEL_KEY, level);
}

/**
 * @param {string} text
 * @returns {string} text without embedded images or query strings, and cut to a sensible length
 */
function sanitizeLogText(text) {
    const clean = text
        .replace(/data:([\w/+.-]*)[^\s"')]*/g, (match, type) => `[data:${type}, ${match.length} chars]`)
        .replace(/(https?:\/\/[^\s"'?)]+)\?[^\s"')]*/g, '$1?…');
    return clean.length > LOG_MAX_STRING_CHARS ? `${clean.slice(0, LOG_MAX_STRING_CHARS)}… [${clean.length} chars]` : clean;
}

/**
 * Turns a log argument into bounded text. Large objects are cut, not walked in full.
 * @param {*} value
 * @param {number} [depth]
 * @returns {string}
 */
function formatLogValue(value, depth = 0) {
    if (typeof value === 'string') return sanitizeLogText(value);
    if (value === null || typeof value !== 'object') {
        return typeof value === 'function' ? `[function ${value.name}]` : String(value);
    }
    if (typeof value.message === 'string' && typeof value.name === 'string') {
        // Stacks are long, and only the top frames say where it happened
        const stack = typeof value.stack === 'string' ? value.stack.split('\n').slice(1, 6).join('\n') : '';
        return sanitizeLogText(`${value.name}: ${value.message}${stack ? `\n${stack}` : ''}`);
    }
    if (typeof Element !== 'undefined' && value instanceof Element) {
        const id = value.id ? `#${value.id}` : '';
        const classes = typeof value.className === 'string' && value.className ? `.${value.className.trim().split(/\s+/).slice(0, 3).join('.')}` : '';
        return `<${value.tagName.toLowerCase()}${id}${classes}>`;
    }
    if (typeof Blob !== 'undefined' && value instanceof Blob) return `[Blob ${value.type}, ${value.size} bytes]`;
    if (depth >= LOG_MAX_DEPTH) return Array.isArray(value) ? `[Array ${value.length}]` : '[Object]';

    if (Array.isArray(value) || (typeof NodeList !== 'undefined' && value instanceof NodeList) ||
        (typeof HTMLCollection !== 'undefined' && value instanceof HTMLCollection)) {
        const items = Array.from(value);
        const shown = items.slice(0, LOG_MAX_ITEMS).map(item => formatLogValue(item, depth + 1));
        if (items.length > LOG_MAX_ITEMS) shown.push(`… ${items.length} items`);
        return `[${shown.join(', ')}]`;
    }
    const keys = Object.keys(value);
    const shown = keys.slice(0, LOG_MAX_ITEMS).map(key =>
        `${key}: ${LOG_SENSITIVE_FIELD.test(key) ? '[redacted]' : formatLogValue(value[key], depth + 1)}`);
    if (keys.length > LOG_MAX_ITEMS) shown.push(`… ${keys.length} fields`);
    return `{${shown.join(', ')}}`;
}

/**
 * Keeps a message in the buffer, dropping the oldest once it is full.
 * @param {string} level
 * @param {*[]} args
 * @returns {void}
 */
function bufferLogEntry(level, args) {
    let text;
    try {
        text = args.map(arg => formatLogValue(arg)).join(' ').slice(0, LOG_MAX_ENTRY_CHARS);
    } catch (e) {
        text = '[message could not be read]'; // logging must never break the caller
    }
    logBuffer.push({ time: new Date().toISOString(), level, text });
    if (logBuffer.length > LOG_BUFFER_SIZE) logBuffer.shift();
}

/**
 * @param {string} level
 * @param {'error'|'warn'|'info'|'log'} method console method; 'log' for debug, as browsers hide console.debug by default
 * @returns {(...args: *[]) => void}
 */
function createLogMethod(level, method) {
    return (...args) => {
        bufferLogEntry(level, args);
        if (LOG_LEVELS.indexOf(level) <= LOG_LEVELS.indexOf(logLevel)) console[method]('[YCC]', ...args);
    };
}

const yccLog = {
    error: createLogMethod('error', 'error'),
    warn: createLogMethod('warn', 'warn'),
    info: createLogMethod('info', 'info'),
    debug: createLogMethod('debug', 'log')
};

// Errors nobody caught. Only this script's own (the browser prints them already): the site's
// would push ours out of the buffer.
window.addEventListener('error', e => {
    if (/userscript/i.test(`${e.filename} ${e.error?.stack}`)) bufferLogEntry('error', ['Uncaught:', e.error || e.message]);
});
window.addEventListener('unhandledrejection', e => {
    if (/userscript/i.test(`${e.reason?.stack}`)) bufferLogEntry('error', ['Unhandled rejection:', e.reason]);
});

/**
 * @param {{time: string, level: string, text: string}} entry
 * @returns {string}
 */
function formatLogEntry(entry) {
    return `${entry.time} ${entry.level.toUpperCase().padEnd(5)} ${entry.text}`;
}

/**
 * Replaces the saved API key wherever it ended up in a report, e.g. inside an error message.
 * @param {string} text
 * @returns {string}
 */
function redactApiKey(text) {
    const key = typeof GM_getValue === 'function' ? GM_getValue(BG_REMOVAL_KEY_NAME, '') : '';
    return key ? text.split(key).join('[redacted]') : text;
}

/**
 * Facts about the setup that a bug report needs. Contains nothing about the user's chats
 * beyond how many settings and images are stored.
 * @returns {Promise<string>}
 */
async function getDebugEnvironment() {
    const script = typeof GM_info === 'object' ? GM_info : {};
    const lines = [
        `Customizer version: ${script.script?.version || 'unknown'}`,
        `Userscript manager: ${script.scriptHandler || 'unknown'} ${script.version || ''}`.trim(),
        `Browser: ${navigator.userAgent}`,
        `Site: ${location.host}`,
        `Page: ${location.pathname.startsWith('/tavern/chat/') ? (isGroupChat() ? 'group chat' : 'single chat') : 'other'}`,
        `Window: ${window.innerWidth}x${window.innerHeight}`,
        `Log level: ${logLevel}`
    ];
    try {
        lines.push(`Stored settings: ${mirrorGetAllRecords().length} records`);
        const usage = await getStorageUsage();
        lines.push(`Stored images: ${usage.images} (${formatBytes(usage.imageBytes)})`);
    } catch (e) {
        lines.push(`Storage: could not be read (${e.message})`);
    }
    return lines.join('\n');
}

/**
 * The whole report: setup details and every buffered message.
 * @returns {Promise<string>}
 */
async function buildDebugReport() {
    const environment = await getDebugEnvironment();
    const dropped = logBuffer.length === LOG_BUFFER_SIZE ? ' (older messages were dropped)' : '';
    return redactApiKey([
        environment,
        '',
        `Logs: ${logBuffer.length} messages${dropped}`,
        ...logBuffer.map(formatLogEntry)
    ].join('\n'));
}

/**
 * Link to a new issue with the template filled in. A link can't hold the whole log, so it carries
 * the latest warnings and errors, as many as fit; the user pastes the rest from the clipboard.
 * @returns {Promise<string>}
 */
async function buildIssueUrl() {
    const url = logs => `${ISSUE_URL}?${new URLSearchParams({
        template: 'bug_report.yml',
        environment,
        logs
    })}`;
    const environment = redactApiKey(await getDebugEnvironment());
    const problems = logBuffer.filter(entry => entry.level === 'error' || entry.level === 'warn').map(formatLogEntry);
    const notice = 'Paste the full logs from the clipboard over this text. Latest warnings and errors:';
    while (problems.length && url(redactApiKey([notice, ...problems].join('\n'))).length > ISSUE_URL_MAX_CHARS) {
        problems.shift();
    }
    return url(redactApiKey(problems.length ? [notice, ...problems].join('\n') : 'Paste the full logs from the clipboard over this text.'));
}
