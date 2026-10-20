// SPDX-License-Identifier: AGPL-3.0-or-later
// Regression fixture uses task/popup functions from Translate for Zotero 2.4.8.
// Source: https://github.com/windingwind/zotero-pdf-translate
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
let serial = 42;
const addon = { data: { alive: true, panel: {}, translate: {queue: [], maximumQueueLength: 1000, selectedText: '', concatKey: false, concatCheckbox: false} }, hooks: {} };
const context = vm.createContext({ addon, config: {addonInstance: 'PDFTranslate'}, Zotero: {PDFTranslate: addon, Utilities: {randomString: () => String(serial++)}}, getPref: key => key === 'enableConcatKey', setDefaultService: task => {task.service = 'unchanged-test-service';}, buildReaderPopup: () => {}, console });
vm.runInContext('  function addTranslateTask(raw, itemId, type, service) {\n    if (!raw) {\n      return;\n    }\n    const addon2 = Zotero[config.addonInstance];\n    type = type || "text";\n    raw = raw.replace(/[\\u0000-\\u001F\\u007F-\\u009F]/gu, " ").normalize("NFKC");\n    const isConcatMode = type === "text" && (addon2.data.translate.concatCheckbox || getPref("enableConcatKey") && addon2.data.translate.concatKey);\n    const lastTask = getLastTranslateTask({ type: "text" });\n    if (isConcatMode && lastTask) {\n      lastTask.raw += " " + raw;\n      lastTask.extraTasks.forEach((extraTask) => extraTask.raw += " " + raw);\n      lastTask.status = "waiting";\n      putTranslateTaskAtHead(lastTask.id);\n      return;\n    }\n    const newTask = {\n      id: `${Zotero.Utilities.randomString()}-${(/* @__PURE__ */ new Date()).getTime()}`,\n      type,\n      raw,\n      result: "",\n      audio: [],\n      service: "",\n      candidateServices: [],\n      itemId,\n      status: "waiting",\n      extraTasks: []\n    };\n    if (!service) {\n      setDefaultService(newTask);\n    } else {\n      newTask.service = service;\n    }\n    addon2.data.translate.queue.push(newTask);\n    if (type === "text" && addon2.data.panel.windowPanel && !addon2.data.panel.windowPanel.closed) {\n      getPref("extraEngines").split(",").filter((s) => s).forEach(\n        (extraService) => newTask.extraTasks.push({\n          id: `${Zotero.Utilities.randomString()}-${(/* @__PURE__ */ new Date()).getTime()}`,\n          type: "text",\n          raw,\n          result: "",\n          audio: [],\n          service: extraService,\n          candidateServices: [],\n          extraTasks: [],\n          itemId,\n          status: "waiting"\n        })\n      );\n    }\n    cleanTasks();\n    return newTask;\n  }\n\n  function cleanTasks() {\n    const addon2 = Zotero[config.addonInstance];\n    if (addon2.data.translate.queue.length > addon2.data.translate.maximumQueueLength) {\n      addon2.data.translate.queue.splice(\n        0,\n        Math.floor(addon2.data.translate.maximumQueueLength / 3)\n      );\n    }\n  }\n\n  function getLastTranslateTask(conditions) {\n    const queue = Zotero[config.addonInstance].data.translate.queue;\n    let i = queue.length - 1;\n    while (i >= 0) {\n      const currentTask = queue[i];\n      const notMatchConditions = conditions && Object.keys(conditions).map((key) => currentTask[key] === conditions[key]).includes(false);\n      if (!notMatchConditions) {\n        return queue[i];\n      }\n      i--;\n    }\n    return void 0;\n  }\n\n  function putTranslateTaskAtHead(taskId) {\n    const queue = Zotero[config.addonInstance].data.translate.queue;\n    const idx = queue.findIndex((task) => task.id === taskId);\n    if (idx >= 0) {\n      const targetTask = queue.splice(idx, 1)[0];\n      queue.push(targetTask);\n      return true;\n    }\n    return false;\n  }\n  function onReaderPopupShow(event) {\n    const selection = addon.data.translate.selectedText;\n    const task = getLastTranslateTask();\n    if (task?.raw === selection) {\n      buildReaderPopup(event);\n      addon.hooks.onReaderPopupRefresh();\n      return;\n    }\n    addTranslateTask(selection, event.reader.itemID);\n    buildReaderPopup(event);\n    addon.hooks.onReaderPopupRefresh();\n    if (getPref("enableAuto")) {\n      addon.hooks.onTranslate();\n    }\n  }\n', context);
addon.hooks.onReaderPopupRefresh = () => {};
addon.hooks.onReaderPopupShow = context.onReaderPopupShow;
function select(text) { addon.data.translate.selectedText = text; addon.hooks.onReaderPopupShow({reader:{itemID:42}}); }
addon.data.translate.concatKey = true;
select('Previous passage'); select('Current selection');
assert.equal(addon.data.translate.queue.at(-1).raw, 'Previous passage Current selection');
console.log('REPRODUCED: installed source appends previous selection when concatKey remains true');
vm.runInContext(fs.readFileSync(require('node:path').join(__dirname, '..', 'bootstrap.js'),'utf8'),context);
context.QuickHighlight.patchTranslation();
for (const [key, checkbox] of [[true,false],[false,true],[true,true],[false,false]]) {
 addon.data.translate.concatKey = key; addon.data.translate.concatCheckbox = checkbox;
 for (let i = 0; i < 100; i++) {
  const text = 'Independent selection ' + i;
  select(text);
  assert.equal(addon.data.translate.queue.at(-1).raw,text);
  assert.equal(addon.data.translate.concatKey,key);
  assert.equal(addon.data.translate.concatCheckbox,checkbox);
 }
}
const queue = addon.data.translate.queue;
const latest = queue.at(-1);
const old = queue[0];
old.result = 'A late response from the previous task';
assert.notEqual(old,latest);
assert.equal(latest.raw,'Independent selection 99');
assert.equal(latest.result,'');
addon.data.translate.concatKey = true;
context.addTranslateTask('Intentional sidebar concatenation',42,'text');
assert.ok(latest.raw.endsWith(' Intentional sidebar concatenation'));
const original = context.QuickHighlight.translationPatch.original;
context.QuickHighlight.stop();
assert.equal(addon.hooks.onReaderPopupShow, original);
addon.hooks.onReaderPopupShow = () => {throw new Error('expected failure');};
context.QuickHighlight.patchTranslation();
assert.throws(() => addon.hooks.onReaderPopupShow(),/expected failure/);
assert.equal(addon.data.translate.concatKey,true);
context.QuickHighlight.stop();
console.log('PASS: 400 independent selections; delayed-result isolation; sidebar concatenation; teardown; exception restoration');
