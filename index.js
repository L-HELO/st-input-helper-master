// The main script for the extension
// Import necessary modules
import { extension_settings, getContext, loadExtensionSettings } from "../../../extensions.js";
import { saveSettingsDebounced } from "../../../../script.js";

// Extension configuration
const extensionName = "st-input-helper";
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;
const defaultSettings = {
    enabled: true,
    buttons: {
        asterisk: true,
        quotes: true,
        parentheses: true,
        bookQuotes1: true,
        bookQuotes2: true,
        bookQuotes3: true,
        newline: true,
        user: true,
        char: true
    },
    shortcuts: {
        asterisk: "",
        quotes: "",
        parentheses: "",
        bookQuotes1: "",
        bookQuotes2: "",
        bookQuotes3: "",
        newline: "",
        user: "",
        char: ""
    },
    buttonOrder: [
        'asterisk',
        'quotes',
        'parentheses',
        'bookQuotes1',
        'bookQuotes2',
        'bookQuotes3',
        'newline',
        'user',
        'char'
    ],
    customSymbols: []
};

// Shortcut function mapping
const shortcutFunctionMap = {
    'asterisk': insertAsterisk,
    'quotes': insertQuotes,
    'parentheses': insertParentheses,
    'bookQuotes1': insertBookQuotes1,
    'bookQuotes2': insertBookQuotes2,
    'bookQuotes3': insertBookQuotes3,
    'newline': insertNewLine,
    'user': insertUserTag,
    'char': insertCharTag
};

// Core Functions

async function loadSettings() {
    extension_settings[extensionName] = extension_settings[extensionName] || {};
    if (Object.keys(extension_settings[extensionName]).length  === 0) {
        Object.assign(extension_settings[extensionName],  defaultSettings);
    }

    // Compatibility checks
    if (!extension_settings[extensionName].buttons) {
        extension_settings[extensionName].buttons = defaultSettings.buttons;
    }
    if (!extension_settings[extensionName].shortcuts) {
        extension_settings[extensionName].shortcuts = defaultSettings.shortcuts;
    }
    if (!extension_settings[extensionName].buttonOrder) {
        extension_settings[extensionName].buttonOrder = defaultSettings.buttonOrder;
    }
    if (!extension_settings[extensionName].customSymbols) {
        extension_settings[extensionName].customSymbols = [];
    }

    // Update UI
    $("#enable_input_helper").prop("checked", extension_settings[extensionName].enabled);

    const buttons = extension_settings[extensionName].buttons;
    $("#enable_asterisk_btn").prop("checked", buttons.asterisk  !== false);
    $("#enable_quotes_btn").prop("checked", buttons.quotes  !== false);
    $("#enable_parentheses_btn").prop("checked", buttons.parentheses  !== false);
    $("#enable_book_quotes1_btn").prop("checked", buttons.bookQuotes1  !== false);
    $("#enable_book_quotes2_btn").prop("checked", buttons.bookQuotes2  !== false);
    $("#enable_book_quotes3_btn").prop("checked", buttons.bookQuotes3  !== false);
    $("#enable_newline_btn").prop("checked", buttons.newline  !== false);
    $("#enable_user_btn").prop("checked", buttons.user  !== false);
    $("#enable_char_btn").prop("checked", buttons.char  !== false);

    const shortcuts = extension_settings[extensionName].shortcuts;
    for (const key in shortcuts) {
        $(`#shortcut_${key}`).val(shortcuts[key] || "");
    }

    updateButtonsOrder();
    updateButtonVisibility();
    loadCustomSymbolButtons();
}

function updateButtonsOrder() {
    const buttonOrder = extension_settings[extensionName].buttonOrder;
    if (!buttonOrder || buttonOrder.length  === 0) return;

    const container = $("#integrated_button_settings");

    buttonOrder.forEach(key  => {
        const buttonRow = $(`.integrated-button-row[data-button-key="${key}"]`);
        if (buttonRow.length)  {
            container.append(buttonRow);
        }
    });
}

