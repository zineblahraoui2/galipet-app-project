import { api } from './client.js'
import { combineDateAndTimeSlot } from '../utils/ownerBooking.js'

export function reportLate(bookingId, minutes = 0) {
  return api.put(`/api/bookings/${bookingId}/late`, { minutes })
}

export function reportNoShow(bookingId) {
  return api.put(`/api/bookings/${bookingId}/no-show`)
}

export function rescheduleBooking(bookingId, newDate, newTimeSlot, reason) {
  const combined = combineDateAndTimeSlot(newDate, newTimeSlot)
  const newStartAt = combined && !Number.isNaN(combined.getTime()) ? combined.toISOString() : ''
  return api.put(`/api/bookings/${bookingId}/reschedule`, { newStartAt, reason })
}
