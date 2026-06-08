/**
 * Unified App Registry — single source of truth for Embedded Apps.
 * Derives Desktop icons, Start Menu, script manifest, menu aliases, and shell bridge metadata.
 */

import outlook32 from 'assets/windowsIcons/887(32x32).png';
import outlook16 from 'assets/windowsIcons/887(16x16).png';
import notepad32 from 'assets/windowsIcons/327(32x32).png';
import notepad16 from 'assets/windowsIcons/327(16x16).png';
import computer32 from 'assets/windowsIcons/676(32x32).png';
import computer16 from 'assets/windowsIcons/676(16x16).png';
import controlPanel32 from 'assets/windowsIcons/300(32x32).png';
import controlPanel16 from 'assets/windowsIcons/300(16x16).png';
import help32 from 'assets/windowsIcons/747(32x32).png';
import help16 from 'assets/windowsIcons/747(16x16).png';
import search32 from 'assets/windowsIcons/299(32x32).png';
import search16 from 'assets/windowsIcons/554(16x16).png';
import run32 from 'assets/windowsIcons/743(32x32).png';
import run16 from 'assets/windowsIcons/743(32x32).png';
import todo32 from 'assets/windowsIcons/360(32x32).png';
import todo16 from 'assets/windowsIcons/360(32x32).png';
import bible32 from 'assets/windowsIcons/334(32x32).png';
import bible16 from 'assets/windowsIcons/334(32x32).png';
import calendar32 from 'assets/windowsIcons/301(32x32).png';
import calendar16 from 'assets/windowsIcons/301(32x32).png';
import pomodoro32 from 'assets/windowsIcons/716(16x16).png';
import pomodoro16 from 'assets/windowsIcons/716(16x16).png';
import kanban32 from 'assets/windowsIcons/358(32x32).png';
import kanban16 from 'assets/windowsIcons/358(16x16).png';
import clippy32 from 'assets/windowsIcons/357(16x16).png';
import clippy16 from 'assets/windowsIcons/357(16x16).png';
import textdiff32 from 'assets/windowsIcons/17(32x32).png';
import textdiff16 from 'assets/windowsIcons/153(16x16).png';
import qrtx32 from 'assets/windowsIcons/234(16x16).png';
import qrtx16 from 'assets/windowsIcons/234(16x16).png';

const P = process.env.PUBLIC_URL || '';
const recycle32 = `${P}/apps/vendor/98/images/icons/recycle-bin-32x32.png`;
const recycle16 = `${P}/apps/vendor/98/images/icons/recycle-bin-16x16.png`;
const recycleFull32 = `${P}/apps/vendor/98/images/icons/recycle-bin-full-32x32.png`;
const recycleFull16 = `${P}/apps/vendor/98/images/icons/recycle-bin-full-16x16.png`;

/** @typedef {'core'|'suite'|'tools'} ProductivitySection */

/**
 * @typedef {Object} AppRegistryEntry
 * @property {string} appKey
 * @property {string} displayTitle
 * @property {string} headerTitle
 * @property {string} [shellTitle] — window title in embedded-bridge manifest
 * @property {string} templateId
 * @property {string|null} initFn — global init function name
 * @property {string|null} [scriptPath] — app JS under public/
 * @property {number} [scriptOrder] — load order among app scripts
 * @property {string|null} [cleanupKey] — pomodoro | qrtx
 * @property {boolean} [useCpInit] — Control Panel uses cpInit()
 * @property {import('react').ComponentType|*} desktopIcon
 * @property {import('react').ComponentType|*} headerIcon
 * @property {import('react').ComponentType|*} [desktopIconFull]
 * @property {import('react').ComponentType|*} [headerIconFull]
 * @property {import('react').ComponentType|*} [startMenuIcon] — defaults to headerIcon
 * @property {{ width: number, height: number }} defaultSize
 * @property {{ x: number, y: number }} defaultOffset
 * @property {boolean} [showOnDesktop]
 * @property {boolean} [multiInstance]
 * @property {boolean} [resizable]
 * @property {boolean} [replacesStock]
 * @property {string} [stockSlot]
 * @property {string[]} [menuAliases]
 * @property {{ section: ProductivitySection, order: number }|null} [productivitySuite]
 * @property {boolean} [pinnedInStartMenu]
 * @property {number} [pinnedOrder]
 */

