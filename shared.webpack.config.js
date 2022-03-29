/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

//@ts-check
/** @typedef {import('webpack').Configuration} WebpackConfig **/

'use strict';

const path = require('path');
const fs = require('fs');
const merge = require('merge-options');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { NLSBundlePlugin } = require('vscode-nls-dev/lib/webpack-bundler');

function withNodeDefaults(/**@type WebpackConfig*/extConfig) {
    /** @type WebpackConfig */
    let defaultConfig = {
        mode: 'none', // this leaves the source code as close as possible to the original (when packaging we set this to 'production')
        target: 'node', // extensions run in a node context
        node: {
            __dirname: false // leave the __dirname-behaviour intact
        },
        resolve: {
            mainFields: ['module', 'main'],
            extensions: ['.ts', '.js'] // support ts-files and js-files
        },
        module: {
            rules: [{
                test: /\.ts$/,
                exclude: /node_modules/,
                use: [{
                    // vscode-nls-dev loader:
                    // * rewrite nls-calls
                    loader: 'vscode-nls-dev/lib/webpack-loader',
                    options: {
                        base: path.join(__dirname, 'src')
                    }
                }, {
                    // configure TypeScript loader:
                    // * enable sources maps for end-to-end source maps
                    loader: 'ts-loader',
                    options: {
                        compilerOptions: {
                            'sourceMap': true,
                        }
                    }
                }]
            }]
        },
        externals: {
            'vscode': 'commonjs vscode', // ignored because it doesn't exist,
            'applicationinsights-native-metrics': 'commonjs applicationinsights-native-metrics', // ignored because we don't ship native module
            '@opentelemetry/tracing': 'commonjs @opentelemetry/tracing', // ignored because we don't ship this module
        },
        output: {
            // all output goes into `dist`.
            // packaging depends on that and this must always be like it
            filename: 'extension.js',
            path: path.join(extConfig.context, 'dist'),
            libraryTarget: 'commonjs',
        },
        // yes, really source maps
        plugins: nodePlugins(extConfig.context),
    };

    return merge(defaultConfig, extConfig);
}

function nodePlugins(context) {
    // Need to find the top-most `package.json` file
    const pkgPath = path.join(__dirname, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    const id = `${pkg.publisher}.${pkg.name}`;
    return [
        new CopyWebpackPlugin({
            patterns: [
                { from: 'src', to: '.', globOptions: { ignore: ['**/test/**', '**/*.ts'] }, noErrorOnMissing: true },
                // { from: './src/*nls.*.json', to: '[name].json' }
            ]
        }),
        new NLSBundlePlugin(id)
    ];
}



module.exports = withNodeDefaults;
module.exports.node = withNodeDefaults;
module.exports.nodePlugins = nodePlugins;
