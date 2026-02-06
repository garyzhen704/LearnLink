import { useState } from 'react'

export function FileUploadInput({ name, accept, id, description, maxSize }) {
  const [fileName, setFileName] = useState(null)

  function handleChange(e) {
    const file = e.target.files[0]
    setFileName(file ? file.name : null)
  }

  return (
    <div className='flex items-center justify-center w-full'>
      <label
        htmlFor={id}
        className='flex flex-col items-center justify-center w-full h-44 bg-neutral-secondary-medium border border-dashed border-default-strong rounded-lg cursor-pointer hover:bg-neutral-tertiary-medium'
      >
        <div className='flex flex-col items-center justify-center text-body pt-5 pb-6'>
          {fileName ? (
            <>
              <OutlineCloudDone className='w-7 h-7 mb-4 text-neutral-700' />
              <p className='mb-2 text-sm font-semibold text-neutral-700'>
                {fileName}
              </p>
              <p className='text-xs text-neutral-700'>Click to change file</p>
            </>
          ) : (
            <>
              <OutlineCloudUpload className='w-7 h-7 mb-4 text-neutral-700' />
              <p className='mb-2 text-sm text-neutral-700'>
                <span className='font-semibold text-neutral-700'>
                  Click to choose
                </span>{' '}
                or drag and drop
              </p>
              <p className='text-xs text-neutral-700'>{description}</p>
              <p className='text-xs mb-4 text-neutral-700'>
                Max. File Size:{' '}
                <span className='font-semibold text-neutral-700'>{maxSize}</span>
              </p>
            </>
          )}
        </div>
        <input
          id={id}
          type='file'
          name={name}
          accept={accept}
          className='hidden'
          onChange={handleChange}
        />
      </label>
    </div>
  )
}

function OutlineCloudDone(props) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 24 24'
      width='1em'
      height='1em'
      {...props}
    >
      <path
        fill='currentColor'
        d='M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5c0-2.64-2.05-4.78-4.65-4.96M19 18H6c-2.21 0-4-1.79-4-4c0-2.05 1.53-3.76 3.56-3.97l1.07-.11l.5-.95A5.47 5.47 0 0 1 12 6c2.62 0 4.88 1.86 5.39 4.43l.3 1.5l1.53.11A2.98 2.98 0 0 1 22 15c0 1.65-1.35 3-3 3m-9-3.82l-2.09-2.09L6.5 13.5L10 17l6.01-6.01l-1.41-1.41z'
      ></path>
    </svg>
  )
}

function OutlineCloudUpload(props) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 24 24'
      width='1em'
      height='1em'
      {...props}
    >
      <path
        fill='currentColor'
        d='M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5c0-2.64-2.05-4.78-4.65-4.96M19 18H6c-2.21 0-4-1.79-4-4c0-2.05 1.53-3.76 3.56-3.97l1.07-.11l.5-.95A5.47 5.47 0 0 1 12 6c2.62 0 4.88 1.86 5.39 4.43l.3 1.5l1.53.11A2.98 2.98 0 0 1 22 15c0 1.65-1.35 3-3 3M8 13h2.55v3h2.9v-3H16l-4-4z'
      ></path>
    </svg>
  )
}