function initSortable() {
    try {
        if ($("#integrated_button_settings").sortable) {
            $("#integrated_button_settings").sortable({
                handle: ".drag-handle",
                axis: "y",
                delay: 150,
                stop: function() {
                    const newOrder = [];
                    $("#integrated_button_settings .integrated-button-row").each(function() {
                        const buttonKey = $(this).attr("data-button-key");
                        newOrder.push(buttonKey);
                    });

                    extension_settings[extensionName].buttonOrder = newOrder;
                    saveSettingsDebounced();
                    updateToolbarButtonOrder();
                }
            });
        } else {
            console.warn("jQuery  UI Sortable not available");
        }
    } catch (error) {
        console.error("Sortable  initialization failed:", error);
    }
}

function updateToolbarButtonOrder() {
    const buttonOrder = extension_settings[extensionName].buttonOrder || [];
    if (buttonOrder.length  === 0) return;

    const toolbar = $("#input_helper_toolbar");
    if (toolbar.length  === 0) return;

    buttonOrder.forEach(key  => {
        const buttonId = getButtonIdFromKey(key);
        if (!buttonId) return;

        const button = $(`#${buttonId}`);
        if (button.length  && extension_settings[extensionName].buttons[key] !== false) {
            toolbar.append(button);
        }
    });
}

function getButtonIdFromKey(key) {
    if (key.startsWith('custom_'))  {
        const index = key.replace('custom_',  '');
        return `input_custom_${index}_btn`;
    }

    const keyToId = {
        'asterisk': 'input_asterisk_btn',
        'quotes': 'input_quotes_btn',
        'parentheses': 'input_parentheses_btn',
        'bookQuotes1': 'input_book_quotes1_btn',
        'bookQuotes2': 'input_book_quotes2_btn',
        'bookQuotes3': 'input_book_quotes3_btn',
        'newline': 'input_newline_btn',
        'user': 'input_user_btn',
        'char': 'input_char_btn'
    };

    return keyToId[key] || '';
}

function updateButtonVisibility() {
    const buttons = extension_settings[extensionName].buttons;

    $("#input_asterisk_btn").toggle(buttons.asterisk  !== false);
    $("#input_quotes_btn").toggle(buttons.quotes  !== false);
    $("#input_parentheses_btn").toggle(buttons.parentheses  !== false);
    $("#input_book_quotes1_btn").toggle(buttons.bookQuotes1  !== false);
    $("#input_book_quotes2_btn").toggle(buttons.bookQuotes2  !== false);
    $("#input_book_quotes3_btn").toggle(buttons.bookQuotes3  !== false);
    $("#input_newline_btn").toggle(buttons.newline  !== false);
    $("#input_user_btn").toggle(buttons.user  !== false);
    $("#input_char_btn").toggle(buttons.char  !== false);

    const customSymbols = extension_settings[extensionName].customSymbols || [];
    customSymbols.forEach((symbol,  index) => {
        const buttonKey = `custom_${index}`;
        $(`#input_custom_${index}_btn`).toggle(buttons[buttonKey] !== false);
    });

    const allHidden = Object.values(buttons).every(v  => v === false);
    if (allHidden) {
        $("#input_helper_toolbar").hide();
    } else if (extension_settings[extensionName].enabled) {
        $("#input_helper_toolbar").show();
        updateToolbarButtonOrder();
    }
}

function onEnableInputChange() {
    const value = $("#enable_input_helper").prop("checked");
    extension_settings[extensionName].enabled = value;
    saveSettingsDebounced();

    if (value) {
        updateButtonVisibility();
    } else {
        $("#input_helper_toolbar").hide();
    }
}

function onButtonVisibilityChange(buttonKey) {
    return function() {
        const checked = $(this).prop("checked");
        extension_settings[extensionName].buttons[buttonKey] = checked;
        saveSettingsDebounced();
        updateButtonVisibility();
    };
}

// Input Helper Functions

function getMessageInput() {
    return $("#send_textarea, #prompt_textarea").first();
}

