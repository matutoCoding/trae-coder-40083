import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ConfigProvider, App as AntdApp } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import 'dayjs/locale/zh-cn'
import dayjs from 'dayjs'
import MainLayout from './layouts/MainLayout'
import SchedulePage from './pages/SchedulePage'
import CyclePage from './pages/CyclePage'
import DiscountPage from './pages/DiscountPage'
import BillPage from './pages/BillPage'

dayjs.locale('zh-cn')

const themeConfig = {
  token: {
    colorPrimary: '#1890ff',
    borderRadius: 6,
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
    fontSize: 13
  },
  components: {
    Layout: {
      headerBg: '#ffffff',
      siderBg: '#001529'
    },
    Menu: {
      darkItemBg: '#001529',
      darkSubMenuItemBg: '#000c17'
    }
  }
}

export default function App() {
  return (
    <ConfigProvider locale={zhCN} theme={themeConfig}>
      <AntdApp>
        <HashRouter>
          <MainLayout>
            <Routes>
              <Route path="/" element={<Navigate to="/schedule/booking" replace />} />
              <Route path="/schedule" element={<Navigate to="/schedule/booking" replace />} />
              <Route path="/schedule/booking" element={<SchedulePage defaultTab="calendar" />} />
              <Route path="/schedule/studio" element={<SchedulePage defaultTab="studios" />} />
              <Route path="/cycle" element={<Navigate to="/cycle/rules" replace />} />
              <Route path="/cycle/rules" element={<CyclePage defaultTab="rules" />} />
              <Route path="/cycle/generate" element={<CyclePage defaultTab="generate" />} />
              <Route path="/discount" element={<Navigate to="/discount/manage" replace />} />
              <Route path="/discount/manage" element={<DiscountPage defaultTab="manage" />} />
              <Route path="/discount/demo" element={<DiscountPage defaultTab="demo" />} />
              <Route path="/bill" element={<Navigate to="/bill/list" replace />} />
              <Route path="/bill/list" element={<BillPage defaultTab="list" />} />
              <Route path="/bill/create" element={<BillPage defaultTab="create" />} />
              <Route path="*" element={<Navigate to="/schedule/booking" replace />} />
            </Routes>
          </MainLayout>
        </HashRouter>
      </AntdApp>
    </ConfigProvider>
  )
}
