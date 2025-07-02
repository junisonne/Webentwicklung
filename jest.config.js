/** @type {import('jest').Config} */
export default {
  transform: {
    "^.+\\.js$": "babel-jest"
  },
  //extensionsToTreatAsEsm: [".js"],
  moduleFileExtensions: ["js", "json", "node"]
}