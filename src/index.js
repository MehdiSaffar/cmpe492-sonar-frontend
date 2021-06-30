import './index.css'

import { Auth0Provider } from '@auth0/auth0-react'
import React from 'react'
import ReactDOM from 'react-dom'
import { BrowserRouter as Router } from 'react-router-dom'

import App from './App'
import { AppContextProvider } from './context/AppContext'
import reportWebVitals from './reportWebVitals'

if (!process.env.NODE_ENV || process.env.NODE_ENV !== 'development') {
    console.log = function () {}
}

ReactDOM.render(
    <Auth0Provider
        domain={process.env.REACT_APP_AUTH0_DOMAIN}
        clientId={process.env.REACT_APP_AUTH0_CLIENT_ID}
        redirectUri={window.location.origin}
        audience="https://sonar-authorize/"
    >
        <Router>
            <AppContextProvider>
                <App />
            </AppContextProvider>
        </Router>
    </Auth0Provider>,
    document.getElementById('root')
)

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()
