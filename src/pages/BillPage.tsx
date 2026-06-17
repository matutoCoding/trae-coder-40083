import React, { useMemo, useState } from 'react'
import {
  Card,
  Table,
  Form,
  Select,
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
  Tooltip,
  Alert,
  Divider,
  List,
  Descriptions,
  Drawer,
  Typography,
  Empty,
  Checkbox,
  Transfer,
  Steps
} from 'antd'
import {
  DeleteOutlined,
  PlusOutlined,
  EyeOutlined,
  FileTextOutlined,
  DollarOutlined,
  ExportOutlined,
  CheckCircleOutlined,
  DownloadOutlined
} from '@ant-design/icons'
import dayjs, { Dayjs } from 'dayjs'
import { useAppStore } from '@/stores/useAppStore'
import {
  Bill,
  BillStatus,
  BILL_STATUS_LABELS,
  BookingStatus,
  Discount,
  DiscountType,
  DISCOUNT_TYPE_LABELS,
  ID,
  CalculationStep
} from '@/types'
import { calculateDiscounts } from '@/utils/discountEngine'

const { RangePicker } = DatePicker
const { Option } = Select
const { Title, Text } = Typography
const { Step } = Steps

const BILL_STATUS_COLORS: Record<BillStatus, string> = {
  [BillStatus.UNPAID]: '#faad14',
  [BillStatus.PAID]: '#52c41a',
  [BillStatus.REFUNDED]: '#8c8c8c'
}

const DISCOUNT_TYPE_COLORS: Record<DiscountType, string> = {
  [DiscountType.COUPON_PERCENT]: 'purple',
  [DiscountType.COUPON_FIXED]: 'blue',
  [DiscountType.FULL_REDUCTION]: 'geekblue'
}

interface BillPageProps {
  defaultTab?: 'list' | 'create'
}

