import {
  Discount,
  DiscountType,
  CalculationResult,
  CalculationStep,
  DiscountApplication
} from '@/types'
import dayjs from 'dayjs'

const TWO_DECIMALS = 100

function round2(value: number): number {
  return Math.round(value * TWO_DECIMALS) / TWO_DECIMALS
}

function isDiscountValidOnDate(discount: Discount, date: string): boolean {
  if (!discount.isActive) return false
  const d = dayjs(date)
  if (discount.startDate && d.isBefore(dayjs(discount.startDate), 'day')) return false
  if (discount.endDate && d.isAfter(dayjs(discount.endDate), 'day')) return false
  return true
}

function sortByPriority(discounts: Discount[]): Discount[] {
  return [...discounts].sort((a, b) => a.priority - b.priority)
}

interface ApplySingleDiscountResult {
  discountAmount: number
  afterAmount: number
  note?: string
  applied: boolean
}

function applySingleDiscount(
  discount: Discount,
  currentAmount: number,
  originalAmount: number
): ApplySingleDiscountResult {
  switch (discount.type) {
    case DiscountType.COUPON_PERCENT: {
      if (currentAmount <= 0) {
        return { discountAmount: 0, afterAmount: currentAmount, applied: false, note: '金额为零，不适用折扣' }
      }
      const percent = discount.value
      if (percent <= 0 || percent > 100) {
        return { discountAmount: 0, afterAmount: currentAmount, applied: false, note: '折扣值无效' }
      }
      let discountAmount = round2(currentAmount * (percent / 100))
      if (discount.maxDiscount !== undefined && discountAmount > discount.maxDiscount) {
        discountAmount = round2(discount.maxDiscount)
      }
      const afterAmount = round2(currentAmount - discountAmount)
      return {
        discountAmount,
        afterAmount,
        applied: true,
        note: discount.maxDiscount !== undefined ? `最高减免 ¥${discount.maxDiscount}` : undefined
      }
    }

    case DiscountType.COUPON_FIXED: {
      if (currentAmount <= 0) {
        return { discountAmount: 0, afterAmount: currentAmount, applied: false, note: '金额为零，不适用立减' }
      }
      const fixedValue = discount.value
      if (fixedValue <= 0) {
        return { discountAmount: 0, afterAmount: currentAmount, applied: false, note: '立减值无效' }
      }
      if (discount.threshold !== undefined && originalAmount < discount.threshold) {
        return {
          discountAmount: 0,
          afterAmount: currentAmount,
          applied: false,
          note: `未达到使用门槛 ¥${discount.threshold}`
        }
      }
      const discountAmount = Math.min(round2(fixedValue), currentAmount)
      const afterAmount = round2(currentAmount - discountAmount)
      return {
        discountAmount,
        afterAmount,
        applied: true
      }
    }

    case DiscountType.FULL_REDUCTION: {
      if (currentAmount <= 0) {
        return { discountAmount: 0, afterAmount: currentAmount, applied: false, note: '金额为零，不适用满减' }
      }
      const threshold = discount.threshold ?? 0
      const reduction = discount.value
      if (threshold <= 0 || reduction <= 0) {
        return { discountAmount: 0, afterAmount: currentAmount, applied: false, note: '满减参数无效' }
      }
      if (originalAmount < threshold) {
        return {
          discountAmount: 0,
          afterAmount: currentAmount,
          applied: false,
          note: `未达到满减门槛 ¥${threshold}`
        }
      }
      const times = Math.floor(originalAmount / threshold)
      const totalReduction = round2(reduction * times)
      const discountAmount = Math.min(totalReduction, currentAmount)
      const afterAmount = round2(currentAmount - discountAmount)
      return {
        discountAmount,
        afterAmount,
        applied: true,
        note: `满¥${threshold}减¥${reduction} × ${times}次`
      }
    }

    default:
      return { discountAmount: 0, afterAmount: currentAmount, applied: false, note: '未知优惠类型' }
  }
}

