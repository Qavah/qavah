import React, { useState } from 'react'
import { Outlet, useParams } from "react-router-dom"
import { ApolloProvider } from '@apollo/client'
import { Context } from './utils'
import { createClient } from './graphql'
import Header from './components/Header'
import './index.css'

function App() {
  const { chainId } = useParams()
  const [store, setStore] = useState({
    balance: null,
  })
  const updateStore = update => setStore({ ...store, ...update })

  return (
    <Context.Provider value={{ store, updateStore }}>
      <ApolloProvider client={createClient(chainId)}>
        <main>
          <Header />
          {/* <div className='Outlet'> */}
            <Outlet />
            {/* <div className="overlay" />
          </div> */}
          {store.message && (
            <div className='Message'>
              <span>{store.message}</span>
              <button onClick={() => updateStore({ message: '' })}>x</button>
            </div>
          )}
        </main>
      </ApolloProvider>
    </Context.Provider>
  )
}

export default App