function insertQuotes() {
    if (!extension_settings[extensionName].enabled) return;

    const textarea = getMessageInput();
    const startPos = textarea.prop("selectionStart");
    const endPos = textarea.prop("selectionEnd");
    const text = textarea.val();

    const beforeText = text.substring(0,  startPos);
    const afterText = text.substring(endPos);

    const newText = beforeText + "\"\"" + afterText;
    textarea.val(newText);

    setTimeout(() => {
        textarea.prop("selectionStart",  startPos + 1);
        textarea.prop("selectionEnd",  startPos + 1);
        textarea.focus();
    }, 0);
}

function insertNewLine() {
    if (!extension_settings[extensionName].enabled) return;

    const textarea = getMessageInput();
    const text = textarea.val();
    const cursorPos = textarea.prop("selectionStart");

    let lineEnd = text.indexOf("\n",  cursorPos);
    if (lineEnd === -1) {
        lineEnd = text.length;
    }

    const newText = text.substring(0,  lineEnd) + "\n" + text.substring(lineEnd);
    textarea.val(newText);

    setTimeout(() => {
        textarea.prop("selectionStart",  lineEnd + 1);
        textarea.prop("selectionEnd",  lineEnd + 1);
        textarea.focus();
    }, 0);
}

function insertAsterisk() {
    if (!extension_settings[extensionName].enabled) return;

    const textarea = getMessageInput();
    const startPos = textarea.prop("selectionStart");
    const endPos = textarea.prop("selectionEnd");
    const text = textarea.val();

    const beforeText = text.substring(0,  startPos);
    const afterText = text.substring(endPos);

    const newText = beforeText + "**" + afterText;
    textarea.val(newText);

    setTimeout(() => {
        textarea.prop("selectionStart",  startPos + 1);
        textarea.prop("selectionEnd",  startPos + 1);
        textarea.focus();
    }, 0);
}

function insertUserTag() {
    if (!extension_settings[extensionName].enabled) return;

    const textarea = getMessageInput();
    const startPos = textarea.prop("selectionStart");
    const endPos = textarea.prop("selectionEnd");
    const text = textarea.val();

    const beforeText = text.substring(0,  startPos);
    const afterText = text.substring(endPos);

    const newText = beforeText + "{{User}}" + afterText;
    textarea.val(newText);

    setTimeout(() => {
        textarea.prop("selectionStart",  startPos + 8);
        textarea.prop("selectionEnd",  startPos + 8);
        textarea.focus();
    }, 0);
}

function insertCharTag() {
    if (!extension_settings[extensionName].enabled) return;

    const textarea = getMessageInput();
    const startPos = textarea.prop("selectionStart");
    const endPos = textarea.prop("selectionEnd");
    const text = textarea.val();

    const beforeText = text.substring(0,  startPos);
    const afterText = text.substring(endPos);

    const newText = beforeText + "{{Char}}" + afterText;
    textarea.val(newText);

    setTimeout(() => {
        textarea.prop("selectionStart",  startPos + 8);
        textarea.prop("selectionEnd",  startPos + 8);
        textarea.focus();
    }, 0);
}

function insertParentheses() {
    if (!extension_settings[extensionName].enabled) return;

    const textarea = getMessageInput();
    const startPos = textarea.prop("selectionStart");
    const endPos = textarea.prop("selectionEnd");
    const text = textarea.val();

    const beforeText = text.substring(0,  startPos);
    const afterText = text.substring(endPos);

    const newText = beforeText + "()" + afterText;
    textarea.val(newText);

    setTimeout(() => {
        textarea.prop("selectionStart",  startPos + 1);
        textarea.prop("selectionEnd",  startPos + 1);
        textarea.focus();
    }, 0);
}

