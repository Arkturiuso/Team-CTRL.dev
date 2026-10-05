// @ts-check
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import prettierConfig from 'eslint-config-prettier'

export default [
  // Глобальные игноры
  {
    ignores: [
      'node_modules/**',
      'build/**',
      'dist/**',
      'tools/**',
      'package-lock.json',
      '.yarn/**',
      '.prettierrc.cjs',
      'eslint.config.mjs',
      'vite.config.ts',
    ],
  },

  // Базовые рекомендации
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  reactPlugin.configs.flat.recommended,
  reactHooks.configs.flat.recommended,
  reactRefresh.configs.vite,

  // Настройки языка и парсера
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      globals: globals.browser,
      parser: tseslint.parser,
      parserOptions: {
        projectService: true,
        ecmaFeatures: { jsx: true },
      },
    },
    settings: {
      react: { version: 'detect' },
    },
  },

  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      // Базовые
      'curly': 'error',
      'eqeqeq': 'error',
      'no-var': 'error',
      'prefer-const': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }],

      // Чистота кода
      'no-unreachable': 'error',
      'no-else-return': 'error',
      'prefer-template': 'error',
      'prefer-arrow-callback': 'error',
      'arrow-body-style': ['error', 'as-needed'],
      'object-shorthand': 'error',
      'no-unneeded-ternary': 'error',

      // TypeScript
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      }],
      '@typescript-eslint/prefer-optional-chain': 'error',

      // React
      'react/jsx-boolean-value': 'error',
      'react/jsx-curly-brace-presence': 'error',
      'react/self-closing-comp': 'error',
      'react/jsx-no-useless-fragment': 'error',
      'react/react-in-jsx-scope': 'off',

      // Безопасность
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'require-await': 'error',
    },
  },
  prettierConfig,
];