/** @type {AppRegistryEntry[]} */
export const APP_REGISTRY = [
  {
    appKey: 'mail',
    displayTitle: 'Outlook Express',
    headerTitle: 'Outlook Express',
    templateId: 'tpl-mail',
    initFn: 'initMailApp',
    scriptPath: '/apps/apps/mail.js',
    scriptOrder: 80,
    desktopIcon: outlook32,
    headerIcon: outlook16,
    defaultSize: { width: 720, height: 500 },
    defaultOffset: { x: 130, y: 110 },
    replacesStock: true,
    stockSlot: 'Outlook Express',
    menuAliases: ['Mail', 'E-mail'],
    multiInstance: true,
    productivitySuite: { section: 'core', order: 1 },
  },
  {
    appKey: 'journal',
    displayTitle: 'Notepad',
    headerTitle: 'Untitled - Notepad',
    shellTitle: 'Untitled - Notepad',
    templateId: 'tpl-journal',
    initFn: 'initJournalApp',
    scriptPath: '/apps/apps/journal.js',
    scriptOrder: 40,
    desktopIcon: notepad32,
    headerIcon: notepad16,
    defaultSize: { width: 640, height: 480 },
    defaultOffset: { x: 140, y: 120 },
    replacesStock: true,
    stockSlot: 'Notepad',
    menuAliases: ['Journal', 'Notepad'],
    multiInstance: true,
    productivitySuite: { section: 'core', order: 2 },
    pinnedInStartMenu: true,
    pinnedOrder: 1,
  },
  {
    appKey: 'mycomputer',
    displayTitle: 'My Computer',
    headerTitle: 'My Computer',
    templateId: 'tpl-mycomputer',
    initFn: 'initMyComputerApp',
    scriptPath: '/apps/apps/mycomputer.js',
    scriptOrder: 20,
    desktopIcon: computer32,
    headerIcon: computer16,
    defaultSize: { width: 660, height: 500 },
    defaultOffset: { x: 170, y: 50 },
    replacesStock: true,
    stockSlot: 'My Computer',
    menuAliases: ['Windows Explorer', 'My Computer'],
    productivitySuite: { section: 'core', order: 3 },
  },
  {
    appKey: 'controlpanel',
    displayTitle: 'Control Panel',
    headerTitle: 'Control Panel',
    templateId: 'tpl-controlpanel',
    initFn: null,
    useCpInit: true,
    scriptPath: '/apps/apps/controlpanel.js',
    scriptOrder: 130,
    desktopIcon: controlPanel32,
    headerIcon: controlPanel16,
    defaultSize: { width: 580, height: 420 },
    defaultOffset: { x: 180, y: 160 },
    replacesStock: true,
    stockSlot: 'Control Panel',
    productivitySuite: { section: 'core', order: 4 },
  },
  {
    appKey: 'recyclebin',
    displayTitle: 'Recycle Bin',
    headerTitle: 'Recycle Bin',
    templateId: 'tpl-recyclebin',
    initFn: 'initRecycleBinApp',
    scriptPath: '/apps/apps/recyclebin.js',
    scriptOrder: 10,
    desktopIcon: recycle32,
    desktopIconFull: recycleFull32,
    headerIcon: recycle16,
    headerIconFull: recycleFull16,
    startMenuIcon: recycle16,
    defaultSize: { width: 480, height: 360 },
    defaultOffset: { x: 190, y: 170 },
    showOnDesktop: true,
    productivitySuite: { section: 'core', order: 5 },
  },
  {
    appKey: 'todo',
    displayTitle: 'Todo Tasks',
    headerTitle: 'Todo Tasks',
    templateId: 'tpl-todo',
    initFn: 'initTodoApp',
    scriptPath: '/apps/apps/todo.js',
    scriptOrder: 60,
    desktopIcon: todo32,
    headerIcon: todo16,
    defaultSize: { width: 480, height: 400 },
    defaultOffset: { x: 80, y: 60 },
    showOnDesktop: true,
    productivitySuite: { section: 'suite', order: 1 },
    pinnedInStartMenu: true,
    pinnedOrder: 2,
  },
  {
    appKey: 'bible',
    displayTitle: 'Bible',
    headerTitle: 'Bible',
    templateId: 'tpl-bible',
    initFn: 'initBibleApp',
    scriptPath: '/apps/apps/bible.js',
    scriptOrder: 30,
    desktopIcon: bible32,
    headerIcon: bible16,
    defaultSize: { width: 620, height: 480 },
    defaultOffset: { x: 90, y: 70 },
    showOnDesktop: true,
    productivitySuite: { section: 'suite', order: 2 },
    pinnedInStartMenu: true,
    pinnedOrder: 3,
  },
  {
    appKey: 'calendar',
    displayTitle: 'Calendar',
    headerTitle: 'Calendar',
    templateId: 'tpl-calendar',
    initFn: 'initCalendarApp',
    scriptPath: '/apps/apps/calendar.js',
    scriptOrder: 50,
    desktopIcon: calendar32,
    headerIcon: calendar16,
    defaultSize: { width: 520, height: 420 },
    defaultOffset: { x: 100, y: 80 },
    showOnDesktop: true,
    productivitySuite: { section: 'suite', order: 3 },
    pinnedInStartMenu: true,
    pinnedOrder: 4,
  },
  {
    appKey: 'pomodoro',
    displayTitle: 'Pomodoro Timer',
    headerTitle: 'Pomodoro Timer',
    templateId: 'tpl-pomodoro',
    initFn: 'initPomodoroApp',
    scriptPath: '/apps/apps/pomodoro.js',
    scriptOrder: 55,
    cleanupKey: 'pomodoro',
    desktopIcon: pomodoro32,
    headerIcon: pomodoro16,
    defaultSize: { width: 360, height: 320 },
    defaultOffset: { x: 110, y: 90 },
    showOnDesktop: true,
    menuAliases: ['Pomodoro'],
    productivitySuite: { section: 'suite', order: 4 },
    pinnedInStartMenu: true,
    pinnedOrder: 6,
  },
  {
    appKey: 'kanban',
    displayTitle: 'Kanban Board',
    headerTitle: 'Kanban Board',
    templateId: 'tpl-kanban',
    initFn: 'initKanbanApp',
    scriptPath: '/apps/apps/kanban.js',
    scriptOrder: 70,
    desktopIcon: kanban32,
    headerIcon: kanban16,
    defaultSize: { width: 640, height: 440 },
    defaultOffset: { x: 120, y: 100 },
    showOnDesktop: true,
    productivitySuite: { section: 'suite', order: 5 },
    pinnedInStartMenu: true,
    pinnedOrder: 5,
  },
  {
    appKey: 'clippy',
    displayTitle: 'Office Assistant',
    headerTitle: 'Microsoft Office Assistant',
    shellTitle: 'Microsoft Office Assistant',
    templateId: 'tpl-clippy',
    initFn: 'initClippyApp',
    scriptPath: '/apps/apps/clippy.js',
    scriptOrder: 90,
    desktopIcon: clippy32,
    headerIcon: clippy16,
    defaultSize: { width: 720, height: 500 },
    defaultOffset: { x: 150, y: 130 },
    showOnDesktop: true,
    menuAliases: ['Clippy Prompts', 'Office Assistant'],
    productivitySuite: { section: 'suite', order: 6 },
  },
  {
    appKey: 'textdiff',
    displayTitle: 'Compare Documents',
    headerTitle: 'Compare Documents',
    templateId: 'tpl-textdiff',
    initFn: 'initTextDiffApp',
    scriptPath: '/apps/apps/textdiff.js',
    scriptOrder: 100,
    desktopIcon: textdiff32,
    headerIcon: textdiff16,
    defaultSize: { width: 640, height: 480 },
    defaultOffset: { x: 160, y: 140 },
    showOnDesktop: true,
    menuAliases: ['Text Diff'],
    multiInstance: true,
    productivitySuite: { section: 'suite', order: 7 },
  },
  {
    appKey: 'qrtx',
    displayTitle: 'QRx Transmitter',
    headerTitle: 'QRx Transmitter',
    templateId: 'tpl-qrtx',
    initFn: 'initQrtxApp',
    scriptPath: '/apps/apps/qrtx.js',
    scriptOrder: 140,
    cleanupKey: 'qrtx',
    desktopIcon: qrtx32,
    headerIcon: qrtx16,
    defaultSize: { width: 520, height: 480 },
    defaultOffset: { x: 200, y: 180 },
    showOnDesktop: true,
    productivitySuite: { section: 'suite', order: 8 },
  },
  {
    appKey: 'search',
    displayTitle: 'Search',
    headerTitle: 'Search',
    templateId: 'tpl-search',
    initFn: 'initSearchApp',
    scriptPath: '/apps/apps/search.js',
    scriptOrder: 110,
    desktopIcon: search32,
    headerIcon: search16,
    defaultSize: { width: 480, height: 400 },
    defaultOffset: { x: 220, y: 100 },
    showOnDesktop: false,
    menuAliases: ['Search'],
    productivitySuite: { section: 'tools', order: 1 },
  },
  {
    appKey: 'help',
    displayTitle: 'Help and Support',
    headerTitle: 'Help and Support',
    templateId: 'tpl-help',
    initFn: null,
    desktopIcon: help32,
    headerIcon: help16,
    defaultSize: { width: 420, height: 350 },
    defaultOffset: { x: 200, y: 120 },
    showOnDesktop: false,
    menuAliases: ['Help and Support', 'Tour Windows XP'],
    productivitySuite: { section: 'tools', order: 2 },
  },
  {
    appKey: 'run',
    displayTitle: 'Run',
    headerTitle: 'Run',
    templateId: 'tpl-run',
    initFn: null,
    desktopIcon: run32,
    headerIcon: run16,
    defaultSize: { width: 360, height: 165 },
    defaultOffset: { x: 240, y: 140 },
    showOnDesktop: false,
    resizable: false,
    menuAliases: ['Run...'],
  },
];

