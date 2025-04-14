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
    'newline': insertNewLine,
    'user': insertUserTag,
    'char': insertCharTag
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

    // 兼容旧版本设置 - 快捷键
    if (!extension_settings[extensionName].shortcuts) {
        extension_settings[extensionName].shortcuts = defaultSettings.shortcuts;
    }
    
    // 兼容旧版本设置 - 按钮顺序
    if (!extension_settings[extensionName].buttonOrder) {
        extension_settings[extensionName].buttonOrder = defaultSettings.buttonOrder;
    }

    // 兼容旧版本设置 - 自定义符号
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
    $("#enable_book_quotes3_btn").prop("checked", buttons.bookQuotes3 !== false); // 新增书名号按钮设置
    $("#enable_newline_btn").prop("checked", buttons.newline !== false);
    $("#enable_user_btn").prop("checked", buttons.user !== false);
    $("#enable_char_btn").prop("checked", buttons.char !== false);
    
    // 更新快捷键设置
    const shortcuts = extension_settings[extensionName].shortcuts;
    for (const key in shortcuts) {
        $(`#shortcut_${key}`).val(shortcuts[key] || "");
    }
    
    // 更新按钮顺序
    updateButtonsOrder();
    
    updateButtonVisibility();

    // 加载自定义符号按钮
    loadCustomSymbolButtons();
}

// 更新设置面板中的按钮顺序
function updateButtonsOrder() {
    const buttonOrder = extension_settings[extensionName].buttonOrder;
    if (!buttonOrder || buttonOrder.length === 0) return;
    
    // 根据保存的顺序重新排列设置面板中的按钮
    const container = $("#integrated_button_settings");
    
    buttonOrder.forEach(key => {
        const buttonRow = $(`.integrated-button-row[data-button-key="${key}"]`);
        if (buttonRow.length) {
            container.append(buttonRow);
        }
    });
}

// 初始化按钮排序
function initSortable() {
    try {
        if ($("#integrated_button_settings").sortable) {
            $("#integrated_button_settings").sortable({
                handle: ".drag-handle",
                axis: "y",
                delay: 150,
                stop: function() {
                    // 获取新的排序
                    const newOrder = [];
                    $("#integrated_button_settings .integrated-button-row").each(function() {
                        const buttonKey = $(this).attr("data-button-key");
                        newOrder.push(buttonKey);
                    });
                    
                    // 保存新排序到设置
                    extension_settings[extensionName].buttonOrder = newOrder;
                    saveSettingsDebounced();
                    
                    // 更新工具栏按钮顺序
                    updateToolbarButtonOrder();
                }
            });
        } else {
            console.warn("jQuery UI Sortable 不可用，无法启用拖拽排序功能");
        }
    } catch (error) {
        console.error("初始化按钮排序功能失败:", error);
    }
}

// 更新工具栏按钮顺序
function updateToolbarButtonOrder() {
    const buttonOrder = extension_settings[extensionName].buttonOrder || [];
    if (buttonOrder.length === 0) return;
    
    const toolbar = $("#input_helper_toolbar");
    if (toolbar.length === 0) return;
    
    // 按照保存的顺序重新排列工具栏按钮
    buttonOrder.forEach(key => {
        // 防止空按钮ID
        const buttonId = getButtonIdFromKey(key);
        if (!buttonId) return;
        
        const button = $(`#${buttonId}`);
        if (button.length && extension_settings[extensionName].buttons[key] !== false) {
            toolbar.append(button);
        }
    });
}

