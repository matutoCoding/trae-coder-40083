import { create } from 'zustand'
import dayjs from 'dayjs'
import {
  Studio,
  Engineer,
  Artist,
  WeeklyRule,
  Booking,
  Discount,
  Bill,
  BookingStatus,
  BillStatus,
  BillItem
} from '@/types'
import {
  MOCK_STUDIOS,
  MOCK_ENGINEERS,
  MOCK_ARTISTS,
  MOCK_RULES,
  MOCK_DISCOUNTS,
  generateMockBookings,
  generateMockBills
} from '@/data/mockData'
import { generateId } from '@/utils/scheduleGenerator'
import { calculateDiscounts } from '@/utils/discountEngine'

interface AppState {
  studios: Studio[]
  engineers: Engineer[]
  artists: Artist[]
  rules: WeeklyRule[]
  bookings: Booking[]
  discounts: Discount[]
  bills: Bill[]

  addStudio: (data: Omit<Studio, 'id' | 'createdAt'>) => void
  updateStudio: (id: string, data: Partial<Studio>) => void
  deleteStudio: (id: string) => void

  addEngineer: (data: Omit<Engineer, 'id' | 'createdAt'>) => void
  updateEngineer: (id: string, data: Partial<Engineer>) => void
  deleteEngineer: (id: string) => void

  addArtist: (data: Omit<Artist, 'id' | 'createdAt'>) => void
  updateArtist: (id: string, data: Partial<Artist>) => void
  deleteArtist: (id: string) => void

  addRule: (data: Omit<WeeklyRule, 'id' | 'createdAt'>) => void
  updateRule: (id: string, data: Partial<WeeklyRule>) => void
  deleteRule: (id: string) => void
  toggleRule: (id: string) => void

