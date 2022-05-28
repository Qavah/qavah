import React, { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@apollo/client'
import { BigNumber } from 'ethers'
import { PROFILE, notificationVar } from '../graphql'
import { useContract } from '../utils'
import Project from '../components/Project'
import Report from '../components/Report'

function Profile () {
  const { chainId, userAddress } = useParams()
  const { address, balance } = useContract(chainId)

  const { data: { receipts = [], projects = [] } = {} } = useQuery(PROFILE, {
    variables: { userAddress },
    onError: error => notificationVar(error.message),
  })
  const [dataImgs, setDataImgs] = useState({})

  useEffect(() => {
    setTimeout(async () => {
      if (window.ReactNativeWebView) {
        for (const receipt of receipts) {
          const blob = await fetch(receipt.project.image).then(r => r.blob())
          const dataImg = await new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onerror = reject
            reader.onload = () => resolve(reader.result)
            reader.readAsDataURL(blob)
          })
          setDataImgs(dataImgs => ({ ...dataImgs, [receipt.project.id]: dataImg }))
        }
      }
    })
  }, [ userAddress, receipts ])

  return (
    <div className='Profile'>
      <div className='top'>
        <h1>
          {userAddress.slice(0, 6)}…{userAddress.slice(-2)}
          {+userAddress !== +address && '’s'}
        </h1>
        {+userAddress !== +address ? (
          <Report userAddress={userAddress} />
        ) : (
          <span>
            Current balance:<br />
            <b>{balance?.toFixed(2)} cUSD</b>
          </span>
        )}
      </div>
      <div className='campaigns'>
        <h2 className='h2'>
          {+userAddress === +address ? 'Your campaigns' : 'Created campaigns'}
          <span>({projects.length})</span>
        </h2>
        <div className='projects'>
          {projects.map(p => (
            <Project project={p} key={p.id} />
          ))}
          {+userAddress === +address && (
            <Link to={`/${chainId}/new`} className='new'>
              <div>
                <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' height={18}><path fill='none' d='M0 0h24v24H0z'/><path fill='currentColor' d='M11 11V5h2v6h6v2h-6v6h-2v-6H5v-2z'/></svg>
              </div>
              <span>
                Start a new campaign
              </span>
            </Link>
          )}
        </div>
      </div>
      <div className='contributions'>
        <h2 className='h2'>
          {+userAddress === +address ? 'Your contributions' : 'Public contributions'}
          <span>({receipts.length})</span>
        </h2>
        <div className='projects'>
          {receipts.map(p => {
            // const link = '/' + p.description?.split('/').slice(3).join('/')
            return (
              <Link to={p.description} className={`a Project plain ${+address === +p.creator && 'mine'}`} key={p.id}>
                {!window.ReactNativeWebView
                  ? <object data={p.image} type='image/svg+xml' className='object' aria-label={p.title} />
                  : <img src={p.image.replace(p.project.image, dataImgs[p.project.id])} className='img image' alt={p.title} />}
              </Link>
            )
          })}
          {+userAddress === +address && (
            <Link to={`/${chainId}`} className='new'>
              <div>
                <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' height={16}><path fill='none' d='M0 0H24V24H0z'/><path fill='currentColor' d='M6 3c3.49 0 6.383 2.554 6.913 5.895C14.088 7.724 15.71 7 17.5 7H22v2.5c0 3.59-2.91 6.5-6.5 6.5H13v5h-2v-8H9c-3.866 0-7-3.134-7-7V3h4zm14 6h-2.5c-2.485 0-4.5 2.015-4.5 4.5v.5h2.5c2.485 0 4.5-2.015 4.5-4.5V9zM6 5H4v1c0 2.761 2.239 5 5 5h2v-1c0-2.761-2.239-5-5-5z'/></svg>
              </div>
              <span>
                Explore projects
              </span>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

export default Profile
