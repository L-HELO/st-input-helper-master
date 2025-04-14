// The main script for the extension
// The following are examples of some basic extension functionality

//You'll likely need to import extension_settings, getContext, and loadExtensionSettings from extensions.js
import { extension_settings, getContext, loadExtensionSettings } from "../../../extensions.js";

//You'll likely need to import some other functions from the main script
import { saveSettingsDebounced } from "../../../../script.js";

// 设置插件名称和路径
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
        bookQuotes3: true, // 新增《》按钮设置
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
    // 添加默认的按钮顺序
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
    // 添加自定义符号设置
    customSymbols: []
};

// 快捷键映射表
const shortcutFunctionMap = {
    'asterisk': insertAsterisk,
    'quotes': insertQuotes,
    'parentheses': insertParentheses,
    'bookQuotes1': insertBookQuotes1,
    'bookQuotes2': insertBookQuotes2,
    'bookQuotes3': insertBookQuotes3,
    'newline': insertNewLine, // This is for the BUTTON/SHORTCUT, not typed input
    'user': insertUserTag,
    'char': insertCharTag
    // Custom symbols will be added dynamically
};

// 加载插件设置
async function loadSettings() {
    extension_settings[extensionName] = extension_settings[extensionName] || {};
    if (Object.keys(extension_settings[extensionName]).length === 0) {
        Object.assign(extension_settings[extensionName], defaultSettings);
    }

    // 兼容旧版本设置
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

    // 更新UI中的设置
    $("#enable_input_helper").prop("checked", extension_settings[extensionName].enabled);

    // 更新按钮显示设置
    const buttons = extension_settings[extensionName].buttons;
    $("#enable_asterisk_btn").prop("checked", buttons.asterisk !== false);
    $("#enable_quotes_btn").prop("checked", buttons.quotes !== false);
    $("#enable_parentheses_btn").prop("checked", buttons.parentheses !== false);
    $("#enable_book_quotes1_btn").prop("checked", buttons.bookQuotes1 !== false);
    $("#enable_book_quotes2_btn").prop("checked", buttons.bookQuotes2 !== false);
    $("#enable_book_quotes3_btn").prop("checked", buttons.bookQuotes3 !== false);
    $("#enable_newline_btn").prop("checked", buttons.newline !== false);
    $("#enable_user_btn").prop("checked", buttons.user !== false);
    $("#enable_char_btn").prop("checked", buttons.char !== false);

    // 更新快捷键设置
    const shortcuts = extension_settings[extensionName].shortcuts;
    for (const key in shortcuts) {
        if ($(`#shortcut_${key}`).length) { // Check if element exists before setting val
            $(`#shortcut_${key}`).val(shortcuts[key] || "");
        }
    }

    // 更新按钮顺序
    updateButtonsOrder();

    updateButtonVisibility();

    // 加载自定义符号按钮
    loadCustomSymbolButtons(); // Call this to ensure custom buttons/settings are loaded
}

// 更新设置面板中的按钮顺序
function updateButtonsOrder() {
    const buttonOrder = extension_settings[extensionName].buttonOrder;
    if (!buttonOrder || buttonOrder.length === 0) return;

    const container = $("#integrated_button_settings");
    if (!container.length) return; // Ensure container exists

    buttonOrder.forEach(key => {
        const buttonRow = $(`.integrated-button-row[data-button-key="${key}"]`);
        if (buttonRow.length) {
            container.append(buttonRow);
        }
    });
}

// 初始化按钮排序
function initSortable() {
    const container = $("#integrated_button_settings");
    if (!container.length) return; // Check if container exists

    try {
        if (container.sortable) {
            container.sortable({
                handle: ".drag-handle",
                axis: "y",
                delay: 150,
                stop: function() {
                    const newOrder = [];
                    $("#integrated_button_settings .integrated-button-row").each(function() {
                        const buttonKey = $(this).attr("data-button-key");
                        if (buttonKey) { // Ensure buttonKey is not undefined
                            newOrder.push(buttonKey);
                        }
                    });

                    extension_settings[extensionName].buttonOrder = newOrder;
                    saveSettingsDebounced();
                    updateToolbarButtonOrder();
                }
            });
        } else {
            console.warn("Input Helper: jQuery UI Sortable not available.");
        }
    } catch (error) {
        console.error("Input Helper: Failed to initialize sortable.", error);
    }
}

// 更新工具栏按钮顺序
function updateToolbarButtonOrder() {
    const buttonOrder = extension_settings[extensionName].buttonOrder || [];
    if (buttonOrder.length === 0) return;

    const toolbar = $("#input_helper_toolbar");
    if (toolbar.length === 0) return;

    buttonOrder.forEach(key => {
        const buttonId = getButtonIdFromKey(key);
        if (!buttonId) return;

        const button = $(`#${buttonId}`);
        // Check if button exists and should be visible according to settings
        if (button.length && extension_settings[extensionName].buttons[key] !== false) {
            toolbar.append(button);
        }
    });
}


