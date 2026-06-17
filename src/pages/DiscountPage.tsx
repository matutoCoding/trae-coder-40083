import React, { useMemo, useState } from 'react'
import {
  Card,
  Table,
  Form,
  Input,
  InputNumber,
  Modal,
  Button,
  Tag,
  DatePicker,
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
  Steps,
  Descriptions,
  Collapse,
  Typography,
  Empty,
  Slider,
  Radio,
  Transfer
} from 'antd'
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  CalculatorOutlined,
  PercentageOutlined,
  RedEnvelopeOutlined,
  GiftOutlined,
  WarningOutlined
} from '@ant-design/icons'
import dayjs, { Dayjs } from 'dayjs'
import { useAppStore } from '@/stores/useAppStore'
import {
  Discount,
  DiscountType,
  DISCOUNT_TYPE_LABELS,
  CalculationResult,
  CalculationStep
} from '@/types'
import { calculateDiscounts, validateDiscount } from '@/utils/discountEngine'

const { RangePicker } = DatePicker
const { Text } = Typography
const { Step } = Steps
const { Panel } = Collapse

const DISCOUNT_TYPE_COLORS: Record<DiscountType, string> = {
  [DiscountType.COUPON_PERCENT]: 'blue',
  [DiscountType.COUPON_FIXED]: 'purple',
  [DiscountType.FULL_REDUCTION]: 'orange'
}

const DISCOUNT_TYPE_ICONS: Record<DiscountType, React.ReactNode> = {
  [DiscountType.COUPON_PERCENT]: <PercentageOutlined />,
  [DiscountType.COUPON_FIXED]: <RedEnvelopeOutlined />,
  [DiscountType.FULL_REDUCTION]: <GiftOutlined />
}

type DiscountFormValues = Omit<Discount, 'id' | 'createdAt'> & {
  dateRange?: [Dayjs, Dayjs]
  percentValue?: number
  fixedValue?: number
  fixedThreshold?: number
  fullThreshold?: number
  fullReduction?: number
}

const getDiscountParamsText = (discount: Discount): string => {
  switch (discount.type) {
    case DiscountType.COUPON_PERCENT:
      const maxDisc = discount.maxDiscount !== undefined ? `，最高减免¥${discount.maxDiscount}` : ''
      return `${discount.value}折${maxDisc}`
    case DiscountType.COUPON_FIXED:
      const threshold = discount.threshold !== undefined ? `（满${discount.threshold}可用）` : ''
      return `立减${discount.value}元${threshold}`
    case DiscountType.FULL_REDUCTION:
      return `满${discount.threshold}减${discount.value}`
    default:
      return '-'
  }
}

const getDateRangeText = (discount: Discount): string => {
  if (!discount.startDate && !discount.endDate) return '永久有效'
  if (discount.startDate && !discount.endDate) return `${discount.startDate} 起`
  if (!discount.startDate && discount.endDate) return `至 ${discount.endDate}`
  return `${discount.startDate} ~ ${discount.endDate}`
}

interface DiscountPageProps {
  defaultTab?: 'manage' | 'demo'
}

