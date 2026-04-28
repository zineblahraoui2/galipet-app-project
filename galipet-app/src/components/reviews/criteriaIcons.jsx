import { GraduationCap, Clock, MessageCircle, CircleDollarSign } from 'lucide-react'

const MAP = {
  expertise: GraduationCap,
  punctuality: Clock,
  communication: MessageCircle,
  value: CircleDollarSign,
}

/** Brand-aligned accent for criteria rows (matches GaliPet orange). */
export function CriteriaIcon({ criterionKey, className = '' }) {
  const C = MAP[criterionKey] || GraduationCap
  return <C className={`h-4 w-4 shrink-0 text-[#E05C2A] ${className}`} strokeWidth={2} aria-hidden />
}
