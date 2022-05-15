import React, { useContext, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Context, useBalance, getNetwork } from '../utils'

function Header () {
  const { chainId } = useParams()
  const { store } = useContext(Context)
  const getBalance = useBalance(chainId)
  useEffect(() => {
    getBalance()
  }, [])
  return (
    <header>
      <Link to='' className='logo plain'>
        <h1>qavah</h1>
        <span className="network">{getNetwork(chainId)}</span>
      </Link>
      {store.balance !== null ? (
        <>
          <Link
            to={`user/${window.ethereum.selectedAddress}`}
            className={(store.disabled || window.location.pathname.includes('/user/' + window.ethereum.selectedAddress)) ? 'disabled' : ''}
          >My profile</Link>
          <Link
            to='new'
            className={(store.disabled || window.location.pathname.includes('/new')) ? 'disabled' : ''}
          >New campaign</Link>
        </>
      ) : (
        <button onClick={() => getBalance(true)}>Connect wallet</button>
      )}
    </header>
  )
}

export default Header
