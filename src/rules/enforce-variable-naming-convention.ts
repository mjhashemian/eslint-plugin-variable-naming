// Types
import { ESLintUtils } from '@typescript-eslint/utils';
import type { TSESTree } from '@typescript-eslint/utils';

type KnownComponentCreator =
    | 'lazy'
    | 'styled'
    | 'createElement'
    | 'memo'
    | 'forwardRef'
    | 'createContext';

type KnownStyledLibrary = 'styled' | 'css' | 'emotion';

type CaseType = 'camelCase' | 'PascalCase' | 'snake_case' | 'UPPER_SNAKE_CASE' | 'kebab-case';

type Options = [
    {
        caseType?: CaseType;
        allowedPatterns?: string[];
        excludeTypes?: string[];
        componentCreators?: KnownComponentCreator[];
        styledLibraries?: KnownStyledLibrary[];
        hookPattern?: string | null;
        checkFunctions?: boolean;
        ignoreDestructuring?: boolean;
        ignoreImports?: boolean;
    },
];

type MessageIds = 'incorrectCase';

const createRule = ESLintUtils.RuleCreator((name) => `#${name}`);

const rule = createRule<Options, MessageIds>({
    name: 'enforce-variable-naming-convention',
    meta: {
        type: 'problem',
        docs: {
            description:
                'Enforce consistent naming convention for simple variables (primitives, arrays, objects)',
        },
        schema: [
            {
                type: 'object',
                properties: {
                    caseType: {
                        type: 'string',
                        enum: ['camelCase', 'PascalCase', 'snake_case', 'UPPER_SNAKE_CASE', 'kebab-case'],
                        default: 'camelCase',
                    },
                    allowedPatterns: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'Regex patterns for variable names that should be ignored',
                    },
                    excludeTypes: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'TypeScript types to exclude from checking',
                    },
                    componentCreators: {
                        type: 'array',
                        items: { type: 'string' },
                        default: ['lazy', 'styled', 'createElement', 'memo', 'forwardRef', 'createContext'],
                        description: 'Functions that create React components (empty array to disable)',
                    },
                    styledLibraries: {
                        type: 'array',
                        items: { type: 'string' },
                        default: ['styled'],
                        description: 'CSS-in-JS library names (empty array to disable)',
                    },
                    hookPattern: {
                        type: ['string', 'null'],
                        default: '^use[A-Z]',
                        description: 'Regex pattern to match hook functions (null to disable)',
                    },
                    checkFunctions: {
                        type: 'boolean',
                        default: false,
                        description: 'Whether to check function variables',
                    },
                    ignoreDestructuring: {
                        type: 'boolean',
                        default: false,
                        description: 'Whether to ignore destructured variables',
                    },
                    ignoreImports: {
                        type: 'boolean',
                        default: false,
                        description: 'Whether to ignore imported variables',
                    },
                },
                additionalProperties: false,
            },
        ],
        messages: {
            incorrectCase:
                'Variable "{{currentName}}" must be in {{expectedCase}}. Consider renaming to "{{suggestedName}}".',
        },
        fixable: 'code',
    },
    defaultOptions: [
        {
            caseType: 'camelCase',
            allowedPatterns: [],
            excludeTypes: [],
            componentCreators: ['lazy', 'styled', 'createElement', 'memo', 'forwardRef', 'createContext'],
            styledLibraries: ['styled'],
            hookPattern: '^use[A-Z]',
            checkFunctions: false,
            ignoreDestructuring: false,
            ignoreImports: false,
        },
    ],
    create(context) {
        const options = context.options[0] || {};
        const caseType = options.caseType || 'camelCase';
        const allowedPatterns = (options.allowedPatterns || []).map((p) => new RegExp(p));
        const excludeTypes = options.excludeTypes || [];

        const componentCreators = options.componentCreators || [
            'lazy',
            'styled',
            'createElement',
            'memo',
            'forwardRef',
            'createContext',
        ];
        const styledLibraries = options.styledLibraries || ['styled'];

        const hookPattern = options.hookPattern ? new RegExp(options.hookPattern) : null;

        const checkFunctions = options.checkFunctions ?? false;
        const ignoreDestructuring = options.ignoreDestructuring ?? false;
        const ignoreImports = options.ignoreImports ?? false;

        const services = ESLintUtils.getParserServices(context);
        const checker = services.program.getTypeChecker();

        const caseValidators: Record<CaseType, (name: string) => boolean> = {
            camelCase: (name) => /^[a-z][a-zA-Z0-9]*$/.test(name),
            PascalCase: (name) => /^[A-Z][a-zA-Z0-9]*$/.test(name),
            snake_case: (name) => /^[a-z][a-z0-9_]*$/.test(name),
            UPPER_SNAKE_CASE: (name) => /^[A-Z][A-Z0-9_]*$/.test(name),
            'kebab-case': (name) => /^[a-z][a-z0-9-]*$/.test(name),
        };

        const caseConverters: Record<CaseType, (name: string) => string> = {
            camelCase: (name) =>
                name
                    .replace(/[-_](.)/g, (_, char) => char.toUpperCase())
                    .replace(/^(.)/, (char) => char.toLowerCase()),
            PascalCase: (name) =>
                name
                    .replace(/[-_](.)/g, (_, char) => char.toUpperCase())
                    .replace(/^(.)/, (char) => char.toUpperCase()),
            snake_case: (name) =>
                name
                    .replace(/([A-Z])/g, '_$1')
                    .toLowerCase()
                    .replace(/^_/, ''),
            UPPER_SNAKE_CASE: (name) =>
                name
                    .replace(/([A-Z])/g, '_$1')
                    .toUpperCase()
                    .replace(/^_/, ''),
            'kebab-case': (name) =>
                name
                    .replace(/([A-Z])/g, '-$1')
                    .toLowerCase()
                    .replace(/^-/, ''),
        };

        const isValidCase = (name: string): boolean => caseValidators[caseType](name);
        const convertToCase = (name: string): string => caseConverters[caseType](name);

        const isAllowedByPattern = (name: string): boolean =>
            allowedPatterns.some((pattern) => pattern.test(name));

        function hasAnyType(node: TSESTree.VariableDeclarator): boolean {
            if (node.id.type === 'Identifier' && node.id.typeAnnotation) {
                const typeAnnotation = node.id.typeAnnotation.typeAnnotation;
                if (typeAnnotation.type === 'TSAnyKeyword') return true;
            }

            try {
                const tsNode = services.esTreeNodeToTSNodeMap.get(node.id);
                const type = checker.getTypeAtLocation(tsNode);
                const typeString = checker.typeToString(type);

                if (excludeTypes.includes(typeString)) return false;

                return (type.flags & (1 << 0)) !== 0 || typeString === 'any';
            } catch {
                return false;
            }
        }

        function isComponentCreator(init: TSESTree.Node | null): boolean {
            if (!init) return false;

            if (componentCreators.length === 0 && styledLibraries.length === 0) {
                return false;
            }

            if (init.type === 'TaggedTemplateExpression') {
                const tag = init.tag;
                if (tag.type === 'MemberExpression' && tag.object.type === 'Identifier') {
                    return styledLibraries.includes(tag.object.name as KnownStyledLibrary);
                }
                return (
                    tag.type === 'Identifier' && styledLibraries.includes(tag.name as KnownStyledLibrary)
                );
            }

            if (init.type === 'CallExpression') {
                const callee = init.callee;

                if (callee.type === 'Identifier') {
                    return componentCreators.includes(callee.name as KnownComponentCreator);
                }

                if (callee.type === 'MemberExpression' && callee.object.type === 'Identifier') {
                    return styledLibraries.includes(callee.object.name as KnownStyledLibrary);
                }

                if (callee.type === 'CallExpression') {
                    return isComponentCreator(callee);
                }
            }

            return false;
        }

        function isMemberExpressionComponent(init: TSESTree.Node | null): boolean {
            if (!init || init.type !== 'MemberExpression') return false;

            const text = context.sourceCode.getText(init);
            return /^[A-Z][a-zA-Z0-9_]*\[/.test(text);
        }

        function isSimpleValue(node: TSESTree.VariableDeclarator): boolean {
            const init = node.init;
            if (!init) return false;

            if (isComponentCreator(init) || isMemberExpressionComponent(init)) {
                return false;
            }

            const simpleTypes = [
                'Literal',
                'TemplateLiteral',
                'ArrayExpression',
                'ObjectExpression',
                'Identifier',
                'UnaryExpression',
                'BinaryExpression',
                'LogicalExpression',
                'ConditionalExpression',
                'MemberExpression',
            ];

            if (simpleTypes.includes(init.type)) return true;

            if (init.type === 'CallExpression' && init.callee.type === 'Identifier') {
                return hookPattern ? hookPattern.test(init.callee.name) : false;
            }

            return init.type === 'CallExpression';
        }

        const isFunction = (node: TSESTree.VariableDeclarator): boolean => {
            const init = node.init;
            return init?.type === 'ArrowFunctionExpression' || init?.type === 'FunctionExpression';
        };

        function isImportedVariable(node: TSESTree.VariableDeclarator): boolean {
            if (node.id.type !== 'Identifier') return false;

            const varName = node.id.name;
            const scope = context.sourceCode.getScope(node);
            const variable = scope?.variables.find((v) => v.name === varName);

            return variable?.defs.some((def) => def.type === 'ImportBinding') ?? false;
        }

        function reportNamingIssue(node: TSESTree.Identifier, varName: string) {
            const suggestedName = convertToCase(varName);

            if (suggestedName === varName) return;

            context.report({
                node,
                messageId: 'incorrectCase',
                data: {
                    currentName: varName,
                    expectedCase: caseType,
                    suggestedName,
                },
                fix: (fixer) => fixer.replaceText(node, suggestedName),
            });
        }

        return {
            VariableDeclarator(node: TSESTree.VariableDeclarator) {
                if (node.id.type !== 'Identifier') {
                    if (ignoreDestructuring) return;
                }

                if (node.id.type !== 'Identifier') return;

                const varName = node.id.name;

                if (ignoreImports && isImportedVariable(node)) {
                    return;
                }

                if (isAllowedByPattern(varName)) return;

                if (isFunction(node) && !checkFunctions) return;

                const hasAny = hasAnyType(node);
                const isSimple = isSimpleValue(node);

                if (!hasAny && !isSimple) return;

                if (!isValidCase(varName)) {
                    reportNamingIssue(node.id, varName);
                }
            },
        };
    },
});

export default rule;
