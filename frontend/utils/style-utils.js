/**
 * CSS Utility-Funktionen für das Poll-Component
 * Stellt Funktionen zum Laden und Anwenden von CSS bereit
 * Mit dynamischem Laden nach Bedarf
 */

// Cache für geladene Stylesheets
let baseStylesheet = null;
let moduleStylesheets = {};

// Mapping von Ansichten zu benötigten CSS-Modulen
const viewModuleMap = {
  'mainMenu': ['base', 'mainMenu'],
  'joinPoll': ['base', 'joinPoll'],
  'createPoll': ['base', 'createPoll'],
  'pollQuestions': ['base', 'pollQuestions'],
  'pollList': ['base', 'pollList'],
  'adminPanel': ['base', 'adminPanel']
};

/**
 * Lädt eine einzelne CSS-Datei und konvertiert sie in ein CSSStyleSheet
 * @param {string} cssPath - Pfad zur CSS-Datei
 * @returns {Promise<CSSStyleSheet>} Promise mit dem StyleSheet
 */
async function loadStylesheet(cssPath) {
  try {
    const response = await fetch(cssPath);
    if (!response.ok) {
      throw new Error(`Fehler beim Laden von ${cssPath}: ${response.status} ${response.statusText}`);
    }
    
    const cssText = await response.text();
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(cssText);
    
    return sheet;
  } catch (error) {
    console.error(`Konnte ${cssPath} nicht laden:`, error);
    // Leeres Stylesheet zurückgeben, damit die Anwendung nicht abstürzt
    return new CSSStyleSheet();
  }
}

/**
 * Lädt die erforderlichen CSS-Module für eine bestimmte Ansicht
 * @param {string} view - Name der Ansicht (z.B. 'mainMenu', 'joinPoll', etc.)
 * @returns {Promise<CSSStyleSheet[]>} Array von CSSStyleSheets
 */
export async function loadViewStyles(view) {
  if (!viewModuleMap[view]) {
    console.warn(`Unbekannte Ansicht: ${view}, lade nur Base CSS`);
    view = 'mainMenu'; // Fallback auf mainMenu
  }
  
  const requiredModules = viewModuleMap[view];
  const styles = [];
  
  try {
    // Base CSS immer zuerst laden
    if (!baseStylesheet) {
      baseStylesheet = await loadStylesheet('./frontend/styles/base.css');
    }
    styles.push(baseStylesheet);
    
    // Lade nur die für diese Ansicht benötigten Module
    for (const moduleName of requiredModules) {
      if (moduleName === 'base') continue; // Base bereits geladen
      
      if (!moduleStylesheets[moduleName]) {
        const path = `./frontend/styles/${moduleName.replace(/([A-Z])/g, '-$1').toLowerCase()}.css`;
        moduleStylesheets[moduleName] = await loadStylesheet(path);
      }
      
      styles.push(moduleStylesheets[moduleName]);
    }
    
    return styles;
  } catch (error) {
    console.error(`Fehler beim Laden der Styles für ${view}:`, error);
    // Fallback: Wenn ein Fehler auftritt, mindestens Base CSS zurückgeben
    return baseStylesheet ? [baseStylesheet] : [];
  }
}

/**
 * Wendet die für eine bestimmte Ansicht benötigten Stylesheets auf das Shadow DOM an
 * @param {ShadowRoot} shadowRoot - Das Shadow DOM der Komponente
 * @param {string} view - Name der aktuellen Ansicht
 * @returns {Promise<void>}
 */
export async function applyStylesToShadowRoot(shadowRoot, view = 'mainMenu') {
  if (!shadowRoot) {
    console.warn("Kein Shadow Root zum Anwenden der Styles übergeben");
    return;
  }
  
  try {
    const viewStylesheets = await loadViewStyles(view);
    shadowRoot.adoptedStyleSheets = viewStylesheets;
  } catch (error) {
    console.error("Fehler beim Anwenden der Styles:", error);
  }
}