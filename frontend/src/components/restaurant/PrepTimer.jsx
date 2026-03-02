import { useEffect, useRef, useState } from 'react'

/**
 * Counts down from `prepTimeMinutes` (minutes) to zero.
 * Starts automatically and resets if prepTimeMinutes changes.
 *
 * Returns a formatted string: "14:32" or "Done" when expired.
 */
const PrepTimer = ({ prepTimeMinutes = 30 }) => {
  const totalSeconds = prepTimeMinutes * 60
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds)
  const intervalRef = useRef(null)

  useEffect(() => {
    setSecondsLeft(prepTimeMinutes * 60)
  }, [prepTimeMinutes])

  useEffect(() => {
    if (secondsLeft <= 0) return
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(intervalRef.current)
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(intervalRef.current)
  }, [secondsLeft <= 0])

  if (secondsLeft <= 0) {
    return (
      <span className="inline-flex items-center gap-1 text-sm font-semibold text-green-600">
        ✓ Ready
      </span>
    )
  }

  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
  const secs = String(secondsLeft % 60).padStart(2, '0')
  const isUrgent = secondsLeft <= 120 // last 2 minutes

  return (
    <span
      className={`inline-flex items-center gap-1 text-sm font-mono font-semibold ${
        isUrgent ? 'text-red-600 animate-pulse' : 'text-orange-600'
      }`}
    >
      ⏱ {mins}:{secs}
    </span>
  )
}

export default PrepTimer
