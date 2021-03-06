import './Layout_common.less'

import { FacebookOutlined, InstagramOutlined, TwitterOutlined } from '@ant-design/icons'
import { Layout } from 'antd'

// import MobileStoreButton from 'react-mobile-store-button'
// import storeButtons from '../../assets/both.png'

export const Footer = () => {
    // const cols = [
    //     [['About us'], ['My Account'], ['Orders History']],
    //     [['Contact us'], ['Address'], ['Email support@getflix.com'], ['']],
    //     [['Follow Us'], ['Facebook'], ['Twitter'], ['Instagram']],
    // ]

    return (
        <Layout.Footer className="footer">
            <div className="footer-col">
                <div className="footer-row-main">About us</div>
                <div>Career</div>
                <div>Support center</div>
                <div>Site roadmap</div>
            </div>
            <div className="footer-col">
                <div className="footer-row-main">Follow us on:</div>
                <div>
                    <FacebookOutlined />
                    &nbsp; Facebook
                </div>
                <div>
                    <InstagramOutlined />
                    &nbsp; Instagram
                </div>
                <div>
                    <TwitterOutlined />
                    &nbsp; Twitter
                </div>
            </div>
            {/* <div className="footer-col">
                <div className="footer-row-main">Do you have a question or feedback for us?</div>
                <div>Call our support desk at </div>
                <div>&nbsp;&nbsp;+90 2430 3242 23 34</div>
                <div>Send us an email at</div>
                <div>&nbsp;&nbsp;support@getflix.com</div>
            </div> */}
        </Layout.Footer>
    )
}