// 从按钮键名获取按钮ID
function getButtonIdFromKey(key) {
    if (typeof key !== 'string') return ''; // Add type check

    if (key.startsWith('custom_')) {
        const index = key.replace('custom_', '');
        return `input_custom_${index}_btn`;
    }

    const keyToId = {
        'asterisk': 'input_asterisk_btn',
        'quotes': 'input_quotes_btn',
        'parentheses': 'input_parentheses_btn',
        'bookQuotes1': 'input_book_quotes1_btn',
        'bookQuotes2': 'input_book_quotes2_btn',
        'bookQuotes3': 'input_book_quotes3_btn',
        'newline': 'input_newline_btn', // This is the button ID
        'user': 'input_user_btn',
        'char': 'input_char_btn'
    };

    return keyToId[key] || '';
}

// 更新按钮可见性
function updateButtonVisibility() {
    const buttons = extension_settings[extensionName].buttons;
    if (!buttons) return; // Ensure buttons exist

    // Helper function to toggle button visibility
    const toggleBtn = (id, isVisible) => $(id).toggle(isVisible);

    toggleBtn("#input_asterisk_btn", buttons.asterisk !== false);
    toggleBtn("#input_quotes_btn", buttons.quotes !== false);
    toggleBtn("#input_parentheses_btn", buttons.parentheses !== false);
    toggleBtn("#input_book_quotes1_btn", buttons.bookQuotes1 !== false);
    toggleBtn("#input_book_quotes2_btn", buttons.bookQuotes2 !== false);
    toggleBtn("#input_book_quotes3_btn", buttons.bookQuotes3 !== false);
    toggleBtn("#input_newline_btn", buttons.newline !== false); // Button visibility
    toggleBtn("#input_user_btn", buttons.user !== false);
    toggleBtn("#input_char_btn", buttons.char !== false);

    const customSymbols = extension_settings[extensionName].customSymbols || [];
    customSymbols.forEach((symbol, index) => {
        const buttonKey = `custom_${index}`;
        toggleBtn(`#input_custom_${index}_btn`, buttons[buttonKey] !== false);
    });

    // Check if any button is visible
    const anyVisible = Object.keys(buttons).some(key => buttons[key] !== false);

    if (!anyVisible) {
        $("#input_helper_toolbar").hide();
    } else if (extension_settings[extensionName].enabled) {
        $("#input_helper_toolbar").show();
        updateToolbarButtonOrder(); // Update order when visibility changes
    }
}


// 开关设置变更响应
function onEnableInputChange() {
    const value = $("#enable_input_helper").prop("checked");
    extension_settings[extensionName].enabled = value;
    saveSettingsDebounced();

    if (value) {
        updateButtonVisibility(); // This will show the toolbar if any buttons are enabled
    } else {
        $("#input_helper_toolbar").hide();
    }
}

// 按钮显示设置变更响应
function onButtonVisibilityChange(buttonKey) {
    return function() {
        const checked = $(this).prop("checked");
        extension_settings[extensionName].buttons[buttonKey] = checked;
        saveSettingsDebounced();
        updateButtonVisibility(); // Update overall visibility and order
    };
}

// 获取输入框元素
function getMessageInput() {
    // Prioritize the visible textarea if possible, otherwise return the first match
    const sendTextarea = $("#send_textarea");
    const promptTextarea = $("#prompt_textarea");

    if (sendTextarea.is(':visible') && sendTextarea.length) {
        return sendTextarea;
    } else if (promptTextarea.is(':visible') && promptTextarea.length) {
        return promptTextarea;
    } else {
        // Fallback if visibility check fails or neither is visible
        return $("#send_textarea, #prompt_textarea").first();
    }
}


// Helper function to insert text and set cursor position
function insertTextAndSetCursor(textarea, textToInsert, cursorOffset) {
    const el = textarea[0]; // Get the DOM element
    if (!el) return;

    const startPos = el.selectionStart;
    const endPos = el.selectionEnd;
    const text = el.value;

    const beforeText = text.substring(0, startPos);
    const afterText = text.substring(endPos);

    const newText = beforeText + textToInsert + afterText;
    textarea.val(newText);

    // Use setTimeout to ensure cursor is set after potential DOM updates
    setTimeout(() => {
        const newCursorPos = startPos + cursorOffset;
        el.selectionStart = newCursorPos;
        el.selectionEnd = newCursorPos;
        textarea.focus(); // Refocus might be needed
    }, 0);

    // Trigger input event manually so other listeners (like auto-resize) can react
    textarea.trigger('input');
}

