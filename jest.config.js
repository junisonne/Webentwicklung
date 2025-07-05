/** @type {import('jest').Config} */
export default {
  transform: {
    "^.+\\.js$": "babel-jest"
  },
  //extensionsToTreatAsEsm: [".js"],
  moduleFileExtensions: ["js", "json", "node"],
  testEnvironment: 'jest-environment-jsdom', 
  //setupFiles: ['<rootDir>/jest.setup.js'], // FETCH-Mock + CSS-Stub
  //setupFilesAfterEnv: ['@testing-library/jest-dom/extend-expect'], // DOM-Matcher from @testing-library/jest-dom
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
}