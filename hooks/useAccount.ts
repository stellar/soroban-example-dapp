import { useEffect, useState } from "react";
import { isConnected, getUserInfo } from "@stellar/freighter-api";

let address: string;

let addressLookup = (async () => {
  if (await isConnected()) return getUserInfo()
})();

// returning the same object identity every time avoids unnecessary re-renders
const addressObject = {
  address: '',
  displayName: '',
};

const addressToHistoricObject = (address: string) => {
  addressObject.address = address;
  addressObject.displayName = `${address.slice(0, 4)}...${address.slice(-4)}`;
  return addressObject
};

/**
 * Returns an object containing `address` and `displayName` properties, with
 * the address fetched from Freighter's `getPublicKey` method in a
 * render-friendly way.
 *
 * Before the address is fetched, returns null.
 *
 * Caches the result so that the Freighter lookup only happens once, no matter
 * how many times this hook is called.
 *
 * NOTE: This does not update the return value if the user changes their
 * Freighter settings; they will need to refresh the page.
 */
export function useAccount(): typeof addressObject | null {
  const [, setLoading] = useState(address === undefined);

  useEffect(() => {
    if (address !== undefined) return;

    addressLookup
      .then(user => { if (user) address = user.publicKey })
      .finally(() => { setLoading(false) });
  }, []);

  if (address) return addressToHistoricObject(address);

  return null;
};
