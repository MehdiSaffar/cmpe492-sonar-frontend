import './styles/App.less'

import { LoadingOutlined } from '@ant-design/icons'
import { useAuth0 } from '@auth0/auth0-react'
import { Spin } from 'antd'
import React, { useEffect, useState } from 'react'
import { Redirect, Route, Switch } from 'react-router-dom'
import Worker from 'workerize-loader!./workers/pyodide.worker.js'

import main_py from '!!raw-loader!./python/main.py'

import api from './api'
import { useAppContext } from './context/AppContext'
import { MainLayout } from './layout/MainLayout'
import Configure from './pages/configure'
import Dashboard from './pages/dashboard'
import Dataset from './pages/dataset'
import Index from './pages/index'
import Visualize from './pages/visualize'

// if (process.env.NEXT_PUBLIC_API_MOCKING === 'enabled') {
//     // eslint-disable-next-line unicorn/prefer-module
//     require('../mocks')
// }

const loadingSpinner = <LoadingOutlined style={{ fontSize: 42 }} spin />
const LoadingScreen = () => {
    return <div className="app-loading">loading</div>
}

export default function App(props) {
    const auth = useAuth0()
    console.log('auth', auth)

    const { isLoading, isAuthenticated, getAccessTokenSilently } = auth

    const { setIsPyReady, setPy } = useAppContext()
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        async function _initApp() {
            console.log('App:_initApp:start')
            setLoading(true)
            try {
                api.request.interceptors.use(async request => {
                    const token = await getAccessTokenSilently()
                    console.log('axios token', token)
                    if (token) request.headers.authorization = `Bearer ${token}`
                    return request
                })
                // init()
            } catch (error) {
                console.error('App:_initApp:error', error)
            } finally {
                setLoading(false)
                console.log('App:_initApp:end')
            }
        }

        async function _initPython() {
            console.log('App:_initPython:start')
            setIsPyReady(false)
            try {
                const worker = new Worker()
                await worker.init_pyodide()
                await worker.load_app(main_py)
                window.worker = worker
                setPy(worker)
                setIsPyReady(true)
            } catch (error) {
                console.error('App:_initPython:error', error)
            } finally {
                console.log('App:_initPython:end')
            }
        }
        _initApp()
        _initPython()
    }, [])

    return (
        <>
            {loading || isLoading ? (
                <Spin className="app-loading-spin" indicator={loadingSpinner} delay={3000} spinning={true}>
                    <LoadingScreen />
                </Spin>
            ) : (
                <MainLayout>
                    <Switch>
                        {isAuthenticated && <Route path="/dashboard" component={Dashboard} />}
                        {isAuthenticated && <Route path="/dataset" component={Dataset} />}
                        {isAuthenticated && <Route path="/visualize" component={Visualize} />}
                        {isAuthenticated && <Route path="/configure" component={Configure} />}
                        <Route exact path="/" component={Index} />
                        <Redirect to="/" />
                    </Switch>
                </MainLayout>
            )}
        </>
    )
}