export const EMBEDDED_BOOTSTRAP_SCRIPTS = [
  '/apps/qrcode.js',
  '/apps/stores.js',
  '/apps/shell-events.js',
  '/apps/shell-state.js',
  '/apps/shell-helpers.js',
  '/apps/vendor/98/vendor98.js',
];

export const EMBEDDED_GLOBAL_SCRIPTS = [
  '/apps/template-manager.js',
  '/apps/embedded-bridge.js',
  '/apps/run-dialog.js',
  '/apps/shell-dialogs.js',
  '/apps/shell-keyboard.js',
  '/apps/apps/lockscreen.js',
];

/** @returns {string[]} */
export function getEmbeddedScriptChain() {
  const appScripts = APP_REGISTRY.filter((d) => d.scriptPath)
    .sort((a, b) => (a.scriptOrder ?? 0) - (b.scriptOrder ?? 0))
    .map((d) => d.scriptPath);
  return [
    ...EMBEDDED_BOOTSTRAP_SCRIPTS,
    ...appScripts,
    ...EMBEDDED_GLOBAL_SCRIPTS,
  ];
}

/** Serializable manifest for embedded-bridge (injected on window before global scripts load). */
export function getEmbeddedAppManifest() {
  return APP_REGISTRY.map((def) => ({
    appKey: def.appKey,
    title: def.shellTitle ?? def.headerTitle,
    initFn: def.useCpInit ? null : def.initFn,
    useCpInit: !!def.useCpInit,
    cleanup: def.cleanupKey ?? null,
  }));
}

