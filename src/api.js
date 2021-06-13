import axios from 'axios'

export default axios.create({
    baseURL: process.env.REACT_APP_BACKEND_URL
})

// const requestInterceptor = async request => {
//     const token = localStorage.getItem('token')
//     if (token) request.headers.authorization = `Bearer ${token}`
//     return request
// }

// console.log('api:attach request interceptor')
// api.interceptors.request.use(requestInterceptor)
