import * as React from 'react'
import { server } from '../shared/contracts'
import * as SorobanClient from 'soroban-client'
let xdr = SorobanClient.xdr

/**
 * Concatenated `${contractId}:${topic}`
 */
type PagingKey = string

/**
 * Paging tokens for each contract/topic pair. These can be mutated directly,
 * rather than being stored as state within the React hook.
 */
const paging: Record<PagingKey, { lastLedgerStart?: number, pagingToken?: string }> = {}

/**
 * Subscribe to events for a given topic from a given contract, using a library
 * generated with `soroban contract bindings typescript`.
 *
 * Someday such generated libraries will include functions for subscribing to
 * the events the contract emits, but for now you can copy this hook into your
 * React project if you need to subscribe to events, or adapt this logic for
 * non-React use.
 */
export function useSubscription(
  contractId: string,
  topic: string,
  onEvent: (event: SorobanClient.SorobanRpc.EventResponse) => void,
  pollInterval = 5000
) {
  const id = `${contractId}:${topic}`
  paging[id] = paging[id] || {}

  React.useEffect(() => {
    let timeoutId: NodeJS.Timer | null = null
    let stop = false

    async function pollEvents(): Promise<void> {
      try {
        if (!paging[id].lastLedgerStart) {
          let latestLedgerState = await server.getLatestLedger();
          paging[id].lastLedgerStart = latestLedgerState.sequence
        } 
       
        let response = await server.getEvents({
          startLedger: !paging[id].pagingToken
            ? paging[id].lastLedgerStart
            : undefined,
          cursor: paging[id].pagingToken,
          filters: [
            {
              contractIds: [contractId],
              topics: [[
                xdr.ScVal.scvSymbol(topic).toXDR("base64")
              ]],
              type: "contract"
            }  
          ],
          limit: 10
        });
     
        paging[id].pagingToken = undefined;
        if (response.latestLedger) {
          paging[id].lastLedgerStart = parseInt(response.latestLedger);
        }
        response.events && response.events.forEach(event => {
          try {
            onEvent(event)
          } catch (error) {
            console.error("Poll Events: subscription callback had error: ", error);
          } finally {
            paging[id].pagingToken = event.pagingToken
          }
        }) 
      } catch (error) {
        console.error("Poll Events: error: ", error);
      } finally {
        if (!stop) {
          timeoutId = setTimeout(pollEvents, pollInterval);
        }
      }
    }

    pollEvents();

    return () => {
      if (timeoutId != null) clearTimeout(timeoutId)
      stop = true
    }
  }, [contractId, topic, onEvent, id, pollInterval])
}
