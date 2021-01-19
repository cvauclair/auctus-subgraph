import { NewAcoToken, NewAcoTokenData } from '../types/ACOFactory/ACOFactory'
import { ACOToken, ACOFactory, Asset } from '../types/schema'
import { ACOToken as ACOTokenContract } from '../types/ACOFactory/ACOToken'
import { BigIntOne, BigIntZero, getCreateAsset, getCreateEth, ZERO_ADDRESS } from '../utils'
import { Address } from '@graphprotocol/graph-ts'

export const ACO_FACTORY_ADDRESS = "0x176b98ab38d1ae8ff3f30bf07f9b93e26f559c17"

export function getCreateACOFactory(): ACOFactory {
  let acoFactory = ACOFactory.load(ACO_FACTORY_ADDRESS)
  if (acoFactory == null) {
    acoFactory = new ACOFactory(ACO_FACTORY_ADDRESS)
    acoFactory.numOptions = BigIntZero
    acoFactory.options = []
    acoFactory.numAssets = BigIntZero
    acoFactory.assets = []
    acoFactory.totalTradeVolume = BigIntZero
    acoFactory.save()
  }

  return acoFactory as ACOFactory
}

export function handleNewAcoToken(event: NewAcoToken): void {
  let acoTokenAddr = event.params.acoToken.toHexString().toString()
  let contract = ACOTokenContract.bind(Address.fromString(acoTokenAddr))

  // Create default acoToken
  let acoToken = new ACOToken(acoTokenAddr)
  acoToken.decimals = contract.decimals()

  acoToken.creationBlock = event.block.number
  acoToken.creationTimestamp = event.block.timestamp
  
  acoToken.strike = event.params.strikePrice
  acoToken.expiration = event.params.expiryTime

  acoToken.type = event.params.isCall ? "CALL" : "PUT"
  
  // Get underlying asset
  let underlyingAddr = event.params.underlying.toHexString().toString()

  if (underlyingAddr == ZERO_ADDRESS) {
    let underlying = getCreateEth()
    acoToken.underlying = underlying.id
  } else {
    let underlying = getCreateAsset(underlyingAddr)
    acoToken.underlying = underlying.id
  }

  // Get strike asset
  let strikeAssetAddr = event.params.strikeAsset.toHexString().toString()
  let strikeAsset = getCreateAsset(strikeAssetAddr)
  acoToken.strikeAsset = strikeAsset.id
  
  acoToken.trades = []
  acoToken.numTrades = BigIntZero

  // Save acoToken
  acoToken.save()

  // Update ACOFactory
  let acoFactory = getCreateACOFactory()

  let options = acoFactory.options
  options.push(acoToken.id)
  acoFactory.options = options
  acoFactory.numOptions = acoFactory.numOptions + BigIntOne
  acoFactory.save()
}

// Essentially same as above, but technically a different event that is emitted by ACOFactoryV3 (above is event emitted by ACOFactoryV2)
export function handleNewAcoTokenData(event: NewAcoTokenData): void {
  let acoTokenAddr = event.params.acoToken.toHexString().toString()
  let contract = ACOTokenContract.bind(Address.fromString(acoTokenAddr))

  // Create default acoToken
  let acoToken = new ACOToken(acoTokenAddr)
  acoToken.decimals = contract.decimals()

  acoToken.creationBlock = event.block.number
  acoToken.creationTimestamp = event.block.timestamp
  
  acoToken.strike = event.params.strikePrice
  acoToken.expiration = event.params.expiryTime

  if (event.params.isCall) {
    acoToken.type = "CALL"
  } else {
    acoToken.type = "PUT"
  }
  
  // Get underlying asset
  let underlyingAddr = event.params.underlying.toHexString().toString()

  if (underlyingAddr == ZERO_ADDRESS) {
    let underlying = getCreateEth()
    acoToken.underlying = underlying.id
  } else {
    let underlying = getCreateAsset(underlyingAddr)
    acoToken.underlying = underlying.id
  }

  // Get strike asset
  let strikeAssetAddr = event.params.strikeAsset.toHexString().toString()
  let strikeAsset = getCreateAsset(strikeAssetAddr)
  acoToken.strikeAsset = strikeAsset.id
  
  acoToken.trades = []
  acoToken.numTrades = BigIntZero

  // Save acoToken
  acoToken.save()

  // Update ACOFactory
  let acoFactory = getCreateACOFactory()

  let options = acoFactory.options
  options.push(acoToken.id)
  acoFactory.options = options
  acoFactory.numOptions = acoFactory.numOptions + BigIntOne
  acoFactory.save()
}