const BillPage: React.FC<BillPageProps> = ({ defaultTab = 'list' }) => {
  const {
    artists,
    studios,
    engineers,
    bookings,
    discounts,
    bills,
    addBill,
    updateBillStatus,
    deleteBill
  } = useAppStore()

  const [activeTab, setActiveTab] = useState<string>(defaultTab === 'create' ? 'generate' : 'list')

  const [filterArtistId, setFilterArtistId] = useState<ID | undefined>(undefined)
  const [filterStatuses, setFilterStatuses] = useState<BillStatus[]>([
    BillStatus.UNPAID,
    BillStatus.PAID,
    BillStatus.REFUNDED
  ])
  const [filterDateRange, setFilterDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null)
  const [appliedFilters, setAppliedFilters] = useState<{
    artistId?: ID
    statuses: BillStatus[]
    dateRange?: [Dayjs | null, Dayjs | null] | null
  }>({
    statuses: [BillStatus.UNPAID, BillStatus.PAID, BillStatus.REFUNDED],
    dateRange: null
  })

  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false)
  const [viewingBill, setViewingBill] = useState<Bill | null>(null)

  const [generateStep, setGenerateStep] = useState(0)
  const [selectedArtistId, setSelectedArtistId] = useState<ID | undefined>(undefined)
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>([
    dayjs().subtract(1, 'month').startOf('month'),
    dayjs().subtract(1, 'month').endOf('month')
  ])
  const [selectedBookingIds, setSelectedBookingIds] = useState<ID[]>([])
  const [selectedDiscountIds, setSelectedDiscountIds] = useState<ID[]>([])
  const [orderedDiscountIds, setOrderedDiscountIds] = useState<ID[]>([])

  const getArtistName = (id: ID) => artists.find((a) => a.id === id)?.name ?? '未知艺人'
  const getArtist = (id: ID) => artists.find((a) => a.id === id)
  const getStudioName = (id: ID) => studios.find((s) => s.id === id)?.name ?? '未知棚'
  const getEngineerName = (id?: ID) =>
    id ? engineers.find((e) => e.id === id)?.name ?? '未指派' : '未指派'

  const filteredBills = useMemo(() => {
    return bills.filter((b) => {
      if (appliedFilters.artistId && b.artistId !== appliedFilters.artistId) return false
      if (appliedFilters.statuses && appliedFilters.statuses.length > 0) {
        if (!appliedFilters.statuses.includes(b.status)) return false
      }
      if (appliedFilters.dateRange && appliedFilters.dateRange[0] && appliedFilters.dateRange[1]) {
        const billDate = dayjs(b.createdAt)
        const start = appliedFilters.dateRange[0].startOf('day')
        const end = appliedFilters.dateRange[1].endOf('day')
        if (billDate.isBefore(start) || billDate.isAfter(end)) return false
      }
      return true
    })
  }, [bills, appliedFilters])

  const stats = useMemo(() => {
    const totalCount = bills.length
    const unpaidAmount = bills
      .filter((b) => b.status === BillStatus.UNPAID)
      .reduce((sum, b) => sum + b.finalAmount, 0)
    const paidAmount = bills
      .filter((b) => b.status === BillStatus.PAID)
      .reduce((sum, b) => sum + b.finalAmount, 0)
    const monthStart = dayjs().startOf('month')
    const monthEnd = dayjs().endOf('month')
    const thisMonthCount = bills.filter((b) => {
      const created = dayjs(b.createdAt)
      return created.isAfter(monthStart.subtract(1, 'second')) && created.isBefore(monthEnd)
    }).length
    return {
      totalCount,
      unpaidAmount: Math.round(unpaidAmount * 100) / 100,
      paidAmount: Math.round(paidAmount * 100) / 100,
      thisMonthCount
    }
  }, [bills])

  const handleSearch = () => {
    setAppliedFilters({
      artistId: filterArtistId,
      statuses: filterStatuses,
      dateRange: filterDateRange
    })
  }

  const handleResetFilters = () => {
    setFilterArtistId(undefined)
    setFilterStatuses([BillStatus.UNPAID, BillStatus.PAID, BillStatus.REFUNDED])
    setFilterDateRange(null)
    setAppliedFilters({
      statuses: [BillStatus.UNPAID, BillStatus.PAID, BillStatus.REFUNDED],
      dateRange: null
    })
  }

  const handleViewBill = (record: Bill) => {
    setViewingBill(record)
    setDetailDrawerOpen(true)
  }

  const handleMarkPaid = (id: ID) => {
    updateBillStatus(id, BillStatus.PAID)
    message.success('已标记为已支付')
  }

  const handleDeleteBill = (id: ID) => {
    deleteBill(id)
    message.success('账单已删除')
  }

  const handleExportBill = (bill: Bill) => {
    try {
      const artist = getArtist(bill.artistId)
      const exportData = {
        billNo: bill.billNo,
        artistName: artist?.name,
        studioName: artist?.studioName,
        period: `${bill.periodStart} ~ ${bill.periodEnd}`,
        status: BILL_STATUS_LABELS[bill.status],
        createdAt: bill.createdAt,
        paidAt: bill.paidAt,
        originalAmount: bill.originalAmount,
        discountAmount: bill.discountAmount,
        finalAmount: bill.finalAmount,
        discountApplications: bill.discountApplications,
        items: bill.items
      }
      const jsonStr = JSON.stringify(exportData, null, 2)
      const blob = new Blob([jsonStr], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${bill.billNo}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      message.success('账单导出成功')
    } catch {
      message.info('已模拟导出到本地')
    }
  }

  const availableBookingsForArtist = useMemo(() => {
    if (!selectedArtistId) return []
    const billedBookingIds = new Set(bills.flatMap((b) => b.bookingIds))
    return bookings.filter((b) => {
      if (b.artistId !== selectedArtistId) return false
      if (b.status === BookingStatus.CANCELLED) return false
      if (billedBookingIds.has(b.id)) return false
      return true
    })
  }, [selectedArtistId, bookings, bills])

  const rangeBookings = useMemo(() => {
    if (!dateRange || !dateRange[0] || !dateRange[1]) return []
    const start = dateRange[0].format('YYYY-MM-DD')
    const end = dateRange[1].format('YYYY-MM-DD')
    return availableBookingsForArtist.filter((b) => {
      return b.date >= start && b.date <= end
    })
  }, [availableBookingsForArtist, dateRange])

  const artistBookingsSummary = useMemo(() => {
    if (!selectedArtistId) return null
    const count = availableBookingsForArtist.length
    const total = availableBookingsForArtist.reduce((sum, b) => sum + b.subtotal, 0)
    if (count === 0) return { count, total: 0, dateRange: null }
    const dates = availableBookingsForArtist.map((b) => b.date).sort()
    return {
      count,
      total: Math.round(total * 100) / 100,
      dateRange: `${dates[0]} ~ ${dates[dates.length - 1]}`
    }
  }, [selectedArtistId, availableBookingsForArtist])

  const defaultDiscountsForArtist = useMemo(() => {
    if (!selectedArtistId) return []
    const artist = getArtist(selectedArtistId)
    if (!artist) return []
    const activeDiscounts = discounts
      .filter((d) => d.isActive)
      .sort((a, b) => a.priority - b.priority)
    return activeDiscounts.map((d) => d.id)
  }, [selectedArtistId, discounts])

  React.useEffect(() => {
    if (generateStep === 2 && selectedArtistId) {
      setSelectedDiscountIds(defaultDiscountsForArtist)
      setOrderedDiscountIds(defaultDiscountsForArtist)
    }
  }, [generateStep, selectedArtistId, defaultDiscountsForArtist])

  const selectedBookings = useMemo(() => {
    return rangeBookings.filter((b) => selectedBookingIds.includes(b.id))
  }, [rangeBookings, selectedBookingIds])

  const originalAmount = useMemo(() => {
    return Math.round(selectedBookings.reduce((sum, b) => sum + b.subtotal, 0) * 100) / 100
  }, [selectedBookings])

  const orderedDiscounts = useMemo(() => {
    const selected = discounts.filter((d) => orderedDiscountIds.includes(d.id))
    return orderedDiscountIds
      .map((id) => selected.find((d) => d.id === id))
      .filter((d): d is Discount => d !== undefined)
  }, [discounts, orderedDiscountIds])

  const previewCalculation = useMemo(() => {
    if (originalAmount <= 0) return null
    return calculateDiscounts(originalAmount, orderedDiscounts, {
      date: dayjs().format('YYYY-MM-DD')
    })
  }, [originalAmount, orderedDiscounts])

  const periodInfo = useMemo(() => {
    if (selectedBookings.length === 0) return { start: '', end: '' }
    const dates = selectedBookings.map((b) => b.date).sort()
    return {
      start: dates[0],
      end: dates[dates.length - 1]
    }
  }, [selectedBookings])

  const canGoStep2 = !!selectedArtistId
  const canGoStep3 = selectedBookingIds.length > 0
  const canGoStep4 = selectedBookingIds.length > 0

  const handleNextStep = () => {
    if (generateStep === 0 && !canGoStep2) {
      message.warning('请先选择艺人')
      return
    }
    if (generateStep === 1 && !canGoStep3) {
      message.warning('请至少选择一个档期')
      return
    }
    setGenerateStep((s) => Math.min(s + 1, 3))
  }

  const handlePrevStep = () => {
    setGenerateStep((s) => Math.max(s - 1, 0))
  }

  const handleConfirmGenerate = () => {
    if (!selectedArtistId || selectedBookingIds.length === 0) {
      message.error('缺少必要信息')
      return
    }
    if (!periodInfo.start || !periodInfo.end) {
      message.error('请选择有效的档期')
      return
    }
    const result = addBill(
      selectedArtistId,
      selectedBookingIds,
      periodInfo.start,
      periodInfo.end,
      orderedDiscountIds.length > 0 ? orderedDiscountIds : undefined
    )
    if (result) {
      message.success(`账单 ${result.billNo} 生成成功`)
      setGenerateStep(0)
      setSelectedArtistId(undefined)
      setDateRange([
        dayjs().subtract(1, 'month').startOf('month'),
        dayjs().subtract(1, 'month').endOf('month')
      ])
      setSelectedBookingIds([])
      setSelectedDiscountIds([])
      setOrderedDiscountIds([])
      setActiveTab('list')
    } else {
      message.error('账单生成失败')
    }
  }

  const handleResetGenerate = () => {
    Modal.confirm({
      title: '确认重置?',
      content: '重置将清空所有已填写的信息',
      onOk: () => {
        setGenerateStep(0)
        setSelectedArtistId(undefined)
        setDateRange([
          dayjs().subtract(1, 'month').startOf('month'),
          dayjs().subtract(1, 'month').endOf('month')
        ])
        setSelectedBookingIds([])
        setSelectedDiscountIds([])
        setOrderedDiscountIds([])
      }
    })
  }

  const handleTransferChange = (targetKeys: React.Key[]) => {
    setSelectedBookingIds(targetKeys as ID[])
  }

  const bookingTransferDataSource = useMemo(() => {
    return rangeBookings.map((b) => ({
      key: b.id,
      title: `${b.date} ${getStudioName(b.studioId)} ${b.startTime}-${b.endTime}`,
      description: `¥${b.subtotal}`,
      date: b.date,
      studioName: getStudioName(b.studioId),
      startTime: b.startTime,
      endTime: b.endTime,
      amount: b.subtotal
    }))
  }, [rangeBookings])

  const handleDiscountCheckboxChange = (values: ID[]) => {
    setSelectedDiscountIds(values)
    const newOrdered = orderedDiscountIds.filter((id) => values.includes(id))
    values.forEach((id) => {
      if (!newOrdered.includes(id)) {
        newOrdered.push(id)
      }
    })
    setOrderedDiscountIds(newOrdered)
  }

  const moveDiscount = (index: number, direction: 'up' | 'down') => {
    const newIds = [...orderedDiscountIds]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= newIds.length) return
    ;[newIds[index], newIds[targetIndex]] = [newIds[targetIndex], newIds[index]]
    setOrderedDiscountIds(newIds)
  }

  const billColumns = [
    {
      title: '账单编号',
      dataIndex: 'billNo',
      key: 'billNo',
      width: 160,
      render: (v: string) => (
        <Space>
          <FileTextOutlined style={{ color: '#1890ff' }} />
          <Text strong>{v}</Text>
        </Space>
      )
    },
    {
      title: '艺人名称',
      dataIndex: 'artistId',
      key: 'artistId',
      render: (id: ID) => getArtistName(id)
    },
    {
      title: '账期',
      key: 'period',
      render: (_: unknown, r: Bill) => `${r.periodStart} ~ ${r.periodEnd}`
    },
    {
      title: '原价',
      dataIndex: 'originalAmount',
      key: 'originalAmount',
      width: 100,
      align: 'right' as const,
      render: (v: number) => `¥${v.toFixed(2)}`
    },
    {
      title: '优惠金额',
      dataIndex: 'discountAmount',
      key: 'discountAmount',
      width: 100,
      align: 'right' as const,
      render: (v: number) => (
        <Text type={v > 0 ? 'danger' : undefined}>-¥{v.toFixed(2)}</Text>
      )
    },
    {
      title: '应付金额',
      dataIndex: 'finalAmount',
      key: 'finalAmount',
      width: 110,
      align: 'right' as const,
      render: (v: number) => <Text strong>¥{v.toFixed(2)}</Text>
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (v: BillStatus) => (
        <Tag color={BILL_STATUS_COLORS[v]} style={{ margin: 0 }}>
          {BILL_STATUS_LABELS[v]}
        </Tag>
      )
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 170,
      render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '操作',
      key: 'action',
      width: 240,
      fixed: 'right' as const,
      render: (_: unknown, record: Bill) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button
              type="link"
              icon={<EyeOutlined />}
              onClick={() => handleViewBill(record)}
            >
              详情
            </Button>
          </Tooltip>
          {record.status === BillStatus.UNPAID && (
            <Tooltip title="标记已支付">
              <Button
                type="link"
                icon={<CheckCircleOutlined />}
                style={{ color: '#52c41a' }}
                onClick={() => handleMarkPaid(record.id)}
              >
                已支付
              </Button>
            </Tooltip>
          )}
          <Popconfirm
            title="确认删除该账单?"
            description="删除后无法恢复"
            onConfirm={() => handleDeleteBill(record.id)}
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  const bookingItemColumns = [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      width: 110
    },
    {
      title: '录音棚',
      dataIndex: 'studioName',
      key: 'studioName'
    },
    {
      title: '录音师',
      dataIndex: 'engineerName',
      key: 'engineerName',
      render: (v?: string) => v ?? '-'
    },
    {
      title: '开始',
      dataIndex: 'startTime',
      key: 'startTime',
      width: 70
    },
    {
      title: '结束',
      dataIndex: 'endTime',
      key: 'endTime',
      width: 70
    },
    {
      title: '时长',
      dataIndex: 'hours',
      key: 'hours',
      width: 80,
      render: (v: number) => `${v} 小时`
    },
    {
      title: '单价',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      width: 90,
      align: 'right' as const,
      render: (v: number) => `¥${v.toFixed(2)}`
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 100,
      align: 'right' as const,
      render: (v: number) => <Text strong>¥{v.toFixed(2)}</Text>
    }
  ]

  const discountAppColumns = [
    {
      title: '优惠名称',
      dataIndex: 'discountName',
      key: 'discountName'
    },
    {
      title: '类型',
      dataIndex: 'discountType',
      key: 'discountType',
      render: (v: DiscountType) => (
        <Tag color={DISCOUNT_TYPE_COLORS[v]}>{DISCOUNT_TYPE_LABELS[v]}</Tag>
      )
    },
    {
      title: '应用前金额',
      dataIndex: 'originalAmount',
      key: 'originalAmount',
      align: 'right' as const,
      render: (v: number) => `¥${v.toFixed(2)}`
    },
    {
      title: '优惠金额',
      dataIndex: 'appliedAmount',
      key: 'appliedAmount',
      align: 'right' as const,
      render: (v: number) => (
        <Text type={v > 0 ? 'danger' : undefined}>-¥{v.toFixed(2)}</Text>
      )
    },
    {
      title: '应用后金额',
      dataIndex: 'afterAmount',
      key: 'afterAmount',
      align: 'right' as const,
      render: (v: number) => <Text strong>¥{v.toFixed(2)}</Text>
    }
  ]

  const renderBillListTab = () => (
    <>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="账单总数"
              value={stats.totalCount}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="待支付金额"
              value={stats.unpaidAmount}
              precision={2}
              prefix={<DollarOutlined />}
              suffix="元"
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="已收金额"
              value={stats.paidAmount}
              precision={2}
              prefix={<CheckCircleOutlined />}
              suffix="元"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="本月新增账单"
              value={stats.thisMonthCount}
              prefix={<PlusOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Card size="small" style={{ marginBottom: 16 }}>
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={8} md={6}>
              <div style={{ fontWeight: 500, marginBottom: 4 }}>艺人</div>
              <Select
                allowClear
                style={{ width: '100%' }}
                placeholder="全部艺人"
                value={filterArtistId}
                onChange={(v) => setFilterArtistId(v)}
                showSearch
                optionFilterProp="children"
              >
                {artists.map((a) => (
                  <Option key={a.id} value={a.id}>
                    {a.name} ({a.studioName})
                  </Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={8} md={6}>
              <div style={{ fontWeight: 500, marginBottom: 4 }}>账单状态</div>
              <Select
                mode="multiple"
                style={{ width: '100%' }}
                placeholder="选择状态"
                value={filterStatuses}
                onChange={(v) => setFilterStatuses(v)}
              >
                <Option value={BillStatus.UNPAID}>
                  <Tag color={BILL_STATUS_COLORS[BillStatus.UNPAID]} style={{ margin: 0 }}>
                    {BILL_STATUS_LABELS[BillStatus.UNPAID]}
                  </Tag>
                </Option>
                <Option value={BillStatus.PAID}>
                  <Tag color={BILL_STATUS_COLORS[BillStatus.PAID]} style={{ margin: 0 }}>
                    {BILL_STATUS_LABELS[BillStatus.PAID]}
                  </Tag>
                </Option>
                <Option value={BillStatus.REFUNDED}>
                  <Tag color={BILL_STATUS_COLORS[BillStatus.REFUNDED]} style={{ margin: 0 }}>
                    {BILL_STATUS_LABELS[BillStatus.REFUNDED]}
                  </Tag>
                </Option>
              </Select>
            </Col>
            <Col xs={24} sm={16} md={8}>
              <div style={{ fontWeight: 500, marginBottom: 4 }}>账单日期范围</div>
              <RangePicker
                style={{ width: '100%' }}
                value={filterDateRange as unknown as [Dayjs, Dayjs]}
                onChange={(v) => setFilterDateRange(v as unknown as [Dayjs | null, Dayjs | null] | null)}
              />
            </Col>
            <Col xs={24} sm={8} md={4} style={{ textAlign: 'right' }}>
              <Space>
                <Button onClick={handleResetFilters}>重置</Button>
                <Button type="primary" onClick={handleSearch}>
                  搜索
                </Button>
              </Space>
            </Col>
          </Row>
        </Card>

        <Table
          rowKey="id"
          columns={billColumns}
          dataSource={filteredBills}
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
          scroll={{ x: 1200 }}
          locale={{
            emptyText: (
              <Empty
                description="暂无账单数据"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )
          }}
        />
      </Card>
    </>
  )

  const renderDetailDrawer = () => {
    if (!viewingBill) return null
    const artist = getArtist(viewingBill.artistId)
    return (
      <Drawer
        title={
          <Space>
            <FileTextOutlined style={{ color: '#1890ff' }} />
            <Text strong style={{ fontSize: 16 }}>
              账单详情 - {viewingBill.billNo}
            </Text>
          </Space>
        }
        width={900}
        open={detailDrawerOpen}
        onClose={() => setDetailDrawerOpen(false)}
        destroyOnClose
        extra={
          <Space>
            <Button
              icon={<ExportOutlined />}
              onClick={() => handleExportBill(viewingBill)}
            >
              导出账单
            </Button>
          </Space>
        }
      >
        <Descriptions bordered column={2} size="small" style={{ marginBottom: 16 }}>
          <Descriptions.Item label="账单编号">{viewingBill.billNo}</Descriptions.Item>
          <Descriptions.Item label="艺人">
            {artist ? `${artist.name} (${artist.studioName})` : '未知'}
          </Descriptions.Item>
          <Descriptions.Item label="账期">
            {viewingBill.periodStart} ~ {viewingBill.periodEnd}
          </Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={BILL_STATUS_COLORS[viewingBill.status]} style={{ margin: 0 }}>
              {BILL_STATUS_LABELS[viewingBill.status]}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {dayjs(viewingBill.createdAt).format('YYYY-MM-DD HH:mm:ss')}
          </Descriptions.Item>
          <Descriptions.Item label="支付时间">
            {viewingBill.paidAt
              ? dayjs(viewingBill.paidAt).format('YYYY-MM-DD HH:mm:ss')
              : '-'}
          </Descriptions.Item>
        </Descriptions>

        <Card title="金额概览" size="small" style={{ marginBottom: 16 }}>
          <Row gutter={[16, 16]}>
            <Col xs={8}>
              <Statistic
                title="原价合计"
                value={viewingBill.originalAmount}
                precision={2}
                prefix="¥"
                valueStyle={{ color: '#8c8c8c' }}
              />
            </Col>
            <Col xs={8}>
              <Statistic
                title="优惠合计"
                value={viewingBill.discountAmount}
                precision={2}
                prefix="-¥"
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Col>
            <Col xs={8}>
              <Statistic
                title="应付金额"
                value={viewingBill.finalAmount}
                precision={2}
                prefix="¥"
                valueStyle={{ color: '#1890ff', fontWeight: 'bold' }}
              />
            </Col>
          </Row>
        </Card>

        <Card
          title={
            <Space>
              <FileTextOutlined />
              <span>档期明细 ({viewingBill.items.length} 条)</span>
            </Space>
          }
          size="small"
          style={{ marginBottom: 16 }}
        >
          <Table
            rowKey="bookingId"
            columns={bookingItemColumns}
            dataSource={viewingBill.items}
            pagination={false}
            size="small"
            summary={() => (
              <Table.Summary fixed>
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={7} align="right">
                    <Text strong>合计：</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={7} align="right">
                    <Text strong style={{ color: '#1890ff' }}>
                      ¥{viewingBill.originalAmount.toFixed(2)}
                    </Text>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              </Table.Summary>
            )}
          />
        </Card>

        {viewingBill.discountApplications.length > 0 && (
          <>
            <Divider orientation="left">优惠明细</Divider>
            <Card size="small">
              <Table
                rowKey={(r) => r.discountId + r.discountName}
                columns={discountAppColumns}
                dataSource={viewingBill.discountApplications}
                pagination={false}
                size="small"
              />
            </Card>
          </>
        )}

        <div style={{ marginTop: 24, textAlign: 'right' }}>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={() => handleExportBill(viewingBill)}
          >
            导出账单
          </Button>
        </div>
      </Drawer>
    )
  }

  const renderStep1 = () => (
    <Card title="Step 1 - 选择艺人">
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Form layout="vertical">
            <Form.Item label="选择艺人" required>
              <Select
                style={{ width: '100%' }}
                placeholder="请选择要出账的艺人"
                value={selectedArtistId}
                onChange={(v) => {
                  setSelectedArtistId(v)
                  setSelectedBookingIds([])
                }}
                showSearch
                optionFilterProp="children"
              >
                {artists.map((a) => (
                  <Option key={a.id} value={a.id}>
                    {a.name} ({a.studioName}) - 等级 {a.level}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Form>
        </Col>
      </Row>

      {artistBookingsSummary && (
        <Alert
          type="info"
          showIcon
          style={{ marginTop: 16 }}
          message={
            <Space>
              <Text>
                该艺人在未出账范围内共有 <Text strong>{artistBookingsSummary.count}</Text>{' '}
                条档期，合计{' '}
                <Text strong style={{ color: '#1890ff' }}>
                  ¥{artistBookingsSummary.total.toFixed(2)}
                </Text>
              </Text>
              {artistBookingsSummary.dateRange && (
                <Tag color="blue">{artistBookingsSummary.dateRange}</Tag>
              )}
            </Space>
          }
          description={
            artistBookingsSummary.count === 0
              ? '该艺人暂无未出账的档期，请先确认档期数据或选择其他艺人'
              : '请进入下一步选择具体的档期范围和档期'
          }
        />
      )}

      {selectedArtistId && artistBookingsSummary && artistBookingsSummary.count > 0 && (
        <Card
          size="small"
          title={`未出账档期概览 (${artistBookingsSummary.count} 条)`}
          style={{ marginTop: 16 }}
        >
          <List
            size="small"
            dataSource={availableBookingsForArtist.slice(0, 10)}
            locale={{ emptyText: '暂无档期' }}
            renderItem={(b) => (
              <List.Item
                key={b.id}
                actions={[
                  <Tag color={b.status === BookingStatus.COMPLETED ? '#1890ff' : '#52c41a'} key="st">
                    {b.status === BookingStatus.COMPLETED ? '已完成' : '已确认'}
                  </Tag>
                ]}
              >
                <List.Item.Meta
                  title={
                    <Space>
                      <Text strong>{b.date}</Text>
                      <Tag color="geekblue">{getStudioName(b.studioId)}</Tag>
                      <Text>
                        {b.startTime} - {b.endTime} ({b.hours}h)
                      </Text>
                    </Space>
                  }
                  description={
                    <Space>
                      <Text type="secondary">录音师：{getEngineerName(b.engineerId)}</Text>
                    </Space>
                  }
                />
                <Text strong style={{ color: '#1890ff' }}>
                  ¥{b.subtotal.toFixed(2)}
                </Text>
              </List.Item>
            )}
          />
          {availableBookingsForArtist.length > 10 && (
            <div style={{ textAlign: 'center', marginTop: 8, color: '#8c8c8c' }}>
              仅显示前 10 条，共 {availableBookingsForArtist.length} 条
            </div>
          )}
        </Card>
      )}
    </Card>
  )

  const renderStep2 = () => {
    const transferColumns = [
      {
        title: '日期',
        dataIndex: 'date',
        width: 100
      },
      {
        title: '录音棚',
        dataIndex: 'studioName',
        width: 120
      },
      {
        title: '开始',
        dataIndex: 'startTime',
        width: 60
      },
      {
        title: '结束',
        dataIndex: 'endTime',
        width: 60
      },
      {
        title: '金额',
        dataIndex: 'amount',
        width: 80,
        render: (v: number) => `¥${v}`
      }
    ]
    return (
      <Card title="Step 2 - 选择档期范围">
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} md={12}>
            <Form layout="vertical">
              <Form.Item label="档期日期范围" required>
                <RangePicker
                  style={{ width: '100%' }}
                  value={dateRange as unknown as [Dayjs, Dayjs]}
                  onChange={(v) => {
                    setDateRange(v as unknown as [Dayjs | null, Dayjs | null] | null)
                    setSelectedBookingIds([])
                  }}
                />
              </Form.Item>
            </Form>
          </Col>
          <Col xs={24} md={12}>
            <Alert
              type="info"
              showIcon
              message={
                <Space>
                  <Text>艺人：</Text>
                  <Text strong>{getArtistName(selectedArtistId!)}</Text>
                  <Divider type="vertical" />
                  <Text>范围内档期：</Text>
                  <Text strong style={{ color: '#1890ff' }}>
                    {rangeBookings.length} 条
                  </Text>
                </Space>
              }
            />
          </Col>
        </Row>

        {rangeBookings.length === 0 ? (
          <Empty description="该日期范围内暂无未出账的档期" />
        ) : (
          <Transfer
            dataSource={bookingTransferDataSource}
            titles={['可选档期', '已选档期']}
            targetKeys={selectedBookingIds as unknown as React.Key[]}
            onChange={handleTransferChange}
            render={(item) => item.title as string}
            listStyle={{ width: '100%', minHeight: 360 }}
            showSelectAll
            showSearch
            pagination={{ pageSize: 10 }}
          >
            {({
              direction,
              filteredItems
            }: {
              direction: 'left' | 'right'
              filteredItems: any[]
            }) => {
              const listData = filteredItems.map((i) => ({
                ...i,
                key: i.key
              }))
              const columns =
                direction === 'left'
                  ? transferColumns
                  : transferColumns
              return (
                <Table
                  size="small"
                  rowKey="key"
                  columns={columns}
                  dataSource={listData}
                  pagination={{ pageSize: 5, size: 'small' }}
                  onRow={() => ({
                    onClick: (e: React.MouseEvent) => {
                      e.stopPropagation()
                      const checkbox = (e.currentTarget as HTMLElement).querySelector(
                        'input[type="checkbox"]'
                      ) as HTMLInputElement | null
                      if (checkbox) checkbox.click()
                    },
                    style: { cursor: 'pointer' }
                  })}
                />
              )
            }}
          </Transfer>
        )}

        {selectedBookingIds.length > 0 && (
          <Alert
            type="success"
            showIcon
            style={{ marginTop: 16 }}
            message={
              <Space>
                <Text>已选择</Text>
                <Text strong style={{ color: '#52c41a' }}>
                  {selectedBookingIds.length}
                </Text>
                <Text>条档期，原价合计</Text>
                <Text strong style={{ color: '#1890ff' }}>
                  ¥{originalAmount.toFixed(2)}
                </Text>
              </Space>
            }
          />
        )}
      </Card>
    )
  }

  const renderStep3 = () => {
    const activeDiscounts = discounts.filter((d) => d.isActive).sort((a, b) => a.priority - b.priority)
    return (
      <Card title="Step 3 - 选择优惠策略">
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card size="small" title="可选优惠策略">
              <Checkbox.Group
                style={{ width: '100%' }}
                value={selectedDiscountIds}
                onChange={handleDiscountCheckboxChange as unknown as (v: (string | number)[]) => void}
              >
                <Space direction="vertical" style={{ width: '100%' }}>
                  {activeDiscounts.length === 0 ? (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description="暂无可用优惠策略"
                    />
                  ) : (
                    activeDiscounts.map((d) => {
                      const isSelected = selectedDiscountIds.includes(d.id)
                      return (
                        <div
                          key={d.id}
                          style={{
                            padding: 12,
                            borderRadius: 8,
                            border: `1px solid ${isSelected ? '#1890ff' : '#f0f0f0'}`,
                            background: isSelected ? '#e6f7ff' : '#fafafa'
                          }}
                        >
                          <Checkbox value={d.id}>
                            <Space>
                              <Text strong>{d.name}</Text>
                              <Tag color={DISCOUNT_TYPE_COLORS[d.type]}>
                                {DISCOUNT_TYPE_LABELS[d.type]}
                              </Tag>
                              {!d.isStackable && <Tag color="red">不可叠加</Tag>}
                            </Space>
                          </Checkbox>
                          <div style={{ marginTop: 8, paddingLeft: 24 }}>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {d.type === DiscountType.COUPON_PERCENT &&
                                `折扣 ${d.value}%${d.maxDiscount ? `，最高减免 ¥${d.maxDiscount}` : ''}`}
                              {d.type === DiscountType.COUPON_FIXED &&
                                `立减 ¥${d.value}${d.threshold ? `，满 ¥${d.threshold} 可用` : ''}`}
                              {d.type === DiscountType.FULL_REDUCTION &&
                                `满 ¥${d.threshold} 减 ¥${d.value}`}
                              {d.startDate &&
                                d.endDate &&
                                ` · 有效期：${d.startDate} ~ ${d.endDate}`}
                            </Text>
                          </div>
                        </div>
                      )
                    })
                  )}
                </Space>
              </Checkbox.Group>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card size="small" title="应用顺序（可上下调整）">
              {orderedDiscountIds.length === 0 ? (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="尚未选择任何优惠策略"
                />
              ) : (
                <List
                  size="small"
                  bordered
                  dataSource={orderedDiscountIds}
                  renderItem={(id, index) => {
                    const d = discounts.find((x) => x.id === id)
                    if (!d) return null
                    return (
                      <List.Item
                        key={id}
                        actions={[
                          <Button
                            key="up"
                            type="text"
                            size="small"
                            disabled={index === 0}
                            onClick={() => moveDiscount(index, 'up')}
                          >
                            ↑
                          </Button>,
                          <Button
                            key="down"
                            type="text"
                            size="small"
                            disabled={index === orderedDiscountIds.length - 1}
                            onClick={() => moveDiscount(index, 'down')}
                          >
                            ↓
                          </Button>
                        ]}
                      >
                        <Space>
                          <Tag color="blue">#{index + 1}</Tag>
                          <Text strong>{d.name}</Text>
                          <Tag color={DISCOUNT_TYPE_COLORS[d.type]}>
                            {DISCOUNT_TYPE_LABELS[d.type]}
                          </Tag>
                        </Space>
                      </List.Item>
                    )
                  }}
                />
              )}
            </Card>
          </Col>
        </Row>

        <Card
          title="预估计算结果"
          size="small"
          style={{ marginTop: 16 }}
          extra={
            <Tag color={previewCalculation?.hadNegativeFallback ? 'orange' : 'green'}>
              {previewCalculation?.hadNegativeFallback ? '触发负值兜底' : '计算正常'}
            </Tag>
          }
        >
          {previewCalculation ? (
            <>
              <Row gutter={[16, 16]}>
                <Col xs={8}>
                  <Statistic
                    title="原价"
                    value={previewCalculation.originalAmount}
                    precision={2}
                    prefix="¥"
                    valueStyle={{ color: '#8c8c8c' }}
                  />
                </Col>
                <Col xs={8}>
                  <Statistic
                    title="总优惠"
                    value={previewCalculation.totalDiscount}
                    precision={2}
                    prefix="-¥"
                    valueStyle={{ color: '#ff4d4f' }}
                  />
                </Col>
                <Col xs={8}>
                  <Statistic
                    title="应付"
                    value={previewCalculation.finalAmount}
                    precision={2}
                    prefix="¥"
                    valueStyle={{ color: '#1890ff', fontWeight: 'bold' }}
                  />
                </Col>
              </Row>
              {previewCalculation.steps.length > 0 && (
                <>
                  <Divider orientation="left" plain>
                    计算步骤
                  </Divider>
                  <Steps direction="vertical" size="small" current={previewCalculation.steps.length}>
                    {previewCalculation.steps.map((step: CalculationStep) => (
                      <Step
                        key={step.order}
                        title={
                          <Space>
                            <Text strong>{step.discountName}</Text>
                            <Tag color={DISCOUNT_TYPE_COLORS[step.discountType]}>
                              {DISCOUNT_TYPE_LABELS[step.discountType]}
                            </Tag>
                          </Space>
                        }
                        description={
                          <div>
                            <div>
                              <Text type="secondary">
                                ¥{step.beforeAmount.toFixed(2)} →{' '}
                              </Text>
                              {step.discountAmount > 0 ? (
                                <Text type="danger">-¥{step.discountAmount.toFixed(2)}</Text>
                              ) : (
                                <Text type="secondary">无优惠</Text>
                              )}
                              <Text type="secondary"> → </Text>
                              <Text strong>¥{step.afterAmount.toFixed(2)}</Text>
                            </div>
                            {step.note && (
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                ({step.note})
                              </Text>
                            )}
                          </div>
                        }
                        status={step.discountAmount > 0 ? 'finish' : 'process'}
                      />
                    ))}
                  </Steps>
                </>
              )}
            </>
          ) : (
            <Empty description="暂无计算结果" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          )}
        </Card>
      </Card>
    )
  }

  const renderStep4 = () => {
    const artist = getArtist(selectedArtistId!)
    const finalPreview = previewCalculation
    return (
      <Card title="Step 4 - 确认生成">
        <Card size="small" title="汇总信息" style={{ marginBottom: 16 }}>
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="艺人">
              {artist ? `${artist.name} (${artist.studioName} / 等级${artist.level})` : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="账期">
              {periodInfo.start && periodInfo.end
                ? `${periodInfo.start} ~ ${periodInfo.end}`
                : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="档次数">
              <Tag color="blue">{selectedBookings.length} 条</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="优惠策略数">
              <Tag color="purple">{orderedDiscountIds.length} 个</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="原价">
              <Text style={{ color: '#8c8c8c' }}>
                ¥{finalPreview?.originalAmount.toFixed(2) ?? '0.00'}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="优惠">
              <Text type="danger">
                -¥{finalPreview?.totalDiscount.toFixed(2) ?? '0.00'}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="应付金额" span={2}>
              <Text strong style={{ fontSize: 20, color: '#1890ff' }}>
                ¥{finalPreview?.finalAmount.toFixed(2) ?? '0.00'}
              </Text>
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {finalPreview && finalPreview.steps.length > 0 && (
          <Card size="small" title="优惠步骤预览" style={{ marginBottom: 16 }}>
            <Steps direction="vertical" size="small" current={finalPreview.steps.length}>
              {finalPreview.steps.map((step: CalculationStep) => (
                <Step
                  key={step.order}
                  title={
                    <Space>
                      <Text strong>{step.discountName}</Text>
                      <Tag color={DISCOUNT_TYPE_COLORS[step.discountType]}>
                        {DISCOUNT_TYPE_LABELS[step.discountType]}
                      </Tag>
                    </Space>
                  }
                  description={
                    <div>
                      <div>
                        <Text type="secondary">
                          ¥{step.beforeAmount.toFixed(2)} →{' '}
                        </Text>
                        {step.discountAmount > 0 ? (
                          <Text type="danger">-¥{step.discountAmount.toFixed(2)}</Text>
                        ) : (
                          <Text type="secondary">无优惠</Text>
                        )}
                        <Text type="secondary"> → </Text>
                        <Text strong>¥{step.afterAmount.toFixed(2)}</Text>
                      </div>
                      {step.note && (
                        <div>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            ({step.note})
                          </Text>
                        </div>
                      )}
                    </div>
                  }
                  status={step.discountAmount > 0 ? 'finish' : 'process'}
                />
              ))}
            </Steps>
          </Card>
        )}

        <Alert
          type="warning"
          showIcon
          message="请确认以上信息无误，生成后账单将处于待支付状态，可在账单管理中查看和标记支付。"
        />
      </Card>
    )
  }

  const renderGenerateTab = () => (
    <Card>
      <div style={{ maxWidth: 1000, margin: '0 auto 24px' }}>
        <Steps current={generateStep} size="small">
          <Step title="选择艺人" description="指定出账艺人" />
          <Step title="选择档期" description="选择档期范围和具体档期" />
          <Step title="选择优惠" description="选择优惠策略和顺序" />
          <Step title="确认生成" description="核对信息并确认" />
        </Steps>
      </div>

      <div style={{ marginBottom: 24 }}>
        {generateStep === 0 && renderStep1()}
        {generateStep === 1 && renderStep2()}
        {generateStep === 2 && renderStep3()}
        {generateStep === 3 && renderStep4()}
      </div>

      <div style={{ textAlign: 'center' }}>
        <Space>
          <Button onClick={handleResetGenerate}>重置</Button>
          {generateStep > 0 && (
            <Button onClick={handlePrevStep}>上一步</Button>
          )}
          {generateStep < 3 && (
            <Button type="primary" onClick={handleNextStep}>
              下一步
            </Button>
          )}
          {generateStep === 3 && (
            <Popconfirm
              title="确认生成账单?"
              description={`将为 ${getArtistName(selectedArtistId!)} 生成包含 ${selectedBookings.length} 条档期的账单`}
              onConfirm={handleConfirmGenerate}
            >
              <Button type="primary" icon={<CheckCircleOutlined />} disabled={!canGoStep4}>
                确认生成账单
              </Button>
            </Popconfirm>
          )}
        </Space>
      </div>
    </Card>
  )

  return (
    <div style={{ padding: 16 }}>
      <Title level={4} style={{ marginBottom: 16 }}>
        <Space>
          <DollarOutlined style={{ color: '#1890ff' }} />
          账单管理
        </Space>
      </Title>

      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'list',
              label: (
                <span>
                  <FileTextOutlined /> 账单管理
                </span>
              ),
              children: renderBillListTab()
            },
            {
              key: 'generate',
              label: (
                <span>
                  <PlusOutlined /> 生成账单
                </span>
              ),
              children: renderGenerateTab()
            }
          ]}
        />
      </Card>

      {renderDetailDrawer()}
    </div>
  )
}

export default BillPage
