export default {
    testEnvironment: 'node',
    transform: {},
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.(m)?js$': '$1'
    },
    testMatch: [
        '**/tests/**/*.test.js',
        '**/tests/**/*.spec.js'
    ],
    testTimeout: 60000,
    verbose: true,
    rootDir: 'src',
    errorOnDeprecated: true,
    bail: 1,
    maxConcurrency: 1,
    maxWorkers: 1,
    setupFilesAfterEnv: ['/Volumes/data/GithubCopilot/selenium-login-project/jest.setup.mjs'],  // Changed from './jest.setup.js' to 'jest.setup.js'
    reporters: [
        'default',
        ['jest-junit', {
            outputDirectory: '../test-results',
            outputName: 'junit.xml',
            classNameTemplate: '{classname}',
            titleTemplate: '{title}',
            ancestorSeparator: ' › ',
            usePathForSuiteName: true
        }]
    ],
    collectCoverage: true,
    coverageDirectory: '../coverage',
    coverageReporters: ['text', 'html'],
    testEnvironmentOptions: {
        url: 'http://localhost'
    },
};