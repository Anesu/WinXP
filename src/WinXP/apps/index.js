import InternetExplorer from './InternetExplorer';
import Minesweeper from './Minesweeper';
import ErrorBox from './ErrorBox';
import Winamp from './Winamp';
import Paint from './Paint';
import {
  embeddedAppSettings,
  desktopEmbeddedApps,
} from './EmbeddedApp';
import iePaper from 'assets/windowsIcons/ie-paper.png';
import ie from 'assets/windowsIcons/ie.png';
import mine from 'assets/minesweeper/mine-icon.png';
import error from 'assets/windowsIcons/897(16x16).png';
import winamp from 'assets/windowsIcons/winamp.png';
import paintLarge from 'assets/windowsIcons/680(32x32).png';
import paint from 'assets/windowsIcons/680(16x16).png';

const gen = () => {
  let id = -1;
  return () => {
    id += 1;
    return id;
  };
};
const genId = gen();
const genIndex = gen();

const MyComputerApp = embeddedAppSettings['My Computer'].component;

export const defaultAppState = [
  {
    component: InternetExplorer,
    header: {
      title: 'Internet Explorer',
      icon: iePaper,
    },
    defaultSize: { width: 700, height: 500 },
    defaultOffset: { x: 130, y: 20 },
    resizable: true,
    minimized: false,
    maximized: window.innerWidth < 800,
    id: genId(),
    zIndex: genIndex(),
  },
  {
    component: Minesweeper,
    header: { title: 'Minesweeper', icon: mine },
    defaultSize: { width: 0, height: 0 },
    defaultOffset: { x: 180, y: 170 },
    resizable: false,
    minimized: false,
    maximized: false,
    id: genId(),
    zIndex: genIndex(),
  },
  {
    component: MyComputerApp,
    header: embeddedAppSettings['My Computer'].header,
    defaultSize: embeddedAppSettings['My Computer'].defaultSize,
    defaultOffset: embeddedAppSettings['My Computer'].defaultOffset,
    resizable: true,
    minimized: false,
    maximized: window.innerWidth < 800,
    id: genId(),
    zIndex: genIndex(),
  },
];

const productivityDesktopIcons = desktopEmbeddedApps.map((def, index) => ({
  id: 100 + index,
  icon: def.desktopIcon,
  title: def.displayTitle,
  component: embeddedAppSettings[def.displayTitle].component,
  isFocus: false,
}));

export const defaultIconState = [
  {
    id: 0,
    icon: ie,
    title: 'Internet Explorer',
    component: InternetExplorer,
    isFocus: false,
  },
  {
    id: 1,
    icon: mine,
    title: 'Minesweeper',
    component: Minesweeper,
    isFocus: false,
  },
  ...productivityDesktopIcons,
  {
    id: 200,
    icon: winamp,
    title: 'Winamp',
    component: Winamp,
    isFocus: false,
  },
  {
    id: 201,
    icon: paintLarge,
    title: 'Paint',
    component: Paint,
    isFocus: false,
  },
];

export const appSettings = {
  'Internet Explorer': {
    header: { icon: iePaper, title: 'InternetExplorer' },
    component: InternetExplorer,
    defaultSize: { width: 700, height: 500 },
    defaultOffset: { x: 140, y: 30 },
    resizable: true,
    minimized: false,
    maximized: window.innerWidth < 800,
    multiInstance: true,
  },
  Minesweeper: {
    header: { icon: mine, title: 'Minesweeper' },
    component: Minesweeper,
    defaultSize: { width: 0, height: 0 },
    defaultOffset: { x: 190, y: 180 },
    resizable: false,
    minimized: false,
    maximized: false,
    multiInstance: true,
  },
  Error: {
    header: {
      icon: error,
      title: 'C:\\',
      buttons: ['close'],
      noFooterWindow: true,
    },
    component: ErrorBox,
    defaultSize: { width: 380, height: 0 },
    defaultOffset: {
      x: window.innerWidth / 2 - 190,
      y: window.innerHeight / 2 - 60,
    },
    resizable: false,
    minimized: false,
    maximized: false,
    multiInstance: true,
  },
  ...embeddedAppSettings,
  Winamp: {
    header: { icon: winamp, title: 'Winamp', invisible: true },
    component: Winamp,
    defaultSize: { width: 0, height: 0 },
    defaultOffset: { x: 0, y: 0 },
    resizable: false,
    minimized: false,
    maximized: false,
    multiInstance: false,
  },
  Paint: {
    header: { icon: paint, title: 'Untitled - Paint' },
    component: Paint,
    defaultSize: { width: 660, height: 500 },
    defaultOffset: { x: 280, y: 70 },
    resizable: true,
    minimized: false,
    maximized: window.innerWidth < 800,
    multiInstance: true,
  },
};

export { InternetExplorer, Minesweeper, ErrorBox, Winamp };