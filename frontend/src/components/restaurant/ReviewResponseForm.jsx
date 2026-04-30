import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '../ui/button'

const ReviewResponseForm = ({ onSubmit, saving = false }) => {
  const [responseText, setResponseText] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!responseText.trim()) {
      toast.error('Please write a response before submitting.')
      return
    }

    await onSubmit(responseText.trim())
    toast.success('Response posted.')
    setResponseText('')
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-2">
      <textarea
        value={responseText}
        onChange={(e) => setResponseText(e.target.value)}
        rows={3}
        placeholder="Write a response to this review"
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
      />

      <Button type="submit" disabled={saving} size="sm">
        {saving ? 'Posting…' : 'Post response'}
      </Button>
    </form>
  )
}

export default ReviewResponseForm
