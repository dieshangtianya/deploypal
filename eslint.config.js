const { defineConfig } = require('eslint/config');
const eslintJs = require('@eslint/js');
const tslint = require('typescript-eslint');
const prettierPlugin = require('eslint-plugin-prettier');
const prettierConfig = require('eslint-config-prettier');
const globals = require('globals');

module.exports = defineConfig([
  eslintJs.configs.recommended,
  tslint.configs.recommended,
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
        ecmaVersion: 6,
        sourceType: 'module',
      },
      globals: {
        ...globals.node,
        ...globals.es2020,
      },
    },
    rules: {
      semi: 'error',
      'no-console': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
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
