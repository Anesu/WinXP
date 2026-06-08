import { createEmbeddedApp } from './createEmbeddedApp';

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

/**
 * displayTitle — desktop icon & Start menu label (XP names where applicable)
 * appKey — internal id used by app JS and openApp()
 */
export const embeddedAppDefs = [
  {
    appKey: 'mail',
    templateId: 'tpl-mail',
    initFn: 'initMailApp',
    displayTitle: 'Outlook Express',
    headerTitle: 'Outlook Express',
    desktopIcon: outlook32,
    headerIcon: outlook16,
    defaultSize: { width: 720, height: 500 },
    defaultOffset: { x: 130, y: 110 },
    replacesStock: true,
    stockSlot: 'Outlook Express',
  },
  {
    appKey: 'journal',
    templateId: 'tpl-journal',
    initFn: 'initJournalApp',
    displayTitle: 'Notepad',
    headerTitle: 'Untitled - Notepad',
    desktopIcon: notepad32,
    headerIcon: notepad16,
    defaultSize: { width: 640, height: 480 },
    defaultOffset: { x: 140, y: 120 },
    replacesStock: true,
    stockSlot: 'Notepad',
  },
  {
    appKey: 'mycomputer',
    templateId: 'tpl-mycomputer',
    initFn: 'initMyComputerApp',
    displayTitle: 'My Computer',
    headerTitle: 'My Computer',
    desktopIcon: computer32,
    headerIcon: computer16,
    defaultSize: { width: 660, height: 500 },
    defaultOffset: { x: 170, y: 50 },
    replacesStock: true,
    stockSlot: 'My Computer',
  },
  {
    appKey: 'controlpanel',
    templateId: 'tpl-controlpanel',
    initFn: null,
    displayTitle: 'Control Panel',
    headerTitle: 'Control Panel',
    desktopIcon: controlPanel32,
    headerIcon: controlPanel16,
    defaultSize: { width: 580, height: 420 },
    defaultOffset: { x: 180, y: 160 },
    replacesStock: true,
    stockSlot: 'Control Panel',
  },
  {
    appKey: 'recyclebin',
    templateId: 'tpl-recyclebin',
    initFn: 'initRecycleBinApp',
    displayTitle: 'Recycle Bin',
    headerTitle: 'Recycle Bin',
    desktopIcon: recycle32,
    desktopIconFull: recycleFull32,
    headerIcon: recycle16,
    headerIconFull: recycleFull16,
    defaultSize: { width: 480, height: 360 },
    defaultOffset: { x: 190, y: 170 },
    showOnDesktop: true,
  },
  {
    appKey: 'help',
    templateId: 'tpl-help',
    initFn: null,
    displayTitle: 'Help and Support',
    headerTitle: 'Help and Support',
    desktopIcon: help32,
    headerIcon: help16,
    defaultSize: { width: 420, height: 350 },
    defaultOffset: { x: 200, y: 120 },
    showOnDesktop: false,
  },
  {
    appKey: 'run',
    templateId: 'tpl-run',
    initFn: null,
    displayTitle: 'Run',
    headerTitle: 'Run',
    desktopIcon: run32,
    headerIcon: run16,
    defaultSize: { width: 360, height: 165 },
    defaultOffset: { x: 240, y: 140 },
    showOnDesktop: false,
    resizable: false,
  },
  {
    appKey: 'search',
    templateId: 'tpl-search',
    initFn: 'initSearchApp',
    displayTitle: 'Search',
    headerTitle: 'Search',
    desktopIcon: search32,
    headerIcon: search16,
    defaultSize: { width: 480, height: 400 },
    defaultOffset: { x: 220, y: 100 },
    showOnDesktop: false,
  },
  {
    appKey: 'todo',
    templateId: 'tpl-todo',
    initFn: 'initTodoApp',
    displayTitle: 'Todo Tasks',
    headerTitle: 'Todo Tasks',
    desktopIcon: todo32,
    headerIcon: todo16,
    defaultSize: { width: 480, height: 400 },
    defaultOffset: { x: 80, y: 60 },
    showOnDesktop: true,
  },
  {
    appKey: 'bible',
    templateId: 'tpl-bible',
    initFn: 'initBibleApp',
    displayTitle: 'Bible',
    headerTitle: 'Bible',
    desktopIcon: bible32,
    headerIcon: bible16,
    defaultSize: { width: 620, height: 480 },
    defaultOffset: { x: 90, y: 70 },
    showOnDesktop: true,
  },
  {
    appKey: 'calendar',
    templateId: 'tpl-calendar',
    initFn: 'initCalendarApp',
    displayTitle: 'Calendar',
    headerTitle: 'Calendar',
    desktopIcon: calendar32,
    headerIcon: calendar16,
    defaultSize: { width: 520, height: 420 },
    defaultOffset: { x: 100, y: 80 },
    showOnDesktop: true,
  },
  {
    appKey: 'pomodoro',
    templateId: 'tpl-pomodoro',
    initFn: 'initPomodoroApp',
    displayTitle: 'Pomodoro Timer',
    headerTitle: 'Pomodoro Timer',
    desktopIcon: pomodoro32,
    headerIcon: pomodoro16,
    defaultSize: { width: 360, height: 320 },
    defaultOffset: { x: 110, y: 90 },
    showOnDesktop: true,
  },
  {
    appKey: 'kanban',
    templateId: 'tpl-kanban',
    initFn: 'initKanbanApp',
    displayTitle: 'Kanban Board',
    headerTitle: 'Kanban Board',
    desktopIcon: kanban32,
    headerIcon: kanban16,
    defaultSize: { width: 640, height: 440 },
    defaultOffset: { x: 120, y: 100 },
    showOnDesktop: true,
  },
  {
    appKey: 'clippy',
    templateId: 'tpl-clippy',
    initFn: 'initClippyApp',
    displayTitle: 'Office Assistant',
    headerTitle: 'Microsoft Office Assistant',
    desktopIcon: clippy32,
    headerIcon: clippy16,
    defaultSize: { width: 720, height: 500 },
    defaultOffset: { x: 150, y: 130 },
    showOnDesktop: true,
  },
  {
    appKey: 'textdiff',
    templateId: 'tpl-textdiff',
    initFn: 'initTextDiffApp',
    displayTitle: 'Compare Documents',
    headerTitle: 'Compare Documents',
    desktopIcon: textdiff32,
    headerIcon: textdiff16,
    defaultSize: { width: 640, height: 480 },
    defaultOffset: { x: 160, y: 140 },
    showOnDesktop: true,
  },
  {
    appKey: 'qrtx',
    templateId: 'tpl-qrtx',
    initFn: 'initQrtxApp',
    displayTitle: 'QRx Transmitter',
    headerTitle: 'QRx Transmitter',
    desktopIcon: qrtx32,
    headerIcon: qrtx16,
    defaultSize: { width: 520, height: 480 },
    defaultOffset: { x: 200, y: 180 },
    showOnDesktop: true,
  },
];

export const embeddedAppSettings = {};
export const embeddedComponents = {};

embeddedAppDefs.forEach((def) => {
  const component = createEmbeddedApp({
    ...def,
    title: def.displayTitle,
    displayName: `XpApp_${def.appKey}`,
  });
  embeddedComponents[def.displayTitle] = component;
  embeddedAppSettings[def.displayTitle] = {
    header: {
      title: def.headerTitle,
      icon: def.headerIcon,
      iconFull: def.headerIconFull,
    },
    component,
    defaultSize: def.defaultSize,
    defaultOffset: def.defaultOffset,
    resizable: def.resizable !== false,
    minimized: false,
    maximized: window.innerWidth < 800,
    multiInstance:
      def.appKey === 'journal' ||
      def.appKey === 'mail' ||
      def.appKey === 'textdiff',
  };
});

export const appByKey = Object.fromEntries(
  embeddedAppDefs.map((def) => [
    def.appKey,
    embeddedAppSettings[def.displayTitle],
  ]),
);

export const desktopEmbeddedApps = embeddedAppDefs.filter(
  (def) => def.showOnDesktop !== false,
);