function insertBookQuotes1() {
    if (!extension_settings[extensionName].enabled) return;

    const textarea = getMessageInput();
    const startPos = textarea.prop("selectionStart");
    const endPos = textarea.prop("selectionEnd");
    const text = textarea.val();

    const beforeText = text.substring(0,  startPos);
    const afterText = text.substring(endPos);

    const newText = beforeText + "「」" + afterText;
    textarea.val(newText);

    setTimeout(() => {
        textarea.prop("selectionStart",  startPos + 1);
        textarea.prop("selectionEnd",  startPos + 1);
        textarea.focus();
    }, 0);
}

function insertBookQuotes2() {
    if (!extension_settings[extensionName].enabled) return;

    const textarea = getMessageInput();
    const startPos = textarea.prop("selectionStart");
    const endPos = textarea.prop("selectionEnd");
    const text = textarea.val();

    const beforeText = text.substring(0,  startPos);
    const afterText = text.substring(endPos);

    const newText = beforeText + "『』" + afterText;
    textarea.val(newText);

    setTimeout(() => {
        textarea.prop("selectionStart",  startPos + 1);
        textarea.prop("selectionEnd",  startPos + 1);
        textarea.focus();
    }, 0);
}

function insertBookQuotes3() {
    if (!extension_settings[extensionName].enabled) return;

    const textarea = getMessageInput();
    const startPos = textarea.prop("selectionStart");
    const endPos = textarea.prop("selectionEnd");
    const text = textarea.val();

    const beforeText = text.substring(0,  startPos);
    const afterText = text.substring(endPos);

    const newText = beforeText + "《》" + afterText;
    textarea.val(newText);

    setTimeout(() => {
        textarea.prop("selectionStart",  startPos + 1);
        textarea.prop("selectionEnd",  startPos + 1);
        textarea.focus();
    }, 0);
}

// Shortcut Handling

function setupShortcutInputs() {
    $(".shortcut-input").on("keydown", function(e) {
        e.preventDefault();

        let keys = [];
        if (e.ctrlKey)  keys.push("Ctrl");
        if (e.altKey)  keys.push("Alt");
        if (e.shiftKey)  keys.push("Shift");

        if (
            e.key  !== "Control" &&
            e.key  !== "Alt" &&
            e.key  !== "Shift" &&
            e.key  !== "Meta" &&
            e.key  !== "Escape"
        ) {
            const keyName = e.key  && typeof e.key  === 'string' && e.key.length  === 1
                ? e.key.toUpperCase()
                : (e.key  || "Unknown");
            keys.push(keyName);
        }

        if (e.key  === "Escape") {
            $(this).val("");
            const shortcutKey = $(this).attr("id").replace("shortcut_", "");
            extension_settings[extensionName].shortcuts[shortcutKey] = "";
            saveSettingsDebounced();
            return;
        }

        if (keys.length  === 0 || (keys.length  === 1 && ["Ctrl", "Alt", "Shift"].includes(keys[0]))) {
            return;
        }

        const shortcutString = keys.join("+");
        $(this).val(shortcutString);

        const shortcutKey = $(this).attr("id").replace("shortcut_", "");
        extension_settings[extensionName].shortcuts[shortcutKey] = shortcutString;
        saveSettingsDebounced();
    });

    $(".shortcut-clear-btn").on("click", function() {
        const targetId = $(this).data("target");
        $(`#${targetId}`).val("");

        const shortcutKey = targetId.replace("shortcut_",  "");
        extension_settings[extensionName].shortcuts[shortcutKey] = "";
        saveSettingsDebounced();
    });
}

