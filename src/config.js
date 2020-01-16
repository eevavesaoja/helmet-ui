
module.exports = {
    emme: {
        version: '4.3.3',
        pythonVersion: '2.7'
    },
    window: {
        width: 800,
        height: 600,
        resizable: false,
        maximizable: false,
        fullscreen: false,
        fullscreenable: false,
        autoHideMenuBar: true,
        webPreferences: {
            devTools: false,
            nodeIntegration: true
        }
    },
    store: {
        properties: {
            EmmePath: 'emme.path',
            DataPath: 'data.path',
            PythonPath: 'python.path',
            HelmetPath: 'helmet.remote.path',
            Iterations: 'helmet.run.iterations',
            Scenario: 'helmet.run.scenario'
        },
        schema: {
            'emme.path': {
                type: 'string'
            },
            'data.path': {
                type: 'string'
            },
            'python.path': {
                type: 'string'
            },
            'helmet.remote.path': {
                type: 'string'
            },
            'helmet.run.iterations': {
                type: 'number',
                minimum: 1,
                maximum: 99,
                default: 10
            },
            'helmet.run.scenario': {
                type: 'string',
                default: 'helmet'
            }
        }
    }
}
