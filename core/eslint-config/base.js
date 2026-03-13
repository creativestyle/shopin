import eslint from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import globals from 'globals';
import typescriptEslint from 'typescript-eslint';
import eslintPluginReact from 'eslint-plugin-react';
import eslintPluginReactHooks from 'eslint-plugin-react-hooks';
import eslintPluginJsxA11y from 'eslint-plugin-jsx-a11y';
import eslintPluginJest from 'eslint-plugin-jest';

export const config = typescriptEslint.config(
  {
    ignores: ['.turbo/**', 'node_modules/**', 'dist/**'],
    files: ['**/*.{ts,tsx,js,jsx}'],
    extends: [
      eslint.configs.recommended,
      ...typescriptEslint.configs.recommended,
    ],
    plugins: {
      react: eslintPluginReact,
      'react-hooks': eslintPluginReactHooks,
      'jsx-a11y': eslintPluginJsxA11y,
    },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        parser: typescriptEslint.parser,
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      ...eslint.configs.recommended.rules,
      ...typescriptEslint.configs.recommended.rules,
      ...eslintPluginReact.configs.recommended.rules,
      ...eslintPluginReactHooks.configs.recommended.rules,
      ...eslintPluginJsxA11y.configs.recommended.rules,
      'jsx-a11y/control-has-associated-label': 'error',
      /* tabindex is sometimes valid for non-interactive elements. For example for scrollable elements if we need to put a focus on them. In this case additional rules are needed. "role" and "aria-label" must be provided. https://act-rules.github.io/rules/0ssw9k */
      'jsx-a11y/no-noninteractive-tabindex': [
        'error',
        {
          tags: [],
          roles: ['region'],
          allowExpressionValues: true,
        },
      ],
      '@typescript-eslint/ban-ts-comment': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/jsx-uses-react': 'off',
      'react/prop-types': 'off',
      'no-unused-vars': ['error', { args: 'none' }],
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  eslintConfigPrettier,
  {
    // Re-enable curly rule after prettier config (prettier disables it)
    rules: {
      curly: 'error',
    },
  },
  {
    files: [
      '**/*.test.{ts,tsx,js,jsx}',
      '**/*.spec.{ts,tsx,js,jsx}',
      '**/*.e2e-spec.{ts,tsx,js,jsx}',
      '**/__tests__/**/*.{ts,tsx,js,jsx}'
    ],
    plugins: { jest: eslintPluginJest },
    languageOptions: { globals: { ...globals.jest } },
    rules: {
      ...eslintPluginJest.configs.recommended.rules,
    },
  },
);