// 从按钮键名获取按钮ID
function getButtonIdFromKey(key) {
    // 检查是否是自定义按钮
    if (key.startsWith('custom_')) {
        // 直接返回自定义按钮的ID
        const index = key.replace('custom_', '');
        return `input_custom_${index}_btn`;
    }
    
    // 预定义按钮的映射
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

// 更新按钮可见性
function updateButtonVisibility() {
    const buttons = extension_settings[extensionName].buttons;
    
    // 根据设置显示/隐藏按钮
    $("#input_asterisk_btn").toggle(buttons.asterisk !== false);
    $("#input_quotes_btn").toggle(buttons.quotes !== false);
    $("#input_parentheses_btn").toggle(buttons.parentheses !== false);
    $("#input_book_quotes1_btn").toggle(buttons.bookQuotes1 !== false);
    $("#input_book_quotes2_btn").toggle(buttons.bookQuotes2 !== false);
    $("#input_book_quotes3_btn").toggle(buttons.bookQuotes3 !== false); // 新增书名号按钮
    $("#input_newline_btn").toggle(buttons.newline !== false);
    $("#input_user_btn").toggle(buttons.user !== false);
    $("#input_char_btn").toggle(buttons.char !== false);
    
    // 更新自定义按钮的显示/隐藏
    const customSymbols = extension_settings[extensionName].customSymbols || [];
    customSymbols.forEach((symbol, index) => {
        const buttonKey = `custom_${index}`;
        $(`#input_custom_${index}_btn`).toggle(buttons[buttonKey] !== false);
    });
    
    // 检查所有按钮是否都被隐藏，如果是则隐藏整个工具栏
    const allHidden = Object.values(buttons).every(v => v === false);
    if (allHidden) {
        $("#input_helper_toolbar").hide();
    } else if (extension_settings[extensionName].enabled) {
        $("#input_helper_toolbar").show();
        
        // 更新按钮顺序
        updateToolbarButtonOrder();
    }
}

// 开关设置变更响应
function onEnableInputChange() {
    const value = $("#enable_input_helper").prop("checked");
    extension_settings[extensionName].enabled = value;
    saveSettingsDebounced();
    
    // 根据复选框状态显示或隐藏工具栏
    if (value) {
        updateButtonVisibility();
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
        updateButtonVisibility();
    };
}

// 获取输入框元素
function getMessageInput() {
    return $("#send_textarea, #prompt_textarea").first();
}

// 插入引号功能
function insertQuotes() {
    if (!extension_settings[extensionName].enabled) return;
    
    const textarea = getMessageInput();
    const startPos = textarea.prop("selectionStart");
    const endPos = textarea.prop("selectionEnd");
    const text = textarea.val();
    
    const beforeText = text.substring(0, startPos);
    const selectedText = text.substring(startPos, endPos);
    const afterText = text.substring(endPos);
    
    // 插入双引号并将光标放在中间
    const newText = beforeText + "\"\"" + afterText;
    textarea.val(newText);
    
    // 设置光标位置在双引号中间
    setTimeout(() => {
        textarea.prop("selectionStart", startPos + 1);
        textarea.prop("selectionEnd", startPos + 1);
        textarea.focus();
    }, 0);
}

// 插入换行功能
function insertNewLine() {
    if (!extension_settings[extensionName].enabled) return;
    
    const textarea = getMessageInput();
    const text = textarea.val();
    const cursorPos = textarea.prop("selectionStart");
    
    // 查找当前行的末尾位置
    let lineEnd = text.indexOf("\n", cursorPos);
    if (lineEnd === -1) {
        // 如果没有找到换行符，说明光标在最后一行，使用文本长度作为行末
        lineEnd = text.length;
    }
    
    // 在行末插入换行符
    const newText = text.substring(0, lineEnd) + "\n" + text.substring(lineEnd);
    textarea.val(newText);
    
    // 设置光标位置在新插入的换行符之后
    setTimeout(() => {
        textarea.prop("selectionStart", lineEnd + 1);
        textarea.prop("selectionEnd", lineEnd + 1);
        textarea.focus();
    }, 0);
}

// 插入星号功能
function insertAsterisk() {
    if (!extension_settings[extensionName].enabled) return;
    
    const textarea = getMessageInput();
    const startPos = textarea.prop("selectionStart");
    const endPos = textarea.prop("selectionEnd");
    const text = textarea.val();
    
    const beforeText = text.substring(0, startPos);
    const selectedText = text.substring(startPos, endPos);
    const afterText = text.substring(endPos);
    
    // 插入两个星号并将光标放在中间
    const newText = beforeText + "**" + afterText;
    textarea.val(newText);
    
    // 设置光标位置在星号中间
    setTimeout(() => {
        textarea.prop("selectionStart", startPos + 1);
        textarea.prop("selectionEnd", startPos + 1);
        textarea.focus();
    }, 0);
}

// 插入用户标记功能
function insertUserTag() {
    if (!extension_settings[extensionName].enabled) return;
    
    const textarea = getMessageInput();
    const startPos = textarea.prop("selectionStart");
    const endPos = textarea.prop("selectionEnd");
    const text = textarea.val();
    
    const beforeText = text.substring(0, startPos);
    const selectedText = text.substring(startPos, endPos);
    const afterText = text.substring(endPos);
    
    // 插入用户标记
    const newText = beforeText + "{{User}}" + afterText;
    textarea.val(newText);
    
    // 设置光标位置在标记之后
    setTimeout(() => {
        textarea.prop("selectionStart", startPos + 8); // "{{User}}".length = 8
        textarea.prop("selectionEnd", startPos + 8);
        textarea.focus();
    }, 0);
}

// 插入角色标记功能
function insertCharTag() {
    if (!extension_settings[extensionName].enabled) return;
    
    const textarea = getMessageInput();
    const startPos = textarea.prop("selectionStart");
    const endPos = textarea.prop("selectionEnd");
    const text = textarea.val();
    
    const beforeText = text.substring(0, startPos);
    const selectedText = text.substring(startPos, endPos);
    const afterText = text.substring(endPos);
    
    // 插入角色标记
    const newText = beforeText + "{{Char}}" + afterText;
    textarea.val(newText);
    
    // 设置光标位置在标记之后
    setTimeout(() => {
        textarea.prop("selectionStart", startPos + 8); // "{{Char}}".length = 8
        textarea.prop("selectionEnd", startPos + 8);
        textarea.focus();
    }, 0);
}

// 插入圆括号功能
function insertParentheses() {
    if (!extension_settings[extensionName].enabled) return;
    
    const textarea = getMessageInput();
    const startPos = textarea.prop("selectionStart");
    const endPos = textarea.prop("selectionEnd");
    const text = textarea.val();
    
    const beforeText = text.substring(0, startPos);
    const selectedText = text.substring(startPos, endPos);
    const afterText = text.substring(endPos);
    
    // 插入圆括号并将光标放在中间
    const newText = beforeText + "()" + afterText;
    textarea.val(newText);
    
    // 设置光标位置在括号中间
    setTimeout(() => {
        textarea.prop("selectionStart", startPos + 1);
        textarea.prop("selectionEnd", startPos + 1);
        textarea.focus();
    }, 0);
}

// 插入书名号「」功能
function insertBookQuotes1() {
    if (!extension_settings[extensionName].enabled) return;
    
    const textarea = getMessageInput();
    const startPos = textarea.prop("selectionStart");
    const endPos = textarea.prop("selectionEnd");
    const text = textarea.val();
    
    const beforeText = text.substring(0, startPos);
    const selectedText = text.substring(startPos, endPos);
    const afterText = text.substring(endPos);
    
    // 插入书名号并将光标放在中间
    const newText = beforeText + "「」" + afterText;
    textarea.val(newText);
    
    // 设置光标位置在书名号中间
    setTimeout(() => {
        textarea.prop("selectionStart", startPos + 1);
        textarea.prop("selectionEnd", startPos + 1);
        textarea.focus();
    }, 0);
}

// 插入书名号『』功能
function insertBookQuotes2() {
    if (!extension_settings[extensionName].enabled) return;
    
    const textarea = getMessageInput();
    const startPos = textarea.prop("selectionStart");
    const endPos = textarea.prop("selectionEnd");
    const text = textarea.val();
    
    const beforeText = text.substring(0, startPos);
    const selectedText = text.substring(startPos, endPos);
    const afterText = text.substring(endPos);
    
    // 插入书名号并将光标放在中间
    const newText = beforeText + "『』" + afterText;
    textarea.val(newText);
    
    // 设置光标位置在书名号中间
    setTimeout(() => {
        textarea.prop("selectionStart", startPos + 1);
        textarea.prop("selectionEnd", startPos + 1);
        textarea.focus();
    }, 0);
}

// 插入书名号《》功能
function insertBookQuotes3() {
    if (!extension_settings[extensionName].enabled) return;
    
    const textarea = getMessageInput();
    const startPos = textarea.prop("selectionStart");
    const endPos = textarea.prop("selectionEnd");
    const text = textarea.val();
    
    const beforeText = text.substring(0, startPos);
    const selectedText = text.substring(startPos, endPos);
    const afterText = text.substring(endPos);
    
    // 插入书名号并将光标放在中间
    const newText = beforeText + "《》" + afterText;
    textarea.val(newText);
    
    // 设置光标位置在书名号中间
    setTimeout(() => {
        textarea.prop("selectionStart", startPos + 1);
        textarea.prop("selectionEnd", startPos + 1);
        textarea.focus();
    }, 0);
}

// 处理快捷键设置
function setupShortcutInputs() {
    // 处理快捷键输入
    $(".shortcut-input").on("keydown", function(e) {
        e.preventDefault();
        
        // 获取按键组合
        let keys = [];
        if (e.ctrlKey) keys.push("Ctrl");
        if (e.altKey) keys.push("Alt");
        if (e.shiftKey) keys.push("Shift");
        
        // 添加主键（如果不是修饰键）
        if (
            e.key !== "Control" && 
            e.key !== "Alt" && 
            e.key !== "Shift" && 
            e.key !== "Meta" &&
            e.key !== "Escape"
        ) {
            // 修复: 确保e.key存在并且有length属性
            const keyName = e.key && typeof e.key === 'string' && e.key.length === 1 
                ? e.key.toUpperCase() 
                : (e.key || "Unknown");
            keys.push(keyName);
        }
        
        // 如果只按了Escape键，清除快捷键
        if (e.key === "Escape") {
            $(this).val("");
            const shortcutKey = $(this).attr("id").replace("shortcut_", "");
            extension_settings[extensionName].shortcuts[shortcutKey] = "";
            saveSettingsDebounced();
            return;
        }
        
        // 如果没有按键组合或只有修饰键，不设置
        if (keys.length === 0 || (keys.length === 1 && ["Ctrl", "Alt", "Shift"].includes(keys[0]))) {
            return;
        }
        
        // 设置快捷键
        const shortcutString = keys.join("+");
        $(this).val(shortcutString);
        
        // 保存到设置
        const shortcutKey = $(this).attr("id").replace("shortcut_", "");
        extension_settings[extensionName].shortcuts[shortcutKey] = shortcutString;
        saveSettingsDebounced();
    });
    
    // 处理清除按钮
    $(".shortcut-clear-btn").on("click", function() {
        const targetId = $(this).data("target");
        $(`#${targetId}`).val("");
        
        // 保存到设置
        const shortcutKey = targetId.replace("shortcut_", "");
        extension_settings[extensionName].shortcuts[shortcutKey] = "";
        saveSettingsDebounced();
    });
}

// 全局快捷键处理函数
function handleGlobalShortcuts(e) {
    // 如果插件未启用或正在编辑快捷键，不处理
    if (!extension_settings[extensionName].enabled || $(document.activeElement).hasClass("shortcut-input")) {
        return;
    }
    
    // 如果当前焦点不在文本区域，不处理
    const messageInput = getMessageInput()[0];
    if (document.activeElement !== messageInput) {
        return;
    }
    
    // 获取当前按键组合
    let keys = [];
    if (e.ctrlKey) keys.push("Ctrl");
    if (e.altKey) keys.push("Alt");
    if (e.shiftKey) keys.push("Shift");
    
    // 添加主键（如果不是修饰键）
    if (
        e.key !== "Control" && 
        e.key !== "Alt" && 
        e.key !== "Shift" && 
        e.key !== "Meta"
    ) {
        // 修复: 确保e.key存在并且有length属性
        const keyName = e.key && typeof e.key === 'string' && e.key.length === 1 
            ? e.key.toUpperCase() 
            : (e.key || "Unknown");
        keys.push(keyName);
    }
    
    // 如果没有有效的按键组合，不处理
    if (keys.length <= 1) {
        return;
    }
    
    const shortcutString = keys.join("+");
    const shortcuts = extension_settings[extensionName].shortcuts;
    
    // 查找匹配的快捷键
    for (const key in shortcuts) {
        if (shortcuts[key] === shortcutString) {
            e.preventDefault();
            
            // 检查是否是自定义按钮的快捷键
            if (key.startsWith('custom_')) {
                const index = parseInt(key.replace('custom_', ''));
                const customSymbols = extension_settings[extensionName].customSymbols || [];
                if (index >= 0 && index < customSymbols.length) {
                    insertCustomSymbol(customSymbols[index]);
                    return;
                }
            }
            // 执行对应的功能
            else if (shortcutFunctionMap[key]) {
                shortcutFunctionMap[key]();
                return;
            }
        }
    }
}

// 加载自定义符号按钮
function loadCustomSymbolButtons() {
    const customSymbols = extension_settings[extensionName].customSymbols || [];
    
    // 清除现有的自定义按钮
    $(".custom-symbol-button").remove();
    $(".integrated-button-row[data-custom='true']").remove();
    
    // 为每个自定义符号创建按钮和设置项
    customSymbols.forEach((symbol, index) => {
        const buttonKey = `custom_${index}`;
        
        // 为工具栏创建按钮
        createCustomSymbolButton(symbol, index);
        
        // 为设置面板创建行
        createCustomSymbolSetting(symbol, index);
        
        // 更新按钮顺序
        if (!extension_settings[extensionName].buttonOrder.includes(buttonKey)) {
            extension_settings[extensionName].buttonOrder.push(buttonKey);
        }
        
        // 确保该按钮有显示设置
        if (extension_settings[extensionName].buttons[buttonKey] === undefined) {
            extension_settings[extensionName].buttons[buttonKey] = true;
        }
        
        // 确保该按钮有快捷键设置
        if (extension_settings[extensionName].shortcuts[buttonKey] === undefined) {
            extension_settings[extensionName].shortcuts[buttonKey] = "";
        }
        
        // 更新快捷键映射
        shortcutFunctionMap[buttonKey] = function() {
            insertCustomSymbol(customSymbols[index]);
        };
    });
    
    // 更新按钮顺序
    updateButtonsOrder();
    updateToolbarButtonOrder();
    
    // 重新绑定快捷键输入框事件
    setupShortcutInputs();
}

// 创建自定义符号按钮
function createCustomSymbolButton(symbol, index) {
    const buttonId = `input_custom_${index}_btn`;
    const buttonKey = `custom_${index}`;
    
    // 先检查是否已存在，如果存在则移除
    $(`#${buttonId}`).remove();
    
    // 创建按钮并添加到工具栏
    const button = $(`<button id="${buttonId}" class="input-helper-btn custom-symbol-button" title="${symbol.name}" data-norefocus="true" data-index="${index}">${symbol.display}</button>`);
    $("#input_helper_toolbar").append(button);
    
    // 添加点击事件
    bindCustomSymbolEvent(button, symbol);
}

// 为自定义符号按钮绑定事件
function bindCustomSymbolEvent(button, symbol) {
    // 检查是否是移动设备
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
        button.on("touchstart", function(e) {
            e.preventDefault();
            insertCustomSymbol(symbol);
            
            // 确保输入框保持焦点状态
            setTimeout(() => {
                getMessageInput().focus();
            }, 10);
            
            return false;
        });
    } else {
        button.on("click", function() {
            insertCustomSymbol(symbol);
        });
    }
}