// 插入引号功能
function insertQuotes() {
    if (!extension_settings[extensionName].enabled) return;
    insertTextAndSetCursor(getMessageInput(), '""', 1);
}

// 插入换行功能 (Button Action) - Inserts newline at end of current line
function insertNewLine() {
    if (!extension_settings[extensionName].enabled) return;

    const textarea = getMessageInput();
    const el = textarea[0];
    if (!el) return;

    const text = el.value;
    const cursorPos = el.selectionStart;

    // Find the end of the current line from the cursor position
    let lineEnd = text.indexOf("\n", cursorPos);
    if (lineEnd === -1) {
        lineEnd = text.length; // If no newline found after cursor, end is text length
    }

    // Insert newline at lineEnd
    const newText = text.substring(0, lineEnd) + "\n" + text.substring(lineEnd);
    textarea.val(newText);

    // Set cursor position after the inserted newline
    setTimeout(() => {
        const newCursorPos = lineEnd + 1;
        el.selectionStart = newCursorPos;
        el.selectionEnd = newCursorPos;
        textarea.focus();
    }, 0);
    // Trigger input event manually
    textarea.trigger('input');
}


// 插入星号功能
function insertAsterisk() {
    if (!extension_settings[extensionName].enabled) return;
    insertTextAndSetCursor(getMessageInput(), '**', 1);
}

// 插入用户标记功能
function insertUserTag() {
    if (!extension_settings[extensionName].enabled) return;
    insertTextAndSetCursor(getMessageInput(), '{{User}}', 8);
}

// 插入角色标记功能
function insertCharTag() {
    if (!extension_settings[extensionName].enabled) return;
    insertTextAndSetCursor(getMessageInput(), '{{Char}}', 8);
}

// 插入圆括号功能
function insertParentheses() {
    if (!extension_settings[extensionName].enabled) return;
    insertTextAndSetCursor(getMessageInput(), '()', 1);
}

// 插入书名号「」功能
function insertBookQuotes1() {
    if (!extension_settings[extensionName].enabled) return;
    insertTextAndSetCursor(getMessageInput(), '「」', 1);
}

// 插入书名号『』功能
function insertBookQuotes2() {
    if (!extension_settings[extensionName].enabled) return;
    insertTextAndSetCursor(getMessageInput(), '『』', 1);
}

// 插入书名号《》功能
function insertBookQuotes3() {
    if (!extension_settings[extensionName].enabled) return;
    insertTextAndSetCursor(getMessageInput(), '《》', 1);
}

// 处理快捷键设置
function setupShortcutInputs() {
    // Handle removing previous listeners to avoid duplicates if called multiple times
    $(document).off("keydown", ".shortcut-input");
    $(document).off("click", ".shortcut-clear-btn");

    $(document).on("keydown", ".shortcut-input", function(e) {
        e.preventDefault();
        e.stopPropagation(); // Prevent triggering global shortcuts

        let keys = [];
        if (e.ctrlKey) keys.push("Ctrl");
        if (e.altKey) keys.push("Alt");
        if (e.shiftKey) keys.push("Shift");

        const validKey = e.key && typeof e.key === 'string' &&
            e.key !== "Control" && e.key !== "Alt" &&
            e.key !== "Shift" && e.key !== "Meta" && e.key !== "Escape";

        if (validKey) {
            const keyName = e.key.length === 1 ? e.key.toUpperCase() : e.key;
            keys.push(keyName);
        }

        if (e.key === "Escape") {
            $(this).val("");
            const shortcutKey = $(this).attr("id").replace("shortcut_", "");
            if (extension_settings[extensionName].shortcuts.hasOwnProperty(shortcutKey)) {
                extension_settings[extensionName].shortcuts[shortcutKey] = "";
                saveSettingsDebounced();
            }
            return;
        }

        // Require at least one modifier and one main key, or just a non-modifier key if it's not a single character (like F1, Enter)
        if (keys.length > 1 || (keys.length === 1 && !["Ctrl", "Alt", "Shift"].includes(keys[0]))) {
            const shortcutString = keys.join("+");
            $(this).val(shortcutString);

            const shortcutKey = $(this).attr("id").replace("shortcut_", "");
            // Ensure the key exists in settings before assigning
            if (extension_settings[extensionName].shortcuts.hasOwnProperty(shortcutKey)) {
                extension_settings[extensionName].shortcuts[shortcutKey] = shortcutString;
                saveSettingsDebounced();
            } else {
                console.warn(`Input Helper: Shortcut key "${shortcutKey}" not found in settings.`);
            }
        }
    });

    $(document).on("click", ".shortcut-clear-btn", function() {
        const targetId = $(this).data("target");
        $(`#${targetId}`).val("");

        const shortcutKey = targetId.replace("shortcut_", "");
        if (extension_settings[extensionName].shortcuts.hasOwnProperty(shortcutKey)) {
            extension_settings[extensionName].shortcuts[shortcutKey] = "";
            saveSettingsDebounced();
        }
    });
}


