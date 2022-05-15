import React, { useContext, useState } from 'react'
import { Link, useParams, useNavigate } from "react-router-dom"
import { ethers } from 'ethers'
import DitherJS from 'ditherjs'
import { Context, getContract, getAbi, client, useBalance } from '../utils'

function NewProject() {
  const { chainId } = useParams()
  const navigate = useNavigate()
  const { updateStore } = useContext(Context)
  const [img, setImg] = useState('')
  const getBalance = useBalance(chainId)

  function onFileSelected(event) {
    var selectedFile = event.target.files[0]
    var reader = new FileReader()
    if (!selectedFile) return

    const img = document.createElement('img')
    img.width = 640
    img.title = selectedFile.name
    document.body.appendChild(img)

    const ditherjs = new DitherJS({
      "step": 1,
      "palette": [[0, 0, 0], [255, 255, 255]],
      "algorithm": "atkinson" // one of ["ordered", "diffusion", "atkinson"]
    })
    reader.onload = function (event) {
      img.onload = async () => {
        ditherjs.dither(img)
        const canvas = document.querySelector('canvas:last-child')
        const ctx = canvas.getContext('2d')
        const imgData = ctx.getImageData(0, 0 * canvas.width / 16 / 2, canvas.width, 9 * canvas.width / 16)
        
        for (var i = 0; i < imgData.data.length; i += 4) {
          if (imgData.data[i + 0]) {
            imgData.data[i + 3] = 0;
          } else {
            imgData.data[i + 0] = 97;
            imgData.data[i + 1] = 31;
            imgData.data[i + 2] = 105;
          }
        }
        const canvas1 = document.createElement('canvas')
        const ctx1 = canvas1.getContext('2d')
        canvas1.width = canvas.width
        canvas1.height = 9 * canvas.width / 16
        ctx1.putImageData(imgData, 0, 0)
        setImg({
          dataUrl: canvas1.toDataURL(),
          blob: await new Promise(resolve => canvas1.toBlob(resolve)),
        })
      }
      img.src = event.target.result
    }
    reader.readAsDataURL(selectedFile)
  }

  return (
    <form className='NewProject' onSubmit={async e => {
      try {
        e.preventDefault()
        const { elements } = e.target
        await getBalance(true, 'Please wait…')

        const provider = new ethers.providers.Web3Provider(window.ethereum)
        const signer = provider.getSigner()
        const contract = new ethers.Contract(getContract(chainId), getAbi(), signer)
        const { path } = await client.add(img.blob)
        const url = `https://ipfs.infura.io/ipfs/${path}`

        const tx = await contract.createProject(
          elements['title'].value,
          elements['description'].value,
          ethers.utils.parseUnits(elements['requestedAmount'].value, 18),
          url,
        )
        await tx.wait()
        updateStore({ message: 'Campaign successfully created!' })
        navigate(`/${chainId}`)

      } catch (error) {
        console.error(error)
        updateStore({ message: error.data?.message || error.message })
      }
    }}>
      <div id="container">
        {img && <img className='img' src={img.dataUrl} alt="" />}
      </div>
      <textarea name='title' placeholder='Your project title' rows='2'></textarea>
      <textarea name='description' placeholder='A more detailed description…' rows='6'></textarea>
      <div className='more'>
        <input type='file' name='image' onChange={onFileSelected} accept='image/*' />
        <input name='requestedAmount' type='number' step='1' min='10' placeholder='Amount' />
      </div>
      <div className='action'>
        <Link to={`/${chainId}`}>Back</Link>
        <button type='submit'>Create campaign</button>
      </div>
    </form>
  )
}

export default NewProject

