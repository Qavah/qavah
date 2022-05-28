import React from 'react'
import { Outlet, useParams } from 'react-router-dom'
import { CeloProvider } from '@celo/react-celo'
import { ApolloProvider } from '@apollo/client'
import { createClient } from './graphql'
import { getNetwork } from './utils'
import Header from './components/Header'
import '@celo/react-celo/lib/styles.css'
import './index.scss'

function App () {
  const { chainId } = useParams()
  return (
    <CeloProvider
      dapp={{
        name: 'Qavah',
        description: 'Spark hope.',
        url: 'https://qavah.me',
      }}
      network={{
        ...getNetwork(chainId),
        chainId: +chainId,
      }}
    >
      <ApolloProvider client={createClient(chainId)}>
        <main>
          <Header />
          <Outlet />
        </main>
      </ApolloProvider>
    </CeloProvider>
  )
}

export default App
