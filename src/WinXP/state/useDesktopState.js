import { useReducer, useCallback } from 'react';
import { initState, reducer } from './reducer';
import {
  ADD_APP,
  DEL_APP,
  FOCUS_APP,
  MINIMIZE_APP,
  TOGGLE_MAXIMIZE_APP,
  FOCUS_ICON,
  SELECT_ICONS,
  FOCUS_DESKTOP,
  START_SELECT,
  END_SELECT,
  SORT_ICONS,
  POWER_OFF,
  CANCEL_POWER_OFF,
  RESET_SESSION,
  SET_POWER_STATE,
} from '../constants/actions';
import { POWER_STATE, FOCUSING } from '../constants';
import { appSettings } from '../apps';
import { appByKey, buildMenuAliasMap } from '../apps/EmbeddedApp';

export function useDesktopState() {
  const [state, dispatch] = useReducer(reducer, initState);

  const getFocusedAppId = useCallback(() => {
    if (state.focusing !== FOCUSING.WINDOW) return -1;
    const focusedApp = [...state.apps]
      .sort((a, b) => b.zIndex - a.zIndex)
      .find((app) => !app.minimized);
    return focusedApp ? focusedApp.id : -1;
  }, [state.focusing, state.apps]);

  const focusedAppId = getFocusedAppId();

  const onFocusApp = useCallback((id) => {
    dispatch({ type: FOCUS_APP, payload: id });
  }, []);

  const onMaximizeWindow = useCallback(
    (id) => {
      if (focusedAppId === id) {
        dispatch({ type: TOGGLE_MAXIMIZE_APP, payload: id });
      }
    },
    [focusedAppId],
  );

  const onMinimizeWindow = useCallback(
    (id) => {
      if (focusedAppId === id) {
        dispatch({ type: MINIMIZE_APP, payload: id });
      }
    },
    [focusedAppId],
  );

  const onCloseApp = useCallback(
    (id) => {
      if (focusedAppId === id) {
        dispatch({ type: DEL_APP, payload: id });
      }
    },
    [focusedAppId],
  );

  const onMouseDownFooterApp = useCallback(
    (id) => {
      if (focusedAppId === id) {
        dispatch({ type: MINIMIZE_APP, payload: id });
      } else {
        dispatch({ type: FOCUS_APP, payload: id });
      }
    },
    [focusedAppId],
  );

  const onMouseDownIcon = useCallback((id) => {
    dispatch({ type: FOCUS_ICON, payload: id });
  }, []);

  const onDoubleClickIcon = useCallback((component) => {
    const appSetting = Object.values(appSettings).find(
      (setting) => setting.component === component,
    );
    if (appSetting) dispatch({ type: ADD_APP, payload: appSetting });
  }, []);

  const onMouseDownFooter = useCallback(() => {
    dispatch({ type: FOCUS_DESKTOP });
  }, []);

  const openEmbeddedApp = useCallback((appKey) => {
    const setting = appByKey[appKey];
    if (setting) dispatch({ type: ADD_APP, payload: setting });
    else
      dispatch({
        type: ADD_APP,
        payload: {
          ...appSettings.Error,
          injectProps: { message: 'C:\\\nApplication not found' },
        },
      });
  }, []);

  const onClickMenuItem = useCallback((o) => {
    if (o === 'Lock Computer') {
      if (window.ShellAPI) window.ShellAPI.showLockScreen();
      return;
    }
    if (o === 'Log Off') {
      dispatch({ type: POWER_OFF, payload: POWER_STATE.LOG_OFF });
      return;
    }
    if (o === 'Turn Off Computer') {
      dispatch({ type: POWER_OFF, payload: POWER_STATE.TURN_OFF });
      return;
    }
    const aliasMap = buildMenuAliasMap();
    const key = aliasMap[o] || o;
    if (appSettings[key]) {
      dispatch({ type: ADD_APP, payload: appSettings[key] });
      return;
    }
    dispatch({
      type: ADD_APP,
      payload: {
        ...appSettings.Error,
        injectProps: { message: 'C:\\\nApplication not found' },
      },
    });
  }, []);

  const onDesktopMenuAction = useCallback((action) => {
    switch (action) {
      case 'refresh':
        window.location.reload();
        break;
      case 'arrange-name':
        dispatch({ type: SORT_ICONS });
        break;
      case 'new-notepad':
        dispatch({ type: ADD_APP, payload: appSettings.Notepad });
        break;
      case 'new-paint':
        dispatch({ type: ADD_APP, payload: appSettings.Paint });
        break;
      case 'new-ie':
        dispatch({ type: ADD_APP, payload: appSettings['Internet Explorer'] });
        break;
      case 'properties':
        dispatch({ type: ADD_APP, payload: appSettings['Control Panel'] });
        break;
      default:
        break;
    }
  }, []);

  const onClickModalButton = useCallback((text) => {
    dispatch({ type: CANCEL_POWER_OFF });

    switch (text) {
      case 'Turn Off':
        if (window.ShellAPI) window.ShellAPI.saveSession();
        dispatch({ type: SET_POWER_STATE, payload: POWER_STATE.SHUTDOWN });
        break;
      case 'Restart':
        window.setTimeout(() => window.location.reload(), 400);
        break;
      case 'Log Off':
        dispatch({ type: RESET_SESSION });
        break;
      case 'Switch User':
        if (window.ShellAPI) window.ShellAPI.showLockScreen();
        break;
      default:
        break;
    }
  }, []);

  const onModalClose = useCallback(() => {
    dispatch({ type: CANCEL_POWER_OFF });
  }, []);

  const onBootComplete = useCallback(() => {
    dispatch({ type: SET_POWER_STATE, payload: POWER_STATE.START });
  }, []);

  const onShutdownWake = useCallback(() => {
    dispatch({ type: SET_POWER_STATE, payload: POWER_STATE.START });
  }, []);

  const onStartSelect = useCallback((payload) => {
    dispatch({ type: START_SELECT, payload });
  }, []);

  const onEndSelect = useCallback(() => {
    dispatch({ type: END_SELECT });
  }, []);

  const onIconsSelected = useCallback((iconIds) => {
    dispatch({ type: SELECT_ICONS, payload: iconIds });
  }, []);

  const focusDesktop = useCallback(() => {
    dispatch({ type: FOCUS_DESKTOP });
  }, []);

  const triggerPowerOff = useCallback((mode) => {
    dispatch({ type: POWER_OFF, payload: mode });
  }, []);

  return {
    state,
    focusedAppId,
    onFocusApp,
    onMaximizeWindow,
    onMinimizeWindow,
    onCloseApp,
    onMouseDownFooterApp,
    onMouseDownIcon,
    onDoubleClickIcon,
    onMouseDownFooter,
    openEmbeddedApp,
    onClickMenuItem,
    onDesktopMenuAction,
    onClickModalButton,
    onModalClose,
    onBootComplete,
    onShutdownWake,
    onStartSelect,
    onEndSelect,
    onIconsSelected,
    focusDesktop,
    triggerPowerOff,
  };
}
