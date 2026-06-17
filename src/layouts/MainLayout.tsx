import { useState } from 'react'
import {
  Layout,
  Menu,
  theme,
  Avatar,
  Dropdown,
  Space,
  Badge,
  Typography,
  Button
} from 'antd'
import {
  CalendarOutlined,
  ThunderboltOutlined,
  TagOutlined,
  FileTextOutlined,
  SettingOutlined,
  UserOutlined,
  BellOutlined,
  LogoutOutlined,
  DashboardOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined
} from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAppStore } from '@/stores/useAppStore'
import dayjs from 'dayjs'

const { Header, Sider, Content } = Layout
const { Title } = Typography

const MENU_ITEMS = [
  {
    key: '/schedule',
    icon: <CalendarOutlined />,
    label: '录音棚排期',
    children: [
      { key: '/schedule/booking', icon: <DashboardOutlined />, label: '档期日历' },
      { key: '/schedule/studio', icon: <SettingOutlined />, label: '资源管理' }
    ]
  },
  {
    key: '/cycle',
    icon: <ThunderboltOutlined />,
    label: '周期生成',
    children: [
      { key: '/cycle/rules', icon: <SettingOutlined />, label: '周期规则' },
      { key: '/cycle/generate', icon: <ThunderboltOutlined />, label: '批量生成' }
    ]
  },
  {
    key: '/discount',
    icon: <TagOutlined />,
    label: '优惠计算',
    children: [
      { key: '/discount/manage', icon: <SettingOutlined />, label: '优惠策略' },
      { key: '/discount/demo', icon: <TagOutlined />, label: '计算演示' }
    ]
  },
  {
    key: '/bill',
    icon: <FileTextOutlined />,
    label: '账单生成',
    children: [
      { key: '/bill/list', icon: <FileTextOutlined />, label: '账单管理' },
      { key: '/bill/create', icon: <DashboardOutlined />, label: '生成账单' }
    ]
  }
]

const MENU_TITLE: Record<string, { title: string; desc: string }> = {
  '/schedule': { title: '录音棚排期', desc: '管理录音棚、录音师、艺人资源和每日档期' },
  '/schedule/booking': { title: '档期日历', desc: '查看录音棚每日占用，调整档期和录音师排班' },
  '/schedule/studio': { title: '资源管理', desc: '维护录音棚、录音师、艺人的基础档案' },
  '/cycle': { title: '周期生成', desc: '为艺人工作室配置固定周期规则，批量生成未来档期' },
  '/cycle/rules': { title: '周期规则', desc: '配置每周固定时段进棚规则，支持多时段灵活设定' },
  '/cycle/generate': { title: '批量生成', desc: '按周期规则预览冲突，批量生成未来档期占用' },
  '/discount': { title: '优惠计算', desc: '配置多优惠叠加顺序，确保负值兜底安全' },
  '/discount/manage': { title: '优惠策略', desc: '维护折扣券、立减券、满减优惠，调整优先级顺序' },
  '/discount/demo': { title: '计算演示', desc: '演示优惠顺序对最终价的影响，查看分步计算过程' },
  '/bill': { title: '账单生成', desc: '按账期汇总档期，叠加优惠生成应收账单' },
  '/bill/list': { title: '账单管理', desc: '查看历史账单，标记支付状态，导出账单明细' },
  '/bill/create': { title: '生成账单', desc: '按艺人+档期范围四步向导生成对账单' }
}

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const {
    token: { colorBgContainer, borderRadiusLG }
  } = theme.useToken()

  const bookings = useAppStore((s) => s.bookings)
  const bills = useAppStore((s) => s.bills)
  const pendingBookings = bookings.filter((b) => b.status === 'pending').length
  const unpaidBills = bills.filter((b) => b.status === 'unpaid').length
  const notifications = pendingBookings + unpaidBills

  const findOpenKeys = (path: string): string[] => {
    const keys: string[] = []
    for (const item of MENU_ITEMS) {
      if (item.children?.some((c) => path.startsWith(c.key))) {
        keys.push(item.key)
      }
    }
    return keys
  }

  const openKeys = findOpenKeys(location.pathname)

  const userMenu = {
    items: [
      { key: 'profile', icon: <UserOutlined />, label: '个人中心' },
      { key: 'settings', icon: <SettingOutlined />, label: '系统设置' },
      { type: 'divider' as const },
      { key: 'logout', icon: <LogoutOutlined />, label: '退出登录' }
    ]
  }

  const titleInfo =
    MENU_TITLE[location.pathname] || {
      title: '工作台',
      desc: '欢迎使用录音棚档期管理系统'
    }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={240}
        style={{ background: '#001529' }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            borderBottom: '1px solid #0f2642'
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #1890ff 0%, #722ed1 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 'bold',
              fontSize: 18,
              flexShrink: 0
            }}
          >
            S
          </div>
          {!collapsed && (
            <div style={{ color: '#fff', whiteSpace: 'nowrap' }}>
              <div style={{ fontSize: 16, fontWeight: 600 }}>录音棚管理</div>
              <div style={{ fontSize: 11, opacity: 0.6 }}>Studio Schedule</div>
            </div>
          )}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          defaultOpenKeys={openKeys}
          selectedKeys={[location.pathname]}
          items={MENU_ITEMS}
          onClick={({ key }) => navigate(key)}
          style={{ borderRight: 0, paddingTop: 8 }}
        />
        {!collapsed && (
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              padding: '12px 16px',
              borderTop: '1px solid #0f2642',
              color: 'rgba(255,255,255,0.5)',
              fontSize: 11
            }}
          >
            <div>v1.0.0</div>
            <div style={{ marginTop: 2 }}>{dayjs().format('YYYY年MM月DD日')}</div>
          </div>
        )}
      </Sider>
      <Layout>
        <Header
          style={{
            padding: '0 24px',
            background: colorBgContainer,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #f0f0f0',
            height: 64,
            boxShadow: '0 1px 4px rgba(0,21,41,0.06)'
          }}
        >
          <Space align="center" size={16}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: 16, width: 40, height: 40 }}
            />
            <div>
              <Title level={4} style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
                {titleInfo.title}
              </Title>
              <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 2 }}>{titleInfo.desc}</div>
            </div>
          </Space>
          <Space size={16}>
            <Badge count={notifications} offset={[-2, 2]}>
              <Button type="text" icon={<BellOutlined />} style={{ fontSize: 16 }} />
            </Badge>
            <Dropdown menu={userMenu} placement="bottomRight" arrow>
              <Space style={{ cursor: 'pointer', padding: '4px 8px', borderRadius: 6 }}>
                <Avatar size={36} style={{ background: 'linear-gradient(135deg,#1890ff,#722ed1)' }}>
                  <UserOutlined />
                </Avatar>
                <div style={{ lineHeight: 1.2 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>管理员</div>
                  <div style={{ fontSize: 11, color: '#8c8c8c' }}>超级管理员</div>
                </div>
              </Space>
            </Dropdown>
          </Space>
        </Header>
        <Content
          style={{
            margin: 0,
            padding: 24,
            minHeight: 280,
            background: '#f5f7fa',
            overflow: 'auto'
          }}
        >
          <div
            style={{
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
              padding: 24,
              minHeight: 'calc(100vh - 64px - 48px)',
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
            }}
          >
            {children}
          </div>
        </Content>
      </Layout>
    </Layout>
  )
}
