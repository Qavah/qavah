import React, { useRef, useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@apollo/client'
import { useCelo } from '@celo/react-celo'
import { BigNumber, ethers } from 'ethers'
import { getContract, useContract } from '../utils'
import { PROJECT_INFO, ALL_PROJECTS, notificationVar } from '../graphql'
import { ReactComponent as Puzzle } from '../assets/puzzle.svg'
import Select from '../components/Select'
import Cropper from 'react-easy-crop'
import getCroppedImg from '../utils/cropImage'
import Report from '../components/Report'
import { ipfs, onFileSelected, escapeHtml } from '../utils'

function ProjectInfo ({ create = false }) {
  const { chainId, projectId } = useParams()
  const navigate = useNavigate()
  const { connect } = useCelo()
  const { address, contract, balance, cUSD, fetchBalance } = useContract(chainId)

  const { data: { project } = {}, refetch, client } = useQuery(PROJECT_INFO, {
    variables: { projectId },
    onError: error => notificationVar(error.message),
    skip: create,
  })

  const [ modal, setModal ] = useState('')
  const [ mode, setMode ] = useState(create ? 'CREATE' : '')
  const [ intersecting, setIntersecting ] = useState([])
  const refs = useRef([ ...Array(101) ].map(() => React.createRef()))
  const [ contribution, setContribution ] = useState(0)

  const [img, setImg] = useState({})
  const [ amount, setAmount ] = useState('')
  const [ title, setTitle ] = useState('')
  const [ description, setDescription ] = useState('')
  const [ message, setMessage ] = useState('')
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)

  useEffect(() => {
    if (project) {
      if (project.fundedAmount !== project.requestedAmount) {
        setContribution(1)
      }
      setAmount(parseFloat(ethers.utils.formatUnits(project.requestedAmount, 18)).toFixed(2))
      setTitle(project.title)
      setDescription(project.description)
      const observer = new IntersectionObserver(
        ([{ isIntersecting, target }]) => {
          if (isIntersecting) {
            setIntersecting((x) => [...x, +target.dataset.index])
          } else {
            setIntersecting((x) => x.filter((i) => i !== +target.dataset.index))
          }
        },
        { rootMargin: '-40%' }
      )
      refs.current.forEach((ref) => ref.current && observer.observe(ref.current))
      return () => observer.disconnect()
    }
  }, [ project ])

  if (!project && !mode) return null
  
  const totalPieces = chainId === '1337' ? 25 : 100
  const percentage = project && BigNumber.from(project.fundedAmount).mul?.(totalPieces).div(project.requestedAmount).toNumber()
  const toClaim = project && parseFloat(ethers.utils.formatUnits(BigNumber.from(project.fundedAmount).sub?.(project.claimedAmount) || 0, 18)).toFixed(2)
  const funded = project && parseFloat(ethers.utils.formatUnits(project.fundedAmount, 18)).toFixed(2)
  const requested = project && parseFloat(ethers.utils.formatUnits(project.requestedAmount, 18)).toFixed(2)

  const receiptsNb = project && project.collection.receipts.length
  const ranges = project && project.collection.receipts.reduce((acc, curr) => [
    ...acc, (acc[acc.length - 1] || 0) + (curr.amount / requested) * totalPieces,
  ], [])
  const chosen = project && intersecting[intersecting.length - 1]

  return (
    <div className='ProjectInfo'>
      {!mode ? (
        project.collection.receipts.length ? (
          <svg className='svg' viewBox='0 0 320 180'>
            <defs>
              <image id='a' href={project.image} width='320' height='180' />
            </defs>
            {[ ...project.collection.receipts[receiptsNb - 1].image.matchAll(/<use.*?\/>/g) ].map((m, i) => {
              const owner = ranges.findIndex((x) => i < x)
              return (
                <use
                  key={'use' + i}
                  href='#a'
                  clipPath={m[0].match(/clip-path='(.*?)'/)[1]}
                  opacity={
                    chosen > -1
                      ? chosen === owner
                        ? 1
                        : owner > -1
                          ? 0.3
                          : 0.1
                      : owner > -1
                        ? 1
                        : 1
                  }
                  style={{ transition: '0.3s' }}
                />
              )
            })}
          </svg>
        ) : (
          <img src={project.image} alt='' />
        )
      ) : (
        <aside className='container'>
          <div className='cropper'>
            <Cropper
              image={img.dataUrl || project?.image}
              aspect={16 / 9}
              crop={crop}
              onCropChange={setCrop}
              onCropComplete={(_, croppedAreaPixels) => setCroppedAreaPixels(croppedAreaPixels)}
              objectFit={img.width / img.height < 16 / 9 ? 'horizontal-cover' : 'vertical-cover'}
              zoom={zoom}
              onZoomChange={setZoom}
            />
          </div>
        </aside>
      )}
      <div className='info'>
        {mode && (
          <div className='banner'>
            <label className='button secondary upload' htmlFor='image'>
              {(img.height || project?.image) ? 'Replace' : 'Upload'} image
              <input id='image' className='input' type='file' name='image' onChange={e => onFileSelected(e, setImg)} accept='image/*' />
            </label>
            <span className='requested'>
              <input
                className='input'
                name='requested'
                type='number'
                step='1'
                min='10'
                placeholder='100'
                inputMode='numeric'
                disabled={requested}
                value={amount}
                onChange={e => setAmount(e.target.value)}
              />
            </span>    
          </div>
        )}
        {!mode ? (
          <h3 className='h3'>
            <span>{project.title}</span>
          </h3>
        ) : (
          <textarea
            className='textarea editable'
            name='title'
            placeholder='Your project title'
            rows='2'
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
        )}
        {!mode && (
          <div className='summary'>
            <span className='amounts'>
              <b>{funded} cUSD</b> funded / <b>{requested}</b>
            </span>
            <span>
              by <b>{project.donators.length} donators</b>
            </span>
          </div>
        )}
        {!mode ? (
           <p className='description'>
            <span>{project.description}</span>
          </p>
        ) : (
          <textarea
            className='textarea editable'
            name='description'
            placeholder='A more detailed description…'
            rows='10'
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        )}
      </div>
      {!mode && (
        <div className='timeline'>
          <div className='h4'>
            Contributions ({project.collection.receipts.length})
            <span>{100 * percentage / totalPieces}% raised</span>
          </div>
          <ul className='ul'>
            <li
              className='li'
              ref={refs.current[100]}
              data-index={100}
              style={{ opacity: chosen === 100 ? 1 : 0.5 }}
              onMouseOver={() => setIntersecting([100])}
              onMouseOut={() => setIntersecting([])}
            >
              <div className='label'>
                <h5>
                  <Link to={`/${chainId}/user/${project.creator.id.toLowerCase()}`} className='a plain'>
                    {+address === +project.creator.id ? 'You' : `${project.creator.id.slice(0, 6)}…${project.creator.id.slice(-2)}`}
                  </Link>
                </h5>
                <span className='small'>
                  {new Date(project.createdAt * 1000).toLocaleDateString()}
                </span>
              </div>
              <div className='label'>
                <span>created the campaign</span>
                <span className='small'></span>
              </div>
            </li>
            {project.collection.receipts.map((r, i) => (
              <li
                ref={refs.current[i]}
                data-index={i}
                className='li donation'
                style={{ opacity: chosen === i ? 1 : 0.5 }}
                key={`${i}_${r.id}`}
                onMouseOver={() => setIntersecting([i])}
                onMouseOut={() => setIntersecting([])}
              >
                <div className='label'>
                  <h5>
                    <Link
                      to={`/${chainId}/user/${r.donator.id.toLowerCase()}`}
                      className='a plain'
                    >
                      {+address === +r.donator.id ? 'You' : `${r.donator.id.slice(0, 6)}…${r.donator.id.slice(-2)}`}
                    </Link>
                  </h5>
                  <span className='small'>
                    {new Date(r.timestamp * 1000).toLocaleDateString(undefined, { day: 'numeric', month: 'numeric' })}
                  </span>
                </div>
                <div className='label'>
                  <span>
                    {' '}contributed <b>{r.amount} cUSD</b>
                  </span>
                  <span className='small'>
                    &mdash;{' '}{r.donator.reports ? '(…)' : r.message}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      {!project || +address === +project.creator.id ? (
        <div className='admin'>
          {!mode ? (
            <>
              <button
                disabled={!+toClaim}
                className='button claim primary'
                onClick={async () => {
                  try {
                    notificationVar('Please confirm on your wallet…')
                    await contract.methods.claimProjectFunds(
                      project.id
                    ).send({ from: address, chainId: '0x' + Number(chainId).toString(16) })
                    notificationVar('Funds successfully claimed!')
                    const fetchClaimProjectFunds = async () => {
                      const cached = client.readQuery({ query: PROJECT_INFO, variables: { projectId } })
                      const cachedClaimedAmount = cached.project.claimedAmount
                      const { data } = await refetch()
                      if (cachedClaimedAmount === data.project.claimedAmount) {
                        await new Promise(resolve => setTimeout(resolve, 2000))
                        await fetchClaimProjectFunds()
                      }
                    }
                    await fetchClaimProjectFunds()
                    fetchBalance(cUSD)
                  } catch (error) {
                    console.error(error)
                    notificationVar(error.message)
                  }
                }}
              >
                Claim {toClaim} cUSD
              </button>
              <button className='button' onClick={() => setMode('EDIT')}>
                Edit
              </button>
            </>
          ) : (
            <>
              {mode === 'EDIT' && (
                <button onClick={() => setMode('')} className='button'>
                  Cancel
                </button>
              )}
              <button
                disabled={(!project && !img.dataUrl) || !title.trim() || !description.trim() || amount < 10}
                className='button primary'
                onClick={async () => {
                  try {
                    let url = project?.image
                    if (img.dataUrl) {
                      const croppedImage = await getCroppedImg(img.dataUrl, croppedAreaPixels, 0)
                      const { path } = await ipfs.add(await fetch(croppedImage).then(r => r.blob()))
                      url = `https://ipfs.infura.io/ipfs/${path}`
                    }
                    notificationVar('Please confirm on your wallet…')
                    if (mode === 'CREATE') {
                      client.query({ query: ALL_PROJECTS })
                      await contract.methods.createProject(
                        escapeHtml(title.trim()),
                        description.trim(),
                        ethers.utils.parseUnits(amount, 18),
                        url,
                      ).send({ from: address, chainId: '0x' + Number(chainId).toString(16) })
                      notificationVar('Campaign successfully created!')
                      const fetchCreateProject = async () => {
                        const { data: cached } = await client.query({ query: ALL_PROJECTS })
                        const cachedMyProjects = cached.projects.filter(p => +p.creator.id === +address).length
                        const { data } = await client.query({ query: ALL_PROJECTS, fetchPolicy: 'network-only' })
                        if (cachedMyProjects === data.projects.filter(p => +p.creator.id === +address).length) {
                          await new Promise(resolve => setTimeout(resolve, 2000))
                          await fetchCreateProject()
                        }
                      }
                      await fetchCreateProject()
                      navigate(`/${chainId}`)
                    } else {
                      await contract.methods.editProject(
                        project.id,
                        escapeHtml(title.trim()),
                        description.trim(),
                        url,
                      ).send({ from: address, chainId: '0x' + Number(chainId).toString(16) })
                      notificationVar('Project successfully updated!')
                      const fetchEditProject = async () => {
                        const cached = client.readQuery({ query: PROJECT_INFO, variables: { projectId } })
                        const cachedUpdatedAt = cached.project.updatedAt
                        const { data } = await refetch()
                        if (cachedUpdatedAt === data.project.updatedAt) {
                          await new Promise(resolve => setTimeout(resolve, 2000))
                          await fetchEditProject()
                        }
                      }
                      await fetchEditProject()
                      setMode('')
                    }
                  } catch (error) {
                    console.error(error)
                    notificationVar(error.message)
                  }
                }}
              >
                {mode === 'CREATE' ? 'Create campaign' : 'Save'}
              </button>
            </>
          )}
        </div>
      ) : (
        <div className='contribute'>
          <div className='h4'>
            How can I help?
            <span>
              {totalPieces - percentage}{' '}
              <Puzzle height={16} fill='rgba(97, 31, 105, 0.7)' strokeWidth={0} />
              left
            </span>
          </div>
          <main>
            <div className='interact'>
              <b>Give to this campaign</b>
              <Select
                contribution={contribution}
                setContribution={setContribution}
                percentage={percentage}
                requested={requested}
                totalPieces={totalPieces}
              />
              <div className='cta'>
                <button
                  className='button primary donate'
                  disabled={
                    isNaN(contribution) ||
                    contribution <= 0 ||
                    contribution > totalPieces - percentage
                  }
                  onClick={() => setModal('DONATE')}
                >
                  Donate now
                </button>
              </div>
            </div>
          </main>
        </div>
      )}
      {!mode && (
        <div className='contribute'>
          <h5 className='h5'>Share this campaign</h5>
          <div className='share'>
            <button
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/${chainId}/${project.id}`)
                notificationVar('Link copied!')
              }}
              className='button secondary'
            >Copy link</button>
            {+address !== +project.creator.id && (
              <Report userAddress={project?.creator.id} />
            )}
          </div>
        </div>
      )}
      {modal === 'DONATE' && (
        <aside className='overlay'>
          <aside className='Modal'>
            <div className='Modal__top'>
              <h3 className='h5'>Are you sure?</h3>
              <span>
                Current balance: <b>{address ? balance : '…'} cUSD</b>
              </span>
            </div>
            <div className='interact'>
              <Select
                contribution={contribution}
                setContribution={setContribution}
                percentage={percentage}
                requested={requested}
                totalPieces={totalPieces}
              />
            </div>
            <textarea
              className='textarea'
              rows='3'
              placeholder='Leave a message (optional)'
              value={message}
              onChange={e => setMessage(e.target.value)}
            />
            {address && (
              <div className='Modal__warning'>
                {balance < contribution * requested / totalPieces
                  ? <span>Uh-oh, your balance is not high enough :/</span>
                  : (isNaN(contribution) || contribution <= 0)
                    ? <span>Looks like it's not a valid amount :/</span>
                    : contribution > totalPieces - percentage
                      ? <span>Sorry, there is only {totalPieces - percentage} pieces left :/</span>
                      : null}
              </div>
            )}
            <div className='Modal__bottom'>
              <button className='button' onClick={() => setModal('')}>
                Back
              </button>
              {address ? (
                <button
                  className='button grow primary'
                  disabled={
                    balance < contribution * requested / totalPieces ||
                    isNaN(contribution) ||
                    contribution <= 0 ||
                    contribution > totalPieces - percentage
                  }
                  onClick={async () => {
                    try {
                      notificationVar('Please approve on your wallet… (1/2)')
                      const donation = BigNumber.from(project.requestedAmount).mul(contribution).div(totalPieces)
                      await cUSD.methods.approve(
                        getContract(chainId),
                        donation.toString(),
                      ).send({ from: address, chainId: '0x' + Number(chainId).toString(16) })
                      notificationVar('Please confirm on your wallet… (2/2)')
                      await contract.methods.donateToProject(
                        project.id,
                        donation.toString(),
                        escapeHtml(message),
                      ).send({ from: address, chainId: '0x' + Number(chainId).toString(16) })
                      notificationVar('Donation successfully sent!')
                      const fetchDonateToProject = async () => {
                        const cached = client.readQuery({ query: PROJECT_INFO, variables: { projectId } })
                        const cachedMyDonations = cached.project.collection.receipts.filter(r => +r.donator.id === +address).length
                        const { data } = await refetch()
                        if (cachedMyDonations === data.project.collection.receipts.filter(r => +r.donator.id === +address).length) {
                          await new Promise(resolve => setTimeout(resolve, 2000))
                          await fetchDonateToProject()
                        }
                      }
                      await fetchDonateToProject()
                      setModal('')
                      fetchBalance(cUSD)
                    } catch (error) {
                      console.error(error)
                      notificationVar(error.message)
                    }
                  }}
                >
                  {balance < contribution * requested / totalPieces ||
                    isNaN(contribution) ||
                    contribution <= 0 ||
                    contribution > totalPieces - percentage
                  ? 'Give'
                  : `Give ${(contribution * requested / totalPieces).toFixed(2)} cUSD`}
                </button>
              ) : (
                <button className='button grow primary' onClick={connect}>
                  Connect wallet
                </button>
              )}
            </div>
          </aside>
        </aside>
      )}
    </div>
  )
}

export default ProjectInfo
