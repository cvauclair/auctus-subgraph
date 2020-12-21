import { Fill } from '../types/Exchange/Exchange'
import { ACOToken, Trade } from '../types/schema'
import { Address, Bytes, log } from '@graphprotocol/graph-ts'
import { BigIntOne, getCreateAsset } from '../utils'
import { ACOFactory } from '../types/ACOFactory/ACOFactory'
import { getCreateACOFactory } from './ACOFactory'

function isACOToken(address: string): boolean {
  let acoToken = ACOToken.load(address)
  return acoToken != null
}

const USDC_ADDRESS = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"

function extractAddress(assetData: Bytes): string {
  if (assetData.length > 20) {
    let addrBytes =  assetData.subarray(assetData.length - 20) as Bytes
    return addrBytes.toHexString()  
  } else {
    return "PLACEHOLDER"
  }
}

export function handleFill(event: Fill): void {
  // Filter Fill events related to ACOTokens
  let makerAssetAddr = extractAddress(event.params.makerAssetData)
  let takerAssetAddr = extractAddress(event.params.takerAssetData)

  // log.debug("Trade detected: maker asset = {}, taker asset = {}", [
  //   makerAssetAddr, 
  //   takerAssetAddr
  // ])


  if (isACOToken(makerAssetAddr) && (takerAssetAddr == USDC_ADDRESS)) {
    // Maker asset is ACOToken    
    let acoToken = ACOToken.load(makerAssetAddr) as ACOToken
    
    // Create new trade
    let trade = new Trade(acoToken.id + "-" + acoToken.numTrades.toString())
    trade.blockNumber = event.block.number
    trade.timestamp = event.block.timestamp
    trade.amount = event.params.makerAssetFilledAmount
    trade.premium = event.params.takerAssetFilledAmount
    trade.baseAsset = getCreateAsset(takerAssetAddr).id
    trade.save()

    // Update ACOToken with latest trade 
    acoToken.numTrades = acoToken.numTrades + BigIntOne
    let trades = acoToken.trades
    trades.push(trade.id)
    acoToken.trades = trades
    acoToken.latestTrade = trade.id
    acoToken.save()

    // Update ACOFactory
    let acoFactory = getCreateACOFactory()
    acoFactory.totalTradeVolume = acoFactory.totalTradeVolume + trade.premium
    acoFactory.save()

  } else if (isACOToken(takerAssetAddr) && (makerAssetAddr == USDC_ADDRESS)) {
    // Taker asset is ACOToken

    let acoToken = ACOToken.load(takerAssetAddr) as ACOToken
    
    // Create new trade
    let trade = new Trade(acoToken.id + "-" + acoToken.numTrades.toString())
    trade.blockNumber = event.block.number
    trade.timestamp = event.block.timestamp
    trade.amount = event.params.takerAssetFilledAmount
    trade.premium = event.params.makerAssetFilledAmount
    trade.baseAsset = getCreateAsset(makerAssetAddr).id
    trade.save()

    // Update ACOToken with latest trade 
    acoToken.numTrades = acoToken.numTrades + BigIntOne
    let trades = acoToken.trades
    trades.push(trade.id)
    acoToken.trades = trades
    acoToken.latestTrade = trade.id
    acoToken.save()

    // Update ACOFactory
    let acoFactory = getCreateACOFactory()
    acoFactory.totalTradeVolume = acoFactory.totalTradeVolume + trade.premium
    acoFactory.save()
    
  } else {
    return
  }
}