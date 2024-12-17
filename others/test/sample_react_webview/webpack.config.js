const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const webviewConfig = {
    entry: './src/webview/index.tsx',
    target: 'web',
    mode: 'development',
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader', 'postcss-loader'],
            }
        ]
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './src/webview/index.html'
        })
    ],
    output: {
        filename: 'webview.js',
        path: path.resolve(__dirname, 'dist'),
    }
};

const extensionConfig = {
    entry: './src/extension.ts',
    target: 'node',
    mode: 'development',
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            }
        ]
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    externals: {
        vscode: 'commonjs vscode'
    },
    output: {
        filename: 'extension.js',
        path: path.resolve(__dirname, 'dist'),
        libraryTarget: 'commonjs2'
    }
};

module.exports = [webviewConfig, extensionConfig];