module.exports = {
  "env": {
    "es6": true,
    "node": true,
    "commonjs": true,
    "browser": true
  },
  "extends": "eslint:recommended",
  "parserOptions": {
    "sourceType": "module",
  },
  "rules": {
    "no-console": ["error", { allow: ["warn", "error"] }],
    "indent": [
      "error",
      "tab"
    ],
    "linebreak-style": [
      "error",
      "unix"
    ],
    "quotes": [
      "error",
      "single"
    ],
    "semi": [
      "error",
      "never"
    ]
  }
};