/** @returns {Record<string, string>} */
export function buildMenuAliasMap() {
  const map = {};
  for (const def of APP_REGISTRY) {
    map[def.displayTitle] = def.displayTitle;
    for (const alias of def.menuAliases ?? []) {
      map[alias] = def.displayTitle;
    }
  }
  return map;
}

const SUITE_SECTIONS = ['core', 'suite', 'tools'];

/** @returns {Array<{type: string, icon?: *, text?: string}>} */
export function buildProductivitySuiteMenuItems() {
  const items = [];
  for (let s = 0; s < SUITE_SECTIONS.length; s += 1) {
    const section = SUITE_SECTIONS[s];
    const sectionApps = APP_REGISTRY.filter(
      (d) => d.productivitySuite?.section === section,
    ).sort(
      (a, b) =>
        (a.productivitySuite?.order ?? 0) - (b.productivitySuite?.order ?? 0),
    );
    for (const def of sectionApps) {
      items.push({
        type: 'item',
        icon: def.startMenuIcon ?? def.headerIcon,
        text: def.displayTitle,
      });
    }
    if (section !== 'tools' && sectionApps.length > 0) {
      items.push({ type: 'separator' });
    }
  }
  return items;
}

/** Pinned shortcuts in the Start Menu left column (registry apps only). */
export function buildPinnedStartMenuItems() {
  return APP_REGISTRY.filter((d) => d.pinnedInStartMenu)
    .sort((a, b) => (a.pinnedOrder ?? 0) - (b.pinnedOrder ?? 0))
    .map((def) => ({
      icon: def.startMenuIcon ?? def.desktopIcon,
      text: def.displayTitle,
    }));
}

export const appRegistryByKey = Object.fromEntries(
  APP_REGISTRY.map((def) => [def.appKey, def]),
);

/** @deprecated Use APP_REGISTRY — kept for gradual migration */
export const embeddedAppDefs = APP_REGISTRY;

export const desktopEmbeddedApps = APP_REGISTRY.filter(
  (def) => def.showOnDesktop !== false,
);
