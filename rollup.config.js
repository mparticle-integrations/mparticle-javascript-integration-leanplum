import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

export default [
    {
        input: 'src/LeanplumAnalyticsEventForwarder.js',
        output: {
            file: 'LeanplumAnalyticsEventForwarder.js',
            format: 'iife',
            exports: 'named',
            name: 'mpLeanplumKit',
            strict: false
        },
        plugins: [
            resolve({
                browser: true
            }),
            commonjs()
        ]
    },
    {
        input: 'src/LeanplumAnalyticsEventForwarder.js',
        output: {
            file: 'dist/LeanplumAnalyticsEventForwarder.js',
            format: 'iife',
            exports: 'named',
            name: 'mpLeanplumKit',
            strict: false
        },
        plugins: [
            resolve({
                browser: true
            }),
            commonjs()
        ]
    },
    {
        input: 'src/LeanplumAnalyticsEventForwarder.js',
        output: {
            file: 'npm/LeanplumAnalyticsEventForwarder.js',
            format: 'cjs',
            exports: 'named',
            name: 'mpLeanplumKit',
            strict: false
        },
        plugins: [
            resolve({
                browser: true
            }),
            commonjs()
        ]
    }
]