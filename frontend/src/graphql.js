import { ApolloClient, InMemoryCache, gql } from '@apollo/client'

export const createClient = chainId => new ApolloClient({
  uri: chainId === '1337'
    ? 'http://localhost:8000/subgraphs/name/yip-theodore/qavah'
    : 'https://api.thegraph.com/subgraphs/name/yip-theodore/qavah',
  cache: new InMemoryCache(),
  defaultOptions: {
    query: {
      fetchPolicy: 'network-only',
    },
  },
})

export const ALL_PROJECTS = gql`
  query {
    projects(
      orderBy: createdAt
      orderDirection: desc
      where: { hidden: false }
    ) {
      id
      creator {
        id
      }
      title
      requestedAmount
      description
      image
      fundedAmount
      claimedAmount
      donators {
        id
      }
      createdAt
      collection {
        id
      }
    }
  }
`

export const PROJECT_INFO = gql`
  query($projectId: ID!) {
    project(id: $projectId) {
      id
      creator {
        id
      }
      title
      requestedAmount
      description
      image
      fundedAmount
      claimedAmount
      donators {
        id
      }
      createdAt
      collection {
        id
        receipts(orderBy: timestamp, orderDirection: desc) {
          id
          name
          amount
          timestamp
          tokenId
          donator {
            id
          }
        }
      }
    }
  }
`

export const PROFILE = gql`
  query($userAddress: ID!) {
    projects(where: { creator: $userAddress }) {
      id
      title
      requestedAmount
      description
      image
      fundedAmount
    }
    receipts(where: { donator: $userAddress }) {
      id
      description
      image
      project {
        id
        image
      }
    }
  }
`