// 创建自定义符号设置项
function createCustomSymbolSetting(symbol, index) {
    const buttonKey = `custom_${index}`;
    
    // 先检查是否已存在，如果存在则移除
    $(`.integrated-button-row[data-button-key="${buttonKey}"]`).remove();
    
    // 创建设置行 - 修改编辑和删除按钮位置
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
    
    // 添加到设置面板
    $("#integrated_button_settings").append(row);
    
    // 添加事件监听
    row.find(`#enable_${buttonKey}_btn`).on("input", onButtonVisibilityChange(buttonKey));
    row.find(".custom-edit-btn").on("click", function() {
        const index = $(this).data("index");
        editCustomSymbol(index);
    });
    row.find(".custom-delete-btn").on("click", function() {
        const index = $(this).data("index");
        deleteCustomSymbol(index);
    });
}
// 插入自定义符号
function insertCustomSymbol(symbol) {
    if (!extension_settings[extensionName].enabled) return;

    const textarea = getMessageInput();
    const startPos = textarea.prop("selectionStart");
    const endPos = textarea.prop("selectionEnd");
    const text = textarea.val();

    const beforeText = text.substring(0, startPos);
    const selectedText = text.substring(startPos, endPos);
    const afterText = text.substring(endPos);

    // 处理符号中的\n换行符
    const processedSymbol = symbol.symbol.replace(/\\n/g, '\n');

    // 插入符号
    const newText = beforeText + processedSymbol + afterText;
    textarea.val(newText);

    // 计算实际插入后的光标位置
    const insertedLength = processedSymbol.length;

    // 设置光标位置
    setTimeout(() => {
        // 计算光标位置
        let cursorPos = startPos;

        if (symbol.cursorPos === "start") {
            cursorPos = startPos;
        } else if (symbol.cursorPos === "end") {
            cursorPos = startPos + insertedLength;
        } else if (symbol.cursorPos === "middle") {
            cursorPos = startPos + Math.floor(insertedLength / 2);
        } else {
            // 具体位置
            cursorPos = startPos + parseInt(symbol.cursorPos) || startPos;
        }

        textarea.prop("selectionStart", cursorPos);
        textarea.prop("selectionEnd", cursorPos);
        textarea.focus();
    }, 0);
}
// 编辑自定义符号
function editCustomSymbol(index) {
    const symbols = extension_settings[extensionName].customSymbols;
    const symbol = symbols[index];
    
    // 显示编辑对话框
    showCustomSymbolDialog(symbol, index);
}

