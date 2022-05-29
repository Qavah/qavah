import React, { useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { notificationVar } from '../graphql'
import { useContract } from '../utils'

const Report = ({ userAddress }) => {
  const { chainId } = useParams()
  const { address, contract } = useContract(chainId)
  const [modal, setModal] = useState(false)
  const ref = useRef()
  return (
    <>
      {modal === 'REPORT' && (
        <aside className='overlay'>
          <aside className='Modal'>
            <div className='Modal__top'>
              <h3>Are you sure to report this user?</h3>
            </div>
            <textarea ref={ref} className='textarea' rows='3' placeholder='Explain why (optional)' />
            <div className='Modal__bottom'>
              <button
                className='button grow primary'
                onClick={async () => {
                  try {
                    notificationVar('Please confirm on your wallet…')
                    await contract.methods.reportUser(
                      userAddress,
                      ref.current.value,
                    ).send({ from: address, chainId: '0x' + Number(chainId).toString(16) })
                    notificationVar('User successfully reported.')
                    setModal('')
                  } catch (error) {
                    console.error(error)
                    notificationVar(error.message)
                  }
                }}
              >
                Report
              </button>
              <button className='button grow' onClick={() => setModal('')}>
                Back
              </button>
            </div>
          </aside>
        </aside>
      )}
      <svg onClick={() => setModal('REPORT')} className='button icon' height={35} xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'>
        <path fill='none' d='M0 0h24v24H0z'/><path fill='currentColor' d='M5 16v6H3V3h9.382a1 1 0 0 1 .894.553L14 5h6a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1h-6.382a1 1 0 0 1-.894-.553L12 16H5zM5 5v9h8.236l1 2H19V7h-6.236l-1-2H5z'/>
      </svg>
    </>
  )
}

export default Report