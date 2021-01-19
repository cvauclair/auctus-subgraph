import { ACOPool, ACOToken, PoolDeposit, PoolWithdraw, Trade } from '../types/schema'
import {
  Deposit,
  Withdraw,
  Swap
} from '../types/templates/ACOPool/ACOPool'
import { log } from '@graphprotocol/graph-ts'
import { BigIntOne, getCreateAsset } from '../utils'
import { addTrade as acoTokenAddTrade } from './ACOToken'

export function addDeposit(acoPool: ACOPool, deposit: PoolDeposit): void {
  acoPool.numDeposits = acoPool.numDeposits + BigIntOne
  let deposits = acoPool.deposits
  deposits.push(deposit.id)
  acoPool.deposits = deposits
  acoPool.latestDeposit = deposit.id
  acoPool.save()
}

export function addWithdraw(acoPool: ACOPool, withdraw: PoolWithdraw): void {
  acoPool.numWithdraws = acoPool.numWithdraws + BigIntOne
  let withdraws = acoPool.withdraws
  withdraws.push(withdraw.id)
  acoPool.withdraws = withdraws
  acoPool.latestDeposit = withdraw.id
  acoPool.save()
}

export function addTrade(acoPool: ACOPool, trade: Trade): void {
  acoPool.numTrades = acoPool.numTrades + BigIntOne
  let trades = acoPool.trades
  trades.push(trade.id)
  acoPool.trades = trades
  acoPool.latestTrade = trade.id
  acoPool.save()
}

export function handleDeposit(event: Deposit): void {
  let poolAddr = event.address.toHexString().toString()
  
  let pool = ACOPool.load(poolAddr)
  
  if (pool != null) {
    let deposit = new PoolDeposit(poolAddr + "-" + pool.numDeposits.toString())
    deposit.blockNumber = event.block.number
    deposit.timestamp = event.block.timestamp
    deposit.account = event.params.account.toHexString().toString()
    deposit.shares = event.params.shares
    deposit.collateralAmount = event.params.collateralAmount
    deposit.save()

    addDeposit(pool as ACOPool, deposit)
  }
}

export function handleWithdraw(event: Withdraw): void {
  let poolAddr = event.address.toHexString().toString()
  
  let pool = ACOPool.load(poolAddr)
  
  if (pool != null) {
    let withdraw = new PoolWithdraw(poolAddr + "-" + pool.numWithdraws.toString())
    withdraw.blockNumber = event.block.number
    withdraw.timestamp = event.block.timestamp
    withdraw.account = event.params.account.toHexString().toString()
    withdraw.shares = event.params.shares
    withdraw.underlyingAmount = event.params.underlyingWithdrawn
    withdraw.strikeAssetAmount = event.params.strikeAssetWithdrawn
    withdraw.save()

    // Update pool withdraws
    addWithdraw(pool as ACOPool, withdraw)
  }
}

export function handleSwap(event: Swap): void {
  let poolAddr = event.address.toHexString().toString()
  let acoTokenAddr = event.params.acoToken.toHexString().toString()
  
  let pool = ACOPool.load(poolAddr)
  let acoToken = ACOToken.load(acoTokenAddr)
  
  let strikeAsset = getCreateAsset(pool.strikeAsset)

  if (pool != null && acoToken != null) {
    let trade = new Trade(acoToken.id + "-" + acoToken.numTrades.toString())
    trade.blockNumber = event.block.number
    trade.timestamp = event.block.timestamp
    trade.amount = event.params.tokenAmount
    trade.premium = event.params.price
    trade.baseAsset = strikeAsset.id
    trade.save()
    
    // Update pool
    addTrade(pool as ACOPool, trade)

    // Update ACOToken
    acoTokenAddTrade(acoToken as ACOToken, trade)
  }
}