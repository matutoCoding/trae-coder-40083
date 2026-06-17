import dayjs, { Dayjs } from 'dayjs'
import {
  WeeklyRule,
  WeeklyTimeSlot,
  Booking,
  BookingStatus,
  Studio,
  Engineer,
  Artist,
  GeneratePreview,
  ID
} from '@/types'

export interface ConflictInfo {
  conflictType: 'studio' | 'engineer'
  conflictBooking: Booking
  message: string
}

export function checkBookingConflicts(
  booking: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'> & { id?: string },
  allBookings: Booking[],
  studios: Studio[],
  artists: Artist[],
  engineers: Engineer[]
): ConflictInfo[] {
  const conflicts: ConflictInfo[] = []
  const studioName = studios.find((s) => s.id === booking.studioId)?.name ?? '未知棚'

  for (const existing of allBookings) {
    if (booking.id && existing.id === booking.id) continue
    if (existing.status === BookingStatus.CANCELLED) continue

    if (bookingOverlaps(existing, booking.date, booking.startTime, booking.endTime, booking.studioId)) {
      const existingArtistName = artists.find((a) => a.id === existing.artistId)?.name ?? '未知艺人'
      conflicts.push({
        conflictType: 'studio',
        conflictBooking: existing,
        message: `录音棚 ${studioName} 与 ${existingArtistName} 的档期重叠（${existing.startTime}-${existing.endTime}）`
      })
    }

    if (booking.engineerId && engineerOverlaps(existing, booking.date, booking.startTime, booking.endTime, booking.engineerId)) {
      const existingArtistName = artists.find((a) => a.id === existing.artistId)?.name ?? '未知艺人'
      const engineerName = engineers.find((e) => e.id === booking.engineerId)?.name ?? '未知录音师'
      conflicts.push({
        conflictType: 'engineer',
        conflictBooking: existing,
        message: `录音师 ${engineerName} 与 ${existingArtistName} 的档期重叠（${existing.startTime}-${existing.endTime}）`
      })
    }
  }

  return conflicts
}

