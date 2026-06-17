import dayjs from 'dayjs'
import {
  Studio,
  Engineer,
  Artist,
  WeeklyRule,
  Booking,
  Discount,
  Bill,
  WeekDay,
  BookingStatus,
  DiscountType,
  BillStatus
} from '@/types'
import { generateId } from '@/utils/scheduleGenerator'

export const MOCK_STUDIOS: Studio[] = [
  {
    id: 'stu_001',
    name: '1号旗舰棚',
    location: 'A栋3层 301室',
    hourlyRate: 1200,
    description: '大型专业录音棚，配备Neumann U87麦克风、SSL AWS 948调音台',
    equipment: ['Neumann U87', 'SSL AWS 948', 'Genelec 8351B', 'Pro Tools HDX'],
    isActive: true,
    createdAt: dayjs().subtract(180, 'day').format()
  },
  {
    id: 'stu_002',
    name: '2号人声棚',
    location: 'A栋3层 302室',
    hourlyRate: 800,
    description: '专注人声录制的中型棚，声学处理优秀',
    equipment: ['Neumann TLM 103', 'Focusrite Red 4Pre', 'Aurora(n)'],
    isActive: true,
    createdAt: dayjs().subtract(180, 'day').format()
  },
  {
    id: 'stu_003',
    name: '3号混音棚',
    location: 'B栋2层 201室',
    hourlyRate: 1500,
    description: '5.1环绕声混音棚，杜比认证',
    equipment: ['Avid S6', 'Genelec 1234A', 'Genelec 7370A Sub'],
    isActive: true,
    createdAt: dayjs().subtract(120, 'day').format()
  },
  {
    id: 'stu_004',
    name: '4号创作室',
    location: 'B栋2层 202室',
    hourlyRate: 500,
    description: '适合Demo制作和词曲创作的小型工作室',
    equipment: ['Universal Audio Apollo x8', 'Neumann KH 120 A'],
    isActive: true,
    createdAt: dayjs().subtract(90, 'day').format()
  }
]

export const MOCK_ENGINEERS: Engineer[] = [
  {
    id: 'eng_001',
    name: '张明',
    phone: '138-0000-0001',
    specialty: '人声录制/混音',
    hourlyRate: 300,
    isActive: true,
    createdAt: dayjs().subtract(200, 'day').format()
  },
  {
    id: 'eng_002',
    name: '李华',
    phone: '138-0000-0002',
    specialty: '乐队同期/古典音乐',
    hourlyRate: 400,
    isActive: true,
    createdAt: dayjs().subtract(200, 'day').format()
  },
  {
    id: 'eng_003',
    name: '王芳',
    phone: '138-0000-0003',
    specialty: '影视后期/5.1混音',
    hourlyRate: 500,
    isActive: true,
    createdAt: dayjs().subtract(150, 'day').format()
  },
  {
    id: 'eng_004',
    name: '赵磊',
    phone: '138-0000-0004',
    specialty: '母带处理/流行音乐',
    hourlyRate: 350,
    isActive: true,
    createdAt: dayjs().subtract(100, 'day').format()
  }
]

export const MOCK_ARTISTS: Artist[] = [
  {
    id: 'art_001',
    name: '星耀音乐工作室',
    studioName: '星耀娱乐',
    contactPerson: '陈经理',
    phone: '139-1000-0001',
    level: 'A',
    note: '长期合作客户，VIP服务',
    createdAt: dayjs().subtract(365, 'day').format()
  },
  {
    id: 'art_002',
    name: '银河之声',
    studioName: '银河传媒',
    contactPerson: '刘总监',
    phone: '139-1000-0002',
    level: 'A',
    createdAt: dayjs().subtract(300, 'day').format()
  },
  {
    id: 'art_003',
    name: '梦想家乐团',
    studioName: '梦想文化',
    contactPerson: '周老师',
    phone: '139-1000-0003',
    level: 'B',
    createdAt: dayjs().subtract(200, 'day').format()
  },
  {
    id: 'art_004',
    name: '独立音乐人·苏晴',
    studioName: '个人工作室',
    contactPerson: '苏晴',
    phone: '139-1000-0004',
    level: 'C',
    createdAt: dayjs().subtract(100, 'day').format()
  },
  {
    id: 'art_005',
    name: '声动少儿合唱团',
    studioName: '声动教育',
    contactPerson: '王老师',
    phone: '139-1000-0005',
    level: 'B',
    createdAt: dayjs().subtract(80, 'day').format()
  }
]

const today = dayjs()

