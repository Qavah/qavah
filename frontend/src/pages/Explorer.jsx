import React, { useState } from 'react'
import { Link, useParams, useNavigate } from "react-router-dom"
import { useQuery } from '@apollo/client'
import { ethers, BigNumber } from 'ethers'
import { ALL_PROJECTS } from '../graphql'

function Explorer () {
  const { data: { projects = [] } = {} } = useQuery(ALL_PROJECTS)
  return (
    <>
      <h2>All campaigns</h2>
      <div className="projects">
        {projects.map((p, i) => {
          const percentage = BigNumber.from(p.fundedAmount).mul?.(100).div(p.requestedAmount).toNumber()
          return (
            <Link to={p.id} className={`Project plain ${+window.ethereum?.selectedAddress === +p.creator && 'mine'}`} key={p.id}>
              <img className='img' src={p.image} alt="" />
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
    </>
  )
}

export default Explorer