export function calculateDiscounts(
  originalAmount: number,
  discounts: Discount[],
  options?: {
    date?: string
    enforceOrder?: Discount[]
  }
): CalculationResult {
  const date = options?.date ?? dayjs().format('YYYY-MM-DD')
  const safeOriginal = round2(Math.max(0, originalAmount))

  const activeDiscounts = (options?.enforceOrder ?? sortByPriority(discounts)).filter((d) =>
    isDiscountValidOnDate(d, date)
  )

  let currentAmount = safeOriginal
  const steps: CalculationStep[] = []
  const applications: DiscountApplication[] = []
  let order = 1
  let hadNegativeFallback = false
  const appliedStackable: Discount[] = []

  for (const discount of activeDiscounts) {
    const beforeStepAmount = currentAmount

    if (!discount.isStackable) {
      const hasOtherNonStackableApplied = applications.some(
        (app) => app.discountId !== discount.id
      )
      if (hasOtherNonStackableApplied) {
        steps.push({
          order: order++,
          discountName: discount.name,
          discountType: discount.type,
          beforeAmount: beforeStepAmount,
          discountAmount: 0,
          afterAmount: beforeStepAmount,
          note: '与已应用的不可叠加优惠冲突，跳过'
        })
        continue
      }
    } else {
      const incompatible = appliedStackable.some((d) => {
        if (d.type === discount.type && d.type === DiscountType.COUPON_PERCENT) return true
        if (d.type === discount.type && d.type === DiscountType.COUPON_FIXED) return false
        return false
      })
      if (incompatible) {
        steps.push({
          order: order++,
          discountName: discount.name,
          discountType: discount.type,
          beforeAmount: beforeStepAmount,
          discountAmount: 0,
          afterAmount: beforeStepAmount,
          note: '同类折扣券已应用，跳过'
        })
        continue
      }
    }

    const result = applySingleDiscount(discount, currentAmount, safeOriginal)

    if (result.applied) {
      let after = result.afterAmount
      let actualDiscount = result.discountAmount

      if (after < 0) {
        actualDiscount = round2(beforeStepAmount)
        after = 0
        hadNegativeFallback = true
      }

      steps.push({
        order: order++,
        discountName: discount.name,
        discountType: discount.type,
        beforeAmount: beforeStepAmount,
        discountAmount: actualDiscount,
        afterAmount: after,
        note: hadNegativeFallback && after === 0 ? `${result.note ?? ''} (触发负值兜底，最低为0)` : result.note
      })

      applications.push({
        discountId: discount.id,
        discountName: discount.name,
        discountType: discount.type,
        appliedAmount: actualDiscount,
        originalAmount: beforeStepAmount,
        afterAmount: after
      })

      if (discount.isStackable) {
        appliedStackable.push(discount)
      }

      currentAmount = after
    } else {
      steps.push({
        order: order++,
        discountName: discount.name,
        discountType: discount.type,
        beforeAmount: beforeStepAmount,
        discountAmount: 0,
        afterAmount: beforeStepAmount,
        note: result.note
      })
    }
  }

  const finalAmount = round2(Math.max(0, currentAmount))
  const totalDiscount = round2(safeOriginal - finalAmount)

  return {
    originalAmount: safeOriginal,
    finalAmount,
    totalDiscount,
    applications,
    steps,
    hadNegativeFallback
  }
}

export function buildDiscountSummary(applications: DiscountApplication[]): string[] {
  return applications.map(
    (app) => `${app.discountName}: -¥${app.appliedAmount.toFixed(2)}`
  )
}

export function validateDiscount(discount: Omit<Discount, 'id' | 'createdAt'>): string[] {
  const errors: string[] = []
  if (!discount.name.trim()) errors.push('优惠名称不能为空')
  if (discount.priority < 0) errors.push('优先级不能为负数')
  if (discount.value <= 0) errors.push('优惠值必须大于0')

  switch (discount.type) {
    case DiscountType.COUPON_PERCENT:
      if (discount.value > 100) errors.push('折扣百分比不能超过100%')
      break
    case DiscountType.FULL_REDUCTION:
      if (discount.threshold === undefined || discount.threshold <= 0) {
        errors.push('满减门槛必须大于0')
      }
      break
    case DiscountType.COUPON_FIXED:
      if (discount.threshold !== undefined && discount.threshold < 0) {
        errors.push('使用门槛不能为负')
      }
      break
  }

  if (discount.startDate && discount.endDate) {
    if (dayjs(discount.startDate).isAfter(dayjs(discount.endDate), 'day')) {
      errors.push('开始日期不能晚于结束日期')
    }
  }

  return errors
}