export function generateId(): ID {
  return `id_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

function parseTime(timeStr: string): { hour: number; minute: number } {
  const [h, m] = timeStr.split(':').map(Number)
  return { hour: h, minute: m || 0 }
}

function calculateHours(startTime: string, endTime: string): number {
  const start = parseTime(startTime)
  const end = parseTime(endTime)
  const startMinutes = start.hour * 60 + start.minute
  const endMinutes = end.hour * 60 + end.minute
  if (endMinutes <= startMinutes) return 0
  return Math.round(((endMinutes - startMinutes) / 60) * 100) / 100
}

export function timeOverlaps(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string
): boolean {
  const aS = parseTime(aStart)
  const aE = parseTime(aEnd)
  const bS = parseTime(bStart)
  const bE = parseTime(bEnd)
  const aStartMin = aS.hour * 60 + aS.minute
  const aEndMin = aE.hour * 60 + aE.minute
  const bStartMin = bS.hour * 60 + bS.minute
  const bEndMin = bE.hour * 60 + bE.minute
  return aStartMin < bEndMin && bStartMin < aEndMin
}

export function bookingOverlaps(
  existing: Booking,
  date: string,
  startTime: string,
  endTime: string,
  studioId: string
): boolean {
  if (existing.studioId !== studioId) return false
  if (existing.date !== date) return false
  if (existing.status === BookingStatus.CANCELLED) return false
  return timeOverlaps(existing.startTime, existing.endTime, startTime, endTime)
}

export function engineerOverlaps(
  existing: Booking,
  date: string,
  startTime: string,
  endTime: string,
  engineerId?: string
): boolean {
  if (!engineerId || !existing.engineerId) return false
  if (existing.engineerId !== engineerId) return false
  if (existing.date !== date) return false
  if (existing.status === BookingStatus.CANCELLED) return false
  return timeOverlaps(existing.startTime, existing.endTime, startTime, endTime)
}

interface GenerateBookingsOptions {
  existingBookings: Booking[]
  studios: Studio[]
  engineers: Engineer[]
  artists: Artist[]
  rangeStart?: string
  rangeEnd?: string
}

export function generateWeeklyBookings(
  rule: WeeklyRule,
  options: GenerateBookingsOptions
): GeneratePreview {
  const generatedBookings: Booking[] = []
  const skippedBookings: { date: string; startTime: string; reason: string }[] = []

  const studio = options.studios.find((s) => s.id === rule.studioId)
  const engineer = rule.engineerId
    ? options.engineers.find((e) => e.id === rule.engineerId)
    : undefined
  const artist = options.artists.find((a) => a.id === rule.artistId)

  if (!studio || !artist) {
    return {
      ruleId: rule.id,
      ruleName: rule.name,
      artistName: artist?.name ?? '未知艺人',
      studioName: studio?.name ?? '未知棚',
      generatedBookings: [],
      skippedBookings: [
        {
          date: '-',
          startTime: '-',
          reason: !studio ? '关联的录音棚不存在' : '关联的艺人不存在'
        }
      ],
      totalCount: 0,
      skippedCount: 1
    }
  }

  const effectiveStart = dayjs(options.rangeStart ?? rule.effectiveStart).startOf('day')
  const effectiveEnd = dayjs(options.rangeEnd ?? rule.effectiveEnd).endOf('day')
  const ruleStart = dayjs(rule.effectiveStart).startOf('day')
  const ruleEnd = dayjs(rule.effectiveEnd).endOf('day')

  const start = effectiveStart.isBefore(ruleStart) ? ruleStart : effectiveStart
  const end = effectiveEnd.isAfter(ruleEnd) ? ruleEnd : effectiveEnd

  if (start.isAfter(end)) {
    return {
      ruleId: rule.id,
      ruleName: rule.name,
      artistName: artist.name,
      studioName: studio.name,
      generatedBookings: [],
      skippedBookings: [{ date: '-', startTime: '-', reason: '生成日期范围与规则有效期无交集' }],
      totalCount: 0,
      skippedCount: 1
    }
  }

  const studioRate = rule.hourlyRateOverride ?? studio.hourlyRate
  const engineerRate = engineer?.hourlyRate ?? 0

  let current: Dayjs = start.clone()
  while (current.isBefore(end) || current.isSame(end, 'day')) {
    const weekDay = current.day() as number
    const matchingSlots = rule.slots.filter((s) => s.weekDay === weekDay)
    const dateStr = current.format('YYYY-MM-DD')

    for (const slot of matchingSlots) {
      const hours = calculateHours(slot.startTime, slot.endTime)
      if (hours <= 0) {
        skippedBookings.push({
          date: dateStr,
          startTime: slot.startTime,
          reason: '时段无效（结束时间不晚于开始时间）'
        })
        continue
      }

      const studioConflict = options.existingBookings.some((b) =>
        bookingOverlaps(b, dateStr, slot.startTime, slot.endTime, rule.studioId)
      )
      if (studioConflict) {
        skippedBookings.push({
          date: dateStr,
          startTime: slot.startTime,
          reason: '录音棚档期冲突'
        })
        continue
      }

      if (rule.engineerId) {
        const engineerConflict = options.existingBookings.some((b) =>
          engineerOverlaps(b, dateStr, slot.startTime, slot.endTime, rule.engineerId)
        )
        if (engineerConflict) {
          skippedBookings.push({
            date: dateStr,
            startTime: slot.startTime,
            reason: '录音师档期冲突'
          })
          continue
        }
      }

      const subtotal = Math.round((hours * (studioRate + engineerRate)) * 100) / 100
      const now = dayjs().format()
      generatedBookings.push({
        id: generateId(),
        studioId: rule.studioId,
        engineerId: rule.engineerId,
        artistId: rule.artistId,
        ruleId: rule.id,
        date: dateStr,
        startTime: slot.startTime,
        endTime: slot.endTime,
        hours,
        studioRate,
        engineerRate,
        subtotal,
        status: BookingStatus.CONFIRMED,
        createdAt: now,
        updatedAt: now
      })
    }

    current = current.add(1, 'day')
  }

  return {
    ruleId: rule.id,
    ruleName: rule.name,
    artistName: artist.name,
    studioName: studio.name,
    generatedBookings,
    skippedBookings,
    totalCount: generatedBookings.length + skippedBookings.length,
    skippedCount: skippedBookings.length
  }
}

export function generateMultipleRules(
  rules: WeeklyRule[],
  options: GenerateBookingsOptions
): GeneratePreview[] {
  let accumulatedExisting = [...options.existingBookings]
  const results: GeneratePreview[] = []

  for (const rule of rules) {
    if (!rule.isActive) continue
    const result = generateWeeklyBookings(rule, { ...options, existingBookings: accumulatedExisting })
    results.push(result)
    accumulatedExisting = [...accumulatedExisting, ...result.generatedBookings]
  }

  return results
}

export function validateWeeklySlot(slot: WeeklyTimeSlot): string | null {
  const hours = calculateHours(slot.startTime, slot.endTime)
  if (hours <= 0) return '结束时间必须晚于开始时间'
  if (hours > 24) return '单次预约时长不能超过24小时'
  return null
}

export function validateWeeklyRule(
  rule: Omit<WeeklyRule, 'id' | 'createdAt'>,
  _existingRules: WeeklyRule[] = []
): string[] {
  const errors: string[] = []
  if (!rule.name.trim()) errors.push('规则名称不能为空')
  if (!rule.artistId) errors.push('请选择关联艺人')
  if (!rule.studioId) errors.push('请选择关联录音棚')
  if (rule.slots.length === 0) errors.push('请至少配置一个周期时段')
  if (!rule.effectiveStart) errors.push('请选择规则生效起始日期')
  if (!rule.effectiveEnd) errors.push('请选择规则生效结束日期')
  if (dayjs(rule.effectiveStart).isAfter(dayjs(rule.effectiveEnd), 'day')) {
    errors.push('生效起始日期不能晚于结束日期')
  }
  if (rule.hourlyRateOverride !== undefined && rule.hourlyRateOverride < 0) {
    errors.push('覆盖单价不能为负数')
  }
  for (const slot of rule.slots) {
    const err = validateWeeklySlot(slot)
    if (err) errors.push(`时段 ${slot.startTime}-${slot.endTime}: ${err}`)
  }
  return errors
}