  addBooking: (data: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateBooking: (id: string, data: Partial<Booking>) => void
  deleteBooking: (id: string) => void
  bulkAddBookings: (bookings: Booking[]) => void
  updateBookingStatus: (id: string, status: BookingStatus) => void

  addDiscount: (data: Omit<Discount, 'id' | 'createdAt'>) => void
  updateDiscount: (id: string, data: Partial<Discount>) => void
  deleteDiscount: (id: string) => void
  toggleDiscount: (id: string) => void
  reorderDiscount: (from: number, to: number) => void

  addBill: (
    artistId: string,
    bookingIds: string[],
    periodStart: string,
    periodEnd: string,
    selectedDiscountIds?: string[]
  ) => Bill | null
  updateBillStatus: (id: string, status: BillStatus) => void
  deleteBill: (id: string) => void
}

const initialBookings = generateMockBookings()
const initialBills = generateMockBills(initialBookings)

export const useAppStore = create<AppState>((set, get) => ({
  studios: MOCK_STUDIOS,
  engineers: MOCK_ENGINEERS,
  artists: MOCK_ARTISTS,
  rules: MOCK_RULES,
  bookings: initialBookings,
  discounts: MOCK_DISCOUNTS,
  bills: initialBills,

  addStudio: (data) =>
    set((s) => ({
      studios: [
        ...s.studios,
        { ...data, id: generateId(), createdAt: dayjs().format() }
      ]
    })),
  updateStudio: (id, data) =>
    set((s) => ({
      studios: s.studios.map((x) => (x.id === id ? { ...x, ...data } : x))
    })),
  deleteStudio: (id) =>
    set((s) => ({
      studios: s.studios.filter((x) => x.id !== id)
    })),

  addEngineer: (data) =>
    set((s) => ({
      engineers: [
        ...s.engineers,
        { ...data, id: generateId(), createdAt: dayjs().format() }
      ]
    })),
  updateEngineer: (id, data) =>
    set((s) => ({
      engineers: s.engineers.map((x) => (x.id === id ? { ...x, ...data } : x))
    })),
  deleteEngineer: (id) =>
    set((s) => ({
      engineers: s.engineers.filter((x) => x.id !== id)
    })),

  addArtist: (data) =>
    set((s) => ({
      artists: [
        ...s.artists,
        { ...data, id: generateId(), createdAt: dayjs().format() }
      ]
    })),
  updateArtist: (id, data) =>
    set((s) => ({
      artists: s.artists.map((x) => (x.id === id ? { ...x, ...data } : x))
    })),
  deleteArtist: (id) =>
    set((s) => ({
      artists: s.artists.filter((x) => x.id !== id)
    })),

  addRule: (data) =>
    set((s) => ({
      rules: [...s.rules, { ...data, id: generateId(), createdAt: dayjs().format() }]
    })),
  updateRule: (id, data) =>
    set((s) => ({
      rules: s.rules.map((x) => (x.id === id ? { ...x, ...data } : x))
    })),
  deleteRule: (id) =>
    set((s) => ({
      rules: s.rules.filter((x) => x.id !== id)
    })),
  toggleRule: (id) =>
    set((s) => ({
      rules: s.rules.map((x) => (x.id === id ? { ...x, isActive: !x.isActive } : x))
    })),

  addBooking: (data) =>
    set((s) => {
      const now = dayjs().format()
      return {
        bookings: [...s.bookings, { ...data, id: generateId(), createdAt: now, updatedAt: now }]
      }
    }),
  updateBooking: (id, data) =>
    set((s) => ({
      bookings: s.bookings.map((x) =>
        x.id === id ? { ...x, ...data, updatedAt: dayjs().format() } : x
      )
    })),
  deleteBooking: (id) =>
    set((s) => ({
      bookings: s.bookings.filter((x) => x.id !== id)
    })),
  bulkAddBookings: (bookings) =>
    set((s) => ({
      bookings: [...s.bookings, ...bookings]
    })),
  updateBookingStatus: (id, status) =>
    set((s) => ({
      bookings: s.bookings.map((x) =>
        x.id === id ? { ...x, status, updatedAt: dayjs().format() } : x
      )
    })),

  addDiscount: (data) =>
    set((s) => ({
      discounts: [
        ...s.discounts,
        { ...data, id: generateId(), createdAt: dayjs().format() }
      ].sort((a, b) => a.priority - b.priority)
    })),
  updateDiscount: (id, data) =>
    set((s) => ({
      discounts: s.discounts
        .map((x) => (x.id === id ? { ...x, ...data } : x))
        .sort((a, b) => a.priority - b.priority)
    })),
  deleteDiscount: (id) =>
    set((s) => ({
      discounts: s.discounts.filter((x) => x.id !== id)
    })),
  toggleDiscount: (id) =>
    set((s) => ({
      discounts: s.discounts.map((x) => (x.id === id ? { ...x, isActive: !x.isActive } : x))
    })),
  reorderDiscount: (from, to) =>
    set((s) => {
      const list = [...s.discounts].sort((a, b) => a.priority - b.priority)
      const [moved] = list.splice(from, 1)
      list.splice(to, 0, moved)
      const reprioritized = list.map((d, idx) => ({ ...d, priority: (idx + 1) * 10 }))
      return { discounts: reprioritized }
    }),

  addBill: (artistId, bookingIds, periodStart, periodEnd, selectedDiscountIds) => {
    const state = get()
    const bookings = state.bookings.filter(
      (b) => bookingIds.includes(b.id) && b.status !== BookingStatus.CANCELLED
    )
    if (bookings.length === 0) return null

    const originalAmount =
      Math.round(bookings.reduce((sum, b) => sum + b.subtotal, 0) * 100) / 100

    let applicableDiscounts = state.discounts
    if (selectedDiscountIds && selectedDiscountIds.length > 0) {
      applicableDiscounts = state.discounts
        .filter((d) => selectedDiscountIds.includes(d.id))
        .sort((a, b) => a.priority - b.priority)
    }

    const calcResult = calculateDiscounts(originalAmount, applicableDiscounts, {
      date: dayjs().format('YYYY-MM-DD')
    })

    const items: BillItem[] = bookings.map((b) => {
      const studio = state.studios.find((s) => s.id === b.studioId)
      const engineer = b.engineerId ? state.engineers.find((e) => e.id === b.engineerId) : undefined
      return {
        bookingId: b.id,
        date: b.date,
        studioName: studio?.name ?? '未知棚',
        engineerName: engineer?.name,
        startTime: b.startTime,
        endTime: b.endTime,
        hours: b.hours,
        unitPrice: b.studioRate + b.engineerRate,
        amount: b.subtotal
      }
    })

    const seq = state.bills.length + 1
    const bill: Bill = {
      id: generateId(),
      billNo: `BL${dayjs().format('YYYYMM')}${String(seq).padStart(4, '0')}`,
      artistId,
      bookingIds,
      periodStart,
      periodEnd,
      originalAmount: calcResult.originalAmount,
      discountAmount: calcResult.totalDiscount,
      finalAmount: calcResult.finalAmount,
      status: BillStatus.UNPAID,
      discountApplications: calcResult.applications,
      items,
      createdAt: dayjs().format()
    }

    set((s) => ({ bills: [bill, ...s.bills] }))
    return bill
  },
  updateBillStatus: (id, status) =>
    set((s) => ({
      bills: s.bills.map((b) =>
        b.id === id
          ? {
              ...b,
              status,
              paidAt: status === BillStatus.PAID && !b.paidAt ? dayjs().format() : b.paidAt
            }
          : b
      )
    })),
  deleteBill: (id) =>
    set((s) => ({
      bills: s.bills.filter((b) => b.id !== id)
    }))
}))
