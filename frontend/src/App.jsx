import React, { useState } from 'react'
import { Outlet, Link, useParams, useNavigate } from "react-router-dom"
import { useQuery } from '@apollo/client'
import { ethers, BigNumber } from 'ethers'
import { Context } from './utils'
import Header from './components/Header'
import './index.css'
import { ALL_PROJECTS } from './graphql'

function App() {
  const [store, setStore] = useState({
    balance: null,
  })
  const updateStore = update => setStore({ ...store, ...update })

  const { data: { projects = [] } = {} } = useQuery(ALL_PROJECTS, {
    pollInterval: 1000,
  })

  return (
    <Context.Provider value={{ store, updateStore }}>
      <main>
        <Header />
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
        <div className='Outlet'>
          <Outlet />
          <div className="overlay" />
        </div>
        {store.message && (
          <div className='Message'>
            <span>{store.message}</span>
            <button onClick={() => store.disabled ? window.location.reload() : updateStore({ message: '' })}>x</button>
          </div>
        )}
      </main>
    </Context.Provider>
  )
}

export default App
