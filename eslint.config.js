import js from '@eslint/js';
import nodePlugin from 'eslint-plugin-node';
import importPlugin from 'eslint-plugin-import';

export default [
  // Global ignores (replaces .eslintignore)
  {
    ignores: [
      'node_modules/**',
      'coverage/**',
      'dist/**',
      '*.min.js',
      '.eslintcache',
      'build/**',
      'out/**'
    ]
  },

  // Base configuration for all files
  {
    ...js.configs.recommended,
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        console: 'readonly'
      }
    },
    plugins: {
      import: importPlugin,
      node: nodePlugin
    },
    rules: {
      // Possible Errors
      'no-console': 'warn',
      'no-debugger': 'error',
      'no-extra-semi': 'error',
      'no-func-assign': 'error',
      'no-inner-declarations': 'error',
      'no-invalid-regexp': 'error',
      'no-irregular-whitespace': 'error',
      'no-obj-calls': 'error',
      'no-sparse-arrays': 'error',
      'no-unreachable': 'error',
      'use-isnan': 'error',
      'valid-typeof': 'error',

      // Best Practices
      'curly': 'error',
      'eqeqeq': ['error', 'always'],
      'no-alert': 'warn',
      'no-caller': 'error',
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-loop-func': 'error',
      'no-multi-spaces': 'error',
      'no-new-func': 'error',
      'no-new-wrappers': 'error',
      'no-redeclare': 'error',
      'no-sequences': 'error',
      'no-throw-literal': 'error',
      'no-with': 'error',

      // Variables
      'no-delete-var': 'error',
      'no-shadow': 'error',
      'no-undef': 'error',
      'no-unused-vars': ['error', { 'vars': 'all', 'args': 'after-used' }],
      'no-use-before-define': 'error',

      // Stylistic Issues
      'brace-style': ['error', '1tbs'],
      'comma-dangle': ['error', 'never'],
      'comma-spacing': ['error', { 'before': false, 'after': true }],
      'indent': ['error', 2],
      'quotes': ['error', 'single'],
      'semi': ['error', 'always'],
      'no-trailing-spaces': 'error',

      // ES6
      'no-var': 'error',
      'prefer-const': 'error'
    }
  },

  // Main process files (Node.js environment)
  {
    files: ['main.js', 'preload.js'],
    languageOptions: {
      globals: {
        Buffer: 'readonly',
        process: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly'
      }
    },
    rules: {
      'no-console': 'off' // Allow console in main process
    }
  },

  // Renderer process files (Browser environment)
  {
    files: ['scripts/**/*.js'],
    languageOptions: {
      globals: {
        window: 'readonly',
        document: 'readonly',
        Audio: 'readonly',
        alert: 'readonly',
        confirm: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        Event: 'readonly',
        FileReader: 'readonly',
        location: 'readonly'
      }
    },
    rules: {
      'no-console': 'warn', // Warn for console in renderer
      'no-alert': 'off' // Allow alerts in UI
    }
  },

  // Test files
  {
    files: ['tests/**/*.js', '**/*.test.js', '**/*.spec.js'],
    languageOptions: {
      globals: {
        // Jest globals
        describe: 'readonly',
        test: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        jest: 'readonly',

        // Node.js globals for test environment
        Buffer: 'readonly',
        process: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',

        // Browser globals for JSDOM
        window: 'readonly',
        document: 'readonly',
        Audio: 'readonly',
        alert: 'readonly',
        confirm: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        Event: 'readonly',
        FileReader: 'readonly',
        location: 'readonly',

        // Custom test globals
        setupDOM: 'readonly',
        mockElectron: 'readonly',
        mockFs: 'readonly',
        mockPath: 'readonly',
        mockChildProcess: 'readonly',
        mockStore: 'readonly'
      }
    },
    rules: {
      'no-console': 'off', // Allow console in tests
      'no-unused-vars': 'off' // Allow unused vars in tests
    }
  },

  // Configuration files
  {
    files: [
      '*.config.js',
      'eslint.config.js',
      'babel.config.js',
      'jest.config.js'
    ],
    languageOptions: {
      globals: {
        Buffer: 'readonly',
        process: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly'
      }
    },
    rules: {
      'no-console': 'off'
    }
  }
];
