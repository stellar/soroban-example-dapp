import humanizeDuration from 'humanize-duration'
import moment from 'moment'

/**
 * Format a balance for display to user.
 *
 * If the balance is a number smaller than the max safe integer, then divide it
 * as a number and return it so that decimal places will be respected.
 * Otherwise, return it as a BigInt, which does not respect decimal places.
 * This is probably ok since the numbers will be so huge.
 */
export function formatAmount(undivided: BigInt, decimals: number): string {
  const n = undivided.valueOf() < BigInt(Number.MAX_SAFE_INTEGER)
    ? Number(undivided) / (10 ** decimals)
    : (undivided.valueOf() / (10n ** BigInt(decimals)));
  return String(n);
}

const getRemainingTime = (date?: Date): string => {
  if (!date) {
    return 'Undefined'
  }
  const diff = moment(date).diff(Date.now())

  if (isExpired(date)) {
    return 'Expired'
  }

  return (
    humanizeDuration(diff, {
      round: true,
      conjunction: ' and ',
      largest: 1,
    }) + ' left'
  )
}

const isExpired = (date?: Date): boolean => {
  return moment(date).diff(Date.now()) <= 0
}

/**
 * Calculate percentage of two BigInts
 * Assumes that each use the same number of decimals,
 * and that dividing each one by `decimals` results in a value representable as
 * a `number` type.
 */
const percentage = (
  value: BigInt,
  divider: BigInt,
  decimals = 7
): number => {
  return (Number(value.valueOf() / (10n ** BigInt(decimals))) /
      Number(divider.valueOf() / (10n ** BigInt(decimals)))
    ) * 100
}

const Utils = {
  formatAmount,
  getRemainingTime,
  isExpired,
  percentage,
}

export { Utils }
