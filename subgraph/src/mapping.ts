import { BigInt, Bytes, json, log } from "@graphprotocol/graph-ts"
import { decode } from "as-base64"
import {
  Contract,
  ProjectCreated,
  FundsDonated,
  FundsClaimed,
  ProjectEdited,
  UserReported,
} from "../generated/Contract/Contract"
import { Qavah } from "../generated/Contract/Qavah"
import { User, Project, Collection, Receipt } from "../generated/schema"

export function handleProjectCreated(event: ProjectCreated): void {
  let project = new Project(event.params.id)
  const _project = Contract.bind(event.address).getProject(event.params.id)
  let user = User.load(_project.creator)
  if (!user) {
    user = new User(_project.creator)
    user.reports = 0
    user.save()
  }
  project.creator = user.id
  project.title = _project.title
  project.requestedAmount = _project.requestedAmount
  project.description = _project.description
  project.image = _project.image
  project.fundedAmount = _project.fundedAmount
  project.claimedAmount = _project.claimedAmount
  project.donators = _project.donators.map<Bytes>(addr => Bytes.fromHexString(addr.toHex()))
  project.createdAt = _project.createdAt
  let collection = new Collection(_project.qavah)
  collection.save()
  project.collection = collection.id
  project.reports = user.reports
  project.save()
}

export function handleFundsDonated(event: FundsDonated): void {
  let project = Project.load(event.params.id) as Project
  const _project = Contract.bind(event.address).getProject(event.params.id)
  project.fundedAmount = _project.fundedAmount
  project.donators = _project.donators.map<Bytes>(addr => Bytes.fromHexString(addr.toHex()))
  project.save()
  const _tokenId = BigInt.fromI32(_project.donators.length - 1)
  let receipt = new Receipt(_project.qavah.concat(Bytes.fromByteArray(Bytes.fromBigInt(_tokenId))))
  const qavah = Qavah.bind(_project.qavah).tokenURI(_tokenId)
  const _receipt = json.fromBytes(Bytes.fromUint8Array(decode(qavah.split(',')[1]))).toObject()
  receipt.name = _receipt.mustGet('name').toString()
  receipt.description = _receipt.mustGet('description').toString()
  receipt.image = _receipt.mustGet('image').toString()
  receipt.amount = _receipt.mustGet('amount').toF64().toString()
  receipt.message = _receipt.mustGet('message').toString()
  receipt.percent = _receipt.mustGet('percent').toBigInt().toI32()
  receipt.timestamp = _receipt.mustGet('timestamp').toBigInt()
  receipt.project = project.id
  receipt.tokenId = _tokenId
  receipt.collection = _project.qavah
  let user = User.load(event.params.from)
  if (!user) {
    user = new User(event.params.from)
    user.reports = 0
    user.save()
  }
  receipt.donator = user.id
  receipt.save()
}

export function handleFundsClaimed(event: FundsClaimed): void {
  let project = Project.load(event.params.id) as Project
  const _project = Contract.bind(event.address).getProject(event.params.id)
  project.claimedAmount = _project.claimedAmount
  project.save()
}

export function handleProjectEdited(event: ProjectEdited): void {
  let project = Project.load(event.params.id) as Project
  const _project = Contract.bind(event.address).getProject(event.params.id)
  project.title = _project.title
  project.description = _project.description
  project.image = _project.image
  project.save()
}

export function handleUserReported(event: UserReported): void {
  log.info('User {} reported by {} for: {}', [event.params.userAddress.toHexString(), event.params.by.toHexString(), event.params.reason])
  let user = User.load(event.params.userAddress) as User
  user.reports++
  user.save()
  const _projects = Contract.bind(event.address).getProjectsByUser(event.params.userAddress)
  for (let i = 0; i < _projects.length; i++) {
    if (_projects[i].creator == user.id) {
      let project = Project.load(_projects[i].id) as Project
      project.reports++
      project.save()
    }
  }
}
