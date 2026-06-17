import React, { useMemo, useState } from 'react'
import {
  Card,
  Table,
  Tabs,
  Form,
  Input,
  InputNumber,
  Select,
  Modal,
  Button,
  Tag,
  DatePicker,
  TimePicker,
  Space,
  message,
  Popconfirm,
  Row,
  Col,
  Statistic,
  Calendar,
  Badge,
  Tooltip,
  Drawer,
  Switch,
  Divider,
  Alert
} from 'antd'
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  CalendarOutlined,
  TeamOutlined,
  AudioOutlined
} from '@ant-design/icons'
import dayjs, { Dayjs } from 'dayjs'
import { useAppStore } from '@/stores/useAppStore'
import {
  Studio,
  Engineer,
  Artist,
  Booking,
  BookingStatus,
  BOOKING_STATUS_LABELS,
  BOOKING_STATUS_COLORS,
  ID
} from '@/types'
import { checkBookingConflicts, ConflictInfo } from '@/utils/scheduleGenerator'

const { RangePicker } = TimePicker
const { TextArea } = Input
const { Option } = Select

const ARTIST_LEVEL_COLORS: Record<string, string> = {
  A: 'magenta',
  B: 'red',
  C: 'orange',
  D: 'gold'
}

interface SchedulePageProps {
  defaultTab?: 'studios' | 'calendar' | 'engineers' | 'artists'
}

