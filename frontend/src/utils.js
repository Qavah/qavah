import { createContext, useContext } from 'react'
import contractAddresses from './contracts/contract-address.json'
import Contract from './contracts/Contract.json'
import { create as ipfsHttpClient } from "ipfs-http-client"
import _Qavah from './contracts/Qavah.json'
import { ethers } from 'ethers'
import CUSD from './contracts/CUSD.json'

export const Context = createContext({})

export const getContract = chainId => contractAddresses[chainId]
export const getAbi = () => Contract.abi
export const getSymbol = chainId => ({
  4: 'ETH',
  97: 'BNB',
  1337: 'ETH',
  44787: 'CELO',
})[chainId]
export const getNetwork = chainId => ({
  4: 'Rinkeby Test Network',
  97: 'BSC Testnet',
  1337: 'localhost',
  44787: 'CELO Alfajores',
})[chainId]

export const client = ipfsHttpClient("https://ipfs.infura.io:5001/api/v0")
export const Qavah = _Qavah

export const getCUSDContract = async (chainId, signer) => {
  const provider = new ethers.providers.Web3Provider(window.ethereum)
  const contract = new ethers.Contract(getContract(chainId), getAbi(), provider)
  const cUSD = new ethers.Contract(await contract.usdTokenAddress(), CUSD.abi, signer || provider)
  return cUSD
}

export const useBalance = (chainId) => {
  const { updateStore } = useContext(Context)
  const getBalance = async (ask, message) => {
    updateStore({ message })
    if (ask) {
      if (window.ethereum === undefined) {
        return updateStore({ message: 'Please make sure you have MetaMask! Then reload the page.' })
      }
      if (window.ethereum.chainId && +window.ethereum.chainId !== +chainId) {
        return updateStore({ message: `Make sure you’re on ${getNetwork(chainId)}! Then reload the page.` })
      }
      await window.ethereum.request({ method: "eth_requestAccounts" })
    }
    const cUSD = await getCUSDContract(chainId)
    if (window.ethereum.selectedAddress) {
      const value = await cUSD.balanceOf(window.ethereum.selectedAddress)
      updateStore({ message, balance: ethers.utils.formatUnits(value, 18) })
    }
  }
  return getBalance
}