function handleGlobalShortcuts(e) {
    if (!extension_settings[extensionName].enabled || $(document.activeElement).hasClass("shortcut-input"))  {
        return;
    }

    const messageInput = getMessageInput()[0];
    if (document.activeElement  !== messageInput) {
        return;
    }

    let keys = [];
    if (e.ctrlKey)  keys.push("Ctrl");
    if (e.altKey)  keys.push("Alt");
    if (e.shiftKey)  keys.push("Shift");

    if (
        e.key  !== "Control" &&
        e.key  !== "Alt" &&
        e.key  !== "Shift" &&
        e.key  !== "Meta"
    ) {
        const keyName = e.key  && typeof e.key  === 'string' && e.key.length  === 1
            ? e.key.toUpperCase()
            : (e.key  || "Unknown");
        keys.push(keyName);
    }

    if (keys.length  <= 1) {
        return;
    }

    const shortcutString = keys.join("+");
    const shortcuts = extension_settings[extensionName].shortcuts;

    for (const key in shortcuts) {
        if (shortcuts[key] === shortcutString) {
            e.preventDefault();

            if (key.startsWith('custom_'))  {
                const index = parseInt(key.replace('custom_',  ''));
                const customSymbols = extension_settings[extensionName].customSymbols || [];
                if (index >= 0 && index < customSymbols.length)  {
                    insertCustomSymbol(customSymbols[index]);
                    return;
                }
            }
            else if (shortcutFunctionMap[key]) {
                shortcutFunctionMap[key]();
                return;
            }
        }
    }
}

// Custom Symbol Functions

function loadCustomSymbolButtons() {
    const customSymbols = extension_settings[extensionName].customSymbols || [];

    $(".custom-symbol-button").remove();
    $(".integrated-button-row[data-custom='true']").remove();

    customSymbols.forEach((symbol,  index) => {
        const buttonKey = `custom_${index}`;

        createCustomSymbolButton(symbol, index);
        createCustomSymbolSetting(symbol, index);

        if (!extension_settings[extensionName].buttonOrder.includes(buttonKey))  {
            extension_settings[extensionName].buttonOrder.push(buttonKey);
        }

        if (extension_settings[extensionName].buttons[buttonKey] === undefined) {
            extension_settings[extensionName].buttons[buttonKey] = true;
        }

        if (extension_settings[extensionName].shortcuts[buttonKey] === undefined) {
            extension_settings[extensionName].shortcuts[buttonKey] = "";
        }

        shortcutFunctionMap[buttonKey] = function() {
            insertCustomSymbol(customSymbols[index]);
        };
    });

    updateButtonsOrder();
    updateToolbarButtonOrder();
    setupShortcutInputs();
}

function createCustomSymbolButton(symbol, index) {
    const buttonId = `input_custom_${index}_btn`;
    const buttonKey = `custom_${index}`;

    $(`#${buttonId}`).remove();

    const button = $(`<button id="${buttonId}" class="input-helper-btn custom-symbol-button" title="${symbol.name}"  data-norefocus="true" data-index="${index}">${symbol.display}</button>`);
    $("#input_helper_toolbar").append(button);

    bindCustomSymbolEvent(button, symbol);
}

function bindCustomSymbolEvent(button, symbol) {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (isMobile) {
        button.on("touchstart",  function(e) {
            e.preventDefault();
            insertCustomSymbol(symbol);

            setTimeout(() => {
                getMessageInput().focus();
            }, 10);

            return false;
        });
    } else {
        button.on("click",  function() {
            insertCustomSymbol(symbol);
        });
    }
}

function createCustomSymbolSetting(symbol, index) {
    const buttonKey = `custom_${index}`;

    $(`.integrated-button-row[data-button-key="${buttonKey}"]`).remove();

    const row = $(`
        <div class="integrated-button-row" data-button-key="${buttonKey}" data-custom="true" data-index="${index}">
            <span class="drag-handle menu-handle">&#9776;</span>
            <input id="enable_${buttonKey}_btn" type="checkbox" ${extension_settings[extensionName].buttons[buttonKey] !== false ? 'checked' : ''} />
            <div class="button-preview">${symbol.display}</div> 
            <label for="enable_${buttonKey}_btn">${symbol.name}</label> 
            <button class="custom-edit-btn" title="编辑" data-index="${index}">✏️</button>
            <button class="custom-delete-btn" title="删除" data-index="${index}">🗑️</button>
            <input id="shortcut_${buttonKey}" class="shortcut-input" type="text" value="${extension_settings[extensionName].shortcuts[buttonKey] || ''}" placeholder="无快捷键" readonly />
            <button class="shortcut-clear-btn" data-target="shortcut_${buttonKey}">×</button>
        </div>
    `);

    $("#integrated_button_settings").append(row);

    row.find(`#enable_${buttonKey}_btn`).on("input",  onButtonVisibilityChange(buttonKey));
    row.find(".custom-edit-btn").on("click",  function() {
        const index = $(this).data("index");
        editCustomSymbol(index);
    });
    row.find(".custom-delete-btn").on("click",  function() {
        const index = $(this).data("index");
        deleteCustomSymbol(index);
    });
}

