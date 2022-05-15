import React, { useState, useEffect } from 'react'
import { Link, useParams } from "react-router-dom"
import { useQuery } from '@apollo/client'
import { BigNumber, ethers } from 'ethers'
import { PROFILE } from '../graphql'

function Profile() {
  const { chainId, userAddress } = useParams()

  const { data: { receipts = [], projects = [] } = {} } = useQuery(PROFILE, {
    variables: { userAddress },
    pollInterval: 1000,
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
  }, [userAddress, receipts])

  return (
    <div className='Profile'>
      <div className="contributions">
        <h2>{+userAddress === +window.ethereum?.selectedAddress ? 'Your contributions' : 'Public contributions'}</h2>
        <div className="projects">
          {receipts.map((p, i) => {
            const link = '/' + p.description?.split('/').slice(3).join('/')
            return (
              <Link to={link} className={`Project plain ${+window.ethereum?.selectedAddress === +p.creator && 'mine'}`} key={p.id}>
                {!window.ReactNativeWebView
                  ? <object data={p.image} type="image/svg+xml" />
                  : <img src={p.image.replace(p.project.image, dataImgs[p.project.id])} className="img" />}
              </Link>
            )
          })}
        </div>
      </div>
      <div className="campaigns">
        <h2>{+userAddress === +window.ethereum?.selectedAddress ? 'Your campaigns' : 'Campaigns created'}</h2>
        <div className="projects">
          {projects.map((p, i) => {
            const percentage = BigNumber.from(p.fundedAmount).mul(10 * 10).div(p.requestedAmount).toNumber()
            return (
              <Link to={`/${chainId}/${p.id}`} className={`Project plain ${+window.ethereum?.selectedAddress === +p.creator && 'mine'}`} key={p.id}>
                <div className="content">
                  <div className="title">
                    <h3>{p.title}</h3>
                  </div>
                  <p className='description'>{p.description}</p>
                  <div className="bottom">
                    <div>
                      <div className='progress'><div style={{ width: percentage + '%' }} /></div>
                      <span className='amounts'>{percentage}% funded of <b>{ethers.utils.formatUnits(p.requestedAmount, 18)} cUSD</b></span>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default Profile
