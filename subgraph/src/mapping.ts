import { BigInt, Bytes, json, log } from "@graphprotocol/graph-ts"
import { decode } from "as-base64"
import {
  Contract,
  ProjectCreated,
  FundsDonated,
  FundsClaimed,
  ProjectVisibilitySet,
} from "../generated/Contract/Contract"
import { Qavah } from "../generated/Contract/Qavah"
import { User, Project, Collection, Receipt } from "../generated/schema"

export function handleProjectCreated(event: ProjectCreated): void {
  let project = new Project(event.params.id)
  const _project = Contract.bind(event.address).getProject(event.params.id)
  let user = User.load(_project.creator)
  if (!user) {
    user = new User(_project.creator)
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
  project.hidden = _project.hidden
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
  receipt.timestamp = _receipt.mustGet('timestamp').toBigInt()
  receipt.project = project.id
  receipt.tokenId = _tokenId
  receipt.collection = _project.qavah
  let user = User.load(event.params.from)
  if (!user) {
    user = new User(event.params.from)
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

export function handleProjectVisibilitySet(event: ProjectVisibilitySet): void {
  let project = Project.load(event.params.id) as Project
  project.hidden = event.params.hidden
  project.save()
}
