// First, create the following directory structure:
/*
vscode-gemini-chat/
├── .vscode/
│   └── launch.json
├── src/
│   └── extension.ts
├── .gitignore
├── package.json
├── tsconfig.json
└── webpack.config.js
*/



// webpack.config.js
const path = require('path');

module.exports = {
    target: 'node',
    mode: 'development',
    entry: './src/extension.ts',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'extension.js',
        libraryTarget: 'commonjs2'
    },
    externals: {
        vscode: 'commonjs vscode'
    },
    resolve: {
        extensions: ['.ts', '.js']
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: 'ts-loader'
                    }
                ]
            }
        ]
    },
    devtool: 'source-map'
};