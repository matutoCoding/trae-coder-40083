import React, { useMemo, useState, useEffect } from 'react'
import {
  Card,
  Table,
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
  Tabs,
  Switch,
  Tooltip,
  Alert,
  Divider,
  List,
  Typography,
  Empty
} from 'antd'
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  PlayCircleOutlined,
  EyeOutlined,
  CalendarOutlined,
  ClockCircleOutlined
} from '@ant-design/icons'
import dayjs, { Dayjs } from 'dayjs'
import { useAppStore } from '@/stores/useAppStore'
import {
  WeeklyRule,
  WeekDay,
  WEEKDAY_LABELS,
  GeneratePreview,
  Booking,
  WeeklyTimeSlot,
  ID
} from '@/types'
import {
  generateWeeklyBookings,
  generateMultipleRules,
  validateWeeklyRule
} from '@/utils/scheduleGenerator'

const { RangePicker } = DatePicker
const { TextArea } = Input
const { Option } = Select
const { Title, Text } = Typography

const WEEKDAY_OPTIONS = Object.entries(WEEKDAY_LABELS).map(([value, label]) => ({
  value: Number(value) as WeekDay,
  label
}))

interface RuleFormValues {
  name: string
  artistId: ID
  studioId: ID
  engineerId?: ID
  slots: WeeklyTimeSlot[]
  effectiveRange: [Dayjs, Dayjs]
  hourlyRateOverride?: number
  note?: string
  isActive: boolean
}

interface CyclePageProps {
  defaultTab?: 'rules' | 'generate'
}

