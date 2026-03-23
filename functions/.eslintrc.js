module.exports = {
  root: true,
  env: {
    es2020: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
  ],
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  ignorePatterns: [
    "/lib/**/*", // Ignore built files.
  ],
  rules: {
    "@typescript-eslint/no-explicit-any": "off",
  },
};
