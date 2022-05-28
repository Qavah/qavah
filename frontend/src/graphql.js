import { ApolloClient, InMemoryCache, gql, makeVar } from '@apollo/client'

export const notificationVar = makeVar('')

export const createClient = chainId => new ApolloClient({
  uri: chainId === '1337'
    ? 'http://localhost:8000/subgraphs/name/yip-theodore/qavah'
    : 'https://api.thegraph.com/subgraphs/name/yip-theodore/qavah',
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          notification: { read: () => notificationVar() },
        },
      },
    },
  }),
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