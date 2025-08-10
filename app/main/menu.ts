import { app, Menu } from 'electron';
import type { Locale } from './settings';
import { getMenuLabelsForLocale } from './menu_i18n';

export function setApplicationMenuForLocale(locale: Locale): void {
  const L = getMenuLabelsForLocale(locale, app.name);
  const isMac = process.platform === 'darwin';

  const template: Electron.MenuItemConstructorOptions[] = [
    // App menu (macOS)
    ...(isMac
      ? [
          {
            label: L.app,
            submenu: [
              { role: 'about', label: L.about },
              { type: 'separator' },
              { role: 'services' },
              { type: 'separator' },
              { role: 'hide', label: L.hide },
              { role: 'hideOthers', label: L.hideOthers },
              { role: 'unhide', label: L.unhide },
              { type: 'separator' },
              { role: 'quit', label: L.quit },
            ] as Electron.MenuItemConstructorOptions[],
          },
        ]
      : []),
    // Edit
    {
      label: L.edit,
      submenu: [
        { role: 'undo', label: L.undo },
        { role: 'redo', label: L.redo },
        { type: 'separator' },
        { role: 'cut', label: L.cut },
        { role: 'copy', label: L.copy },
        { role: 'paste', label: L.paste },
        { role: 'selectAll', label: L.selectAll },
      ] as Electron.MenuItemConstructorOptions[],
    },
    // View
    {
      label: L.view,
      submenu: [
        { role: 'reload', label: L.reload },
        { role: 'toggleDevTools', label: L.toggleDevTools },
        { type: 'separator' },
        { role: 'resetZoom', label: L.resetZoom },
        { role: 'zoomIn', label: L.zoomIn },
        { role: 'zoomOut', label: L.zoomOut },
        { type: 'separator' },
        { role: 'togglefullscreen', label: L.toggleFullScreen },
      ] as Electron.MenuItemConstructorOptions[],
    },
    // Window
    {
      label: L.window,
      role: 'window',
      submenu: [
        { role: 'minimize', label: L.minimize },
        { role: 'close', label: L.closeWindow },
      ] as Electron.MenuItemConstructorOptions[],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}


