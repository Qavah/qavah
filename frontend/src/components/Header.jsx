import React from 'react'
import { Link } from 'react-router-dom'
import { useCelo } from '@celo/react-celo'
import { useReactiveVar } from '@apollo/client'
import { notificationVar } from '../graphql'

function Header () {
  const { connect, address, network, destroy } = useCelo()
  const notification = useReactiveVar(notificationVar)
  return (
    <>
      <header className='header'>
        <Link to='' className='a logo plain'>
          <h1 className='h1'>qavah</h1>
          <span className="network">{network.name}</span>
        </Link>
        {address ? (
          <>
          {window.location.pathname.includes('/user/' + address) ? (
            <button className="a" onClick={destroy}>Log out</button>
          ) : (
            <Link to={`user/${address}`} className='a'>My account</Link>
          )}
          </>
        ) : (
          <button className='a' onClick={connect}>Connect wallet</button>
        )}
        <a className='a' href="https://github.com/Qavah/qavah/blob/main/docs/FAQ.md" target="_blank" rel="noopener noreferrer">
          FAQ
        </a>
      </header>
      {notification && (
        <div className='Message'>
          <span>{notification}</span>
          <button className='a' onClick={() => notificationVar('')}>x</button>
        </div>
      )}
    </>
  )
}

export default Header
