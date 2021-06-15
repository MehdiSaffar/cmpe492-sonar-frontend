const config = {
    BACKEND_URL: process.env.REACT_APP_BACKEND_URL,
    AUTH0_DOMAIN: process.env.REACT_APP_AUTH0_DOMAIN,
    AUTH0_ISSUER_BASE_URL: process.env.REACT_APP_AUTH0_ISSUER_BASE_URL,
    AUTH0_CLIENT_ID: process.env.REACT_APP_AUTH0_CLIENT_ID
}

export default config

console.log(config)
