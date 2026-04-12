import { useState, useEffect, useCallback, useRef } from 'react'
import supabase from '../../lib/supabase'
import { toast } from 'sonner'
import {
  getMenu,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
  updateRestaurantSettings,
} from '../../services/restaurantService'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const EMPTY_FORM = { name: '', category: '', price: '', description: '', image_url: '' }

const Badge = ({ available }) => (
  <span
    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
      available
        ? 'bg-green-100 text-green-700'
        : 'bg-gray-100 text-gray-500'
    }`}
  >
    {available ? 'Available' : 'Unavailable'}
  </span>
)

// ─── Item form (add / edit) ───────────────────────────────────────────────────

const ItemForm = ({ initial = EMPTY_FORM, onSave, onCancel, saving }) => {
  const [form, setForm] = useState(initial)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (!uploadError) return
    toast.error(uploadError, { id: `error-${uploadError}` })
  }, [uploadError])

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleImagePick = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Only JPG, PNG, WEBP or GIF images are allowed.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image must be 5 MB or less.')
      return
    }

    setUploading(true)
    setUploadError(null)
    try {
      const ext = file.name.split('.').pop()
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage
        .from('menu_image')
        .upload(path, file, { upsert: false })
      if (error) throw error
      const { data } = supabase.storage.from('menu_image').getPublicUrl(path)
      setForm((f) => ({ ...f, image_url: data.publicUrl }))
    } catch (err) {
      setUploadError(err.message ?? 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.name.trim() || form.price === '') return
    onSave({
      name: form.name.trim(),
      category: form.category.trim() || null,
      price: parseFloat(form.price),
      description: form.description.trim() || null,
      image_url: form.image_url || null,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Item name <span className="text-red-500">*</span>
          </label>
          <input
            required
            value={form.name}
            onChange={set('name')}
            placeholder="e.g. Margherita Pizza"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
          <input
            value={form.category}
            onChange={set('category')}
            placeholder="e.g. Mains, Drinks"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Price (৳) <span className="text-red-500">*</span>
          </label>
          <input
            required
            type="number"
            min="0"
            step="1"
            value={form.price}
            onChange={set('price')}
            placeholder="e.g. 250"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
          <input
            value={form.description}
            onChange={set('description')}
            placeholder="Short description (optional)"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-gray-600 mb-1">Item image</label>

          <div className="flex items-center gap-3">
            {/* Hidden real input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImagePick}
            />

            {/* Thumbnail / placeholder */}
            <div
              onClick={() => !uploading && fileInputRef.current?.click()}
              className={`w-20 h-20 rounded-md border-2 border-dashed flex items-center justify-center shrink-0 cursor-pointer overflow-hidden transition-colors ${
                uploading
                  ? 'border-orange-300 bg-orange-50'
                  : 'border-gray-300 hover:border-orange-400 bg-gray-50'
              }`}
            >
              {form.image_url ? (
                <img
                  src={form.image_url}
                  alt="preview"
                  className="w-full h-full object-cover"
                  onError={(e) => { e.currentTarget.style.display = 'none' }}
                />
              ) : uploading ? (
                <span className="text-xs text-orange-400 text-center px-1">Uploading…</span>
              ) : (
                <span className="text-2xl">📷</span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-md text-xs font-medium border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                {form.image_url ? 'Change image' : 'Upload image'}
              </button>
              {form.image_url && (
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, image_url: '' }))}
                  className="ml-2 px-3 py-1.5 rounded-md text-xs font-medium border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
                >
                  Remove
                </button>
              )}
                <p className="text-xs text-gray-400 mt-1">JPG, PNG, WEBP — max 5 MB</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-2 justify-end pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-md text-sm font-medium text-gray-600 border border-gray-300 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 rounded-md text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving…' : 'Save item'}
        </button>
      </div>
    </form>
  )
}

// ─── Settings panel ───────────────────────────────────────────────────────────

const SettingsPanel = ({ initial, onSave }) => {
  const [prepTime, setPrepTime] = useState(initial.avg_prep_time ?? '')
  const [capacity, setCapacity] = useState(initial.max_orders_per_hour ?? '')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState(null)

  useEffect(() => {
    if (!err) return
    toast.error(err, { id: `error-${err}` })
  }, [err])

  const handleSave = async (e) => {
    e.preventDefault()
    if (prepTime === '' && capacity === '') return
    setSaving(true)
    setErr(null)
    try {
      const payload = {}
      if (prepTime !== '') payload.avg_prep_time = Number(prepTime)
      if (capacity !== '') payload.max_orders_per_hour = Number(capacity)
      await onSave(payload)
      toast.success('Restaurant settings updated.')
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to save settings.'
      setErr(msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form
      onSubmit={handleSave}
      className="bg-white rounded-xl border border-gray-200 shadow-sm p-5"
    >
      <h3 className="text-base font-semibold text-gray-800 mb-4">Restaurant Settings</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Avg. prep time (minutes)
          </label>
          <input
            type="number"
            min="1"
            step="1"
            value={prepTime}
            onChange={(e) => setPrepTime(e.target.value)}
            placeholder="e.g. 25"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
          <p className="text-xs text-gray-400 mt-1">Used to calculate order delivery estimates.</p>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Max orders per hour
          </label>
          <input
            type="number"
            min="1"
            step="1"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            placeholder="e.g. 20"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
          <p className="text-xs text-gray-400 mt-1">Orders above this limit will be deferred.</p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 rounded-md text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving…' : 'Save settings'}
        </button>
      </div>
    </form>
  )
}

// ─── Single menu item row ─────────────────────────────────────────────────────

const ItemRow = ({ item, onEdit, onDelete, onToggle, busyId }) => {
  const isBusy = busyId === item.id

  return (
    <div
      className={`flex items-start justify-between gap-3 px-4 py-3 rounded-lg border transition-colors ${
        item.is_available
          ? 'bg-white border-gray-200'
          : 'bg-gray-50 border-gray-200 opacity-70'
      }`}
    >
      {/* Thumbnail */}
      {item.image_url ? (
        <img
          src={item.image_url}
          alt={item.name}
          className="w-14 h-14 rounded-md object-cover border border-gray-200 shrink-0"
          onError={(e) => { e.currentTarget.style.display = 'none' }}
        />
      ) : (
        <div className="w-14 h-14 rounded-md bg-gray-100 flex items-center justify-center shrink-0 text-gray-300 text-xl">
          🍽️
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-gray-800 text-sm">{item.name}</span>
          {item.category && (
            <span className="text-xs text-gray-400 bg-gray-100 rounded px-1.5 py-0.5">
              {item.category}
            </span>
          )}
          <Badge available={item.is_available} />
        </div>
        {item.description && (
          <p className="text-xs text-gray-500 mt-0.5 truncate">{item.description}</p>
        )}
        <p className="text-sm font-semibold text-gray-700 mt-1">
          ৳{Number(item.price).toFixed(0)}
        </p>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {/* Toggle availability */}
        <button
          onClick={() => onToggle(item)}
          disabled={isBusy}
          title={item.is_available ? 'Mark unavailable' : 'Mark available'}
          className={`px-2.5 py-1.5 rounded-md text-xs font-medium border transition-colors disabled:opacity-50 ${
            item.is_available
              ? 'border-gray-300 text-gray-600 hover:bg-gray-50'
              : 'border-orange-300 text-orange-600 hover:bg-orange-50'
          }`}
        >
          {item.is_available ? 'Disable' : 'Enable'}
        </button>

        {/* Edit */}
        <button
          onClick={() => onEdit(item)}
          disabled={isBusy}
          className="px-2.5 py-1.5 rounded-md text-xs font-medium border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          Edit
        </button>

        {/* Delete */}
        <button
          onClick={() => onDelete(item)}
          disabled={isBusy}
          className="px-2.5 py-1.5 rounded-md text-xs font-medium border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
        >
          Delete
        </button>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

const MenuManagement = () => {
  const [items, setItems] = useState([])
  const [settings, setSettings] = useState({ avg_prep_time: null, max_orders_per_hour: null })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Form state
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingItem, setEditingItem] = useState(null) // item being edited
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState(null) // item being toggled / deleted
  const [formError, setFormError] = useState(null)

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState(null)

  useEffect(() => {
    if (!error) return
    toast.error(error, { id: `error-${error}` })
  }, [error])

  useEffect(() => {
    if (!formError) return
    toast.error(formError, { id: `error-${formError}` })
  }, [formError])

  const fetchMenu = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await getMenu()
      setItems(result.items)
      setSettings(result.restaurant)
    } catch {
      setError('Failed to load menu.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMenu()
  }, [fetchMenu])

  // ── Add ──────────────────────────────────────────────────────────────────────
  const handleAdd = async (formData) => {
    setSaving(true)
    setFormError(null)
    try {
      const newItem = await addMenuItem(formData)
      setItems((prev) => [...prev, newItem])
      setShowAddForm(false)
    } catch (err) {
      setFormError(
        err?.response?.data?.message ||
        err?.message ||
        'Failed to add item. Please try again.'
      )
    } finally {
      setSaving(false)
    }
  }

  // ── Edit ─────────────────────────────────────────────────────────────────────
  const handleEdit = async (formData) => {
    setSaving(true)
    setFormError(null)
    try {
      const updated = await updateMenuItem(editingItem.id, formData)
      setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)))
      setEditingItem(null)
    } catch (err) {
      setFormError(
        err?.response?.data?.message ||
        err?.message ||
        'Failed to update item. Please try again.'
      )
    } finally {
      setSaving(false)
    }
  }

  // ── Toggle availability ───────────────────────────────────────────────────────
  const handleToggle = async (item) => {
    setBusyId(item.id)
    try {
      const updated = await updateMenuItem(item.id, { is_available: !item.is_available })
      setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)))
    } catch (err) {
      setFormError(
        err?.response?.data?.message || err?.message || 'Failed to update item availability.'
      )
    } finally {
      setBusyId(null)
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return
    setBusyId(deleteTarget.id)
    setDeleteTarget(null)
    try {
      await deleteMenuItem(deleteTarget.id)
      setItems((prev) => prev.filter((i) => i.id !== deleteTarget.id))
    } catch (err) {
      setFormError(
        err?.response?.data?.message || err?.message || 'Failed to delete item.'
      )
    } finally {
      setBusyId(null)
    }
  }

  // ── Save settings ─────────────────────────────────────────────────────────────
  const handleSaveSettings = async (payload) => {
    // let the error bubble up — SettingsPanel catches and shows the real message
    const updated = await updateRestaurantSettings(payload)
    setSettings({
      avg_prep_time: updated.avg_prep_time ?? null,
      max_orders_per_hour: updated.max_orders_per_hour ?? null,
    })
  }

  // ── Group items by category ───────────────────────────────────────────────────
  const grouped = items.reduce((acc, item) => {
    const cat = item.category || 'Uncategorised'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(item)
    return acc
  }, {})

  return (
    <div className="max-w-3xl mx-auto">
      {/* Page header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Menu Management</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Add, edit or disable items on your menu.
          </p>
        </div>
        {!showAddForm && !editingItem && (
          <button
            onClick={() => { setShowAddForm(true); setFormError(null) }}
            className="px-4 py-2 rounded-md text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 transition-colors"
          >
            + Add item
          </button>
        )}
      </div>

      {/* Add item form */}
      {showAddForm && (
        <div className="bg-white rounded-xl border border-orange-200 shadow-sm p-5 mb-6">
          <h3 className="text-base font-semibold text-gray-800 mb-4">New menu item</h3>
          <ItemForm
            onSave={handleAdd}
            onCancel={() => { setShowAddForm(false); setFormError(null) }}
            saving={saving}
          />
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3 mb-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-16 rounded-lg bg-gray-100 animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <span className="text-4xl mb-3">🍽️</span>
          <p className="text-sm">No menu items yet. Add your first item above.</p>
        </div>
      )}

      {/* Menu list grouped by category */}
      {!loading && items.length > 0 && (
        <div className="space-y-6 mb-8">
          {Object.entries(grouped).map(([cat, catItems]) => (
            <div key={cat}>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2 px-1">
                {cat}
              </h4>
              <div className="space-y-2">
                {catItems.map((item) =>
                  editingItem?.id === item.id ? (
                    <div
                      key={item.id}
                      className="bg-white rounded-xl border border-orange-200 shadow-sm p-4"
                    >
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">Edit "{item.name}"</h3>
                      <ItemForm
                        initial={{
                          name: item.name,
                          category: item.category ?? '',
                          price: item.price,
                          description: item.description ?? '',
                          image_url: item.image_url ?? '',
                        }}
                        onSave={handleEdit}
                        onCancel={() => { setEditingItem(null); setFormError(null) }}
                        saving={saving}
                      />
                    </div>
                  ) : (
                    <ItemRow
                      key={item.id}
                      item={item}
                      onEdit={(i) => { setEditingItem(i); setShowAddForm(false); setFormError(null) }}
                      onDelete={setDeleteTarget}
                      onToggle={handleToggle}
                      busyId={busyId}
                    />
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-base font-semibold text-gray-800 mb-2">Delete item?</h3>
            <p className="text-sm text-gray-500 mb-5">
              "{deleteTarget.name}" will be permanently removed from your menu.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-md text-sm font-medium text-gray-600 border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 rounded-md text-sm font-medium text-white bg-red-500 hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Restaurant settings */}
      {!loading && (
        <SettingsPanel initial={settings} onSave={handleSaveSettings} />
      )}
    </div>
  )
}

export default MenuManagement