const DiscountPage: React.FC<DiscountPageProps> = ({ defaultTab = 'manage' }) => {
  const {
    discounts,
    bills,
    addDiscount,
    updateDiscount,
    deleteDiscount,
    toggleDiscount,
    reorderDiscount
  } = useAppStore()

  const sortedDiscounts = useMemo(
    () => [...discounts].sort((a, b) => a.priority - b.priority),
    [discounts]
  )

  const activeCount = useMemo(() => discounts.filter((d) => d.isActive).length, [discounts])

  const todayUsageCount = useMemo(() => {
    const today = dayjs().format('YYYY-MM-DD')
    return bills.filter(
      (b) => dayjs(b.createdAt).format('YYYY-MM-DD') === today && b.discountApplications.length > 0
    ).length
  }, [bills])

  const [modalOpen, setModalOpen] = useState(false)
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null)
  const [form] = Form.useForm<DiscountFormValues>()
  const [formErrors, setFormErrors] = useState<string[]>([])
  const [formType, setFormType] = useState<DiscountType>(DiscountType.COUPON_PERCENT)

  const [originalAmount, setOriginalAmount] = useState<number>(5000)
  const [calcDate, setCalcDate] = useState<Dayjs>(dayjs())
  const [selectedDiscountIds, setSelectedDiscountIds] = useState<string[]>([])
  const [calcResult, setCalcResult] = useState<CalculationResult | null>(null)

  const handleOpenModal = (discount?: Discount) => {
    setFormErrors([])
    if (discount) {
      setEditingDiscount(discount)
      setFormType(discount.type)
      const values: DiscountFormValues = {
        name: discount.name,
        type: discount.type,
        value: discount.value,
        threshold: discount.threshold,
        maxDiscount: discount.maxDiscount,
        isStackable: discount.isStackable,
        priority: discount.priority,
        startDate: discount.startDate,
        endDate: discount.endDate,
        isActive: discount.isActive,
        dateRange:
          discount.startDate && discount.endDate
            ? [dayjs(discount.startDate), dayjs(discount.endDate)]
            : undefined,
        percentValue: discount.type === DiscountType.COUPON_PERCENT ? discount.value : undefined,
        fixedValue: discount.type === DiscountType.COUPON_FIXED ? discount.value : undefined,
        fixedThreshold: discount.type === DiscountType.COUPON_FIXED ? discount.threshold : undefined,
        fullThreshold: discount.type === DiscountType.FULL_REDUCTION ? discount.threshold : undefined,
        fullReduction: discount.type === DiscountType.FULL_REDUCTION ? discount.value : undefined
      }
      form.setFieldsValue(values)
    } else {
      setEditingDiscount(null)
      setFormType(DiscountType.COUPON_PERCENT)
      form.resetFields()
      form.setFieldsValue({
        type: DiscountType.COUPON_PERCENT,
        isStackable: false,
        isActive: true,
        priority: (sortedDiscounts.length + 1) * 10
      })
    }
    setModalOpen(true)
  }

  const handleTypeChange = (e: any) => {
    setFormType(e.target.value)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const type = values.type
      let value = 0
      let threshold: number | undefined
      let maxDiscount: number | undefined

      switch (type) {
        case DiscountType.COUPON_PERCENT:
          value = values.percentValue!
          maxDiscount = values.maxDiscount
          break
        case DiscountType.COUPON_FIXED:
          value = values.fixedValue!
          threshold = values.fixedThreshold
          break
        case DiscountType.FULL_REDUCTION:
          threshold = values.fullThreshold!
          value = values.fullReduction!
          break
      }

      let startDate: string | undefined
      let endDate: string | undefined
      if (values.dateRange && values.dateRange.length === 2) {
        startDate = values.dateRange[0].format('YYYY-MM-DD')
        endDate = values.dateRange[1].format('YYYY-MM-DD')
      }

      const discountData: Omit<Discount, 'id' | 'createdAt'> = {
        name: values.name,
        type,
        value,
        threshold,
        maxDiscount,
        isStackable: values.isStackable,
        priority: values.priority,
        startDate,
        endDate,
        isActive: values.isActive
      }

      const errors = validateDiscount(discountData)
      if (errors.length > 0) {
        setFormErrors(errors)
        return
      }

      if (editingDiscount) {
        updateDiscount(editingDiscount.id, discountData)
        message.success('优惠策略更新成功')
      } else {
        addDiscount(discountData)
        message.success('优惠策略创建成功')
      }
      setModalOpen(false)
      setFormErrors([])
    } catch {
      // 校验错误已自动处理
    }
  }

  const handleMoveUp = (index: number) => {
    if (index <= 0) {
      message.warning('已经是第一个了')
      return
    }
    reorderDiscount(index, index - 1)
  }

  const handleMoveDown = (index: number) => {
    if (index >= sortedDiscounts.length - 1) {
      message.warning('已经是最后一个了')
      return
    }
    reorderDiscount(index, index + 1)
  }

  const handleCalculate = () => {
    if (originalAmount <= 0) {
      message.warning('请输入有效的原始金额')
      return
    }
    const orderedDiscounts = selectedDiscountIds
      .map((id) => discounts.find((d) => d.id === id))
      .filter((d): d is Discount => d !== undefined)
    const result = calculateDiscounts(originalAmount, orderedDiscounts, {
      date: calcDate.format('YYYY-MM-DD'),
      enforceOrder: orderedDiscounts
    })
    setCalcResult(result)
  }

  const handleSelectedMoveUp = (index: number) => {
    if (index <= 0) {
      message.warning('已经是第一个了')
      return
    }
    const newIds = [...selectedDiscountIds]
    const [moved] = newIds.splice(index, 1)
    newIds.splice(index - 1, 0, moved)
    setSelectedDiscountIds(newIds)
  }

  const handleSelectedMoveDown = (index: number) => {
    if (index >= selectedDiscountIds.length - 1) {
      message.warning('已经是最后一个了')
      return
    }
    const newIds = [...selectedDiscountIds]
    const [moved] = newIds.splice(index, 1)
    newIds.splice(index + 1, 0, moved)
    setSelectedDiscountIds(newIds)
  }

  const orderCompareResult = useMemo(() => {
    if (selectedDiscountIds.length < 2 || originalAmount <= 0) return null
    const selectedDiscounts = sortedDiscounts.filter((d) => selectedDiscountIds.includes(d.id))
    if (selectedDiscounts.length < 2) return null

    const ordered = [...selectedDiscounts].sort((a, b) => a.priority - b.priority)
    const reversed = [...ordered].reverse()

    const resultOrdered = calculateDiscounts(originalAmount, ordered, {
      date: calcDate.format('YYYY-MM-DD'),
      enforceOrder: ordered
    })
    const resultReversed = calculateDiscounts(originalAmount, reversed, {
      date: calcDate.format('YYYY-MM-DD'),
      enforceOrder: reversed
    })

    return {
      ordered: resultOrdered.finalAmount,
      reversed: resultReversed.finalAmount,
      diff: Math.abs(resultOrdered.finalAmount - resultReversed.finalAmount)
    }
  }, [selectedDiscountIds, originalAmount, calcDate, sortedDiscounts])

  const tableColumns = [
    {
      title: '排序',
      key: 'sort',
      width: 80,
      render: (_: any, __: Discount, index: number) => (
        <Space direction="vertical" size={4}>
          <Button
            type="text"
            size="small"
            icon={<ArrowUpOutlined />}
            onClick={() => handleMoveUp(index)}
            disabled={index === 0}
          />
          <Button
            type="text"
            size="small"
            icon={<ArrowDownOutlined />}
            onClick={() => handleMoveDown(index)}
            disabled={index === sortedDiscounts.length - 1}
          />
        </Space>
      )
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 80,
      sorter: (a: Discount, b: Discount) => a.priority - b.priority
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Discount) => (
        <Space>
          {DISCOUNT_TYPE_ICONS[record.type]}
          <span>{text}</span>
        </Space>
      )
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: DiscountType) => (
        <Tag color={DISCOUNT_TYPE_COLORS[type]} icon={DISCOUNT_TYPE_ICONS[type]}>
          {DISCOUNT_TYPE_LABELS[type]}
        </Tag>
      )
    },
    {
      title: '参数说明',
      key: 'params',
      render: (_: any, record: Discount) => getDiscountParamsText(record)
    },
    {
      title: '有效期',
      key: 'dateRange',
      width: 200,
      render: (_: any, record: Discount) => getDateRangeText(record)
    },
    {
      title: '可叠加',
      dataIndex: 'isStackable',
      key: 'isStackable',
      width: 80,
      render: (v: boolean) => (v ? <Tag color="green">是</Tag> : <Tag color="default">否</Tag>)
    },
    {
      title: '启用',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 80,
      render: (_: any, record: Discount) => (
        <Switch checked={record.isActive} onChange={() => toggleDiscount(record.id)} size="small" />
      )
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      render: (_: any, record: Discount, index: number) => (
        <Space size="small">
          <Tooltip title="上移">
            <Button
              type="text"
              size="small"
              icon={<ArrowUpOutlined />}
              onClick={() => handleMoveUp(index)}
              disabled={index === 0}
            />
          </Tooltip>
          <Tooltip title="下移">
            <Button
              type="text"
              size="small"
              icon={<ArrowDownOutlined />}
              onClick={() => handleMoveDown(index)}
              disabled={index === sortedDiscounts.length - 1}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleOpenModal(record)}
            />
          </Tooltip>
          <Popconfirm title="确定删除该优惠策略吗？" onConfirm={() => deleteDiscount(record.id)}>
            <Button type="text" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ]

  const transferDataSource = sortedDiscounts.map((d) => ({
    key: d.id,
    title: `${d.name} [${DISCOUNT_TYPE_LABELS[d.type]}] - ${getDiscountParamsText(d)}`,
    description: getDiscountParamsText(d)
  }))

  const renderManagementTab = () => (
    <>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="优惠总数"
              value={discounts.length}
              prefix={<GiftOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="启用数"
              value={activeCount}
              prefix={<Switch checked disabled size="small" />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="今日使用次数"
              value={todayUsageCount}
              prefix={<CalculatorOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title="优惠策略列表"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal()}>
            新增优惠
          </Button>
        }
      >
        <Table
          rowKey="id"
          columns={tableColumns}
          dataSource={sortedDiscounts}
          pagination={false}
          locale={{ emptyText: <Empty description="暂无优惠策略" /> }}
        />
      </Card>

      <Modal
        title={editingDiscount ? '编辑优惠策略' : '新增优惠策略'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        width={600}
        destroyOnClose
        okText="提交"
        cancelText="取消"
      >
        {formErrors.length > 0 && (
          <Alert
            style={{ marginBottom: 16 }}
            message="表单校验失败"
            description={
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {formErrors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            }
            type="error"
            showIcon
            icon={<WarningOutlined />}
          />
        )}
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item
            label="优惠名称"
            name="name"
            rules={[{ required: true, message: '请输入优惠名称' }]}
          >
            <Input placeholder="请输入优惠名称" maxLength={50} showCount />
          </Form.Item>

          <Form.Item
            label="优惠类型"
            name="type"
            rules={[{ required: true, message: '请选择优惠类型' }]}
          >
            <Radio.Group onChange={handleTypeChange}>
              <Radio.Button value={DiscountType.COUPON_PERCENT}>
                <PercentageOutlined /> 折扣券
              </Radio.Button>
              <Radio.Button value={DiscountType.COUPON_FIXED}>
                <RedEnvelopeOutlined /> 立减券
              </Radio.Button>
              <Radio.Button value={DiscountType.FULL_REDUCTION}>
                <GiftOutlined /> 满减优惠
              </Radio.Button>
            </Radio.Group>
          </Form.Item>

          {formType === DiscountType.COUPON_PERCENT && (
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="折扣百分比"
                  name="percentValue"
                  rules={[
                    { required: true, message: '请输入折扣百分比' },
                    { type: 'number', min: 0, max: 100, message: '折扣范围0-100' }
                  ]}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    min={0}
                    max={100}
                    step={1}
                    placeholder="例如: 90 表示9折"
                    addonAfter="%"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="最高减免（可选）"
                  name="maxDiscount"
                  rules={[{ type: 'number', min: 0, message: '最高减免不能为负' }]}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    min={0}
                    step={10}
                    placeholder="不填则不限制"
                    addonBefore="¥"
                  />
                </Form.Item>
              </Col>
            </Row>
          )}

          {formType === DiscountType.COUPON_FIXED && (
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="立减金额"
                  name="fixedValue"
                  rules={[
                    { required: true, message: '请输入立减金额' },
                    { type: 'number', min: 0, message: '立减金额必须大于0' }
                  ]}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    min={0}
                    step={10}
                    placeholder="请输入立减金额"
                    addonBefore="¥"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="使用门槛（可选）"
                  name="fixedThreshold"
                  rules={[{ type: 'number', min: 0, message: '使用门槛不能为负' }]}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    min={0}
                    step={100}
                    placeholder="满X元可用，不填则无门槛"
                    addonBefore="满¥"
                  />
                </Form.Item>
              </Col>
            </Row>
          )}

          {formType === DiscountType.FULL_REDUCTION && (
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="满减门槛"
                  name="fullThreshold"
                  rules={[
                    { required: true, message: '请输入满减门槛' },
                    { type: 'number', min: 0, message: '满减门槛必须大于0' }
                  ]}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    min={0}
                    step={100}
                    placeholder="例如: 1000"
                    addonBefore="满¥"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="减免金额"
                  name="fullReduction"
                  rules={[
                    { required: true, message: '请输入减免金额' },
                    { type: 'number', min: 0, message: '减免金额必须大于0' }
                  ]}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    min={0}
                    step={10}
                    placeholder="例如: 100"
                    addonBefore="减¥"
                  />
                </Form.Item>
              </Col>
            </Row>
          )}

          <Divider style={{ margin: '8px 0 16px' }} />

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="优先级"
                name="priority"
                rules={[
                  { required: true, message: '请输入优先级' },
                  { type: 'number', min: 0, message: '优先级不能为负' }
                ]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  step={10}
                  placeholder="数值越小优先级越高"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="有效期" name="dateRange">
                <RangePicker style={{ width: '100%' }} placeholder={['开始日期', '结束日期']} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="是否可叠加" name="isStackable" valuePropName="checked">
                <Switch checkedChildren="是" unCheckedChildren="否" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="是否启用" name="isActive" valuePropName="checked">
                <Switch checkedChildren="启用" unCheckedChildren="禁用" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </>
  )

  const renderCalculatorTab = () => (
    <Row gutter={16}>
      <Col span={10}>
        <Card title="优惠计算输入" style={{ marginBottom: 16 }}>
          <Form layout="vertical">
            <Form.Item label="原始金额">
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                step={100}
                value={originalAmount}
                onChange={(v) => setOriginalAmount(v ?? 0)}
                addonBefore="¥"
                placeholder="请输入原始金额"
                size="large"
              />
            </Form.Item>
            <Row gutter={16}>
              <Col span={24}>
                <Form.Item label="金额快捷选择">
                  <Slider
                    min={0}
                    max={10000}
                    step={100}
                    value={originalAmount}
                    onChange={(v) => setOriginalAmount(v as number)}
                    marks={{
                      0: '¥0',
                      1000: '¥1000',
                      3000: '¥3000',
                      5000: '¥5000',
                      8000: '¥8000',
                      10000: '¥10000'
                    }}
                  />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item label="计算日期">
              <DatePicker
                style={{ width: '100%' }}
                value={calcDate}
                onChange={(v) => setCalcDate(v ?? dayjs())}
                size="large"
              />
            </Form.Item>
            <Form.Item label="选择优惠（支持多选）">
              <Transfer
                dataSource={transferDataSource}
                titles={['全部优惠', '已选优惠']}
                targetKeys={selectedDiscountIds}
                onChange={(nextTargetKeys) => setSelectedDiscountIds(nextTargetKeys as string[])}
                render={(item) => item.title}
                listStyle={{ width: '100%', height: 200 }}
                showSearch
                filterOption={(inputValue, item) =>
                  item.title.toLowerCase().includes(inputValue.toLowerCase())
                }
              />
            </Form.Item>
            {selectedDiscountIds.length > 0 && (
              <Form.Item label="已选优惠排序（影响计算顺序）">
                <List
                  size="small"
                  bordered
                  dataSource={selectedDiscountIds}
                  locale={{ emptyText: '暂无已选优惠' }}
                  renderItem={(id, index) => {
                    const d = sortedDiscounts.find((x) => x.id === id)
                    if (!d) return null
                    return (
                      <List.Item
                        actions={[
                          <Button
                            key="up"
                            type="text"
                            size="small"
                            icon={<ArrowUpOutlined />}
                            onClick={() => handleSelectedMoveUp(index)}
                            disabled={index === 0}
                          />,
                          <Button
                            key="down"
                            type="text"
                            size="small"
                            icon={<ArrowDownOutlined />}
                            onClick={() => handleSelectedMoveDown(index)}
                            disabled={index === selectedDiscountIds.length - 1}
                          />
                        ]}
                      >
                        <Space>
                          <Tag color={DISCOUNT_TYPE_COLORS[d.type]}>
                            {DISCOUNT_TYPE_LABELS[d.type]}
                          </Tag>
                          <span>
                            步骤 {index + 1}: {d.name} - {getDiscountParamsText(d)}
                          </span>
                        </Space>
                      </List.Item>
                    )
                  }}
                />
              </Form.Item>
            )}
            <Button
              type="primary"
              block
              size="large"
              icon={<CalculatorOutlined />}
              onClick={handleCalculate}
              disabled={!originalAmount || originalAmount <= 0}
            >
              重新计算
            </Button>
          </Form>
        </Card>
      </Col>

      <Col span={14}>
        <Card title="计算结果">
          {!calcResult ? (
            <Empty
              style={{ padding: '40px 0' }}
              description="请选择优惠并点击「重新计算」查看结果"
            />
          ) : (
            <>
              <Row gutter={16} style={{ marginBottom: 16 }}>
                <Col span={8}>
                  <Card size="small">
                    <Statistic
                      title="原价"
                      value={calcResult.originalAmount}
                      prefix="¥"
                      valueStyle={{ textDecoration: 'line-through', color: '#999' }}
                    />
                  </Card>
                </Col>
                <Col span={8}>
                  <Card size="small">
                    <Statistic
                      title="总减免"
                      value={calcResult.totalDiscount}
                      prefix="-¥"
                      valueStyle={{ color: '#52c41a', fontWeight: 'bold' }}
                    />
                  </Card>
                </Col>
                <Col span={8}>
                  <Card size="small" style={{ border: '2px solid #ff4d4f' }}>
                    <Statistic
                      title="最终应付"
                      value={calcResult.finalAmount}
                      prefix="¥"
                      valueStyle={{ color: '#ff4d4f', fontSize: 24, fontWeight: 'bold' }}
                    />
                  </Card>
                </Col>
              </Row>

              {calcResult.hadNegativeFallback && (
                <Alert
                  style={{ marginBottom: 16 }}
                  type="warning"
                  showIcon
                  icon={<WarningOutlined />}
                  message="已触发负值兜底，最终金额置为0"
                  description="由于优惠叠加后金额出现负数，系统自动将最终金额调整为0元。"
                />
              )}

              <Divider orientation="left">计算步骤详情</Divider>
              {calcResult.steps.length === 0 ? (
                <Empty description="没有可应用的优惠" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              ) : (
                <Steps
                  direction="vertical"
                  size="small"
                  current={calcResult.steps.length}
                  style={{ marginBottom: 16 }}
                >
                  {calcResult.steps.map((step: CalculationStep) => {
                    const hasDiscount = step.discountAmount > 0
                    return (
                      <Step
                        key={step.order}
                        status={hasDiscount ? 'finish' : 'process'}
                        title={
                          <Space>
                            <span style={{ fontWeight: 500 }}>{step.discountName}</span>
                            <Tag color={DISCOUNT_TYPE_COLORS[step.discountType]}>
                              {DISCOUNT_TYPE_LABELS[step.discountType]}
                            </Tag>
                          </Space>
                        }
                        description={
                          <div>
                            <Text type={hasDiscount ? 'success' : 'warning'}>
                              {hasDiscount
                                ? `¥${step.beforeAmount.toFixed(2)} → -¥${step.discountAmount.toFixed(2)} → ¥${step.afterAmount.toFixed(2)}`
                                : `未应用，保持 ¥${step.beforeAmount.toFixed(2)}`}
                            </Text>
                            {step.note && (
                              <div style={{ marginTop: 4 }}>
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                  备注: {step.note}
                                </Text>
                              </div>
                            )}
                          </div>
                        }
                      />
                    )
                  })}
                </Steps>
              )}

              <Collapse style={{ marginBottom: 16 }}>
                <Panel header="查看优惠应用详情" key="details">
                  <Descriptions column={1} size="small" bordered>
                    {calcResult.applications.length === 0 ? (
                      <Descriptions.Item label="应用优惠">无</Descriptions.Item>
                    ) : (
                      calcResult.applications.map((app, idx) => (
                        <React.Fragment key={app.discountId}>
                          <Descriptions.Item label={`优惠 ${idx + 1}`}>
                            <Space>
                              <Tag color={DISCOUNT_TYPE_COLORS[app.discountType]}>
                                {DISCOUNT_TYPE_LABELS[app.discountType]}
                              </Tag>
                              <span>{app.discountName}</span>
                            </Space>
                          </Descriptions.Item>
                          <Descriptions.Item label="计算前金额">
                            ¥{app.originalAmount.toFixed(2)}
                          </Descriptions.Item>
                          <Descriptions.Item label="减免金额">
                            <Text type="success">-¥{app.appliedAmount.toFixed(2)}</Text>
                          </Descriptions.Item>
                          <Descriptions.Item label="计算后金额">
                            ¥{app.afterAmount.toFixed(2)}
                          </Descriptions.Item>
                        </React.Fragment>
                      ))
                    )}
                  </Descriptions>
                </Panel>
              </Collapse>

              {orderCompareResult && orderCompareResult.diff > 0.01 && (
                <>
                  <Divider orientation="left">
                    <Space>
                      <WarningOutlined style={{ color: '#faad14' }} />
                      顺序影响提示
                    </Space>
                  </Divider>
                  <Alert
                    type="info"
                    showIcon
                    message="不同的优惠应用顺序会产生不同的结果"
                    description={
                      <Row gutter={16} style={{ marginTop: 8 }}>
                        <Col span={12}>
                          <Card size="small" title="按优先级顺序（先满减后折扣等）">
                            <Statistic
                              value={orderCompareResult.ordered}
                              prefix="¥"
                              precision={2}
                              valueStyle={{ color: '#1890ff' }}
                            />
                          </Card>
                        </Col>
                        <Col span={12}>
                          <Card size="small" title="逆序（先折扣后满减等）">
                            <Statistic
                              value={orderCompareResult.reversed}
                              prefix="¥"
                              precision={2}
                              valueStyle={{ color: '#722ed1' }}
                            />
                          </Card>
                        </Col>
                        <Col span={24} style={{ marginTop: 8 }}>
                          <Text type="warning">
                            差额: ¥{orderCompareResult.diff.toFixed(2)}，
                            建议合理设置优惠优先级或选择对用户更有利的顺序
                          </Text>
                        </Col>
                      </Row>
                    }
                    style={{ marginBottom: 16 }}
                  />
                </>
              )}
            </>
          )}
        </Card>
      </Col>
    </Row>
  )

  return (
    <div style={{ padding: 16 }}>
      <Card>
        <Tabs
          defaultActiveKey={defaultTab === 'demo' ? 'calculator' : 'management'}
          items={[
            {
              key: 'management',
              label: (
                <Space>
                  <GiftOutlined />
                  优惠策略管理
                </Space>
              ),
              children: renderManagementTab()
            },
            {
              key: 'calculator',
              label: (
                <Space>
                  <CalculatorOutlined />
                  优惠计算演示
                </Space>
              ),
              children: renderCalculatorTab()
            }
          ]}
        />
      </Card>
    </div>
  )
}

export default DiscountPage