export const MOCK_RULES: WeeklyRule[] = [
  {
    id: 'rule_001',
    name: '星耀·每周一二四常规进棚',
    artistId: 'art_001',
    studioId: 'stu_001',
    engineerId: 'eng_001',
    slots: [
      { weekDay: WeekDay.MONDAY, startTime: '14:00', endTime: '18:00' },
      { weekDay: WeekDay.TUESDAY, startTime: '10:00', endTime: '14:00' },
      { weekDay: WeekDay.THURSDAY, startTime: '14:00', endTime: '20:00' }
    ],
    effectiveStart: today.startOf('week').format('YYYY-MM-DD'),
    effectiveEnd: today.add(8, 'week').endOf('week').format('YYYY-MM-DD'),
    hourlyRateOverride: 1100,
    note: 'VIP客户协议价',
    isActive: true,
    createdAt: dayjs().subtract(30, 'day').format()
  },
  {
    id: 'rule_002',
    name: '银河之声·周三混音日',
    artistId: 'art_002',
    studioId: 'stu_003',
    engineerId: 'eng_003',
    slots: [{ weekDay: WeekDay.WEDNESDAY, startTime: '09:00', endTime: '18:00' }],
    effectiveStart: today.startOf('week').format('YYYY-MM-DD'),
    effectiveEnd: today.add(12, 'week').endOf('week').format('YYYY-MM-DD'),
    note: '固定混音档期',
    isActive: true,
    createdAt: dayjs().subtract(25, 'day').format()
  },
  {
    id: 'rule_003',
    name: '梦想家乐团·周六排练',
    artistId: 'art_003',
    studioId: 'stu_001',
    engineerId: 'eng_002',
    slots: [{ weekDay: WeekDay.SATURDAY, startTime: '14:00', endTime: '21:00' }],
    effectiveStart: today.startOf('week').format('YYYY-MM-DD'),
    effectiveEnd: today.add(4, 'week').endOf('week').format('YYYY-MM-DD'),
    isActive: true,
    createdAt: dayjs().subtract(15, 'day').format()
  },
  {
    id: 'rule_004',
    name: '声动少儿·周日上午',
    artistId: 'art_005',
    studioId: 'stu_002',
    slots: [{ weekDay: WeekDay.SUNDAY, startTime: '09:00', endTime: '12:00' }],
    effectiveStart: today.startOf('week').format('YYYY-MM-DD'),
    effectiveEnd: today.add(6, 'week').endOf('week').format('YYYY-MM-DD'),
    isActive: true,
    createdAt: dayjs().subtract(10, 'day').format()
  }
]

export function generateMockBookings(): Booking[] {
  const bookings: Booking[] = []
  const rules = MOCK_RULES

  for (const rule of rules) {
    const studio = MOCK_STUDIOS.find((s) => s.id === rule.studioId)!
    const engineer = rule.engineerId
      ? MOCK_ENGINEERS.find((e) => e.id === rule.engineerId)
      : undefined
    const studioRate = rule.hourlyRateOverride ?? studio.hourlyRate
    const engineerRate = engineer?.hourlyRate ?? 0

    for (let w = -1; w < 3; w++) {
      const weekStart = today.startOf('week').add(w, 'week')
      for (const slot of rule.slots) {
        const date = weekStart.day(slot.weekDay)
        if (date.isBefore(today.subtract(1, 'day'), 'day') && w < 0) continue
        if (date.isBefore(dayjs(rule.effectiveStart), 'day')) continue
        if (date.isAfter(dayjs(rule.effectiveEnd), 'day')) continue

        const [sh, sm] = slot.startTime.split(':').map(Number)
        const [eh, em] = slot.endTime.split(':').map(Number)
        const hours = Math.round(((eh * 60 + em) - (sh * 60 + sm)) / 60 * 100) / 100

        const status = date.isBefore(today, 'day')
          ? BookingStatus.COMPLETED
          : date.isSame(today, 'day')
          ? BookingStatus.CONFIRMED
          : BookingStatus.CONFIRMED

        bookings.push({
          id: generateId(),
          studioId: rule.studioId,
          engineerId: rule.engineerId,
          artistId: rule.artistId,
          ruleId: rule.id,
          date: date.format('YYYY-MM-DD'),
          startTime: slot.startTime,
          endTime: slot.endTime,
          hours,
          studioRate,
          engineerRate,
          subtotal: Math.round(hours * (studioRate + engineerRate) * 100) / 100,
          status,
          createdAt: dayjs().subtract(40 + w * 7, 'day').format(),
          updatedAt: dayjs().subtract(10, 'day').format()
        })
      }
    }
  }

  bookings.push({
    id: generateId(),
    studioId: 'stu_004',
    artistId: 'art_004',
    date: today.format('YYYY-MM-DD'),
    startTime: '15:00',
    endTime: '18:00',
    hours: 3,
    studioRate: 500,
    engineerRate: 0,
    subtotal: 1500,
    status: BookingStatus.PENDING,
    note: '独立音乐人Demo录制，待确认',
    createdAt: dayjs().subtract(2, 'day').format(),
    updatedAt: dayjs().subtract(2, 'day').format()
  })

  return bookings
}