// 全局快捷键处理函数
function handleGlobalShortcuts(e) {
    const isEditingShortcut = $(document.activeElement).hasClass("shortcut-input");
    const isTextAreaFocused = $(document.activeElement).is("#send_textarea, #prompt_textarea");

    // Only handle if plugin enabled, not editing a shortcut, and textarea is focused
    if (!extension_settings[extensionName].enabled || isEditingShortcut || !isTextAreaFocused) {
        return;
    }

    let keys = [];
    if (e.ctrlKey) keys.push("Ctrl");
    if (e.altKey) keys.push("Alt");
    if (e.shiftKey) keys.push("Shift");

    const validKey = e.key && typeof e.key === 'string' &&
        e.key !== "Control" && e.key !== "Alt" &&
        e.key !== "Shift" && e.key !== "Meta";

    if (validKey) {
        const keyName = e.key.length === 1 ? e.key.toUpperCase() : e.key;
        keys.push(keyName);
    }

    // Need at least one modifier + key, or a non-single-char key like F1, etc.
    if (keys.length < 1 || (keys.length === 1 && ["Ctrl", "Alt", "Shift"].includes(keys[0]))) {
        // Allow single non-modifier keys if they are not typical typing keys (e.g., function keys)
        if (!(keys.length === 1 && keys[0].length > 1 && !["Ctrl", "Alt", "Shift"].includes(keys[0]))) {
            return;
        }
    }


    const shortcutString = keys.join("+");
    const shortcuts = extension_settings[extensionName].shortcuts;

    for (const key in shortcuts) {
        if (shortcuts[key] === shortcutString) {
            e.preventDefault(); // Prevent default browser/app action for the shortcut

            // Find the function or action associated with this shortcut key
            const action = shortcutFunctionMap[key];
            if (typeof action === 'function') {
                action();
                return; // Shortcut handled
            } else {
                // Handle custom symbols dynamically mapped earlier
                if (key.startsWith('custom_')) {
                    const index = parseInt(key.replace('custom_', ''));
                    const customSymbols = extension_settings[extensionName].customSymbols || [];
                    if (index >= 0 && index < customSymbols.length) {
                        insertCustomSymbol(customSymbols[index]);
                        return; // Shortcut handled
                    }
                }
            }
        }
    }
}


// 加载自定义符号按钮
function loadCustomSymbolButtons() {
    const customSymbols = extension_settings[extensionName].customSymbols || [];

    // Clear existing custom elements first to prevent duplication
    $(".custom-symbol-button").remove();
    $(".integrated-button-row[data-custom='true']").remove();

    // Clear dynamic entries from shortcut map to prevent stale entries if symbols are deleted/reordered
    Object.keys(shortcutFunctionMap).forEach(key => {
        if (key.startsWith('custom_')) {
            delete shortcutFunctionMap[key];
        }
    });

    customSymbols.forEach((symbol, index) => {
        const buttonKey = `custom_${index}`;

        // Create toolbar button
        createCustomSymbolButton(symbol, index);

        // Create settings panel row
        createCustomSymbolSetting(symbol, index);

        // Ensure settings exist for this button (order, visibility, shortcut)
        if (!extension_settings[extensionName].buttonOrder.includes(buttonKey)) {
            extension_settings[extensionName].buttonOrder.push(buttonKey);
        }
        if (extension_settings[extensionName].buttons[buttonKey] === undefined) {
            extension_settings[extensionName].buttons[buttonKey] = true; // Default to visible
        }
        if (extension_settings[extensionName].shortcuts[buttonKey] === undefined) {
            extension_settings[extensionName].shortcuts[buttonKey] = ""; // Default to no shortcut
        }

        // Dynamically add to shortcut map
        shortcutFunctionMap[buttonKey] = () => insertCustomSymbol(customSymbols[index]);
    });

    // Update UI elements after loading/reloading symbols
    updateButtonsOrder(); // Update settings panel order
    updateToolbarButtonOrder(); // Update toolbar order
    updateButtonVisibility(); // Ensure correct visibility based on settings
    setupShortcutInputs(); // Re-initialize shortcut input fields bindings
}

// 创建自定义符号按钮
function createCustomSymbolButton(symbol, index) {
    const buttonId = `input_custom_${index}_btn`;
    const buttonKey = `custom_${index}`;

    // Create button element
    const button = $(`<button id="${buttonId}" class="input-helper-btn custom-symbol-button" title="${symbol.name || ''}" data-norefocus="true" data-index="${index}">${symbol.display || symbol.symbol}</button>`);

    // Append to toolbar (order will be corrected by updateToolbarButtonOrder)
    $("#input_helper_toolbar").append(button);

    // Add click/touch event
    bindCustomSymbolEvent(button, symbol);
}

// 为自定义符号按钮绑定事件
function bindCustomSymbolEvent(button, symbol) {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    // Use appropriate event based on device
    const eventType = isMobile ? "touchstart" : "click";

    button.off(eventType).on(eventType, function(e) {
        if (isMobile) {
            e.preventDefault(); // Prevent potential double actions or focus issues on mobile
        }
        insertCustomSymbol(symbol);

        // Ensure focus stays on textarea after interaction, especially on mobile
        if (isMobile) {
            setTimeout(() => {
                getMessageInput().focus();
            }, 10); // Small delay might be needed
        }
        return !isMobile; // Prevent default click behavior on mobile, allow on desktop
    });
}

// 创建自定义符号设置项
function createCustomSymbolSetting(symbol, index) {
    const buttonKey = `custom_${index}`;

    // Create the HTML row for the settings panel
    const row = $(`
        <div class="integrated-button-row" data-button-key="${buttonKey}" data-custom="true" data-index="${index}">
            <span class="drag-handle menu-handle">☰</span>
            <input id="enable_${buttonKey}_btn" type="checkbox" ${extension_settings[extensionName].buttons[buttonKey] !== false ? 'checked' : ''} />
            <div class="button-preview">${symbol.display || symbol.symbol}</div>
            <label for="enable_${buttonKey}_btn">${symbol.name || 'Unnamed Symbol'}</label>
            <div class="button-actions"> <!-- Container for buttons -->
                <button class="custom-edit-btn inline-button" title="编辑" data-index="${index}">✏️</button>
                <button class="custom-delete-btn inline-button" title="删除" data-index="${index}">🗑️</button>
            </div>
            <input id="shortcut_${buttonKey}" class="shortcut-input" type="text" value="${extension_settings[extensionName].shortcuts[buttonKey] || ''}" placeholder="无快捷键" readonly />
            <button class="shortcut-clear-btn inline-button" data-target="shortcut_${buttonKey}" title="清除快捷键">×</button>
        </div>
    `);

    // Append to the settings container (order will be corrected by updateButtonsOrder)
    $("#integrated_button_settings").append(row);

    // Bind events for controls within the row
    row.find(`#enable_${buttonKey}_btn`).on("input", onButtonVisibilityChange(buttonKey));
    row.find(".custom-edit-btn").on("click", function() {
        editCustomSymbol($(this).data("index"));
    });
    row.find(".custom-delete-btn").on("click", function() {
        deleteCustomSymbol($(this).data("index"));
    });
    // Shortcut input bindings are handled by setupShortcutInputs() called after loadCustomSymbolButtons
}

// 插入自定义符号
function insertCustomSymbol(symbol) {
    if (!extension_settings[extensionName].enabled || !symbol) return;

    const textarea = getMessageInput();
    const el = textarea[0];
    if (!el) return;

    // Process \n in the symbol string to actual newlines
    const processedSymbol = symbol.symbol.replace(/\\n/g, '\n');
    const insertedLength = processedSymbol.length;

    let cursorOffset;
    if (symbol.cursorPos === "start") {
        cursorOffset = 0;
    } else if (symbol.cursorPos === "end") {
        cursorOffset = insertedLength;
    } else if (symbol.cursorPos === "middle") {
        cursorOffset = Math.floor(insertedLength / 2);
    } else {
        // Custom position (treat as number)
        cursorOffset = parseInt(symbol.cursorPos);
        if (isNaN(cursorOffset) || cursorOffset < 0 || cursorOffset > insertedLength) {
            cursorOffset = Math.floor(insertedLength / 2); // Default to middle if invalid
        }
    }

    insertTextAndSetCursor(textarea, processedSymbol, cursorOffset);
}

// 编辑自定义符号
function editCustomSymbol(index) {
    const symbols = extension_settings[extensionName].customSymbols;
    if (index >= 0 && index < symbols.length) {
        showCustomSymbolDialog(symbols[index], index);
    } else {
        console.error("Input Helper: Invalid index for editing custom symbol:", index);
    }
}

// 删除自定义符号
function deleteCustomSymbol(index) {
    const symbols = extension_settings[extensionName].customSymbols;
    if (index < 0 || index >= symbols.length) {
        console.error("Input Helper: Invalid index for deleting custom symbol:", index);
        return;
    }

    if (confirm(`确定要删除符号 "${symbols[index].name || 'Unnamed Symbol'}" 吗？`)) {
        const buttonKey = `custom_${index}`;

        // Remove from settings arrays/objects
        symbols.splice(index, 1);

        const orderIndex = extension_settings[extensionName].buttonOrder.indexOf(buttonKey);
        if (orderIndex > -1) {
            extension_settings[extensionName].buttonOrder.splice(orderIndex, 1);
        }

        delete extension_settings[extensionName].buttons[buttonKey];
        delete extension_settings[extensionName].shortcuts[buttonKey];
        // Note: shortcutFunctionMap is rebuilt in loadCustomSymbolButtons

        // Save settings immediately
        saveSettingsDebounced();

        // Reload all custom buttons to re-index everything correctly
        loadCustomSymbolButtons();

        // No need to call updateButtonVisibility separately, loadCustomSymbolButtons handles UI updates
        // No need to rebind mobile listeners separately, bindCustomSymbolEvent handles it during creation

        console.log(`Input Helper: Deleted custom symbol at index ${index}.`);
    }
}

// 重新绑定移动设备事件监听器 - Simplified: binding now happens during button creation
// function rebindMobileEventListeners() { ... } // No longer strictly needed if bindCustomSymbolEvent is robust


// 显示自定义符号对话框
function showCustomSymbolDialog(existingSymbol = null, editIndex = -1) {
    // Remove existing dialog if any
    $("#custom_symbol_dialog").remove();

    const dialogHtml = `
        <div id="custom_symbol_dialog" class="custom-symbol-dialog SillyTavernDialog"> <!-- Add ST dialog class -->
            <div class="custom-symbol-dialog-content">
                <h3>${existingSymbol ? '编辑符号' : '添加自定义符号'}</h3>
                <div class="custom-symbol-form">
                    <div class="form-group inline-label"> <!-- Use inline-label for better alignment -->
                        <label for="custom_symbol_name">名称:</label>
                        <input type="text" id="custom_symbol_name" value="${existingSymbol?.name || ''}" placeholder="如：方括号">
                    </div>
                    <div class="form-group inline-label">
                        <label for="custom_symbol_symbol">符号:</label>
                        <input type="text" id="custom_symbol_symbol" value="${existingSymbol?.symbol || ''}" placeholder="如：[] (用 \\n 表示换行)">
                    </div>
                     <div class="form-group inline-label">
                        <label for="custom_symbol_display">显示:</label>
                        <input type="text" id="custom_symbol_display" value="${existingSymbol?.display || ''}" placeholder="按钮上显示的文本 (可选)">
                    </div>
                    <div class="form-group inline-label">
                        <label for="custom_symbol_cursor">光标:</label>
                        <select id="custom_symbol_cursor">
                            <option value="start" ${existingSymbol?.cursorPos === 'start' ? 'selected' : ''}>开始</option>
                            <option value="middle" ${!existingSymbol || existingSymbol.cursorPos === 'middle' ? 'selected' : ''}>中间</option>
                            <option value="end" ${existingSymbol?.cursorPos === 'end' ? 'selected' : ''}>结尾</option>
                            <option value="custom" ${existingSymbol && !['start', 'middle', 'end'].includes(existingSymbol.cursorPos) ? 'selected' : ''}>位置</option>
                        </select>
                        <input type="number" id="custom_symbol_cursor_pos" value="${existingSymbol && !['start', 'middle', 'end'].includes(existingSymbol.cursorPos) ? existingSymbol.cursorPos : '1'}" min="0" style="display: ${existingSymbol && !['start', 'middle', 'end'].includes(existingSymbol.cursorPos) ? 'inline-block' : 'none'}; width: 60px;">
                    </div>
                </div>
                <hr>
                <div class="custom-symbol-buttons">
                    <button id="custom_symbol_cancel" class="menu_button">取消</button>
                    <button id="custom_symbol_save" class="menu_button primary_button">保存</button> <!-- Use ST button classes -->
                </div>
            </div>
        </div>
    `;
    const dialog = $(dialogHtml);
    $("body").append(dialog);

    // Event handlers for the dialog
    $("#custom_symbol_cursor").on("change", function() {
        $("#custom_symbol_cursor_pos").toggle($(this).val() === "custom");
    }).trigger('change'); // Trigger change on load to set initial state

    $("#custom_symbol_cancel").on("click", () => dialog.remove());

    $("#custom_symbol_save").on("click", function() {
        const name = $("#custom_symbol_name").val().trim();
        const symbol = $("#custom_symbol_symbol").val(); // Don't trim symbol, spaces might be intentional
        const display = $("#custom_symbol_display").val().trim() || symbol.replace(/\\n/g, ''); // Use symbol as fallback display, remove newlines for display
        let cursorPosOption = $("#custom_symbol_cursor").val();
        let cursorPos = cursorPosOption === "custom" ? $("#custom_symbol_cursor_pos").val() : cursorPosOption;


        if (!name || !symbol) {
            alert("名称和符号不能为空！");
            return;
        }

        const symbolObj = { name, symbol, display, cursorPos };

        if (editIndex >= 0) {
            extension_settings[extensionName].customSymbols[editIndex] = symbolObj;
            console.log("Input Helper: Updated custom symbol:", symbolObj);
        } else {
            extension_settings[extensionName].customSymbols.push(symbolObj);
            console.log("Input Helper: Added custom symbol:", symbolObj);
        }

        saveSettingsDebounced();
        loadCustomSymbolButtons(); // Reload UI
        dialog.remove();
    });

    // Focus the first input field
    $("#custom_symbol_name").focus();
}


// ==========================================================================
// Initialize Plugin
// ==========================================================================
jQuery(async () => {
    try {
        // Load settings HTML
        const settingsHtml = await $.get(`${extensionFolderPath}/settings.html`);
        $("#extensions_settings2").append(settingsHtml);

        // Load toolbar HTML
        const toolbarHtml = await $.get(`${extensionFolderPath}/toolbar.html`);
        // Insert toolbar - improved logic for placement
        if ($("#quickreply_section").length) { // Target quick reply section if available
            $("#quickreply_section").prepend(toolbarHtml); // Place before QR input
            // Adjust styles if needed, e.g., margins on the toolbar or QR section
            $("#input_helper_toolbar").css({ 'margin-bottom': '5px' });
        } else if ($("#send_form").length) { // Fallback to send form
            $("#send_form").prepend(toolbarHtml); // Place before the main send button/textarea container
            $("#input_helper_toolbar").css({ 'margin-bottom': '5px' });
        } else {
            console.warn("Input Helper: Could not find suitable location to insert toolbar.");
            // Optionally append somewhere less ideal as a last resort
            // $("#chat_input_form_area").append(toolbarHtml);
        }

// --- START: /n Replacement Logic ---
        const $textarea = getMessageInput(); // Get the primary textarea
        if ($textarea.length) {
            $textarea.on('input', function(event) {
                // Do nothing if the plugin is disabled
                if (!extension_settings[extensionName]?.enabled) return;

                const textareaElement = this;
                let currentValue = textareaElement.value; // Use value property directly
                let cursorPosition = textareaElement.selectionStart;
                let valueChanged = false; // Flag to track if replacement happened

                // Regex to find '/n' that isn't escaped ('\\/n')
                const regex = /(?<!\\)\/n/g;

                if (regex.test(currentValue)) {
                    let valueBeforeCursor = currentValue.substring(0, cursorPosition);
                    let replacementsBeforeCursor = (valueBeforeCursor.match(regex) || []).length;

                    // Replace all non-escaped '/n' with '\n'
                    let newValue = currentValue.replace(regex, '\n');
                    // Optional: Handle escaped '\\/n' -> '/n'
                    // newValue = newValue.replace(/\\\\\/n/g, '/n');

                    if (newValue !== currentValue) {
                        valueChanged = true;
                        // Calculate the base new cursor position based *only* on the replacement
                        // Cursor was originally *after* /n (length 2)
                        // It should now be *after* \n (length 1)
                        // The difference is 1 position backward for each replacement before the cursor
                        let newCursorPosition = cursorPosition - replacementsBeforeCursor;

                        // Update value first
                        textareaElement.value = newValue;

                        // Now, set the cursor position, potentially adjusting for the \n} case
                        // Use timeout to ensure cursor set after value update and potential browser redraws
                        setTimeout(() => {
                            let finalCursorPos = newCursorPosition;
                            const currentValAfterTimeout = textareaElement.value; // Get value again in case something else changed

                            // *** FIX: Check for the specific \n} sequence at the calculated cursor position ***
                            // This happens if the user types '}' immediately after '/n' was replaced.
                            // Check if the character *before* the calculated position is \n
                            // and the character *at* the calculated position is }
                            if (finalCursorPos > 0 &&
                                currentValAfterTimeout[finalCursorPos - 1] === '\n' &&
                                currentValAfterTimeout[finalCursorPos] === '}')
                            {
                                // Nudge the cursor one step forward to be after the '}'
                                finalCursorPos++;
                            }

                            // Set the final cursor position
                            textareaElement.selectionStart = finalCursorPos;
                            textareaElement.selectionEnd = finalCursorPos;

                        }, 0);

                        // Trigger input event manually ONLY if value actually changed by replacement
                        // Helps ensure compatibility with features like auto-resize
                        $(textareaElement).trigger('input');
                    }
                }

                // --- Optional: Add a check specifically for the case where '}' was just typed after a '\n' ---
                // This is an alternative/additional check that might catch edge cases,
                // but the primary fix above within the timeout should handle the described scenario.
                /*
                if (!valueChanged && currentValue.length > 0 && cursorPosition > 0) {
                    // Check if the last typed character (inferred) might be '}'
                    // This is heuristic and less reliable than the timeout check
                    const charBeforeCursor = currentValue[cursorPosition - 1];
                    const charFurtherBefore = currentValue[cursorPosition - 2];

                    if (charBeforeCursor === '}' && charFurtherBefore === '\n') {
                       // Potentially nudge cursor, but be careful not to interfere with normal '}' typing
                       // console.log("Detected potential \n} sequence typed");
                       // It's generally better to let the timeout logic handle the correction
                    }
                }
                */
            });
            console.log("Input Helper: Real-time /n replacement listener attached (with \\n} fix).");
        } else {
            console.warn("Input Helper: Could not find target textarea for /n replacement.");
        }
        // --- END: /n Replacement Logic ---

        // Bind standard button clicks (Desktop)
        // Mobile uses touchstart bound dynamically during button creation/rebinding
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (!isMobile) {
            $("#input_helper_toolbar").on("click", ".input-helper-btn", function() {
                const btnId = $(this).attr("id");
                switch (btnId) {
                    case 'input_asterisk_btn': insertAsterisk(); break;
                    case 'input_quotes_btn': insertQuotes(); break;
                    case 'input_parentheses_btn': insertParentheses(); break;
                    case 'input_book_quotes1_btn': insertBookQuotes1(); break;
                    case 'input_book_quotes2_btn': insertBookQuotes2(); break;
                    case 'input_book_quotes3_btn': insertBookQuotes3(); break;
                    case 'input_newline_btn': insertNewLine(); break; // Button action
                    case 'input_user_btn': insertUserTag(); break;
                    case 'input_char_btn': insertCharTag(); break;
                    // Custom buttons clicks are handled by bindCustomSymbolEvent
                }
            });
        }
        // Note: bindCustomSymbolEvent handles both mobile and desktop clicks for custom buttons.


        // Load settings and initialize UI elements
        await loadSettings(); // Load settings first

        // Setup settings panel interactions
        $("#enable_input_helper").on("input", onEnableInputChange);
        // Bind visibility checkboxes (binding done within createCustomSymbolSetting for custom ones)
        $("#enable_asterisk_btn").on("input", onButtonVisibilityChange("asterisk"));
        $("#enable_quotes_btn").on("input", onButtonVisibilityChange("quotes"));
        $("#enable_parentheses_btn").on("input", onButtonVisibilityChange("parentheses"));
        $("#enable_book_quotes1_btn").on("input", onButtonVisibilityChange("bookQuotes1"));
        $("#enable_book_quotes2_btn").on("input", onButtonVisibilityChange("bookQuotes2"));
        $("#enable_book_quotes3_btn").on("input", onButtonVisibilityChange("bookQuotes3"));
        $("#enable_newline_btn").on("input", onButtonVisibilityChange("newline"));
        $("#enable_user_btn").on("input", onButtonVisibilityChange("user"));
        $("#enable_char_btn").on("input", onButtonVisibilityChange("char"));

        // Setup add custom symbol button
        $("#st_input_helper_settings").append(`
            <div class="inline-drawer">
                <div class="inline-drawer-toggle settings_block">
                    <span>自定义符号管理</span>
                </div>
                <div class="inline-drawer-content">
                     <div class="example-extension_block">
                         <button id="add_custom_symbol_btn" class="menu_button">添加自定义符号</button>
                     </div>
                 </div>
            </div>
        `);
        $("#add_custom_symbol_btn").on("click", () => showCustomSymbolDialog());

        // Initialize sortable and shortcuts AFTER settings are loaded and elements exist
        initSortable();
        setupShortcutInputs(); // Ensure shortcut inputs are ready

        // Register global shortcut listener
        $(document).on("keydown", handleGlobalShortcuts);

        // Handle dialog keydowns (Enter/Escape)
        $(document).on("keydown", function(e) {
            if ($("#custom_symbol_dialog").length) {
                if (e.key === "Escape") {
                    $("#custom_symbol_dialog").remove();
                } else if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey && !e.altKey) {
                    // Trigger save only if focus isn't on a multi-line input or button that handles Enter
                    if ($(document.activeElement).is('input[type="text"], input[type="number"], select')) {
                        e.preventDefault(); // Prevent form submission if it were a form
                        $("#custom_symbol_save").trigger("click");
                    }
                }
            }
        });


        // Final state check for toolbar visibility based on loaded settings
        if (!extension_settings[extensionName].enabled) {
            $("#input_helper_toolbar").hide();
        } else {
            updateButtonVisibility(); // Ensure correct buttons are shown/hidden initially
        }

        console.log(`Input Helper (${extensionName}) loaded successfully.`);

    } catch (error) {
        console.error(`Input Helper (${extensionName}) failed to load:`, error);
    }
});