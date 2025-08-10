import type { Locale } from './settings';

type MenuLabels = {
  app: string;
  about: string;
  quit: string;
  edit: string;
  undo: string;
  redo: string;
  cut: string;
  copy: string;
  paste: string;
  selectAll: string;
  view: string;
  reload: string;
  toggleDevTools: string;
  resetZoom: string;
  zoomIn: string;
  zoomOut: string;
  toggleFullScreen: string;
  window: string;
  minimize: string;
  closeWindow: string;
  hide: string;
  hideOthers: string;
  unhide: string;
};

const catalogs: Record<Locale, Record<string, string>> = {
  en: {
    'menu.app': '{appName}',
    'menu.about': 'About {appName}',
    'menu.quit': 'Quit {appName}',
    'menu.edit': 'Edit',
    'menu.undo': 'Undo',
    'menu.redo': 'Redo',
    'menu.cut': 'Cut',
    'menu.copy': 'Copy',
    'menu.paste': 'Paste',
    'menu.selectAll': 'Select All',
    'menu.view': 'View',
    'menu.reload': 'Reload',
    'menu.toggleDevTools': 'Toggle Developer Tools',
    'menu.resetZoom': 'Actual Size',
    'menu.zoomIn': 'Zoom In',
    'menu.zoomOut': 'Zoom Out',
    'menu.toggleFullScreen': 'Toggle Full Screen',
    'menu.window': 'Window',
    'menu.minimize': 'Minimize',
    'menu.closeWindow': 'Close Window',
    'menu.hide': 'Hide',
    'menu.hideOthers': 'Hide Others',
    'menu.unhide': 'Show All',
  },
  fr: {
    'menu.app': '{appName}',
    'menu.about': 'À propos de {appName}',
    'menu.quit': 'Quitter {appName}',
    'menu.edit': 'Édition',
    'menu.undo': 'Annuler',
    'menu.redo': 'Rétablir',
    'menu.cut': 'Couper',
    'menu.copy': 'Copier',
    'menu.paste': 'Coller',
    'menu.selectAll': 'Tout sélectionner',
    'menu.view': 'Affichage',
    'menu.reload': 'Recharger',
    'menu.toggleDevTools': 'Outils de développement',
    'menu.resetZoom': 'Taille réelle',
    'menu.zoomIn': 'Agrandir',
    'menu.zoomOut': 'Rétrécir',
    'menu.toggleFullScreen': 'Plein écran',
    'menu.window': 'Fenêtre',
    'menu.minimize': 'Minimiser',
    'menu.closeWindow': 'Fermer la fenêtre',
    'menu.hide': 'Masquer',
    'menu.hideOthers': 'Masquer les autres',
    'menu.unhide': 'Tout afficher',
  },
};

function format(template: string, params: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_m, p1) => params[p1] ?? '');
}

export function getMenuLabelsForLocale(locale: Locale, appName: string): MenuLabels {
  const dict = catalogs[locale] ?? catalogs.en;
  const p = { appName };
  return {
    app: format(dict['menu.app'], p),
    about: format(dict['menu.about'], p),
    quit: format(dict['menu.quit'], p),
    edit: format(dict['menu.edit'], p),
    undo: format(dict['menu.undo'], p),
    redo: format(dict['menu.redo'], p),
    cut: format(dict['menu.cut'], p),
    copy: format(dict['menu.copy'], p),
    paste: format(dict['menu.paste'], p),
    selectAll: format(dict['menu.selectAll'], p),
    view: format(dict['menu.view'], p),
    reload: format(dict['menu.reload'], p),
    toggleDevTools: format(dict['menu.toggleDevTools'], p),
    resetZoom: format(dict['menu.resetZoom'], p),
    zoomIn: format(dict['menu.zoomIn'], p),
    zoomOut: format(dict['menu.zoomOut'], p),
    toggleFullScreen: format(dict['menu.toggleFullScreen'], p),
    window: format(dict['menu.window'], p),
    minimize: format(dict['menu.minimize'], p),
    closeWindow: format(dict['menu.closeWindow'], p),
    hide: format(dict['menu.hide'], p),
    hideOthers: format(dict['menu.hideOthers'], p),
    unhide: format(dict['menu.unhide'], p),
  };
}