export const MOCK_DISCOUNTS: Discount[] = [
  {
    id: 'disc_001',
    name: '新客户9折券',
    type: DiscountType.COUPON_PERCENT,
    value: 10,
    maxDiscount: 500,
    isStackable: true,
    priority: 10,
    isActive: true,
    startDate: today.subtract(30, 'day').format('YYYY-MM-DD'),
    endDate: today.add(90, 'day').format('YYYY-MM-DD'),
    createdAt: dayjs().subtract(30, 'day').format()
  },
  {
    id: 'disc_002',
    name: 'A类客户常规88折',
    type: DiscountType.COUPON_PERCENT,
    value: 12,
    isStackable: true,
    priority: 20,
    isActive: true,
    createdAt: dayjs().subtract(200, 'day').format()
  },
  {
    id: 'disc_003',
    name: '50元立减券',
    type: DiscountType.COUPON_FIXED,
    value: 50,
    threshold: 300,
    isStackable: true,
    priority: 30,
    isActive: true,
    createdAt: dayjs().subtract(60, 'day').format()
  },
  {
    id: 'disc_004',
    name: '满1000减100',
    type: DiscountType.FULL_REDUCTION,
    value: 100,
    threshold: 1000,
    isStackable: true,
    priority: 40,
    isActive: true,
    startDate: today.subtract(10, 'day').format('YYYY-MM-DD'),
    endDate: today.add(60, 'day').format('YYYY-MM-DD'),
    createdAt: dayjs().subtract(10, 'day').format()
  },
  {
    id: 'disc_005',
    name: '满5000减800',
    type: DiscountType.FULL_REDUCTION,
    value: 800,
    threshold: 5000,
    isStackable: true,
    priority: 50,
    isActive: true,
    createdAt: dayjs().subtract(120, 'day').format()
  },
  {
    id: 'disc_006',
    name: 'VIP月卡专属折扣（不可叠加）',
    type: DiscountType.COUPON_PERCENT,
    value: 20,
    isStackable: false,
    priority: 5,
    isActive: true,
    createdAt: dayjs().subtract(90, 'day').format()
  }
]

export function generateMockBills(bookings: Booking[]): Bill[] {
  const bills: Bill[] = []

  const byArtist: Record<string, Booking[]> = {}
  for (const b of bookings) {
    if (b.status === BookingStatus.CANCELLED) continue
    if (!byArtist[b.artistId]) byArtist[b.artistId] = []
    byArtist[b.artistId].push(b)
  }

  let billSeq = 1

  for (const artistId of Object.keys(byArtist)) {
    const artistBookings = byArtist[artistId]
      .filter((b) => dayjs(b.date).isBefore(today, 'day'))
      .sort((a, b) => a.date.localeCompare(b.date))

    if (artistBookings.length === 0) continue

    const byMonth: Record<string, Booking[]> = {}
    for (const b of artistBookings) {
      const month = dayjs(b.date).format('YYYY-MM')
      if (!byMonth[month]) byMonth[month] = []
      byMonth[month].push(b)
    }

    for (const month of Object.keys(byMonth)) {
      const monthBookings = byMonth[month]
      const originalAmount = Math.round(
        monthBookings.reduce((s, b) => s + b.subtotal, 0) * 100
      ) / 100

      let discountAmount = 0
      let finalAmount = originalAmount
      const applications = []

      if (artistId === 'art_001') {
        discountAmount = Math.round(originalAmount * 0.12 * 100) / 100
        finalAmount = Math.round((originalAmount - discountAmount) * 100) / 100
        applications.push({
          discountId: 'disc_002',
          discountName: 'A类客户常规88折',
          discountType: DiscountType.COUPON_PERCENT,
          appliedAmount: discountAmount,
          originalAmount,
          afterAmount: finalAmount
        })
      }

      bills.push({
        id: `bill_${String(billSeq).padStart(3, '0')}`,
        billNo: `BL${dayjs().format('YYYYMM')}${String(billSeq).padStart(4, '0')}`,
        artistId,
        bookingIds: monthBookings.map((b) => b.id),
        periodStart: dayjs(month + '-01').format('YYYY-MM-DD'),
        periodEnd: dayjs(month + '-01').endOf('month').format('YYYY-MM-DD'),
        originalAmount,
        discountAmount,
        finalAmount,
        status: billSeq % 3 === 0 ? BillStatus.UNPAID : BillStatus.PAID,
        discountApplications: applications,
        items: monthBookings.map((b) => {
          const studio = MOCK_STUDIOS.find((s) => s.id === b.studioId)
          const engineer = b.engineerId ? MOCK_ENGINEERS.find((e) => e.id === b.engineerId) : undefined
          return {
            bookingId: b.id,
            date: b.date,
            studioName: studio?.name ?? '未知',
            engineerName: engineer?.name,
            startTime: b.startTime,
            endTime: b.endTime,
            hours: b.hours,
            unitPrice: b.studioRate + b.engineerRate,
            amount: b.subtotal
          }
        }),
        paidAt: billSeq % 3 !== 0 ? dayjs(month + '-28').format() : undefined,
        createdAt: dayjs(month + '-01').add(1, 'month').format()
      })
      billSeq++
    }
  }

  return bills
}
