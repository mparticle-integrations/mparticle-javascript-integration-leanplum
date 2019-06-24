import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

export default [{
    input: 'src/LeanplumAnalyticsEventForwarder.js',
    output: {
        file: 'LeanplumAnalyticsEventForwarder.js',
       format: 'umd',
        exports: 'named',
        name: 'mp-leanplum-kit',
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
        format: 'umd',
        exports: 'named',
        name: 'mp-leanplum-kit',
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