function insertCustomSymbol(symbol) {
    if (!extension_settings[extensionName].enabled) return;

    const textarea = getMessageInput();
    const startPos = textarea.prop("selectionStart");
    const endPos = textarea.prop("selectionEnd");
    const text = textarea.val();

    const beforeText = text.substring(0,  startPos);
    const afterText = text.substring(endPos);

    const processedSymbol = symbol.symbol
        .replace(/\\n/g, '\n')
        .replace(/([^\\]|^)n/g, '$1\n');

    const newText = beforeText + processedSymbol + afterText;
    textarea.val(newText);

    const insertedLength = processedSymbol.length;

    setTimeout(() => {
        let cursorPos = startPos;
        const strategy = symbol.cursorPos  || 'end';

        switch(strategy) {
            case 'start':
                cursorPos = startPos;
                break;
            case 'end':
                cursorPos = startPos + insertedLength;
                break;
            case 'middle':
                cursorPos = startPos + Math.floor(insertedLength  / 2);
                break;
            default:
                if (processedSymbol.includes('\n'))  {
                    const lastNewline = processedSymbol.lastIndexOf('\n');
                    cursorPos = startPos + lastNewline + 1;
                } else {
                    cursorPos = startPos + (parseInt(strategy) || 0);
                }
        }

        textarea.prop("selectionStart",  cursorPos);
        textarea.prop("selectionEnd",  cursorPos);
        textarea.focus();
    }, 0);
}

function editCustomSymbol(index) {
    const symbols = extension_settings[extensionName].customSymbols;
    const symbol = symbols[index];

    showCustomSymbolDialog(symbol, index);
}

function deleteCustomSymbol(index) {
    if (confirm("确定要删除这个自定义符号吗？")) {
        const symbols = extension_settings[extensionName].customSymbols;
        const buttonKey = `custom_${index}`;

        symbols.splice(index,  1);

        const orderIndex = extension_settings[extensionName].buttonOrder.indexOf(buttonKey);
        if (orderIndex > -1) {
            extension_settings[extensionName].buttonOrder.splice(orderIndex,  1);
        }

        delete extension_settings[extensionName].buttons[buttonKey];
        delete extension_settings[extensionName].shortcuts[buttonKey];

        $(`#input_custom_${index}_btn`).remove();
        delete shortcutFunctionMap[buttonKey];

        saveSettingsDebounced();
        rebindMobileEventListeners();
        loadCustomSymbolButtons();
        updateButtonVisibility();
    }
}

function rebindMobileEventListeners() {
    if (!/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))  {
        return;
    }

    $("#input_helper_toolbar button").off("touchstart");

    $("#input_helper_toolbar button").on("touchstart", function(e) {
        e.preventDefault();
        const btnId = $(this).attr("id");

        if (btnId === "input_asterisk_btn") insertAsterisk();
        else if (btnId === "input_quotes_btn") insertQuotes();
        else if (btnId === "input_parentheses_btn") insertParentheses();
        else if (btnId === "input_book_quotes1_btn") insertBookQuotes1();
        else if (btnId === "input_book_quotes2_btn") insertBookQuotes2();
        else if (btnId === "input_book_quotes3_btn") insertBookQuotes3();
        else if (btnId === "input_newline_btn") insertNewLine();
        else if (btnId === "input_user_btn") insertUserTag();
        else if (btnId === "input_char_btn") insertCharTag();
        else if (btnId.startsWith("input_custom_"))  {
            const index = parseInt(btnId.replace("input_custom_",  "").replace("_btn", ""));
            const customSymbols = extension_settings[extensionName].customSymbols || [];
            if (index >= 0 && index < customSymbols.length)  {
                insertCustomSymbol(customSymbols[index]);
            }
        }

        setTimeout(() => {
            getMessageInput().focus();
        }, 10);

        return false;
    });
}