// 删除自定义符号
function deleteCustomSymbol(index) {
    if (confirm("确定要删除这个自定义符号吗？")) {
        const symbols = extension_settings[extensionName].customSymbols;
        const buttonKey = `custom_${index}`;
        
        // 从设置中删除
        symbols.splice(index, 1);
        
        // 从按钮顺序中删除
        const orderIndex = extension_settings[extensionName].buttonOrder.indexOf(buttonKey);
        if (orderIndex > -1) {
            extension_settings[extensionName].buttonOrder.splice(orderIndex, 1);
        }
        
        // 从按钮显示设置中删除
        delete extension_settings[extensionName].buttons[buttonKey];
        
        // 从按钮快捷键设置中删除
        delete extension_settings[extensionName].shortcuts[buttonKey];
        
        // 从工具栏中删除
        $(`#input_custom_${index}_btn`).remove();
        
        // 从快捷键映射中删除
        delete shortcutFunctionMap[buttonKey];
        
        // 保存设置
        saveSettingsDebounced();
        
        // 移动设备监听器需要重新绑定
        rebindMobileEventListeners();
        
        // 重新加载自定义按钮 - 这会导致索引重排
        loadCustomSymbolButtons();
        
        // 更新工具栏
        updateButtonVisibility();
    }
}

