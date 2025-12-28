module.exports = {
    preset: 'react-native',
    setupFilesAfterEnv: ['./jest.setup.js'],
    testMatch: ['**/__tests__/**/*.test.[jt]s?(x)'],
    transformIgnorePatterns: [
        'node_modules/(?!(react-native|@react-native|react-native-.*|@react-navigation|expo|@expo|expo-.*|@unimodules|unimodules)/)',
    ],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
        '^@expo/vector-icons$': '<rootDir>/__mocks__/@expo/vector-icons.js',
    },
    collectCoverageFrom: [
        'screens/**/*.{js,jsx}',
        'components/**/*.{js,jsx}',
        '!**/node_modules/**',
        '!**/__tests__/**',
        '!**/__mocks__/**',
    ],
    testEnvironment: 'node',
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
};
