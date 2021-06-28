import './styles/App.less'

import { useAuth0 } from '@auth0/auth0-react'
import { Spin } from 'antd'
import React, { useEffect, useState } from 'react'
import { Redirect, Route, Switch } from 'react-router-dom'
import Worker from 'workerize-loader!./workers/pyodide.worker.js'

import main_py from '!!raw-loader!./python/main.py'

import api from './api'
import LoadingPage from './comp/LoadingPage'
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

export default function App(props) {
    const auth = useAuth0()

    const { isLoading, isAuthenticated, getAccessTokenSilently } = auth

    const { setIsPyReady, setPy } = useAppContext()
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        async function _initApp() {
            console.log('App:_initApp:start')
            setLoading(true)
            try {
                api.interceptors.request.use(async request => {
                    const token = await getAccessTokenSilently()
                    if (token) request.headers.authorization = `Bearer ${token}`
                    return request
                })
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

    // return <LoadingPage />

    return (
        <>
            {loading || isLoading ? (
                <LoadingPage delay={3000} />
            ) : (
                <MainLayout>
                    <Switch>
                        {isAuthenticated && <Route path="/dashboard" component={Dashboard} />}
                        {isAuthenticated && <Route path="/dataset/:id/" component={Dataset} />}
                        {isAuthenticated && <Route path="/visualize/:id/" component={Visualize} />}
                        {isAuthenticated && <Route path="/configure/:id/" component={Configure} />}
                        {!isAuthenticated && <Route exact path="/" component={Index} />}
                        <Redirect to={isAuthenticated ? '/dashboard' : '/'} />
                    </Switch>
                </MainLayout>
            )}
        </>
    )
}