function showCustomSymbolDialog(existingSymbol = null, editIndex = -1) {
    const dialog = $(`
        <div id="custom_symbol_dialog" class="custom-symbol-dialog">
            <div class="custom-symbol-dialog-content">
                <h3>${existingSymbol ? '编辑符号' : '添加自定义符号'}</h3>
                <div class="custom-symbol-form">
                    <div class="form-group">
                        <label for="custom_symbol_name">名称：</label>
                        <input type="text" id="custom_symbol_name" value="${existingSymbol ? existingSymbol.name  : ''}" placeholder="如：方括号">
                    </div>
                    <div class="form-group">
                        <label for="custom_symbol_symbol">符号：</label>
                        <input type="text" id="custom_symbol_symbol" value="${existingSymbol ? existingSymbol.symbol  : ''}" placeholder="如：[]">
                    </div>
                    <div class="form-group">
                        <label for="custom_symbol_display">显示文本：</label>
                        <input type="text" id="custom_symbol_display" value="${existingSymbol ? existingSymbol.display  : ''}" placeholder="如：[]">
                    </div>
                    <div class="form-group">
                        <label for="custom_symbol_cursor">光标位置：</label>
                        <select id="custom_symbol_cursor">
                            <option value="start" ${existingSymbol && existingSymbol.cursorPos  === 'start' ? 'selected' : ''}>开始</option>
                            <option value="middle" ${!existingSymbol || existingSymbol.cursorPos  === 'middle' ? 'selected' : ''}>中间</option>
                            <option value="end" ${existingSymbol && existingSymbol.cursorPos  === 'end' ? 'selected' : ''}>结尾</option>
                            <option value="custom" ${existingSymbol && !['start', 'middle', 'end'].includes(existingSymbol.cursorPos)  ? 'selected' : ''}>自定义</option>
                        </select>
                        <input type="number" id="custom_symbol_cursor_pos" value="${existingSymbol && !['start', 'middle', 'end'].includes(existingSymbol.cursorPos)  ? existingSymbol.cursorPos  : '1'}" min="0" style="display: ${existingSymbol && !['start', 'middle', 'end'].includes(existingSymbol.cursorPos)  ? 'inline-block' : 'none'}; width: 60px;">
                    </div>
                </div>
                <div class="custom-symbol-buttons">
                    <button id="custom_symbol_cancel">取消</button>
                    <button id="custom_symbol_save">保存</button>
                </div>
            </div>
        </div>
    `);

    $("body").append(dialog);

    $("#custom_symbol_cursor").on("change", function() {
        if ($(this).val() === "custom") {
            $("#custom_symbol_cursor_pos").show();
        } else {
            $("#custom_symbol_cursor_pos").hide();
        }
    });

    $("#custom_symbol_cancel").on("click", function() {
        dialog.remove();
    });

    $("#custom_symbol_save").on("click", function() {
        const name = $("#custom_symbol_name").val().trim();
        let symbol = $("#custom_symbol_symbol").val();
        symbol = symbol.replace(/\\n/g,  '\n')
            .replace(/([^\\]|^)n/g, '$1\n');

        const display = $("#custom_symbol_display").val() || symbol;
        let cursorPos = $("#custom_symbol_cursor").val();

        if (cursorPos === "custom") {
            cursorPos = $("#custom_symbol_cursor_pos").val();
        }

        if (!name || !symbol) {
            alert("请输入名称和符号！");
            return;
        }

        const symbolObj = {
            name: name,
            symbol: symbol,
            display: display,
            cursorPos: cursorPos
        };

        if (editIndex >= 0) {
            extension_settings[extensionName].customSymbols[editIndex] = symbolObj;
        } else {
            if (!extension_settings[extensionName].customSymbols) {
                extension_settings[extensionName].customSymbols = [];
            }
            extension_settings[extensionName].customSymbols.push(symbolObj);
        }

        saveSettingsDebounced();
        loadCustomSymbolButtons();
        dialog.remove();
    });
}

