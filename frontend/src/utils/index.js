import { useCallback, useEffect, useState } from 'react'
import { useCelo } from '@celo/react-celo'
import * as ipfsClient from 'ipfs-http-client'
import { ethers } from 'ethers'
import DitherJS from 'ditherjs'
import contractAddresses from '../contracts/contract-address.json'
import Contract from '../contracts/Contract.json'
import CUSD from '../contracts/CUSD.json'

export const getContract = chainId => contractAddresses[chainId]
export const getAbi = () => Contract.abi
export const getNetwork = chainId => ({
  1337: {
    name: 'Localhost',
    rpcUrl: 'http://localhost:8545',
    subgraph: 'http://localhost:8000/subgraphs/name/yip-theodore/qavah',
  },
  44787: {
    name: 'Alfajores',
    rpcUrl: 'https://alfajores-forno.celo-testnet.org',
    explorer: 'https://alfajores-blockscout.celo-testnet.org',
    subgraph: 'https://api.thegraph.com/subgraphs/name/yip-theodore/qavah',
  },
  42220: {
    name: 'Celo',
    rpcUrl: 'https://forno.celo.org',
    explorer: 'https://explorer.celo.org',
    subgraph: 'https://api.thegraph.com/subgraphs/name/yip-theodore/qavah-celo-mainnet',
  }
})[chainId]

export const ipfs = ipfsClient.create({
  host: 'ipfs.infura.io',
  port: 5001,
  protocol: 'https',
  headers: {
    authorization: 'Basic ' + Buffer.from('2DKuHQyhrxZg8pQ0qFDS2P1zbhA:1c5a77a8f113de65fe662e53288a883e').toString('base64'),
  },
})

export const useContract = (chainId) => {
  const { address, kit } = useCelo()
  const [ contract, setContract ] = useState(null)
  const [ cUSD, setCUSD ] = useState(null)
  const [ balance, setBalance ] = useState(null)

  const fetchBalance = useCallback(async (erc20) => {
    const balance = await erc20.methods.balanceOf(address).call()
    setBalance(parseFloat(ethers.utils.formatUnits(balance, 18)).toFixed(2))
  }, [ address ])

  useEffect(() => {
    if (address) {
      window.contract = new kit.connection.web3.eth.Contract(
        getAbi(),
        getContract(chainId),
      )
      setContract(window.contract)
      window.contract.methods.usdTokenAddress(
      ).call().then(usdTokenAddress => {
        const cUSD = new kit.connection.web3.eth.Contract(
          CUSD.abi,
          usdTokenAddress,
        )
        fetchBalance(cUSD)
        setCUSD(cUSD)
      })
    }
  }, [ address, chainId, fetchBalance, kit.connection.web3.eth.Contract ])


  return { address, contract, balance, cUSD, fetchBalance }
}

export async function onFileSelected (event, setImg) {
  var selectedFile = event.target.files[0]
  var reader = new FileReader()
  if (!selectedFile) return

  const img = document.createElement('img')
  img.className = 'img'
  img.width = 640
  img.height = 360
  img.title = selectedFile.name
  document.body.appendChild(img)

  const ditherjs = new DitherJS({
    step: 1,
    palette: [[0, 0, 0], [255, 255, 255]],
    algorithm: 'atkinson' // one of ['ordered', 'diffusion', 'atkinson']
  })
  reader.onload = function (event) {
    img.onload = async () => {
      ditherjs.dither(img)
      const canvas = document.querySelector('canvas:last-child')
      const ctx = canvas.getContext('2d')
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      for (var i = 0; i < imgData.data.length; i += 4) {
        if (imgData.data[i + 0]) {
          imgData.data[i + 0] = 251
          imgData.data[i + 1] = 204
          imgData.data[i + 2] = 92
        } else {
          imgData.data[i + 0] = 97
          imgData.data[i + 1] = 31
          imgData.data[i + 2] = 105
        }
      }
      const canvas1 = document.createElement('canvas')
      canvas1.className = 'canvas'
      const ctx1 = canvas1.getContext('2d')
      canvas1.width = canvas.width
      canvas1.height = canvas.height
      ctx1.putImageData(imgData, 0, 0)
      setImg({
        dataUrl: canvas1.toDataURL(),
        blob: await new Promise(resolve => canvas1.toBlob(resolve)),
        width: canvas1.width,
        height: canvas1.height,
      })
    }
    img.src = event.target.result
  }
  reader.readAsDataURL(selectedFile)
}

export const escapeHtml = (unsafe) => {
  return unsafe.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;').replaceAll('#', '%23')
}
