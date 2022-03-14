import 'core-js/stable'
import 'regenerator-runtime/runtime'

import ReactDOM from 'react-dom'
import { message } from 'antd'
import cookie from 'js-cookie'

import history from '@/router/history'
import Router from '@/router'
import initCMDTools from '@/utils/cmd-tools'
import { initSentry, isRealEnv, initXkey } from '@dian/app-utils'
import { systemRoutes, privateRoutes } from '@/router/routes'
import { supplyRoutes } from '@/router/utils'
import pkg from '../package.json'

import 'antd/dist/antd.css'
import './style.less'

if (isRealEnv()) {
  initSentry(pkg, {
    routes: [...supplyRoutes(systemRoutes), ...(privateRoutes)],
  })
}
initCMDTools()

initXkey({
  appKey: 'kcn9vo2l7b46ad',
  debug: !isRealEnv(), // 线上环境则上传到real
  watchXhr: false,
  appDesc: 'apiMerak',
  userId: cookie.get('userId'),
})

message.config({
  maxCount: 3,
})

const App = (
  <Router history={history} />
)

ReactDOM.render(App, document.querySelector('#root'))
