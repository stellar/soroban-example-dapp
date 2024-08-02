import React, { createContext, useContext, useState } from 'react'

const AppContext = createContext({
  walletAddress: '',
  setWalletAddress: (value: any) => value,
})

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [walletAddress, setWalletAddress] = useState('')

  return (
    <AppContext.Provider value={{ walletAddress, setWalletAddress }}>
      {children}
    </AppContext.Provider>
  )
}

export const useAppContext = () => useContext(AppContext)
