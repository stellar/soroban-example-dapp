import BigNumber from 'bignumber.js'
import humanizeDuration from 'humanize-duration'
import moment from 'moment'

const formatAmount = (value: BigNumber, decimals = 7): string => {
  return value.shiftedBy(decimals * -1).toNumber().toLocaleString()
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

const percentage = (
  value: BigNumber,
  divider: BigNumber,
  decimals = 7
): number => {
  return (
    (value.shiftedBy(decimals * -1).toNumber() /
      divider.shiftedBy(decimals * -1).toNumber()) *
    100
  )
}

const Utils = {
  formatAmount,
  getRemainingTime,
  isExpired,
  percentage,
}

export { Utils }
