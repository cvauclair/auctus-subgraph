import { ACOToken, Trade } from "../types/schema";
import { BigIntOne } from "../utils";

export function addTrade(acoToken: ACOToken, trade: Trade): void {
  acoToken.numTrades = acoToken.numTrades + BigIntOne
  let trades = acoToken.trades
  trades.push(trade.id)
  acoToken.trades = trades
  acoToken.latestTrade = trade.id
  acoToken.save()
}