const SchedulePage: React.FC<SchedulePageProps> = ({ defaultTab = 'studios' }) => {
  const {
    studios,
    engineers,
    artists,
    bookings,
    addStudio,
    updateStudio,
    deleteStudio,
    addEngineer,
    updateEngineer,
    deleteEngineer,
    addArtist,
    updateArtist,
    deleteArtist,
    addBooking,
    updateBooking,
    updateBookingStatus
  } = useAppStore()

  const [activeTab, setActiveTab] = useState<string>(defaultTab)

  const [studioModalOpen, setStudioModalOpen] = useState(false)
  const [editingStudio, setEditingStudio] = useState<Studio | null>(null)
  const [studioForm] = Form.useForm<Omit<Studio, 'id' | 'createdAt'>>()

  const [engineerModalOpen, setEngineerModalOpen] = useState(false)
  const [editingEngineer, setEditingEngineer] = useState<Engineer | null>(null)
  const [engineerForm] = Form.useForm<Omit<Engineer, 'id' | 'createdAt'>>()

  const [artistModalOpen, setArtistModalOpen] = useState(false)
  const [editingArtist, setEditingArtist] = useState<Artist | null>(null)
  const [artistForm] = Form.useForm<Omit<Artist, 'id' | 'createdAt'>>()

  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs())
  const [filterStudioId, setFilterStudioId] = useState<ID | undefined>(undefined)
  const [filterEngineerId, setFilterEngineerId] = useState<ID | undefined>(undefined)
  const [filterArtistId, setFilterArtistId] = useState<ID | undefined>(undefined)

  const [bookingDrawerOpen, setBookingDrawerOpen] = useState(false)
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null)
  const [bookingForm] = Form.useForm()

  const getStudioName = (id: ID) => studios.find((s) => s.id === id)?.name ?? '未知'
  const getEngineerName = (id?: ID) => (id ? engineers.find((e) => e.id === id)?.name ?? '未指派' : '未指派')
  const getArtistName = (id: ID) => artists.find((a) => a.id === id)?.name ?? '未知'

  const stats = useMemo(() => {
    const activeStudios = studios.filter((s) => s.isActive).length
    const activeEngineers = engineers.filter((e) => e.isActive).length
    const todayBookings = bookings.filter(
      (b) => b.date === dayjs().format('YYYY-MM-DD') && b.status !== BookingStatus.CANCELLED
    ).length
    const pendingBookings = bookings.filter((b) => b.status === BookingStatus.PENDING).length
    return { activeStudios, activeEngineers, todayBookings, pendingBookings }
  }, [studios, engineers, bookings])

  const handleAddStudio = () => {
    setEditingStudio(null)
    studioForm.resetFields()
    studioForm.setFieldsValue({ isActive: true, hourlyRate: 200, equipment: [] })
    setStudioModalOpen(true)
  }

  const handleEditStudio = (record: Studio) => {
    setEditingStudio(record)
    studioForm.setFieldsValue(record)
    setStudioModalOpen(true)
  }

  const handleDeleteStudio = (id: ID) => {
    deleteStudio(id)
    message.success('删除成功')
  }

  const handleSubmitStudio = async () => {
    try {
      const values = await studioForm.validateFields()
      if (editingStudio) {
        updateStudio(editingStudio.id, values)
        message.success('更新成功')
      } else {
        addStudio(values)
        message.success('新增成功')
      }
      setStudioModalOpen(false)
    } catch {
      message.error('请检查表单')
    }
  }

  const handleAddEngineer = () => {
    setEditingEngineer(null)
    engineerForm.resetFields()
    engineerForm.setFieldsValue({ isActive: true, hourlyRate: 150 })
    setEngineerModalOpen(true)
  }

  const handleEditEngineer = (record: Engineer) => {
    setEditingEngineer(record)
    engineerForm.setFieldsValue(record)
    setEngineerModalOpen(true)
  }

  const handleDeleteEngineer = (id: ID) => {
    deleteEngineer(id)
    message.success('删除成功')
  }

  const handleSubmitEngineer = async () => {
    try {
      const values = await engineerForm.validateFields()
      if (editingEngineer) {
        updateEngineer(editingEngineer.id, values)
        message.success('更新成功')
      } else {
        addEngineer(values)
        message.success('新增成功')
      }
      setEngineerModalOpen(false)
    } catch {
      message.error('请检查表单')
    }
  }

  const handleAddArtist = () => {
    setEditingArtist(null)
    artistForm.resetFields()
    artistForm.setFieldsValue({ level: 'B' })
    setArtistModalOpen(true)
  }

  const handleEditArtist = (record: Artist) => {
    setEditingArtist(record)
    artistForm.setFieldsValue(record)
    setArtistModalOpen(true)
  }

  const handleDeleteArtist = (id: ID) => {
    deleteArtist(id)
    message.success('删除成功')
  }

  const handleSubmitArtist = async () => {
    try {
      const values = await artistForm.validateFields()
      if (editingArtist) {
        updateArtist(editingArtist.id, values)
        message.success('更新成功')
      } else {
        addArtist(values)
        message.success('新增成功')
      }
      setArtistModalOpen(false)
    } catch {
      message.error('请检查表单')
    }
  }

  const handleAddBooking = () => {
    setEditingBooking(null)
    bookingForm.resetFields()
    bookingForm.setFieldsValue({
      date: selectedDate,
      status: BookingStatus.PENDING
    })
    setBookingDrawerOpen(true)
  }

  const handleEditBooking = (record: Booking) => {
    setEditingBooking(record)
    bookingForm.setFieldsValue({
      artistId: record.artistId,
      studioId: record.studioId,
      engineerId: record.engineerId,
      date: dayjs(record.date),
      timeRange: [dayjs(record.startTime, 'HH:mm'), dayjs(record.endTime, 'HH:mm')],
      status: record.status,
      note: record.note
    })
    setBookingDrawerOpen(true)
  }

  const handleCancelBooking = (id: ID) => {
    updateBookingStatus(id, BookingStatus.CANCELLED)
    message.success('档期已取消')
  }

  const handleSubmitBooking = async () => {
    try {
      const values = await bookingForm.validateFields()
      const date: Dayjs = values.date
      const timeRange: [Dayjs, Dayjs] = values.timeRange
      const startTime = timeRange[0].format('HH:mm')
      const endTime = timeRange[1].format('HH:mm')
      const hours = Math.max(
        Math.round(timeRange[1].diff(timeRange[0], 'minute') / 60 * 100) / 100,
        0
      )

      const studio = studios.find((s) => s.id === values.studioId)
      const engineer = values.engineerId ? engineers.find((e) => e.id === values.engineerId) : undefined
      const studioRate = studio?.hourlyRate ?? 0
      const engineerRate = engineer?.hourlyRate ?? 0
      const subtotal = Math.round((studioRate + engineerRate) * hours * 100) / 100

      const bookingData: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'> = {
        artistId: values.artistId,
        studioId: values.studioId,
        engineerId: values.engineerId,
        date: date.format('YYYY-MM-DD'),
        startTime,
        endTime,
        hours,
        studioRate,
        engineerRate,
        subtotal,
        status: values.status,
        note: values.note
      }

      const bookingForCheck = editingBooking
        ? { ...bookingData, id: editingBooking.id }
        : bookingData
      const conflicts = checkBookingConflicts(
        bookingForCheck,
        bookings,
        studios,
        artists,
        engineers
      )

      if (conflicts.length > 0) {
        Modal.error({
          title: '档期冲突',
          width: 520,
          content: (
            <div>
              <div style={{ marginBottom: 12 }}>检测到以下冲突，请调整后再提交：</div>
              {conflicts.map((c: ConflictInfo, idx: number) => (
                <Alert
                  key={idx}
                  type="error"
                  showIcon
                  style={{ marginBottom: 8 }}
                  message={c.conflictType === 'studio' ? '录音棚冲突' : '录音师冲突'}
                  description={c.message}
                />
              ))}
            </div>
          )
        })
        return
      }

      if (editingBooking) {
        updateBooking(editingBooking.id, bookingData)
        message.success('档期更新成功')
      } else {
        addBooking(bookingData)
        message.success('档期新增成功')
      }
      setBookingDrawerOpen(false)
    } catch {
      message.error('请检查表单')
    }
  }

  const dateCellRender = (value: Dayjs) => {
    const dateStr = value.format('YYYY-MM-DD')
    const dayBookings = bookings.filter((b) => {
      if (b.date !== dateStr || b.status === BookingStatus.CANCELLED) return false
      if (filterStudioId && b.studioId !== filterStudioId) return false
      if (filterEngineerId && b.engineerId !== filterEngineerId) return false
      if (filterArtistId && b.artistId !== filterArtistId) return false
      return true
    })
    if (dayBookings.length === 0) return null
    return (
      <div style={{ padding: '4px 0' }}>
        <Badge
          count={dayBookings.length}
          style={{ backgroundColor: dayBookings.some((b) => b.status === BookingStatus.PENDING) ? '#faad14' : '#52c41a' }}
        />
      </div>
    )
  }

  const selectedDateBookings = useMemo(() => {
    const dateStr = selectedDate.format('YYYY-MM-DD')
    return bookings.filter((b) => {
      if (b.date !== dateStr) return false
      if (filterStudioId && b.studioId !== filterStudioId) return false
      if (filterEngineerId && b.engineerId !== filterEngineerId) return false
      if (filterArtistId && b.artistId !== filterArtistId) return false
      return true
    })
  }, [bookings, selectedDate, filterStudioId, filterEngineerId, filterArtistId])

  const studioColumns = [
    { title: '名称', dataIndex: 'name', key: 'name' },
    { title: '位置', dataIndex: 'location', key: 'location' },
    {
      title: '时薪',
      dataIndex: 'hourlyRate',
      key: 'hourlyRate',
      render: (v: number) => `¥${v}/小时`
    },
    {
      title: '设备',
      dataIndex: 'equipment',
      key: 'equipment',
      render: (v: string[]) => (v && v.length > 0 ? v.join('、') : '-')
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (v: boolean) => (v ? <Tag color="green">启用</Tag> : <Tag color="default">停用</Tag>)
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: unknown, record: Studio) => (
        <Space size="small">
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEditStudio(record)}>
            编辑
          </Button>
          <Popconfirm title="确认删除该录音棚?" onConfirm={() => handleDeleteStudio(record.id)}>
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  const engineerColumns = [
    { title: '姓名', dataIndex: 'name', key: 'name' },
    { title: '电话', dataIndex: 'phone', key: 'phone' },
    { title: '专长', dataIndex: 'specialty', key: 'specialty' },
    {
      title: '时薪',
      dataIndex: 'hourlyRate',
      key: 'hourlyRate',
      render: (v: number) => `¥${v}/小时`
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (v: boolean) => (v ? <Tag color="green">启用</Tag> : <Tag color="default">停用</Tag>)
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: unknown, record: Engineer) => (
        <Space size="small">
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEditEngineer(record)}>
            编辑
          </Button>
          <Popconfirm title="确认删除该录音师?" onConfirm={() => handleDeleteEngineer(record.id)}>
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  const artistColumns = [
    { title: '艺人名', dataIndex: 'name', key: 'name' },
    { title: '所属公司', dataIndex: 'studioName', key: 'studioName' },
    { title: '联系人', dataIndex: 'contactPerson', key: 'contactPerson' },
    { title: '电话', dataIndex: 'phone', key: 'phone' },
    {
      title: '客户等级',
      dataIndex: 'level',
      key: 'level',
      render: (v: string) => <Tag color={ARTIST_LEVEL_COLORS[v]}>{`等级 ${v}`}</Tag>
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: unknown, record: Artist) => (
        <Space size="small">
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEditArtist(record)}>
            编辑
          </Button>
          <Popconfirm title="确认删除该艺人?" onConfirm={() => handleDeleteArtist(record.id)}>
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  const bookingColumns = [
    {
      title: '艺人',
      dataIndex: 'artistId',
      key: 'artistId',
      render: (id: ID) => getArtistName(id)
    },
    {
      title: '录音棚',
      dataIndex: 'studioId',
      key: 'studioId',
      render: (id: ID) => getStudioName(id)
    },
    {
      title: '录音师',
      dataIndex: 'engineerId',
      key: 'engineerId',
      render: (id?: ID) => getEngineerName(id)
    },
    {
      title: '时段',
      key: 'time',
      render: (_: unknown, r: Booking) => `${r.startTime} - ${r.endTime}`
    },
    {
      title: '时长',
      dataIndex: 'hours',
      key: 'hours',
      render: (v: number) => `${v} 小时`
    },
    {
      title: '金额',
      dataIndex: 'subtotal',
      key: 'subtotal',
      render: (v: number) => `¥${v}`
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (v: BookingStatus) => (
        <Tag color={BOOKING_STATUS_COLORS[v]}>{BOOKING_STATUS_LABELS[v]}</Tag>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: unknown, record: Booking) => (
        <Space size="small">
          <Tooltip title="编辑">
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleEditBooking(record)}
              disabled={record.status === BookingStatus.CANCELLED}
            >
              编辑
            </Button>
          </Tooltip>
          <Popconfirm
            title="确认取消该档期?"
            onConfirm={() => handleCancelBooking(record.id)}
            disabled={record.status === BookingStatus.CANCELLED}
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              disabled={record.status === BookingStatus.CANCELLED}
            >
              取消
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <div style={{ padding: 16 }}>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="活跃录音棚"
              value={stats.activeStudios}
              prefix={<AudioOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="活跃录音师"
              value={stats.activeEngineers}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="今日档期"
              value={stats.todayBookings}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="待确认档期"
              value={stats.pendingBookings}
              prefix={<Badge count={stats.pendingBookings} size="small" />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'studios',
              label: (
                <span>
                  <AudioOutlined /> 录音棚资源
                </span>
              ),
              children: (
                <>
                  <div style={{ marginBottom: 16, textAlign: 'right' }}>
                    <Button type="primary" icon={<PlusOutlined />} onClick={handleAddStudio}>
                      新增录音棚
                    </Button>
                  </div>
                  <Table
                    rowKey="id"
                    columns={studioColumns}
                    dataSource={studios}
                    pagination={{ pageSize: 10 }}
                  />
                </>
              )
            },
            {
              key: 'engineers',
              label: (
                <span>
                  <TeamOutlined /> 录音师管理
                </span>
              ),
              children: (
                <>
                  <div style={{ marginBottom: 16, textAlign: 'right' }}>
                    <Button type="primary" icon={<PlusOutlined />} onClick={handleAddEngineer}>
                      新增录音师
                    </Button>
                  </div>
                  <Table
                    rowKey="id"
                    columns={engineerColumns}
                    dataSource={engineers}
                    pagination={{ pageSize: 10 }}
                  />
                </>
              )
            },
            {
              key: 'calendar',
              label: (
                <span>
                  <CalendarOutlined /> 档期日历
                </span>
              ),
              children: (
                <>
                  <Card size="small" style={{ marginBottom: 16 }}>
                    <Row gutter={[16, 16]} align="middle">
                      <Col xs={24} sm={8} md={6}>
                        <div style={{ fontWeight: 500, marginBottom: 4 }}>录音棚筛选</div>
                        <Select
                          allowClear
                          style={{ width: '100%' }}
                          placeholder="全部录音棚"
                          value={filterStudioId}
                          onChange={(v) => setFilterStudioId(v)}
                        >
                          {studios.map((s) => (
                            <Option key={s.id} value={s.id}>
                              {s.name}
                            </Option>
                          ))}
                        </Select>
                      </Col>
                      <Col xs={24} sm={8} md={6}>
                        <div style={{ fontWeight: 500, marginBottom: 4 }}>录音师筛选</div>
                        <Select
                          allowClear
                          style={{ width: '100%' }}
                          placeholder="全部录音师"
                          value={filterEngineerId}
                          onChange={(v) => setFilterEngineerId(v)}
                        >
                          {engineers.map((e) => (
                            <Option key={e.id} value={e.id}>
                              {e.name}
                            </Option>
                          ))}
                        </Select>
                      </Col>
                      <Col xs={24} sm={8} md={6}>
                        <div style={{ fontWeight: 500, marginBottom: 4 }}>艺人筛选</div>
                        <Select
                          allowClear
                          style={{ width: '100%' }}
                          placeholder="全部艺人"
                          value={filterArtistId}
                          onChange={(v) => setFilterArtistId(v)}
                        >
                          {artists.map((a) => (
                            <Option key={a.id} value={a.id}>
                              {a.name}
                            </Option>
                          ))}
                        </Select>
                      </Col>
                      <Col xs={24} sm={24} md={6} style={{ textAlign: 'right' }}>
                        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddBooking}>
                          新增档期
                        </Button>
                      </Col>
                    </Row>
                  </Card>

                  <Row gutter={[16, 16]}>
                    <Col xs={24} lg={12}>
                      <Card title="月历视图">
                        <Calendar
                          cellRender={dateCellRender}
                          value={selectedDate}
                          onSelect={(d) => setSelectedDate(d)}
                        />
                      </Card>
                    </Col>
                    <Col xs={24} lg={12}>
                      <Card title={`${selectedDate.format('YYYY年MM月DD日')} 档期详情`}>
                        <Table
                          rowKey="id"
                          columns={bookingColumns}
                          dataSource={selectedDateBookings}
                          pagination={{ pageSize: 5 }}
                          locale={{ emptyText: '当日暂无档期' }}
                          size="small"
                        />
                      </Card>
                    </Col>
                  </Row>
                </>
              )
            },
            {
              key: 'artists',
              label: (
                <span>
                  <TeamOutlined /> 艺人管理
                </span>
              ),
              children: (
                <>
                  <div style={{ marginBottom: 16, textAlign: 'right' }}>
                    <Button type="primary" icon={<PlusOutlined />} onClick={handleAddArtist}>
                      新增艺人
                    </Button>
                  </div>
                  <Table
                    rowKey="id"
                    columns={artistColumns}
                    dataSource={artists}
                    pagination={{ pageSize: 10 }}
                  />
                </>
              )
            }
          ]}
        />
      </Card>

      <Modal
        title={editingStudio ? '编辑录音棚' : '新增录音棚'}
        open={studioModalOpen}
        onOk={handleSubmitStudio}
        onCancel={() => setStudioModalOpen(false)}
        destroyOnClose
      >
        <Form form={studioForm} layout="vertical">
          <Form.Item
            label="名称"
            name="name"
            rules={[{ required: true, message: '请输入名称' }]}
          >
            <Input placeholder="请输入录音棚名称" />
          </Form.Item>
          <Form.Item
            label="位置"
            name="location"
            rules={[{ required: true, message: '请输入位置' }]}
          >
            <Input placeholder="请输入位置" />
          </Form.Item>
          <Form.Item
            label="时薪 (¥/小时)"
            name="hourlyRate"
            rules={[{ required: true, message: '请输入时薪' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入时薪" />
          </Form.Item>
          <Form.Item label="设备列表" name="equipment">
            <Select
              mode="tags"
              placeholder="输入设备名后回车添加"
              tokenSeparators={['，', ',', ' ']}
            />
          </Form.Item>
          <Form.Item label="描述" name="description">
            <TextArea rows={3} placeholder="选填，补充说明" />
          </Form.Item>
          <Form.Item label="启用状态" name="isActive" valuePropName="checked">
            <Switch checkedChildren="启用" unCheckedChildren="停用" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={editingEngineer ? '编辑录音师' : '新增录音师'}
        open={engineerModalOpen}
        onOk={handleSubmitEngineer}
        onCancel={() => setEngineerModalOpen(false)}
        destroyOnClose
      >
        <Form form={engineerForm} layout="vertical">
          <Form.Item
            label="姓名"
            name="name"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input placeholder="请输入姓名" />
          </Form.Item>
          <Form.Item
            label="电话"
            name="phone"
            rules={[{ required: true, message: '请输入电话' }]}
          >
            <Input placeholder="请输入联系电话" />
          </Form.Item>
          <Form.Item
            label="专长"
            name="specialty"
            rules={[{ required: true, message: '请输入专长' }]}
          >
            <Input placeholder="如：混音、母带、人声录制等" />
          </Form.Item>
          <Form.Item
            label="时薪 (¥/小时)"
            name="hourlyRate"
            rules={[{ required: true, message: '请输入时薪' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入时薪" />
          </Form.Item>
          <Form.Item label="启用状态" name="isActive" valuePropName="checked">
            <Switch checkedChildren="启用" unCheckedChildren="停用" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={editingArtist ? '编辑艺人' : '新增艺人'}
        open={artistModalOpen}
        onOk={handleSubmitArtist}
        onCancel={() => setArtistModalOpen(false)}
        destroyOnClose
      >
        <Form form={artistForm} layout="vertical">
          <Form.Item
            label="艺人名"
            name="name"
            rules={[{ required: true, message: '请输入艺人名' }]}
          >
            <Input placeholder="请输入艺人名或组合名" />
          </Form.Item>
          <Form.Item
            label="所属公司"
            name="studioName"
            rules={[{ required: true, message: '请输入所属公司' }]}
          >
            <Input placeholder="请输入所属经纪公司或厂牌" />
          </Form.Item>
          <Form.Item
            label="联系人"
            name="contactPerson"
            rules={[{ required: true, message: '请输入联系人' }]}
          >
            <Input placeholder="请输入联系人姓名" />
          </Form.Item>
          <Form.Item
            label="联系电话"
            name="phone"
            rules={[{ required: true, message: '请输入电话' }]}
          >
            <Input placeholder="请输入联系电话" />
          </Form.Item>
          <Form.Item
            label="客户等级"
            name="level"
            rules={[{ required: true, message: '请选择等级' }]}
          >
            <Select placeholder="请选择客户等级">
              <Option value="A">A - 顶级客户</Option>
              <Option value="B">B - 重要客户</Option>
              <Option value="C">C - 普通客户</Option>
              <Option value="D">D - 潜在客户</Option>
            </Select>
          </Form.Item>
          <Form.Item label="备注" name="note">
            <TextArea rows={3} placeholder="选填" />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title={editingBooking ? '编辑档期' : '新增档期'}
        width={480}
        open={bookingDrawerOpen}
        onClose={() => setBookingDrawerOpen(false)}
        destroyOnClose
        footer={
          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setBookingDrawerOpen(false)}>取消</Button>
              <Button type="primary" onClick={handleSubmitBooking}>
                {editingBooking ? '保存修改' : '确认新增'}
              </Button>
            </Space>
          </div>
        }
      >
        <Form form={bookingForm} layout="vertical">
          <Form.Item
            label="艺人"
            name="artistId"
            rules={[{ required: true, message: '请选择艺人' }]}
          >
            <Select placeholder="请选择艺人" showSearch optionFilterProp="children">
              {artists.map((a) => (
                <Option key={a.id} value={a.id}>
                  {a.name} ({a.studioName})
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            label="录音棚"
            name="studioId"
            rules={[{ required: true, message: '请选择录音棚' }]}
          >
            <Select placeholder="请选择录音棚" showSearch optionFilterProp="children">
              {studios
                .filter((s) => s.isActive)
                .map((s) => (
                  <Option key={s.id} value={s.id}>
                    {s.name} - ¥{s.hourlyRate}/小时
                  </Option>
                ))}
            </Select>
          </Form.Item>
          <Form.Item label="录音师 (可选)" name="engineerId">
            <Select placeholder="请选择录音师" allowClear showSearch optionFilterProp="children">
              {engineers
                .filter((e) => e.isActive)
                .map((e) => (
                  <Option key={e.id} value={e.id}>
                    {e.name} - {e.specialty} - ¥{e.hourlyRate}/小时
                  </Option>
                ))}
            </Select>
          </Form.Item>
          <Form.Item
            label="日期"
            name="date"
            rules={[{ required: true, message: '请选择日期' }]}
          >
            <DatePicker style={{ width: '100%' }} placeholder="请选择日期" />
          </Form.Item>
          <Form.Item
            label="时段"
            name="timeRange"
            rules={[{ required: true, message: '请选择时段' }]}
          >
            <RangePicker style={{ width: '100%' }} format="HH:mm" minuteStep={15} />
          </Form.Item>
          <Form.Item
            label="状态"
            name="status"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select>
              <Option value={BookingStatus.CONFIRMED}>已确认</Option>
              <Option value={BookingStatus.PENDING}>待确认</Option>
            </Select>
          </Form.Item>
          <Divider orientation="left">备注信息</Divider>
          <Form.Item label="备注" name="note">
            <TextArea rows={4} placeholder="选填，如：需要准备特殊设备等" />
          </Form.Item>
          <div style={{ padding: 12, background: '#f6ffed', borderRadius: 8, border: '1px solid #b7eb8f' }}>
            <div style={{ fontSize: 12, color: '#52c41a', marginBottom: 4 }}>
              提交后将自动计算：时长 × (棚时薪 + 录音师时薪) = 金额
            </div>
          </div>
        </Form>
      </Drawer>
    </div>
  )
}

export default SchedulePage
