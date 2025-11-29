# eslint-plugin-variable-naming

ESLint plugin to enforce consistent variable naming conventions with full configurability.

## Installation
```bash
  npm install --save-dev eslint-plugin-variable-naming
```
## Usage

### With ESLint Legacy Config (`.eslintrc.json`)
```json
{
  "parser": "@typescript-eslint/parser",
  "plugins": ["variable-naming"],
  "rules": {
    "variable-naming/enforce-variable-naming-convention": ["error", {
      "caseType": "camelCase"
    }]
  }
}
```
### With ESLint Flat Config (JavaScript - `eslint.config.js`)

```javascript
const variableNaming = require('eslint-plugin-variable-naming');
const tsParser = require('@typescript-eslint/parser');

module.exports = [{
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
        parser: tsParser,
        parserOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            project: './tsconfig.json',
        },
    },
    plugins: {
        'variable-naming': variableNaming,
    },
    rules: {
        'variable-naming/enforce-variable-naming-convention': ['error', {
            caseType: 'camelCase',
        }],
    },
}, ];
```
### With ESLint Flat Config (TypeScript - `eslint.config.ts`)

```typescript
import variableNaming from 'eslint-plugin-variable-naming';
import tsParser from '@typescript-eslint/parser';
import type {
    Linter
} from 'eslint';

const config: Linter.FlatConfig[] = [{
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
        parser: tsParser,
        parserOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            project: './tsconfig.json',
        },
    },
    plugins: {
        'variable-naming': variableNaming,
    },
    rules: {
        'variable-naming/enforce-variable-naming-convention': ['error', {
            caseType: 'camelCase',
            checkFunctions: false,
            ignoreDestructuring: false,
            ignoreImports: false,
        }],
    },
}, ];

export default config;
```
### Using Recommended Config

#### Legacy Config (`.eslintrc.json`)

```json
{
"parser": "@typescript-eslint/parser",
"extends": ["plugin:variable-naming/recommended"]
}
```
#### Flat Config (JavaScript)

```javascript
const variableNaming = require('eslint-plugin-variable-naming');
const tsParser = require('@typescript-eslint/parser');

module.exports = [{
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
        parser: tsParser,
        parserOptions: {
            project: './tsconfig.json',
        },
    },
    ...variableNaming.configs.recommended,
}, ];
```
#### Flat Config (TypeScript)

```typescript
import variableNaming from 'eslint-plugin-variable-naming';
import tsParser from '@typescript-eslint/parser';

export default [{
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
        parser: tsParser,
        parserOptions: {
            project: './tsconfig.json',
        },
    },
    ...variableNaming.configs.recommended,
}, ];
```
## Configuration Examples

### Complete example with all options

```typescript
// eslint.config.ts
export default [{
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
        'variable-naming/enforce-variable-naming-convention': ['error', {
            // Specify the case type
            caseType: 'camelCase',

            // Allowed patterns (regex) to ignore
            allowedPatterns: ['^_.*', '^CONSTANT_.*'],

            // TypeScript types to exclude
            excludeTypes: ['Promise', 'Observable'],

            // React component creator functions
            componentCreators: ['lazy', 'memo', 'forwardRef'],

            // CSS-in-JS libraries
            styledLibraries: ['styled', 'emotion'],

            // Hook pattern (null to disable)
            hookPattern: '^use[A-Z]',

            // Check function variables
            checkFunctions: false,

            // Ignore destructured variables
            ignoreDestructuring: false,

            // Ignore imported variables
            ignoreImports: true,
        }],
    },
}, ];
```
### Example for React projects

```typescript
// eslint.config.ts
export default [{
    files: ['**/*.tsx'],
    rules: {
        'variable-naming/enforce-variable-naming-convention': ['error', {
            caseType: 'camelCase',
            componentCreators: ['lazy', 'memo', 'forwardRef', 'createContext'],
            styledLibraries: ['styled'],
            hookPattern: '^use[A-Z]',
            ignoreImports: true,
        }],
    },
}, ];
```
### Example for snake_case convention

```typescript
// eslint.config.ts
export default [{
    files: ['**/*.ts'],
    rules: {
        'variable-naming/enforce-variable-naming-convention': ['error', {
            caseType: 'snake_case',
            componentCreators: [],
            styledLibraries: [],
            hookPattern: null,
            checkFunctions: true,
        }],
    },
}, ];
```

## Options

### `caseType` (default: `"camelCase"`)
The naming convention to enforce:
- `"camelCase"`: `myVariable`
- `"PascalCase"`: `MyVariable`
- `"snake_case"`: `my_variable`
- `"UPPER_SNAKE_CASE"`: `MY_VARIABLE`
- `"kebab-case"`: `my-variable`

### `allowedPatterns` (default: `[]`)
Array of regex patterns for variable names to ignore:


```json
{
  "allowedPatterns": ["^_.*", "^CONSTANT_.*"]
}
```
### `excludeTypes` (default: `[]`)
TypeScript types to exclude from checking:

```json
{
  "excludeTypes": ["Promise", "Observable"]
}
```

### `componentCreators`: (default: `["lazy", "styled", "createElement", "memo", "forwardRef", "createContext"]`)
Functions that create React components (set to `[]` to disable):

```json
{
  "componentCreators": ["lazy", "memo"]
}
```
### `styledLibraries` (default: `["styled"]`)
CSS-in-JS library names (set to `[]` to disable):

```json
{
  "styledLibraries": ["styled", "emotion"]
}
```
### `hookPattern` (default: `"^use[A-Z]"`)
Regex pattern to match hook functions (set to `null` to disable):

```json
{
  "hookPattern": "^use[A-Z].*"
}
```
### `checkFunctions` (default: `false`)
Whether to check function variables:

```json
{
  "checkFunctions": true
}
```
### `ignoreDestructuring` (default: `false`)
Whether to ignore destructured variables:

```json
{
  "ignoreDestructuring": true
}
```
### `ignoreImports` (default: `false`)
Whether to ignore imported variables:
```json
{
  "ignoreImports": true
}
```
## Examples
```ts
// ❌ Bad (with camelCase)
const MyVariable = 'value';
const my_variable = 123;

// ✅ Good (with camelCase)
const myVariable = 'value';
const anotherVar = 123;
```

## License

MIT

