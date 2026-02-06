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
              <svg
                className='w-8 h-8 mb-4'
                aria-hidden='true'
                xmlns='http://www.w3.org/2000/svg'
                width='24'
                height='24'
                fill='none'
                viewBox='0 0 24 24'
              >
                <path
                  stroke='currentColor'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2'
                  d='M9 17h6l3-3V6a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1v11l3-1Zm0 0-3 1v2h12v-2l-3-1'
                />
              </svg>
              <p className='mb-2 text-sm font-semibold'>{fileName}</p>
              <p className='text-xs'>Click to change file</p>
            </>
          ) : (
            <>
              <svg
                className='w-8 h-8 mb-4'
                aria-hidden='true'
                xmlns='http://www.w3.org/2000/svg'
                width='24'
                height='24'
                fill='none'
                viewBox='0 0 24 24'
              >
                <path
                  stroke='currentColor'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2'
                  d='M15 17h3a3 3 0 0 0 0-6h-.025a5.56 5.56 0 0 0 .025-.5A5.5 5.5 0 0 0 7.207 9.021C7.137 9.017 7.071 9 7 9a4 4 0 1 0 0 8h2.167M12 19v-9m0 0-2 2m2-2 2 2'
                />
              </svg>
              <p className='mb-2 text-sm'>
                <span className='font-semibold'>Click to upload</span> or drag
                and drop
              </p>
              <p className='text-xs'>{description}</p>
              <p className='text-xs mb-4'>
                Max. File Size: <span className='font-semibold'>{maxSize}</span>
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
