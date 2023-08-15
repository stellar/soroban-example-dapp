import { useEffect, useState, createContext, Dispatch, SetStateAction } from "react";
import { isConnected, getUserInfo } from "@stellar/freighter-api";

// Global context to get logged account and to set it.
export const AccountContext = createContext<AddressObject | null>(null);
export const AccountSetContext = createContext<Dispatch<SetStateAction<AddressObject | null>> | null>(null);

let address: string;

let addressLookup = (async () => {
  if (await isConnected()) return getUserInfo()
})();

export type AddressObject = {
  address: string,
  displayName: string
};

// returning the same object identity every time avoids unnecessary re-renders
const addressObject: AddressObject = {
  address: '',
  displayName: '',
};

export const addressToHistoricObject = (address: string) => {
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
export function useAccount(): AddressObject | null {
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