// 重新绑定移动设备事件监听器
function rebindMobileEventListeners() {
    if (!/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        return; // 非移动设备不需要重新绑定
    }
    
    // 移除之前的监听器
    $("#input_helper_toolbar button").off("touchstart");
    
    // 重新绑定监听器
    $("#input_helper_toolbar button").on("touchstart", function(e) {
        e.preventDefault();
        const btnId = $(this).attr("id");
        
        // 基于按钮ID调用相应的函数
        if (btnId === "input_asterisk_btn") insertAsterisk();
        else if (btnId === "input_quotes_btn") insertQuotes();
        else if (btnId === "input_parentheses_btn") insertParentheses();
        else if (btnId === "input_book_quotes1_btn") insertBookQuotes1();
        else if (btnId === "input_book_quotes2_btn") insertBookQuotes2();
        else if (btnId === "input_book_quotes3_btn") insertBookQuotes3();
        else if (btnId === "input_newline_btn") insertNewLine();
        else if (btnId === "input_user_btn") insertUserTag();
        else if (btnId === "input_char_btn") insertCharTag();
        else if (btnId.startsWith("input_custom_")) {
            // 处理自定义按钮
            const index = parseInt(btnId.replace("input_custom_", "").replace("_btn", ""));
            const customSymbols = extension_settings[extensionName].customSymbols || [];
            if (index >= 0 && index < customSymbols.length) {
                insertCustomSymbol(customSymbols[index]);
            }
        }
        
        // 确保输入框保持焦点状态
        setTimeout(() => {
            getMessageInput().focus();
        }, 10);
        
        return false;
    });
}

