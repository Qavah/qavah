import React, { useRef, useEffect, useContext } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@apollo/client'
import { BigNumber, ethers } from 'ethers'
import { Context, getContract, getAbi, useBalance, getCUSDContract } from '../utils'
import { PROJECT_INFO } from '../graphql'

function ProjectInfo() {
  const { chainId, projectId } = useParams()
  const navigate = useNavigate()
  const { store, updateStore } = useContext(Context)

  const { data: { project } = {} } = useQuery(PROJECT_INFO, {
    variables: { projectId },
    pollInterval: 1000,
  })
  const input = useRef()
  const getBalance = useBalance(chainId)

  useEffect(() => {
    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      const signer = provider.getSigner()
      window.contract = new ethers.Contract(getContract(chainId), getAbi(), signer)
    }
  }, [])
  if (!project) return null

  const percentage = BigNumber.from(project.fundedAmount).mul?.(100).div(project.requestedAmount).toNumber()
  const toClaim = ethers.utils.formatUnits(BigNumber.from(project.fundedAmount).sub?.(project.claimedAmount) || 0, 18)
  const requested = ethers.utils.formatUnits(project.requestedAmount, 18)
  return (
    <div className='ProjectInfo'>
      <div className='bar'>
        <div className="top">
          <Link to={`/${chainId}`}>Back</Link>
          <span className='amounts'>{percentage}% funded of <b>{requested} cUSD</b></span>
        </div>
        <div className='progress'><div style={{ width: percentage + '%' }} /></div>
      </div>
      <img className='img' src={project.image} alt="" />
      <div className="content">
        <div className="title">
          <h3>{project.title}</h3>
        </div>
        {+window.ethereum?.selectedAddress !== +project.creator.id && (
          <div className='creator'>
            <span className='small'>by</span> <Link to={`/${chainId}/user/${project.creator.id.toLowerCase()}`} className='userAddress' style={{ maxWidth: 'none' }}>{project.creator.id}</Link>
          </div>
        )}
        <p className='description'>{project.description}</p>
        <ul>
          {project.collection.receipts.map((r, i) =>
            <li key={`${i}_${r.id}`}>
              {+window.ethereum?.selectedAddress === +r.donator.id ? (
                <span>You</span>
              ) : (
                <Link to={`/${chainId}/user/${r.donator.id.toLowerCase()}`} className='userAddress'>{r.donator.id}</Link>
              )} donated {r.amount} cUSD
            </li>
          )}
        </ul>
        <div className="interact">
          {store.balance !== null ? (
            <p className='connect'>{store.balance} cUSD</p>
          ) : (
            <button onClick={() => getBalance(true)} className='connect'>Connect</button>
          )}
          {+window.ethereum?.selectedAddress === +project.creator.id ? (
            +toClaim ? (
              <button className='claim' onClick={async () => {
                try {
                  updateStore({ message: 'Please wait…' })

                  const provider = new ethers.providers.Web3Provider(window.ethereum)
                  const signer = provider.getSigner()
                  const contract = new ethers.Contract(getContract(chainId), getAbi(), signer)

                  const tx = await contract.claimProjectFunds(projectId)
                  await tx.wait()
                  await getBalance(true, 'Funds successfully claimed!')

                } catch (error) {
                  console.error(error)
                  updateStore({ message: error.data?.message || error.message })
                }
              }}>
                Claim {toClaim} cUSD
              </button>
            ) : (
              <span>Nothing to claim for now</span>
            )
          ) : BigNumber.from(project.fundedAmount).lt?.(project.requestedAmount) ? (
            <>
              <button className='plain' onClick={() => {
                input.current.value = Math.max(+input.current.value - requested / 100, requested / 100)
              }}>-</button>
              <input ref={input} name="amount" defaultValue={requested / 100} />
              <button className='plain' onClick={() => {
                input.current.value = Math.min(+input.current.value + requested / 100, requested)
              }}>+</button>
              <button className='donate' onClick={async () => {
                try {
                  await getBalance(true, 'Please wait…')

                  const provider = new ethers.providers.Web3Provider(window.ethereum)
                  const signer = provider.getSigner()
                  const contract = new ethers.Contract(getContract(chainId), getAbi(), signer)
                  const cUSD = await getCUSDContract(chainId, signer)
                  if (!input.current) return
                  const value = ethers.utils.parseUnits(input.current.value, 18)
                  const approval = await cUSD.approve(getContract(chainId), value)
                  await approval.wait()
                  const tx = await contract.donateToProject(projectId, value)
                  await tx.wait()
                  await getBalance(true, 'Donation successfully sent!')
                  navigate(`/${chainId}/user/${window.ethereum.selectedAddress}`)

                } catch (error) {
                  console.error(error)
                  updateStore({ message: error.data?.message || error.message })
                }
              }}>
                Donate
              </button>
            </>
          ) : (
            <span>The campaign has finished!</span>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProjectInfo