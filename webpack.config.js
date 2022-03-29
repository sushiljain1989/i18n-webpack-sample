//@ts-check
'use strict';

const path = require( 'path' );
const fs = require('fs');
const distPath = path.resolve( __dirname, 'dist/pack' );
const { NLSBundlePlugin } = require('vscode-nls-dev/lib/webpack-bundler');
const pkgPath = path.join(__dirname, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const id = `${pkg.publisher}.${pkg.name}`;
/**@type {import('webpack').Configuration}*/
const config = {
    target: 'node',
    node: {
		__dirname: false // leave the __dirname-behaviour intact
	},
    entry: './src/extension.ts',
    output: {
        path: distPath,
        filename: 'extension.js',
        libraryTarget: 'commonjs2'
    },
    externals: {
        vscode: 'commonjs vscode',
        "vscode-nls": 'commonjs vscode-nls',
        '@sap/hana-client': 'commonjs @sap/hana-client',
        "byline": 'commonjs byline',
		"file-type": 'commonjs file-type',
		"iconv-lite": 'commonjs iconv-lite',
		"jschardet": 'commonjs jschardet',
		"vscode-extension-telemetry": 'commonjs vscode-extension-telemetry',
        "which": 'commonjs which',
    },
    resolve: {
        extensions: [ '.ts', '.js' ]
    },
    module: {
        rules: [
            {
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
							"sourceMap": true,
                        }
                    }
                }]
            }
        ]
    },
    plugins: [
        new NLSBundlePlugin(id)
    ]
};
module.exports = ( env, argv ) => {
    if( argv.mode === 'development' ) {
        config.devtool = 'source-map';
        config.output['devtoolModuleFilenameTemplate'] = '../[resource-path]';
    }
    return config;
};