// 显示自定义符号对话框
function showCustomSymbolDialog(existingSymbol = null, editIndex = -1) {
    // 创建对话框 - 修改样式以正确应用主题颜色
    const dialog = $(`
        <div id="custom_symbol_dialog" class="custom-symbol-dialog">
            <div class="custom-symbol-dialog-content">
                <h3>${existingSymbol ? '编辑符号' : '添加自定义符号'}</h3>
                <div class="custom-symbol-form">
                    <div class="form-group">
                        <label for="custom_symbol_name">名称：</label>
                        <input type="text" id="custom_symbol_name" value="${existingSymbol ? existingSymbol.name : ''}" placeholder="如：方括号">
                    </div>
                    <div class="form-group">
                        <label for="custom_symbol_symbol">符号：</label>
                        <input type="text" id="custom_symbol_symbol" value="${existingSymbol ? existingSymbol.symbol : ''}" placeholder="如：[]">
                    </div>
                    <div class="form-group">
                        <label for="custom_symbol_display">显示文本：</label>
                        <input type="text" id="custom_symbol_display" value="${existingSymbol ? existingSymbol.display : ''}" placeholder="如：[]">
                    </div>
                    <div class="form-group">
                        <label for="custom_symbol_cursor">光标位置：</label>
                        <select id="custom_symbol_cursor">
                            <option value="start" ${existingSymbol && existingSymbol.cursorPos === 'start' ? 'selected' : ''}>开始</option>
                            <option value="middle" ${!existingSymbol || existingSymbol.cursorPos === 'middle' ? 'selected' : ''}>中间</option>
                            <option value="end" ${existingSymbol && existingSymbol.cursorPos === 'end' ? 'selected' : ''}>结尾</option>
                            <option value="custom" ${existingSymbol && !['start', 'middle', 'end'].includes(existingSymbol.cursorPos) ? 'selected' : ''}>自定义</option>
                        </select>
                        <input type="number" id="custom_symbol_cursor_pos" value="${existingSymbol && !['start', 'middle', 'end'].includes(existingSymbol.cursorPos) ? existingSymbol.cursorPos : '1'}" min="0" style="display: ${existingSymbol && !['start', 'middle', 'end'].includes(existingSymbol.cursorPos) ? 'inline-block' : 'none'}; width: 60px;">
                    </div>
                </div>
                <div class="custom-symbol-buttons">
                    <button id="custom_symbol_cancel">取消</button>
                    <button id="custom_symbol_save">保存</button>
                </div>
            </div>
        </div>
    `);
    
    // 添加到页面
    $("body").append(dialog);
    
    // 处理自定义光标位置选择
    $("#custom_symbol_cursor").on("change", function() {
        if ($(this).val() === "custom") {
            $("#custom_symbol_cursor_pos").show();
        } else {
            $("#custom_symbol_cursor_pos").hide();
        }
    });
    
    // 取消按钮事件
    $("#custom_symbol_cancel").on("click", function() {
        dialog.remove();
    });
    
    // 保存按钮事件
    $("#custom_symbol_save").on("click", function() {
        const name = $("#custom_symbol_name").val().trim();
        const symbol = $("#custom_symbol_symbol").val();
        const display = $("#custom_symbol_display").val() || symbol;
        let cursorPos = $("#custom_symbol_cursor").val();
        
        if (cursorPos === "custom") {
            cursorPos = $("#custom_symbol_cursor_pos").val();
        }
        
        // 验证输入
        if (!name || !symbol) {
            alert("请输入名称和符号！");
            return;
        }
        
        // 创建符号对象
        const symbolObj = {
            name: name,
            symbol: symbol,
            display: display,
            cursorPos: cursorPos
        };
        
        // 保存到设置
        if (editIndex >= 0) {
            // 编辑现有符号
            extension_settings[extensionName].customSymbols[editIndex] = symbolObj;
        } else {
            // 添加新符号
            if (!extension_settings[extensionName].customSymbols) {
                extension_settings[extensionName].customSymbols = [];
            }
            extension_settings[extensionName].customSymbols.push(symbolObj);
        }
        
        // 保存设置
        saveSettingsDebounced();
        
        // 重新加载自定义按钮
        loadCustomSymbolButtons();
        
        // 关闭对话框
        dialog.remove();
    });
}

