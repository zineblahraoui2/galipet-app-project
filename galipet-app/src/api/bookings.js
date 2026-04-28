import { api } from './client.js'

export function reportLate(bookingId, minutes = 0) {
  return api.put(`/api/bookings/${bookingId}/late`, { minutes })
}

export function reportNoShow(bookingId) {
  return api.put(`/api/bookings/${bookingId}/no-show`)
}

export function rescheduleBooking(bookingId, newDate, newTimeSlot, reason) {
  return api.put(`/api/bookings/${bookingId}/reschedule`, { newDate, newTimeSlot, reason })
}
