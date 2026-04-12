import { useEffect, useRef, useState } from 'react'
import { Progress } from '../ui/progress'

const PrepTimer = ({ prepTimeMinutes = 30 }) => {
  const totalSeconds = prepTimeMinutes * 60
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds)
  const intervalRef = useRef(null)
  const isDone = secondsLeft <= 0

  useEffect(() => {
    setSecondsLeft(prepTimeMinutes * 60)
  }, [prepTimeMinutes])

  useEffect(() => {
    if (isDone) return
    const id = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(id)
          return 0
        }
        return s - 1
      })
    }, 1000)
    intervalRef.current = id
    return () => clearInterval(id)
  }, [isDone])

  if (secondsLeft <= 0) {
    return (
      <span className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-600">
        ✓ Ready
      </span>
    )
  }

  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
  const secs = String(secondsLeft % 60).padStart(2, '0')
  const isUrgent = secondsLeft <= 120 // last 2 minutes
  const progressPercent = Math.max(0, Math.min(100, 100 - (secondsLeft / totalSeconds) * 100))

  return (
    <div className="flex flex-col gap-1.5 w-32 border border-border p-1.5 rounded-lg bg-muted/30">
      <div className="flex justify-between items-center text-xs font-mono">
        <span className="text-muted-foreground">Prep time</span>
        <span
          className={`font-semibold ${
            isUrgent ? 'text-destructive animate-pulse' : 'text-primary'
          }`}
        >
          {mins}:{secs}
        </span>
      </div>
      <Progress value={progressPercent} className={`h-1.5 ${isUrgent ? 'bg-destructive/20' : ''}`} />
    </div>
  )
}

export default PrepTimer
