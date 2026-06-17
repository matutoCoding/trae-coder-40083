export type ID = string

export enum WeekDay {
  SUNDAY = 0,
  MONDAY = 1,
  TUESDAY = 2,
  WEDNESDAY = 3,
  THURSDAY = 4,
  FRIDAY = 5,
  SATURDAY = 6
}

export const WEEKDAY_LABELS: Record<WeekDay, string> = {
  [WeekDay.SUNDAY]: '周日',
  [WeekDay.MONDAY]: '周一',
  [WeekDay.TUESDAY]: '周二',
  [WeekDay.WEDNESDAY]: '周三',
  [WeekDay.THURSDAY]: '周四',
  [WeekDay.FRIDAY]: '周五',
  [WeekDay.SATURDAY]: '周六'
}

export enum BookingStatus {
  CONFIRMED = 'confirmed',
  PENDING = 'pending',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed'
}

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  [BookingStatus.CONFIRMED]: '已确认',
  [BookingStatus.PENDING]: '待确认',
  [BookingStatus.CANCELLED]: '已取消',
  [BookingStatus.COMPLETED]: '已完成'
}

export const BOOKING_STATUS_COLORS: Record<BookingStatus, string> = {
  [BookingStatus.CONFIRMED]: '#52c41a',
  [BookingStatus.PENDING]: '#faad14',
  [BookingStatus.CANCELLED]: '#ff4d4f',
  [BookingStatus.COMPLETED]: '#1890ff'
}

export enum DiscountType {
  COUPON_PERCENT = 'coupon_percent',
  COUPON_FIXED = 'coupon_fixed',
  FULL_REDUCTION = 'full_reduction'
}

export const DISCOUNT_TYPE_LABELS: Record<DiscountType, string> = {
  [DiscountType.COUPON_PERCENT]: '折扣券',
  [DiscountType.COUPON_FIXED]: '立减券',
  [DiscountType.FULL_REDUCTION]: '满减优惠'
}

export enum BillStatus {
  UNPAID = 'unpaid',
  PAID = 'paid',
  REFUNDED = 'refunded'
}

export const BILL_STATUS_LABELS: Record<BillStatus, string> = {
  [BillStatus.UNPAID]: '待支付',
  [BillStatus.PAID]: '已支付',
  [BillStatus.REFUNDED]: '已退款'
}

export interface Studio {
  id: ID
  name: string
  location: string
  hourlyRate: number
  description?: string
  equipment?: string[]
  isActive: boolean
  createdAt: string
}

export interface Engineer {
  id: ID
  name: string
  phone: string
  specialty: string
  hourlyRate: number
  isActive: boolean
  createdAt: string
}

export interface Artist {
  id: ID
  name: string
  studioName: string
  contactPerson: string
  phone: string
  level: 'A' | 'B' | 'C' | 'D'
  note?: string
  createdAt: string
}

export interface WeeklyTimeSlot {
  weekDay: WeekDay
  startTime: string
  endTime: string
}

export interface WeeklyRule {
  id: ID
  name: string
  artistId: ID
  studioId: ID
  engineerId?: ID
  slots: WeeklyTimeSlot[]
  effectiveStart: string
  effectiveEnd: string
  hourlyRateOverride?: number
  note?: string
  isActive: boolean
  createdAt: string
}

export interface Booking {
  id: ID
  studioId: ID
  engineerId?: ID
  artistId: ID
  ruleId?: ID
  date: string
  startTime: string
  endTime: string
  hours: number
  studioRate: number
  engineerRate: number
  subtotal: number
  status: BookingStatus
  note?: string
  createdAt: string
  updatedAt: string
}

export interface Discount {
  id: ID
  name: string
  type: DiscountType
  value: number
  threshold?: number
  maxDiscount?: number
  isStackable: boolean
  priority: number
  startDate?: string
  endDate?: string
  isActive: boolean
  createdAt: string
}

export interface DiscountApplication {
  discountId: ID
  discountName: string
  discountType: DiscountType
  appliedAmount: number
  originalAmount: number
  afterAmount: number
}

export interface CalculationResult {
  originalAmount: number
  finalAmount: number
  totalDiscount: number
  applications: DiscountApplication[]
  steps: CalculationStep[]
  hadNegativeFallback: boolean
}

export interface CalculationStep {
  order: number
  discountName: string
  discountType: DiscountType
  beforeAmount: number
  discountAmount: number
  afterAmount: number
  note?: string
}

export interface Bill {
  id: ID
  billNo: string
  artistId: ID
  bookingIds: ID[]
  periodStart: string
  periodEnd: string
  originalAmount: number
  discountAmount: number
  finalAmount: number
  status: BillStatus
  discountApplications: DiscountApplication[]
  items: BillItem[]
  paidAt?: string
  createdAt: string
}

export interface BillItem {
  bookingId: ID
  date: string
  studioName: string
  engineerName?: string
  startTime: string
  endTime: string
  hours: number
  unitPrice: number
  amount: number
}

export interface GeneratePreview {
  ruleId: ID
  ruleName: string
  artistName: string
  studioName: string
  generatedBookings: Booking[]
  skippedBookings: { date: string; startTime: string; reason: string }[]
  totalCount: number
  skippedCount: number
}
