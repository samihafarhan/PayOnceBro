import React from 'react'
import { useEffect } from 'react'
import { toast } from 'sonner'

const Error = ({ message }) => {
  useEffect(() => {
    if (!message) return
    toast.error(String(message), { id: `error-${String(message)}` })
  }, [message])

  return null
}

export default Error
