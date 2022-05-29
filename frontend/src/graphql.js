import { ApolloClient, InMemoryCache, gql, makeVar } from '@apollo/client'
import { getNetwork } from './utils'

export const notificationVar = makeVar('')

export const createClient = chainId => new ApolloClient({
  uri: getNetwork(chainId)?.subgraph,
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          notification: { read: () => notificationVar() },
        },
      },
    },
  }),
})

export const ALL_PROJECTS = gql`
  query {
    projects(
      orderBy: createdAt
      orderDirection: desc
      where: { reports_lt: 2 }
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
      updatedAt
      collection {
        id
        receipts(orderBy: timestamp) {
          id
          name
          amount
          image
          timestamp
          tokenId
          donator {
            id
            reports
          }
          message
        }
      }
      createdAt
    }
  }
`

export const PROFILE = gql`
  query($userAddress: ID!) {
    projects(
      where: {creator: $userAddress}
      orderBy: createdAt
      orderDirection: desc
    ) {
      id
      title
      requestedAmount
      description
      image
      fundedAmount
    }
    receipts(
      where: {donator: $userAddress}
      orderBy: timestamp
      orderDirection: desc
    ) {
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