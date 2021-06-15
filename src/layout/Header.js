import './Layout_common.less'

import { LogoutOutlined, UserOutlined } from '@ant-design/icons'
import { useAuth0 } from '@auth0/auth0-react'
import { Avatar, Button, Dropdown, Layout, Menu } from 'antd'
import { Link } from 'react-router-dom'

import { useAppContext } from '../context/AppContext'
import { useRouter } from '../hooks'

export const GuestHeaderContent = () => {
    return (
        <Menu className="header-menu" mode="horizontal">
            {/* <Menu.Item key="login">
                <Link to="/login">Login</Link>
            </Menu.Item> */}
        </Menu>
    )
}

export const UserHeaderContent = () => {
    // const { user, logout } = useAppContext()
    const { user, logout } = useAuth0()
    const router = useRouter()

    const onMenuItemClick = async ({ key }) => {
        if (key === 'logout') {
            logout()
            // router.push('/')
        }
    }

    const dropdownMenu = () => {
        return (
            <Menu onClick={onMenuItemClick}>
                <Menu.Item key="logout" icon={<LogoutOutlined />}>
                    Logout
                </Menu.Item>
            </Menu>
        )
    }

    return (
        <div className="header-user">
            <Dropdown overlay={dropdownMenu()} placement={'bottomRight'} trigger="click">
                <Button className="header-user-info" ghost>
                    <Avatar shape="square" size="large" icon={<UserOutlined />} />
                    <div className="header-user-info-details">
                        <div className="header-user-info-details-name">{user.name}</div>
                        <div className="header-user-info-details-email">{user.email}</div>
                    </div>
                </Button>
            </Dropdown>
        </div>
    )
}

export const Header = () => {
    const { isAuthenticated } = useAuth0()
    // const { user } = useAppContext()

    return (
        <Layout.Header className="header">
            <div className="header-logo">
                <Link to="/">
                    <img src={'/logo.png'} />
                </Link>
            </div>
            <div className="header-search-bar"></div>
            {!isAuthenticated ? <GuestHeaderContent /> : <UserHeaderContent />}
        </Layout.Header>
    )
}
