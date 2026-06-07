import { createEmbeddedApp } from './createEmbeddedApp';

import outlook32 from 'assets/windowsIcons/887(32x32).png';
import outlook16 from 'assets/windowsIcons/887(16x16).png';
import notepad32 from 'assets/windowsIcons/327(32x32).png';
import notepad16 from 'assets/windowsIcons/327(16x16).png';
import computer32 from 'assets/windowsIcons/676(32x32).png';
import computer16 from 'assets/windowsIcons/676(16x16).png';
import controlPanel32 from 'assets/windowsIcons/300(32x32).png';
import controlPanel16 from 'assets/windowsIcons/300(16x16).png';
import calculator32 from 'assets/windowsIcons/74(32x32).png';
import calculator16 from 'assets/windowsIcons/74(16x16).png';
import folder32 from 'assets/windowsIcons/folder.png';
import help32 from 'assets/windowsIcons/747(32x32).png';
import help16 from 'assets/windowsIcons/747(16x16).png';
import search32 from 'assets/windowsIcons/299(32x32).png';
import search16 from 'assets/windowsIcons/554(16x16).png';
import ie32 from 'assets/windowsIcons/896(16x16).png';

const P = process.env.PUBLIC_URL || '';
const recycle32 = `${P}/apps/vendor/98/images/icons/recycle-bin-32x32.png`;
const recycle16 = `${P}/apps/vendor/98/images/icons/recycle-bin-16x16.png`;
const task32 = `${P}/apps/vendor/98/images/icons/task-32x32.png`;
const task16 = `${P}/apps/vendor/98/images/icons/task-16x16.png`;
const chm32 = `${P}/apps/vendor/98/images/icons/chm-32x32.png`;
const chm16 = `${P}/apps/vendor/98/images/icons/chm-16x16.png`;
const calendar32 = `${P}/apps/vendor/98/images/icons/favorites-folder-32x32.png`;
const calendar16 = `${P}/apps/vendor/98/images/icons/favorites-folder-16x16.png`;
const kanban32 = `${P}/apps/vendor/98/images/icons/programs-folder-32x32.png`;
const kanban16 = `${P}/apps/vendor/98/images/icons/programs-folder-16x16.png`;

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
    headerIcon: recycle16,
    defaultSize: { width: 480, height: 360 },
    defaultOffset: { x: 190, y: 170 },
    showOnDesktop: true,
  },
  {
    appKey: 'todo',
    templateId: 'tpl-todo',
    initFn: 'initTodoApp',
    displayTitle: 'Todo Tasks',
    headerTitle: 'Todo Tasks',
    desktopIcon: task32,
    headerIcon: task16,
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
    desktopIcon: chm32,
    headerIcon: chm16,
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
    desktopIcon: calculator32,
    headerIcon: calculator16,
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
    desktopIcon: help32,
    headerIcon: help16,
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
    desktopIcon: search32,
    headerIcon: search16,
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
    desktopIcon: ie32,
    headerIcon: ie32,
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
    },
    component,
    defaultSize: def.defaultSize,
    defaultOffset: def.defaultOffset,
    resizable: true,
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
