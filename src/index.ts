import enforceVariableNamingConvention from './rules/enforce-variable-naming-convention';

const plugin = {
    rules: {
        'enforce-variable-naming-convention': enforceVariableNamingConvention,
    },
    configs: {
        recommended: {
            plugins: ['variable-naming'],
            rules: {
                'variable-naming/enforce-variable-naming-convention': 'error',
            },
        },
    },
};

export = plugin;
