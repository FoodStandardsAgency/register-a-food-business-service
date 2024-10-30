const prettier = require("eslint-plugin-prettier");
const jest = require("eslint-plugin-jest");
const node = require("eslint-plugin-n");

module.exports = [
  {
    ignores: ["coverage/*", "scripts/*", "node_modules/*"]
  },
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "commonjs"
    },
    files: ["src/**/*.js", "pages_unit_tests/**/*.js"],
    rules: {
      "prettier/prettier": "warn",
      "no-param-reassign": [
        2,
        {
          props: true,
          ignorePropertyModificationsFor: ["req"]
        }
      ],
      "no-trailing-spaces": "error",
      "no-param-reassign": "warn",
      "jest/no-disabled-tests": "warn",
      "jest/no-focused-tests": "error",
      "jest/no-identical-title": "error",
      "jest/prefer-to-have-length": "warn",
      "jest/valid-expect": "error",
      "node/exports-style": ["error", "module.exports"],
      "node/file-extension-in-import": ["error", "always"],
      "node/prefer-global/buffer": ["error", "always"],
      "node/prefer-global/console": ["error", "always"],
      "node/prefer-global/process": ["error", "always"],
      "node/prefer-global/url-search-params": ["error", "always"],
      "node/prefer-global/url": ["error", "always"],
      "node/prefer-promises/dns": "error",
      "node/prefer-promises/fs": "error"
    },
    plugins: {
      prettier: prettier,
      jest: jest,
      node: node
    }
  }
];
