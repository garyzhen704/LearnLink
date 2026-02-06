import { useState } from 'react'

export default function CreateClassForm({
  classes,
  selectedClass,
  setSelectedClass,
  addNewClass,
  onSuccess,
}) {
  const [name, setName] = useState('')
  const [color, setColor] = useState('#3b82f6')
  const [error, setError] = useState('')
  const [showNewClassForm, setShowNewClassForm] = useState(false)

  const trimmedName = name.trim()
  const isDuplicate =
    trimmedName &&
    classes.some((c) => c.name.toLowerCase() === trimmedName.toLowerCase())

  const handleSubmit = () => {
    setError('')
    try {
      const className = addNewClass(trimmedName, color)
      setName('')
      setColor('#3b82f6')
      setError('')
      setShowNewClassForm(false)
      onSuccess(className)
    } catch (err) {
      setError(err.message)
    }
  }

  const handleCancel = () => {
    setName('')
    setColor('#3b82f6')
    setError('')
    setShowNewClassForm(false)
  }

  return showNewClassForm ? (
    <div className='flex flex-col space-y-3 rounded-lg border border-neutral-300 p-4'>
      <div className='flex gap-6 border-b border-neutral-100 pb-3'>
        <div className='flex flex-col w-[61%] space-y-2'>
          <label className='text-xs text-neutral-600'>Name</label>
          <input
            type='text'
            placeholder='Class name'
            value={name}
            onChange={(e) => setName(e.target.value)}
            className='w-full rounded border border-neutral-300 px-2 py-1 text-sm'
            maxLength={50}
          />
        </div>
        <div className='flex flex-col gap-2'>
          <label className='text-xs text-neutral-600'>Color</label>
          <input
            type='color'
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className='h-8 w-16 cursor-pointer rounded border border-neutral-300'
          />
        </div>
      </div>
      {isDuplicate && (
        <p className='text-xs text-red-600'>
          A class with this name already exists.
        </p>
      )}
      {error && <p className='text-xs text-red-600'>{error}</p>}
      <div className='flex gap-2'>
        <button
          type='button'
          onClick={handleSubmit}
          className='btn-outline flex-1 text-xs'
          disabled={!trimmedName || isDuplicate}
        >
          Create Class
        </button>
        <button
          type='button'
          onClick={handleCancel}
          className='btn-ghost flex-1 text-xs'
        >
          Cancel
        </button>
      </div>
    </div>
  ) : (
    <div className='flex flex-col space-y-2'>
      <label className='mb-1 block text-xs font-medium text-neutral-700'>
        Select Class <span className='text-neutral-400'>(optional)</span>
      </label>

      <div className='flex gap-2'>
        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          className='flex-1 h-9 cursor-pointer rounded-lg border border-neutral-300 px-3 py-2 text-sm'
        >
          <option value=''>-- None (Uncategorized) --</option>
          {classes.map((cls) => (
            <option key={cls.name} value={cls.name}>
              {cls.name}
            </option>
          ))}
        </select>
        <button
          type='button'
          onClick={() => setShowNewClassForm(true)}
          className='icon-btn-outline'
          title='Create new class'
        >
          +
        </button>
      </div>
    </div>
  )
}
