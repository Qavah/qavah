import { Link, useParams } from 'react-router-dom'
import { ethers, BigNumber } from 'ethers'

const Project = ({ project }) => {
  const { chainId } = useParams()
  const percentage = BigNumber.from(project.fundedAmount).mul?.(100).div(project.requestedAmount).toNumber()
  return (
    <Link to={`/${chainId}/${project.id}`} className='Project'>
      <img className='img image' src={project.image.replace('ipfs.infura.io', 'qavah.infura-ipfs.io')} alt='' />
      <div className='content'>
        <div className='title'>
          <h3 className='h3'>{project.title}</h3>
        </div>
        <p className='description'>{project.description}</p>
        <div className='bottom'>
          <div>
            <div className='progress'><div style={{ width: percentage + '%' }} /></div>
            <span className='amounts'>{percentage}% funded of <b>{parseFloat(ethers.utils.formatUnits(project.requestedAmount, 18)).toFixed(2)} cUSD</b></span>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default Project