const CyclePage: React.FC<CyclePageProps> = ({ defaultTab = 'rules' }) => {
  const {
    studios,
    engineers,
    artists,
    rules,
    bookings,
    addRule,
    updateRule,
    deleteRule,
    toggleRule,
    bulkAddBookings
  } = useAppStore()

  const [activeTab, setActiveTab] = useState<string>(defaultTab)

  const [ruleModalOpen, setRuleModalOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<WeeklyRule | null>(null)
  const [ruleForm] = Form.useForm<RuleFormValues>()

  const [selectedRuleIds, setSelectedRuleIds] = useState<ID[]>([])
  const [generateRange, setGenerateRange] = useState<[Dayjs, Dayjs] | null>([
    dayjs().startOf('day'),
    dayjs().add(4, 'week').endOf('day')
  ])
  const [previewResults, setPreviewResults] = useState<GeneratePreview[] | null>(null)

  const getStudioName = (id: ID) => studios.find((s) => s.id === id)?.name ?? '未知'
  const getEngineerName = (id?: ID) =>
    id ? engineers.find((e) => e.id === id)?.name ?? '未指派' : '未指派'
  const getArtistName = (id: ID) => artists.find((a) => a.id === id)?.name ?? '未知'

  const stats = useMemo(() => {
    const totalRules = rules.length
    const activeRules = rules.filter((r) => r.isActive).length

    const today = dayjs().format('YYYY-MM-DD')
    const weekStart = dayjs().startOf('week').format('YYYY-MM-DD')
    const weekEnd = dayjs().endOf('week').format('YYYY-MM-DD')

    const ruleIds = rules.map((r) => r.id)
    const weekBookings = bookings.filter(
      (b) =>
        ruleIds.includes(b.ruleId || '') &&
        b.date >= weekStart &&
        b.date <= weekEnd
    ).length
    const todayBookings = bookings.filter(
      (b) => ruleIds.includes(b.ruleId || '') && b.date === today
    ).length

    return { totalRules, activeRules, weekBookings, todayBookings }
  }, [rules, bookings])

  useEffect(() => {
    const activeRuleIds = rules.filter((r) => r.isActive).map((r) => r.id)
    setSelectedRuleIds(activeRuleIds)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const formatSlotsDisplay = (slots: WeeklyTimeSlot[]) => {
    if (slots.length === 0) return <Tag color="default">未配置</Tag>
    return (
      <Space direction="vertical" size={2}>
        {slots.map((slot, idx) => (
          <Tag key={idx} color="blue">
            {WEEKDAY_LABELS[slot.weekDay]} {slot.startTime}-{slot.endTime}
          </Tag>
        ))}
      </Space>
    )
  }

  const handleAddRule = () => {
    setEditingRule(null)
    ruleForm.resetFields()
    ruleForm.setFieldsValue({
      isActive: true,
      slots: [{ weekDay: WeekDay.MONDAY, startTime: '09:00', endTime: '12:00' }]
    })
    setRuleModalOpen(true)
  }

  const handleEditRule = (record: WeeklyRule) => {
    setEditingRule(record)
    ruleForm.setFieldsValue({
      name: record.name,
      artistId: record.artistId,
      studioId: record.studioId,
      engineerId: record.engineerId,
      slots: record.slots,
      effectiveRange: [dayjs(record.effectiveStart), dayjs(record.effectiveEnd)],
      hourlyRateOverride: record.hourlyRateOverride,
      note: record.note,
      isActive: record.isActive
    })
    setRuleModalOpen(true)
  }

  const handleDeleteRule = (id: ID) => {
    deleteRule(id)
    message.success('删除成功')
  }

  const handleToggleRule = (record: WeeklyRule) => {
    toggleRule(record.id)
    message.success(record.isActive ? '已停用' : '已启用')
  }

  const handlePreviewFromRule = (record: WeeklyRule) => {
    setSelectedRuleIds([record.id])
    setGenerateRange([
      dayjs().startOf('day'),
      dayjs().add(4, 'week').endOf('day')
    ])
    const result = generateWeeklyBookings(record, {
      existingBookings: bookings,
      studios,
      engineers,
      artists,
      rangeStart: dayjs().format('YYYY-MM-DD'),
      rangeEnd: dayjs().add(4, 'week').format('YYYY-MM-DD')
    })
    setPreviewResults([result])
    setActiveTab('batch')
  }

  const handleSubmitRule = async () => {
    try {
      const values = await ruleForm.validateFields()

      const ruleData = {
        name: values.name,
        artistId: values.artistId,
        studioId: values.studioId,
        engineerId: values.engineerId,
        slots: values.slots,
        effectiveStart: values.effectiveRange[0].format('YYYY-MM-DD'),
        effectiveEnd: values.effectiveRange[1].format('YYYY-MM-DD'),
        hourlyRateOverride: values.hourlyRateOverride,
        note: values.note,
        isActive: values.isActive
      }

      const errors = validateWeeklyRule(ruleData, rules)
      if (errors.length > 0) {
        message.error(errors[0])
        return
      }

      if (editingRule) {
        updateRule(editingRule.id, ruleData)
        message.success('更新成功')
      } else {
        addRule(ruleData)
        message.success('新增成功')
      }
      setRuleModalOpen(false)
    } catch {
      message.error('请检查表单')
    }
  }

  const handlePreview = () => {
    if (selectedRuleIds.length === 0) {
      message.error('请至少选择一个规则')
      return
    }
    if (!generateRange || generateRange.length !== 2) {
      message.error('请选择生成日期范围')
      return
    }

    const targetRules = rules.filter((r) => selectedRuleIds.includes(r.id))
    const results = generateMultipleRules(targetRules, {
      existingBookings: bookings,
      studios,
      engineers,
      artists,
      rangeStart: generateRange[0].format('YYYY-MM-DD'),
      rangeEnd: generateRange[1].format('YYYY-MM-DD')
    })
    setPreviewResults(results)
  }

  const handleConfirmGenerate = () => {
    if (!previewResults || previewResults.length === 0) {
      message.error('请先预览生成结果')
      return
    }

    const allBookings: Booking[] = []
    previewResults.forEach((r) => {
      allBookings.push(...r.generatedBookings)
    })

    if (allBookings.length === 0) {
      message.warning('没有可生成的档期')
      return
    }

    bulkAddBookings(allBookings)
    message.success(`成功生成 ${allBookings.length} 个档期`)
    setPreviewResults(null)
  }

  const ruleColumns = [
    { title: '规则名称', dataIndex: 'name', key: 'name', width: 160 },
    {
      title: '艺人',
      dataIndex: 'artistId',
      key: 'artistId',
      width: 140,
      render: (id: ID) => getArtistName(id)
    },
    {
      title: '录音棚',
      dataIndex: 'studioId',
      key: 'studioId',
      width: 140,
      render: (id: ID) => getStudioName(id)
    },
    {
      title: '录音师',
      dataIndex: 'engineerId',
      key: 'engineerId',
      width: 120,
      render: (id?: ID) => getEngineerName(id)
    },
    {
      title: '时段配置',
      key: 'slots',
      width: 260,
      render: (_: unknown, r: WeeklyRule) => formatSlotsDisplay(r.slots)
    },
    {
      title: '有效期',
      key: 'effective',
      width: 180,
      render: (_: unknown, r: WeeklyRule) => (
        <Space direction="vertical" size={0}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            <CalendarOutlined /> {r.effectiveStart}
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            <CalendarOutlined /> {r.effectiveEnd}
          </Text>
        </Space>
      )
    },
    {
      title: '启用',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 80,
      align: 'center' as const,
      render: (v: boolean, record: WeeklyRule) => (
        <Switch
          checked={v}
          onChange={() => handleToggleRule(record)}
          size="small"
        />
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 260,
      fixed: 'right' as const,
      render: (_: unknown, record: WeeklyRule) => (
        <Space size="small" wrap>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handlePreviewFromRule(record)}
          >
            生成预览
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditRule(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确认删除该规则?"
            onConfirm={() => handleDeleteRule(record.id)}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  const previewSummary = useMemo(() => {
    if (!previewResults) return null
    const total = previewResults.reduce((s, r) => s + r.totalCount, 0)
    const generated = previewResults.reduce(
      (s, r) => s + r.generatedBookings.length,
      0
    )
    const skipped = previewResults.reduce((s, r) => s + r.skippedCount, 0)
    return { total, generated, skipped }
  }, [previewResults])

  const bookingDetailColumns = [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      width: 120,
      render: (v: string) => (
        <Space>
          <CalendarOutlined style={{ color: '#1890ff' }} />
          {v}
        </Space>
      )
    },
    {
      title: '星期',
      key: 'weekday',
      width: 80,
      render: (_: unknown, r: Booking) => WEEKDAY_LABELS[dayjs(r.date).day() as WeekDay]
    },
    {
      title: '开始',
      dataIndex: 'startTime',
      key: 'startTime',
      width: 90
    },
    {
      title: '结束',
      dataIndex: 'endTime',
      key: 'endTime',
      width: 90
    },
    {
      title: '时长',
      dataIndex: 'hours',
      key: 'hours',
      width: 100,
      render: (v: number) => `${v} 小时`
    },
    {
      title: '金额',
      dataIndex: 'subtotal',
      key: 'subtotal',
      width: 120,
      render: (v: number) => <Text strong style={{ color: '#cf1322' }}>¥{v}</Text>
    }
  ]

  const rulesTabContent = (
    <>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="规则总数"
              value={stats.totalRules}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="启用规则"
              value={stats.activeRules}
              prefix={<PlayCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="本周生成档次数"
              value={stats.weekBookings}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="今日生成档次数"
              value={stats.todayBookings}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      <div style={{ marginBottom: 16, textAlign: 'right' }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddRule}>
          新增周期规则
        </Button>
      </div>

      <Table
        rowKey="id"
        columns={ruleColumns}
        dataSource={rules}
        pagination={{ pageSize: 10 }}
        scroll={{ x: 1300 }}
      />
    </>
  )

  const batchTabContent = (
    <>
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="bottom">
          <Col xs={24} md={12}>
            <div style={{ fontWeight: 500, marginBottom: 8 }}>选择规则</div>
            <Select
              mode="multiple"
              style={{ width: '100%' }}
              placeholder="请选择要生成的周期规则"
              value={selectedRuleIds}
              onChange={setSelectedRuleIds}
              optionFilterProp="label"
              maxTagCount="responsive"
            >
              {rules.map((r) => (
                <Option key={r.id} value={r.id} label={r.name}>
                  <Space>
                    <Text>{r.name}</Text>
                    {r.isActive ? (
                      <Tag color="green">启用</Tag>
                    ) : (
                      <Tag color="default">停用</Tag>
                    )}
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {getArtistName(r.artistId)} / {getStudioName(r.studioId)}
                    </Text>
                  </Space>
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} md={8}>
            <div style={{ fontWeight: 500, marginBottom: 8 }}>生成日期范围</div>
            <RangePicker
              style={{ width: '100%' }}
              value={generateRange}
              onChange={(v) => setGenerateRange(v as [Dayjs, Dayjs] | null)}
            />
          </Col>
          <Col xs={24} md={4}>
            <Button
              type="primary"
              icon={<EyeOutlined />}
              onClick={handlePreview}
              style={{ width: '100%' }}
            >
              预览生成结果
            </Button>
          </Col>
        </Row>
      </Card>

      {previewSummary && (
        <Card style={{ marginBottom: 16 }} size="small">
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={8}>
              <Alert
                type="info"
                showIcon
                message={`计划生成数：${previewSummary.total}`}
              />
            </Col>
            <Col xs={24} sm={8}>
              <Alert
                type="success"
                showIcon
                message={`成功生成数：${previewSummary.generated}`}
              />
            </Col>
            <Col xs={24} sm={8}>
              <Alert
                type="warning"
                showIcon
                message={`冲突跳过数：${previewSummary.skipped}`}
              />
            </Col>
          </Row>
        </Card>
      )}

      {previewResults && previewResults.length > 0 ? (
        <>
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            {previewResults.map((result) => (
              <Col xs={24} key={result.ruleId}>
                <Card
                  title={
                    <Space>
                      <Title level={5} style={{ margin: 0 }}>
                        {result.ruleName}
                      </Title>
                      <Tag color="blue">{result.artistName}</Tag>
                      <Tag color="purple">{result.studioName}</Tag>
                    </Space>
                  }
                  size="small"
                >
                  <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                    <Col xs={24} sm={8}>
                      <Statistic
                        title="计划生成数"
                        value={result.totalCount}
                        valueStyle={{ color: '#1890ff', fontSize: 20 }}
                      />
                    </Col>
                    <Col xs={24} sm={8}>
                      <Statistic
                        title="成功数"
                        value={result.generatedBookings.length}
                        valueStyle={{ color: '#52c41a', fontSize: 20 }}
                      />
                    </Col>
                    <Col xs={24} sm={8}>
                      <Statistic
                        title="冲突跳过数"
                        value={result.skippedCount}
                        valueStyle={{ color: '#fa8c16', fontSize: 20 }}
                      />
                    </Col>
                  </Row>

                  {result.skippedBookings.length > 0 && (
                    <Alert
                      type="warning"
                      showIcon
                      style={{ marginBottom: 16 }}
                      message={`存在 ${result.skippedBookings.length} 条跳过记录${result.skippedBookings.length > 10 ? '，仅显示前10条' : ''}`}
                      description={
                        <List
                          size="small"
                          dataSource={result.skippedBookings.slice(0, 10)}
                          renderItem={(item) => (
                            <List.Item>
                              <Space>
                                <CalendarOutlined />
                                <Text>{item.date}</Text>
                                <ClockCircleOutlined />
                                <Text>{item.startTime}</Text>
                                <Tag color="orange">{item.reason}</Tag>
                              </Space>
                            </List.Item>
                          )}
                        />
                      }
                    />
                  )}

                  {result.generatedBookings.length > 0 ? (
                    <Table
                      rowKey="id"
                      columns={bookingDetailColumns}
                      dataSource={result.generatedBookings}
                      pagination={{ pageSize: 5, size: 'small' }}
                      size="small"
                    />
                  ) : (
                    <Empty description="无可用档期可生成" />
                  )}
                </Card>
              </Col>
            ))}
          </Row>

          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setPreviewResults(null)}>取消预览</Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleConfirmGenerate}
                disabled={!previewSummary || previewSummary.generated === 0}
              >
                确认批量生成
              </Button>
            </Space>
          </div>
        </>
      ) : (
        <Card>
          <Empty description="点击上方「预览生成结果」查看计划生成的档期" />
        </Card>
      )}
    </>
  )

  return (
    <div style={{ padding: 16 }}>
      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'rules',
              label: (
                <span>
                  <CalendarOutlined /> 周期规则
                </span>
              ),
              children: rulesTabContent
            },
            {
              key: 'batch',
              label: (
                <span>
                  <PlayCircleOutlined /> 批量生成
                </span>
              ),
              children: batchTabContent
            }
          ]}
        />
      </Card>

      <Modal
        title={editingRule ? '编辑周期规则' : '新增周期规则'}
        open={ruleModalOpen}
        onOk={handleSubmitRule}
        onCancel={() => setRuleModalOpen(false)}
        destroyOnClose
        width={680}
      >
        <Form form={ruleForm} layout="vertical">
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="规则名称"
                name="name"
                rules={[{ required: true, message: '请输入规则名称' }]}
              >
                <Input placeholder="请输入规则名称，如：每周一录音" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="启用状态" name="isActive" valuePropName="checked">
                <Switch checkedChildren="启用" unCheckedChildren="停用" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
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
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="录音棚"
                name="studioId"
                rules={[{ required: true, message: '请选择录音棚' }]}
              >
                <Select
                  placeholder="请选择录音棚"
                  showSearch
                  optionFilterProp="children"
                >
                  {studios
                    .filter((s) => s.isActive)
                    .map((s) => (
                      <Option key={s.id} value={s.id}>
                        {s.name} - ¥{s.hourlyRate}/小时
                      </Option>
                    ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item label="录音师 (可选)" name="engineerId">
                <Select
                  placeholder="请选择录音师"
                  allowClear
                  showSearch
                  optionFilterProp="children"
                >
                  {engineers
                    .filter((e) => e.isActive)
                    .map((e) => (
                      <Option key={e.id} value={e.id}>
                        {e.name} - {e.specialty} - ¥{e.hourlyRate}/小时
                      </Option>
                    ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="协议单价覆盖 (¥/小时)" name="hourlyRateOverride">
                <Tooltip title="不填则使用录音棚默认时薪">
                  <InputNumber min={0} style={{ width: '100%' }} placeholder="选填，覆盖录音棚时薪" />
                </Tooltip>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="有效期"
            name="effectiveRange"
            rules={[{ required: true, message: '请选择有效期范围' }]}
          >
            <RangePicker style={{ width: '100%' }} />
          </Form.Item>

          <Divider orientation="left">时段配置</Divider>

          <Form.List
            name="slots"
            rules={[
              {
                validator: async (_, slots: WeeklyTimeSlot[]) => {
                  if (!slots || slots.length === 0) {
                    return Promise.reject(new Error('请至少配置一个时段'))
                  }
                }
              }
            ]}
          >
            {(fields, { add, remove }, { errors }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Space
                    key={key}
                    style={{ display: 'flex', marginBottom: 8, width: '100%' }}
                    align="baseline"
                  >
                    <Form.Item
                      {...restField}
                      name={[name, 'weekDay']}
                      rules={[{ required: true, message: '选择星期' }]}
                      style={{ marginBottom: 0, minWidth: 120 }}
                    >
                      <Select
                        placeholder="星期"
                        options={WEEKDAY_OPTIONS}
                      />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'startTime']}
                      rules={[{ required: true, message: '选择开始时间' }]}
                      style={{ marginBottom: 0 }}
                    >
                      <TimePicker format="HH:mm" minuteStep={15} placeholder="开始" />
                    </Form.Item>
                    <Text>—</Text>
                    <Form.Item
                      {...restField}
                      name={[name, 'endTime']}
                      rules={[{ required: true, message: '选择结束时间' }]}
                      style={{ marginBottom: 0 }}
                    >
                      <TimePicker format="HH:mm" minuteStep={15} placeholder="结束" />
                    </Form.Item>
                    <DeleteOutlined
                      style={{ color: '#ff4d4f', cursor: 'pointer', marginLeft: 8 }}
                      onClick={() => remove(name)}
                    />
                  </Space>
                ))}
                <Form.Item style={{ marginBottom: 0 }}>
                  <Button
                    type="dashed"
                    onClick={() =>
                      add({ weekDay: WeekDay.MONDAY, startTime: '09:00', endTime: '12:00' })
                    }
                    icon={<PlusOutlined />}
                    block
                  >
                    添加时段
                  </Button>
                  <Form.ErrorList errors={errors} />
                </Form.Item>
              </>
            )}
          </Form.List>

          <Divider orientation="left">其他信息</Divider>

          <Form.Item label="备注" name="note">
            <TextArea rows={3} placeholder="选填，补充说明" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default CyclePage
