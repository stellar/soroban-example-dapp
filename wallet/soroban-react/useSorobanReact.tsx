import { useContext } from 'react';
import { SorobanContext } from "./SorobanContext";
import { SorobanContextType } from "./SorobanContext";

//export function useSorobanReact<T extends BaseProvider = Web3Provider>(): Web3ContextType<T> {
export function useSorobanReact() {
    const context = useContext<SorobanContextType>(SorobanContext)
    if (!context) throw Error('useWeb3React can only be used within the Web3ReactProvider component')
    return context
  }