// 初始化插件
jQuery(async () => {
    // 加载HTML
    const settingsHtml = await $.get(`${extensionFolderPath}/settings.html`);
    $("#extensions_settings2").append(settingsHtml);
    
    // 加载输入工具栏HTML
    const toolbarHtml = await $.get(`${extensionFolderPath}/toolbar.html`);
    
    // 将工具栏插入到 #qr--bar 下方，并确保正确的视觉顺序
    if ($("#qr--bar").length) {
        // 如果存在QR Bar，确保正确的插入位置和样式
        $("#qr--bar").after(toolbarHtml);
        
        // 为了确保正确的视觉顺序，应用特定的CSS
        $("#send_form").css("display", "flex");
        $("#send_form").css("flex-direction", "column");
        $("#qr--bar").css("order", "1");
        $("#input_helper_toolbar").css("order", "2");
    } else {
        // 如果不存在QR Bar，则插入到file_form后
        $("#file_form").after(toolbarHtml);
    }
    
    // 移动设备优化：防止按钮点击导致键盘消失和重新出现
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) {
        // 在移动设备上，阻止工具栏按钮的默认行为，避免输入框失焦
        $("#input_helper_toolbar").on("mousedown touchstart", function(e) {
            e.preventDefault(); // 阻止默认行为
            // 不阻止冒泡，以便点击事件仍然被处理
        });
        
        // 初始绑定移动设备触摸事件 - 使用统一的函数便于重新绑定
        rebindMobileEventListeners();
    } else {
        // 桌面端使用原有的点击事件
        $("#input_asterisk_btn").on("click", insertAsterisk);
        $("#input_quotes_btn").on("click", insertQuotes);
        $("#input_newline_btn").on("click", insertNewLine);
        $("#input_user_btn").on("click", insertUserTag);
        $("#input_char_btn").on("click", insertCharTag);
        $("#input_parentheses_btn").on("click", insertParentheses);
        $("#input_book_quotes1_btn").on("click", insertBookQuotes1);
        $("#input_book_quotes2_btn").on("click", insertBookQuotes2);
        $("#input_book_quotes3_btn").on("click", insertBookQuotes3);
        // 动态添加的自定义按钮会在创建时绑定事件
    }
    
    // 注册事件监听
    $("#insert_quotes_button").on("click", insertQuotes);
    $("#new_line_button").on("click", insertNewLine);
    $("#insert_asterisk_button").on("click", insertAsterisk);
    $("#enable_input_helper").on("input", onEnableInputChange);
    
    // 注册设置变更事件监听
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
    
    // 加载设置
    await loadSettings();
    
    // 设置快捷键输入框
    setupShortcutInputs();
    
    // 初始化排序功能
    initSortable();
    
    // 注册全局快捷键事件
    $(document).on("keydown", handleGlobalShortcuts);
    
    // 根据初始化设置显示或隐藏工具栏
    if (!extension_settings[extensionName].enabled) {
        $("#input_helper_toolbar").hide();
    }
    
    // 添加添加自定义符号按钮
    $("#integrated_button_settings").after(`
        <div class="example-extension_block">
            <button id="add_custom_symbol_btn" class="menu_button">添加自定义符号</button>
        </div>
    `);
    
    // 添加自定义符号按钮事件
    $("#add_custom_symbol_btn").on("click", function() {
        showCustomSymbolDialog();
    });
    
    // 注册自定义符号对话框键盘事件处理
    $(document).on("keydown", function(e) {
        // 如果对话框正在显示且按下了Escape，关闭对话框
        if ($("#custom_symbol_dialog").length && e.key === "Escape") {
            $("#custom_symbol_dialog").remove();
        }
        
        // 如果对话框正在显示且按下了Enter，模拟点击保存按钮
        if ($("#custom_symbol_dialog").length && e.key === "Enter" && !e.ctrlKey && !e.shiftKey && !e.altKey) {
            if ($(document.activeElement).is("input") && !$(document.activeElement).is("textarea")) {
                $("#custom_symbol_save").click();
            }
        }
    });
    
    console.log("输入助手插件已加载");
});
