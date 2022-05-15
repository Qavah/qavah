const { expect } = require("chai");

describe("Contract", function () {

  let cUSD, contract, qavah, addr1, addr2, p

  beforeEach(async function () {
    [ creator, addr1, addr2 ] = await ethers.getSigners()
    p = (amount) => ethers.utils.parseUnits(amount.toString(), 18)

    const CUSD = await ethers.getContractFactory('CUSD')
    cUSD = await CUSD.deploy(p(1000))
    await cUSD.deployed()

    const Contract = await ethers.getContractFactory("Contract")
    contract = await upgrades.deployProxy(Contract, [ cUSD.address, 'http://localhost:3000/1337/' ])
    await contract.deployed()
    console.log(contract.address)

    const qavahArtifact = await artifacts.readArtifact('Qavah')
    qavah = (address) => new ethers.Contract(address, qavahArtifact.abi, creator)
  })

  it("should be good", async function () {
    const tx = await contract.createProject(
      "Delivering school supplies to kids in Central Ghana",
      "We’re planning on provisioning several areas and villages with books, new clothes and shoes, for all children whose family cannot afford. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quas eos soluta repudiandae. Soluta nisi iste maxime rerum porro aperiam explicabo quod cum, ipsam labore praesentium laboriosam aut voluptatum, a quo!",
      p(400),
      "https://ipfs.infura.io/ipfs/QmP64siF2nZZJJJnC5Rcfraxw6zmcaAG1X1S9XfZkNcVqD",
    )
    await tx.wait()
    const projects = await contract.getProjects()
    // console.log(projects)

    // await addr1.sendTransaction({ to: '0xD5411f421e2ADA12E731B07E49813018F35DDbD7', value: ethers.utils.parseEther('1') })
    await cUSD.transfer(addr1.address, p(400))
    await cUSD.connect(addr1).approve(contract.address, p(400))
    await expect(contract.connect(addr1).donateToProject(projects[0].id, p(0.10))).to.be.reverted
    await contract.connect(addr1).donateToProject(projects[0].id, p(300.90))

    await cUSD.transfer(addr2.address, p(200))
    await cUSD.connect(addr2).approve(contract.address, p(200))
    await contract.connect(addr2).donateToProject(projects[0].id, p(100))
    await expect(contract.connect(addr2).donateToProject(projects[0].id, p(50))).to.be.reverted

    const project = await contract.getProject(projects[0].id)
    expect(project.fundedAmount).to.equal(p(400))

    const owner1 = await qavah(project.qavah).ownerOf(0)
    expect(owner1).to.equal(addr1.address)
    const tokenURI1 = await qavah(project.qavah).tokenURI(0)
    const token1 = JSON.parse(atob(tokenURI1.split(',')[1]))
    // console.log(token1)
    expect(token1.amount).to.equal(300)

    const owner2 = await qavah(project.qavah).ownerOf(1)
    expect(owner2).to.equal(addr2.address)
    const projectsByUser = await contract.getProjectsByUser(addr2.address)
    expect(projectsByUser.length).to.equal(1);
    const tokenURI2 = await qavah(projectsByUser[0].qavah).tokenURI(1)
    const token2 = JSON.parse(atob(tokenURI2.split(',')[1]))
    const image = token2.image // atob(token2.image.split(',')[1])
    // console.log(image)
    expect(image).to.contain(`:nth-of-type(n+${76}):nth-of-type(-n+${100})`)
  })

})
