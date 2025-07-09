import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: "http://141.72.13.151:8500/",
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});
