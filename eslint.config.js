const { defineConfig } = require('eslint/config');
const eslintJs = require('@eslint/js');
const tseslintPlugin = require('@typescript-eslint/eslint-plugin');
const typescriptParser = require('@typescript-eslint/parser');
const prettierPlugin = require('eslint-plugin-prettier');
const prettierConfig = require('eslint-config-prettier');
const globals = require('globals');

const tseslintRules = tseslintPlugin.configs.recommended.rules;

module.exports = defineConfig([
  eslintJs.configs.recommended,
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        project: './tsconfig.json',
      },
      ecmaVersion: 6,
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
        ...globals.es2020,
      },
    },
    plugins: {
      '@typescript-eslint': tseslintPlugin,
    },
    rules: {
      ...tseslintRules,
      semi: 'error',
      "no-console": "off",
    }
  },
  {
    files: ['**/*.{ts,js}'], // Prettier 支持的文件类型
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      ...prettierConfig.rules, // 禁用与 Prettier 冲突的规则
      'prettier/prettier': 'error', // 启用 Prettier 检查
    },
  },
  {
    ignores: ['node_modules', 'dist', 'build', 'coverage', 'bin', 'lib', '*.min.js'],
  }
]);
