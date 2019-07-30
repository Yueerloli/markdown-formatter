'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
var vscode = require('vscode');
// import { vscode.workspace } from 'vscode';
var removeReplace_1 = require("./removeReplace");
var formatList_1 = require('./formatList');
var Table_1 = require('./Table');
var escapeStringRegexp = require('escape-string-regexp');
// import beautify from 'js-beautify'
var beautify = require('js-beautify');
var beautify_js = require('js-beautify').js;
var beautify_css = require('js-beautify').css;
var beautify_html = require('js-beautify').html;
var config = vscode.workspace.getConfiguration('markdownFormatter');
var fullWidthTurnHalfWidth = config.get('fullWidthTurnHalfWidth', 'auto');
var codeAreaFormat = config.get('codeAreaFormat', true);
var codeAreaToBlock = config.get('codeAreaToBlock', '');
var enable = config.get('enable', true);
var formatOpt = config.get('formatOpt', {});
var formatULSymbol = config.get('formatULSymbol', true);
var spaceAfterFullWidth = config.get('spaceAfterFullWidth', false);
vscode.workspace.onDidChangeConfiguration(function (_) {
    config = vscode.workspace.getConfiguration('markdownFormatter');
    fullWidthTurnHalfWidth = config.get('fullWidthTurnHalfWidth', 'auto');
    codeAreaFormat = config.get('codeAreaFormat', true);
    codeAreaToBlock = config.get('codeAreaToBlock', '');
    enable = config.get('enable', true);
    formatOpt = config.get('formatOpt', {});
    formatULSymbol = config.get('formatULSymbol', true);
    spaceAfterFullWidth = config.get('spaceAfterFullWidth', false);
});
// let textLast = ''
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    console.log(vscode.window.activeTextEditor.options.tabSize);
    // repalce symbol
    var CHINESE_SYMBOL = "\uFF0C\uFF1A\uFF1B\uFF01\u201C\u201D\u2018\u2019\uFF08\uFF09\uFF1F\u3002";
    var ENGLISH_SYMBOL = ",:;!\"\"''()?.";
    // chinese symbol
    var CHINESE_CHARCTER_SYMBOL = "([\\u4e00-\\u9fa5])";
    var ENGLISH_CHARCTER_SYMBOL = "([A-Za-z])";
    // punctuation which need a space after it
    // const PUNCTUATION_EXP = /([，,。；;！、？：])\ */g;
    var PUNCTUATION_EXP = spaceAfterFullWidth ? /([，,。；;！、？：])\ */g : /([,;])\ */g;
    // period which need a space after it
    var PERIOD_EXP = /([\.\!\?\:])([A-Z\u4e00-\u9fa5])/g;
    // h1 symbol
    var H1_EXP = /^(# [^\n]+)\n*/g;
    // h2,h3,h4... symbol
    var H_EXP = /\n*(##+ [^\n]+)\n*/g;
    // table
    var TABLE_EXP = /((?:(?:[^\n]*?\|[^\n]*)\ *)?(?:\r?\n|^))(?:[^|]+)((?:\|\ *(?::?-+:?|::)\ *|\|?(?:\ *(?::?-+:?|::)\ *\|)+)(?:\ *(?::?-+:?|::)\ *)?\ *\r?\n)((?:(?:[^\n]*?\|[^\n]*)\ *(?:\r?\n|$))+)/g;
    //back quote
    var BACK_QUOTE_EXP = /\ *`([^`\n]+)`\ */g;
    // image link
    var IMG_EXP = /([^[])(\!\[[^\n]+\]\([^\n]+\))/g;
    // list 
    // const LIST_EXP = /(((?:\n)+(?: {4}|\t)*(?:\d+\.|\-|\*|\+) [^\n]+)+)/g;
    var LIST_EXP = /((\n(?: {2}|\t)*(?:\d+\.|\-|\*|\+) [^\n]+)+)/g;
    // const LIST_OL_EXP = /((\n(?: {2}|\t)*(\d+)\. [^\n]+)+)/g
    var LIST_OL_LI_EXP = /(\n(?: {2}|\t)*)(\d+)(\. [^\n]+)/g;
    var LIST_UL_ST_EXP = /\n(?:\-|\*|\+) ([^\n]+)/g;
    var LIST_UL_ND_EXP = /\n(?: {2}|\t)(?:\-|\*|\+) ([^\n]+)/g;
    var LIST_UL_TH_EXP = /\n(?: {2}|\t){2}(?:\-|\*|\+) ([^\n]+)/g;
    // const NO_PERIOD_BACK_QUOTE_EXP = /\ *`([^.`\n]+)`\ */g;
    // const NO_PERIOD_BACK_QUOTE_EXP1 = /\ *`([^`\n]*\.[^`\n]*)`\ */g;
    // link 
    var LINK_SPACE_EXP = /\n(>+) *([^\n]+)/g;
    var LINK_EXP = /\n((>+[^\n]*\n)+)/g;
    //href
    var HREF_EXP = /(?:http|https|file|ftp):\/\/[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\*\+,;=.]+/g;
    // duplicated line
    var EXTRALINE_EXP = /\n\n+/g;
    // code block
    // const CODE_AREA_EXP = /\n+((?:(?: {4}|\t)+[^\n\-\+\*][^\n]+\n*)+)/g;
    // const CODE_AREA_EXP = /\n+((?:(?: {4}|\t)+(?!\d\.|\+|\-|\*)[^\n]+\n)+)/g;
    // const CODE_AREA_EXP = /\n+((?:(?: {4}|\t)+([^\+\d\.\-\*])[^\n]+\n)+)/g
    var CODE_AREA_EXP = /\n+((?:(?: {4}|\t)[^\n]+\n)+)/g;
    // const CODE_AREA_EXP = /(?:(?: {4}|\t)+[^\n]+\n*)+/g;
    // const CODE_EXP = /\n*```([\s\S]+?)```\n*/g;
    var CODE_BLOCK_EXP = /\n*```(?: *)(\w*)\n([^```]+)(```)+?\n+/g;
    // const CODE_BLOCK_EXP = /\n*```(?: *)(\w*)\n([\s\S]+)(```)+?\n+/g
    // line-break
    var LINE_BREAK_EXP = /\r\n/g;
    // const TAG_START_EXP = /<(?:[^\/])(?:[^"'>]|"[^"]*"|'[^']*')*>/g
    // const TAG_SINGLE_EXP = /<(?:[^\/])(?:[^"'>]|"[^"]*"|'[^']*')*\/>/g
    // const TAG_END_EXP = /<\/(?:[^"'>]|"[^"]*"|'[^']*')*>/g
    function extractTables(text) {
        return text.match(TABLE_EXP);
    }
    context.subscriptions.push(vscode.languages.registerDocumentFormattingEditProvider('markdown', {
        provideDocumentFormattingEdits: function (document, options, token) {
            if (!enable) {
                return void 0;
            }
            var beautifyOpt = {};
            if (formatOpt) {
                beautifyOpt = Object.assign(beautify, formatOpt);
            }
            var result = [];
            var start = new vscode.Position(0, 0);
            var end = new vscode.Position(document.lineCount - 1, document.lineAt(document.lineCount - 1).text.length);
            var range = new vscode.Range(start, end);
            var text = document.getText(range) + '\n';
            // if (text === textLast) {
            //     vscode.window.showInformationMessage('No text to format.');
            //     return void 0;
            // }
            // textLast = text;
            var textLast = text;
            // format \r\n to \n,fix
            text = text.replace(LINE_BREAK_EXP, '\n');
            try {
                // format PUNCTUATION_EXP
                var _replacewithCharcter_1 = function (_a) {
                    var target = _a.target, judge = _a.judge, pad = _a.pad;
                    target.forEach(function (e, i) {
                        var _reg = new RegExp(judge + "\\" + e, 'g');
                        text = text.replace(_reg, "$1" + pad[i]);
                    });
                };
                text = removeReplace_1.removeReplace({
                    text: text, reg: [BACK_QUOTE_EXP, CODE_BLOCK_EXP, CODE_AREA_EXP, HREF_EXP], func: function (text) {
                        // handle fullwidth character
                        var fullwidthArr = CHINESE_SYMBOL.split('');
                        var halfwidthArr = ENGLISH_SYMBOL.split('');
                        if (fullWidthTurnHalfWidth === 'auto') {
                            _replacewithCharcter_1({ target: fullwidthArr, judge: ENGLISH_CHARCTER_SYMBOL, pad: halfwidthArr });
                            _replacewithCharcter_1({ target: halfwidthArr, judge: CHINESE_CHARCTER_SYMBOL, pad: fullwidthArr });
                        }
                        else {
                            if (fullWidthTurnHalfWidth !== '' && fullWidthTurnHalfWidth !== '_') {
                                var _commaArr = fullWidthTurnHalfWidth.split('');
                                if (_commaArr && _commaArr.length > 0) {
                                    _commaArr.forEach(function (e) {
                                        var _i = fullwidthArr.indexOf(e);
                                        if (_i > -1) {
                                            var _reg = new RegExp('\\' + e, 'g');
                                            text = text.replace(_reg, halfwidthArr[_i]);
                                        }
                                    });
                                }
                            }
                        }
                        text = text.replace(PUNCTUATION_EXP, '$1 ');
                        text = text.replace(PERIOD_EXP, '$1 $2');
                        return text;
                    }
                });
                // handler table
                var _tableArr = extractTables(text);
                if (_tableArr && _tableArr.length > 0) {
                    _tableArr.forEach(function (table) {
                        var re = new RegExp(escapeStringRegexp(String(table)), 'g');
                        text = text.replace(re, function (substring) { return '\n\n' + new Table_1.Table().reformat(table) + '\n\n'; });
                    });
                }
                // handler js
                if (formatOpt !== false) {
                    var _codeArr = text.match(CODE_BLOCK_EXP);
                    if (_codeArr && _codeArr.length > 0) {
                        _codeArr.forEach(function (e) {
                            var isJs = e.replace(CODE_BLOCK_EXP, '$1').toLocaleLowerCase();
                            if (isJs === 'js' || isJs === 'javascript' || isJs === '') {
                                var re = new RegExp(escapeStringRegexp(e.replace(CODE_BLOCK_EXP, '$2')), 'g');
                                text = text.replace(re, '' + beautify_js(e.replace(CODE_BLOCK_EXP, '$2'), beautifyOpt) + '\n');
                            }
                            if (isJs === 'html') {
                                var re = new RegExp(escapeStringRegexp(e.replace(CODE_BLOCK_EXP, '$2')), 'g');
                                text = text.replace(re, '' + beautify_html(e.replace(CODE_BLOCK_EXP, '$2'), beautifyOpt) + '\n');
                            }
                            if (isJs === 'css') {
                                var re = new RegExp(escapeStringRegexp(e.replace(CODE_BLOCK_EXP, '$2')), 'g');
                                text = text.replace(re, '' + beautify_css(e.replace(CODE_BLOCK_EXP, '$2'), beautifyOpt) + '\n');
                            }
                        });
                    }
                    text = removeReplace_1.removeReplace({
                        text: text, reg: [CODE_BLOCK_EXP, LIST_EXP], func: function (text) {
                            var _jsArr = text.match(CODE_AREA_EXP);
                            codeAreaToBlock = codeAreaToBlock.toLowerCase();
                            if (codeAreaFormat && _jsArr && _jsArr.length > 0) {
                                if (codeAreaToBlock === '') {
                                    _jsArr.forEach(function (e) {
                                        var re = new RegExp(escapeStringRegexp(e), 'g');
                                        // text = text.replace(re, '\n\n\n' + beautify(e.replace(CODE_AREA_EXP, '$1'), beautifyOpt) + '\n\n\n');
                                        text = text.replace(re, '\n\n\n' + e.replace(CODE_AREA_EXP, '$1') + '\n\n\n');
                                    });
                                }
                                else {
                                    if (codeAreaToBlock === 'js' || codeAreaToBlock === 'javascript') {
                                        _jsArr.forEach(function (e) {
                                            var re = new RegExp(escapeStringRegexp(e), 'g');
                                            text = text.replace(re, '\n\n\n``` ' + codeAreaToBlock + '\n' + beautify_js(e.replace(CODE_AREA_EXP, '$1').replace(/(\ {4}|\t)/g, ''), beautifyOpt) + '\n```\n\n\n');
                                        });
                                    }
                                    else if (codeAreaToBlock === 'html') {
                                        _jsArr.forEach(function (e) {
                                            var re = new RegExp(escapeStringRegexp(e), 'g');
                                            text = text.replace(re, '\n\n\n``` ' + codeAreaToBlock + '\n' + beautify_html(e.replace(CODE_AREA_EXP, '$1').replace(/(\ {4}|\t)/g, ''), beautifyOpt) + '\n```\n\n\n');
                                        });
                                    }
                                    else if (codeAreaToBlock === 'css') {
                                        _jsArr.forEach(function (e) {
                                            var re = new RegExp(escapeStringRegexp(e), 'g');
                                            text = text.replace(re, '\n\n\n``` ' + codeAreaToBlock + '\n' + beautify_css(e.replace(CODE_AREA_EXP, '$1').replace(/(\ {4}|\t)/g, ''), beautifyOpt) + '\n```\n\n\n');
                                        });
                                    }
                                    else {
                                        _jsArr.forEach(function (e) {
                                            var re = new RegExp(escapeStringRegexp(e), 'g');
                                            // text = text.replace(re, '\n\n\n' + beautify(e.replace(CODE_AREA_EXP, '$1'), beautifyOpt) + '\n\n\n');
                                            text = text.replace(re, '\n\n\n``` ' + codeAreaToBlock + '\n' + e.replace(CODE_AREA_EXP, '$1').replace(/(\ {4}|\t)/g, '') + '```\n\n\n');
                                        });
                                    }
                                }
                            }
                            return text;
                        }
                    });
                }
                text = new formatList_1.FormatList(text).formatted({ formatULSymbol: formatULSymbol, LIST_EXP: LIST_EXP, LIST_UL_ST_EXP: LIST_UL_ST_EXP, LIST_UL_ND_EXP: LIST_UL_ND_EXP, LIST_UL_TH_EXP: LIST_UL_TH_EXP, LIST_OL_LI_EXP: LIST_OL_LI_EXP });
                // text = formatList({ text })
                text = text.replace(BACK_QUOTE_EXP, ' `$1` ');
                text = text.replace(H_EXP, '\n\n' + '$1' + '\n\n');
                text = text.replace(H1_EXP, '$1' + '\n\n');
                text = text.replace(IMG_EXP, '$1\n\n' + '$2' + '\n\n');
                text = text.replace(CODE_BLOCK_EXP, '\n\n``` ' + '$1\n$2' + '```\n\n');
                text = text.replace(LINK_EXP, '\n\n' + '$1' + '\n\n');
                text = text.replace(LINK_SPACE_EXP, '\n' + '$1 $2');
                text = text.replace(EXTRALINE_EXP, '\n\n');
            }
            catch (e) {
                text = textLast;
                vscode.window.showInformationMessage("[Error Format]:" + e + " \n you can ask for help by https://github.com/sumnow/markdown-formatter/issues");
            }
            result.push(new vscode.TextEdit(range, text));
            vscode.window.showInformationMessage('Formatted text succeeded!');
            return result;
        }
    }));
    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "markdown-formatter" is now active!');
    // The command has been defined in the README.md file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in README.md
    // let disposable = vscode.commands.registerCommand('extension.sayHello', () => {
    // The code you place here will be executed every time your command is executed
    // Display a message box to the user
    // vscode.window.showInformationMessage('Hello World!');
    // });
    // context.subscriptions.push(disposable);
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() {
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map