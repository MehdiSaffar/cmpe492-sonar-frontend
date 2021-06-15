import './index.less'

import { useAuth0 } from '@auth0/auth0-react'
import { Button } from 'antd'

import { useAppContext } from '../context/AppContext'
import { useRouter } from '../hooks'

export default function Home() {
    const router = useRouter()

    const { loginWithPopup } = useAuth0()

    const onClickLogin = async () => {
        await loginWithPopup()
        router.push('/dashboard')
    }

    return (
        <div className="home">
            <div className="home-login">
                <div className="home-login-logo">
                    <img src="/logo.png" />
                </div>
                <div className="home-login-right">
                    <div className="home-login-text">
                        <h1>Welcome to SONAR</h1>
                        Press login to start
                    </div>
                    <div className="home-login-button">
                        <Button block type="primary" onClick={onClickLogin}>
                            Login
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
