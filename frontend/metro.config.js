const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
// metro-config exports 'default' property for exclusionList
const exclusionList = require(path.resolve(__dirname, 'node_modules/metro-config/src/defaults/exclusionList')).default;

const config = getDefaultConfig(__dirname);

// Enable package exports for modern libraries like ox/viem
config.resolver.unstable_enablePackageExports = true;
config.resolver.unstable_conditionNames = ['react-native', 'browser', 'require', 'import', 'default'];
config.resolver.sourceExts.push('mjs', 'cjs');

// Block .ts files in 'ox' package to prevent Metro from resolving to them instead of ESM build
// This forces usage of the 'exports' field pointing to _esm/
config.resolver.blockList = exclusionList([
    /node_modules\/ox\/.*\.ts$/,
]);

config.resolver.resolveRequest = (context, moduleName, platform) => {
    if (moduleName === 'tslib') {
        const tslibPath = path.resolve(__dirname, 'node_modules/tslib/tslib.js');
        return {
            filePath: tslibPath,
            type: 'sourceFile',
        };
    }
    // Fallback to standard resolution for all other modules
    return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
