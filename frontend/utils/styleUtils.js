let baseStylesheet = null;
let moduleStylesheets = {};

const viewModuleMap = {
  'mainMenu': ['base', 'mainMenu'],
  'joinPoll': ['base', 'joinPoll'],
  'createPoll': ['base', 'createPoll'],
  'pollQuestions': ['base', 'pollQuestions'],
  'pollList': ['base', 'pollList'],
  'adminPanel': ['base', 'adminPanel']
};

/**
 * Loads a single CSS file and converts it to a CSSStyleSheet
 * @param {string} cssPath - Path to the CSS file
 * @returns {Promise<CSSStyleSheet>} Promise with the StyleSheet
 */
async function loadStylesheet(cssPath) {
  try {
    const response = await fetch(cssPath);
    if (!response.ok) {
      throw new Error(`Error loading ${cssPath}: ${response.status} ${response.statusText}`);
    }
    
    const cssText = await response.text();
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(cssText);
    
    return sheet;
  } catch (error) {
    console.error(`Could not load ${cssPath}:`, error);
    return new CSSStyleSheet();
  }
}

/**
 * Loads the required CSS modules for a specific view
 * @param {string} view - Name of the view (e.g. 'mainMenu', 'joinPoll', etc.)
 * @returns {Promise<CSSStyleSheet[]>} Array of CSSStyleSheets
 */
export async function loadViewStyles(view) {
  if (!viewModuleMap[view]) {
    console.warn(`Unknown view: ${view}, loading only base CSS`);
    view = 'mainMenu';
  }
  
  const requiredModules = viewModuleMap[view];
  const styles = [];
  
  try {
    if (!baseStylesheet) {
      baseStylesheet = await loadStylesheet('./frontend/styles/base.css');
    }
    styles.push(baseStylesheet);
    
    for (const moduleName of requiredModules) {
      if (moduleName === 'base') continue;
      
      if (!moduleStylesheets[moduleName]) {
        const path = `./frontend/styles/${moduleName.replace(/([A-Z])/g, '-$1').toLowerCase()}.css`;
        moduleStylesheets[moduleName] = await loadStylesheet(path);
      }
      
      styles.push(moduleStylesheets[moduleName]);
    }
    
    return styles;
  } catch (error) {
    console.error(`Fehler beim Laden der Styles für ${view}:`, error);
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