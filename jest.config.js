module.exports = {
    testEnvironment: 'node',
    testTimeout: 30000,
    roots: ['<rootDir>/src'],
    testMatch: [
        '**/__tests__/**/*.js',
        '**/?(*.)+(spec|test).js'
    ],
    verbose: true,
    setupFilesAfterEnv: ['./jest.setup.js'],
    watch: false,
    watchAll: false,
    automock: false,
    runInBand: true
};