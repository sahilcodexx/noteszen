import { useEffect, useState } from 'react'

export function formatClockTime(date: Date): string {
  return date
    .toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
    .toLowerCase()
}

export function getTimeGreeting(date: Date): string {
  const hour = date.getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export function useLiveClock() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  return {
    now,
    time: formatClockTime(now),
    greeting: getTimeGreeting(now),
  }
}