// Initialization

jQuery(async () => {
    const settingsHtml = await $.get(`${extensionFolderPath}/settings.html`);
    $("#extensions_settings2").append(settingsHtml);

    const toolbarHtml = await $.get(`${extensionFolderPath}/toolbar.html`);

    if ($("#qr--bar").length) {
        $("#qr--bar").after(toolbarHtml);
        $("#send_form").css("display", "flex");
        $("#send_form").css("flex-direction", "column");
        $("#qr--bar").css("order", "1");
        $("#input_helper_toolbar").css("order", "2");
    } else {
        $("#file_form").after(toolbarHtml);
    }

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) {
        $("#input_helper_toolbar").on("mousedown touchstart", function(e) {
            e.preventDefault();
        });

        rebindMobileEventListeners();
    } else {
        $("#input_asterisk_btn").on("click", insertAsterisk);
        $("#input_quotes_btn").on("click", insertQuotes);
        $("#input_newline_btn").on("click", insertNewLine);
        $("#input_user_btn").on("click", insertUserTag);
        $("#input_char_btn").on("click", insertCharTag);
        $("#input_parentheses_btn").on("click", insertParentheses);
        $("#input_book_quotes1_btn").on("click", insertBookQuotes1);
        $("#input_book_quotes2_btn").on("click", insertBookQuotes2);
        $("#input_book_quotes3_btn").on("click", insertBookQuotes3);
    }

    $("#insert_quotes_button").on("click", insertQuotes);
    $("#new_line_button").on("click", insertNewLine);
    $("#insert_asterisk_button").on("click", insertAsterisk);
    $("#enable_input_helper").on("input", onEnableInputChange);

    $("#enable_input_helper").on("input", onEnableInputChange);
    $("#enable_asterisk_btn").on("input", onButtonVisibilityChange("asterisk"));
    $("#enable_quotes_btn").on("input", onButtonVisibilityChange("quotes"));
    $("#enable_parentheses_btn").on("input", onButtonVisibilityChange("parentheses"));
    $("#enable_book_quotes1_btn").on("input", onButtonVisibilityChange("bookQuotes1"));
    $("#enable_book_quotes2_btn").on("input", onButtonVisibilityChange("bookQuotes2"));
    $("#enable_book_quotes3_btn").on("input", onButtonVisibilityChange("bookQuotes3"));
    $("#enable_newline_btn").on("input", onButtonVisibilityChange("newline"));
    $("#enable_user_btn").on("input", onButtonVisibilityChange("user"));
    $("#enable_char_btn").on("input", onButtonVisibilityChange("char"));

    await loadSettings();
    setupShortcutInputs();
    initSortable();
    $(document).on("keydown", handleGlobalShortcuts);

    if (!extension_settings[extensionName].enabled) {
        $("#input_helper_toolbar").hide();
    }

    $("#integrated_button_settings").after(`
        <div class="example-extension_block">
            <button id="add_custom_symbol_btn" class="menu_button">添加自定义符号</button>
        </div>
    `);

    $("#add_custom_symbol_btn").on("click", function() {
        showCustomSymbolDialog();
    });

    $(document).on("keydown", function(e) {
        if ($("#custom_symbol_dialog").length && e.key  === "Escape") {
            $("#custom_symbol_dialog").remove();
        }

        if ($("#custom_symbol_dialog").length && e.key  === "Enter" && !e.ctrlKey  && !e.shiftKey  && !e.altKey)  {
            if ($(document.activeElement).is("input")  && !$(document.activeElement).is("textarea"))  {
                $("#custom_symbol_save").click();
            }
        }
    });

    console.log(" 输入助手插件已加载");
});