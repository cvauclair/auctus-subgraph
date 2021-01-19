import { NewAcoPool } from '../types/ACOPoolFactory/ACOPoolFactory'
import { ACOPool } from '../types/schema'
import { BigIntZero, getCreateAsset, getCreateEth, ZERO_ADDRESS } from '../utils'
import { ACOPool as ACOPoolTemplate } from '../types/templates'
import { log } from '@graphprotocol/graph-ts'

export function handleNewAcoPool(event: NewAcoPool): void {
  log.debug("New ACOPool detected: poolAddr = {}, poolImplAddr = {}", [
    event.params.acoPool.toHexString().toString(),
    event.params.acoPoolImplementation.toHexString().toString()
  ])
  let poolAddr = event.params.acoPool.toHexString().toString()
  let underlyingAddr = event.params.underlying.toHexString().toString()
  let strikeAssetAddr = event.params.strikeAsset.toHexString().toString()

  let pool = new ACOPool(poolAddr)
  pool.underlying = (underlyingAddr == ZERO_ADDRESS ? getCreateEth().id : getCreateAsset(underlyingAddr).id)
  pool.strikeAsset = (strikeAssetAddr == ZERO_ADDRESS ? getCreateEth().id : getCreateAsset(strikeAssetAddr).id)
  pool.type = event.params.isCall ? "CALL" : "PUT"

  pool.numDeposits = BigIntZero
  pool.deposits = []

  pool.numWithdraws = BigIntZero
  pool.withdraws = []

  pool.numTrades = BigIntZero
  pool.trades = []

  pool.save()

  ACOPoolTemplate.create(event.params.acoPool)
}