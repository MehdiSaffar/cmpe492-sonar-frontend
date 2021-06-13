const CracoLessPlugin = require('craco-less')

module.exports = {
    plugins: [
        {
            plugin: CracoLessPlugin,
            options: {
                lessLoaderOptions: {
                    lessOptions: {
                        modifyVars: { '@primary-color': '#1DA57A' },
                        javascriptEnabled: true
                    }
                }
            }
        }
    ],
    // webpack: config => {
    //     config.output.globalObject = `(typeof self !== 'undefined' ? self : this)`
    //     config.module.rules.push({
    //         test: /\.worker\.js$/,
    //         use: [
    //             {
    //                 loader: 'workerize-loader'
    //                 // options: {
    //                 //     name: 'static/[hash]',
    //                 //     publicPath: '/static/'
    //                 // }
    //             }
    //         ]
    //     })

    //     return config
    // }
}
