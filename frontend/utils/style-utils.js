/**
 * CSS Utility-Funktionen für das Poll-Component
 * Stellt Funktionen zum Laden und Anwenden von CSS bereit
 */

// Cache für geladene Stylesheets
let baseStylesheet = null;
let moduleStylesheets = {};

// Liste der Module
const moduleNames = ['base', 'mainMenu', 'createPoll', 'joinPoll', 'pollQuestions', 'pollList', 'adminPanel'];

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
 * Lädt alle CSS-Module und kombiniert sie für die Anwendung im Shadow DOM
 * @returns {Promise<CSSStyleSheet[]>} Array von CSSStyleSheets
 */
export async function loadAllStyles() {
  console.log("Lade alle CSS-Dateien...");
  
  try {
    // Base CSS laden (wenn noch nicht im Cache)
    if (!baseStylesheet) {
      baseStylesheet = await loadStylesheet('./frontend/modularization/base.css');
      console.log("Base CSS geladen");
    }
    
    // Alle Module-Stylesheets laden
    for (const moduleName of moduleNames) {
      if (moduleName === 'base') continue; // Base CSS bereits geladen
      
      if (!moduleStylesheets[moduleName]) {
        const path = `./frontend/modularization/${moduleName.replace(/([A-Z])/g, '-$1').toLowerCase()}.css`;
        moduleStylesheets[moduleName] = await loadStylesheet(path);
        console.log(`${moduleName} CSS geladen`);
      }
    }
    
    // Alle Stylesheets zusammenführen, mit Base zuerst
    const allStylesheets = [baseStylesheet];
    for (const moduleName of moduleNames) {
      if (moduleName === 'base') continue;
      if (moduleStylesheets[moduleName]) {
        allStylesheets.push(moduleStylesheets[moduleName]);
      }
    }
    
    console.log(`Alle CSS-Dateien geladen: ${allStylesheets.length} Stylesheets`);
    return allStylesheets;
  } catch (error) {
    console.error("Fehler beim Laden der CSS-Dateien:", error);
    throw error;
  }
}

/**
 * Wendet alle Stylesheets auf das Shadow DOM einer Komponente an
 * @param {ShadowRoot} shadowRoot - Das Shadow DOM der Komponente
 * @returns {Promise<void>}
 */
export async function applyStylesToShadowRoot(shadowRoot) {
  if (!shadowRoot) {
    console.warn("Kein Shadow Root zum Anwenden der Styles übergeben");
    return;
  }
  
  try {
    const allStylesheets = await loadAllStyles();
    shadowRoot.adoptedStyleSheets = allStylesheets;
    console.log("Styles auf Shadow DOM angewendet");
  } catch (error) {
    console.error("Fehler beim Anwenden der Styles:", error);
  }
}
