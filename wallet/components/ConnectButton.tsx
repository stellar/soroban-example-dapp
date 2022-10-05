import React from 'react';
import { AppContext } from '../AppContext';
import { useAccount } from '../hooks/useAccount';
import { useNetwork } from '../hooks/useNetwork';
import { useIsMounted } from '../hooks/useIsMounted';
import { DropdownSvg } from '../../assets/icons';
import Image from 'next/image'

const blue = {
  blue9: '#0091ff',
}
const gray = {
  gray1: '#fcfcfc',
  gray3: '#f3f3f3',
  gray12: '#171717',
};
const red = {
  red1: '#fffcfc',
  red3: '#ffefef',
  red11: '#cd2b31',
};

type AccountStatus = 'full' | 'avatar' | 'address';
type ChainStatus = 'full' | 'icon' | 'name' | 'none';

export interface ConnectButtonProps {
  accountStatus?: AccountStatus;
  chainStatus?: ChainStatus;
  label?: string;
}

const defaultProps: ConnectButtonProps = {
  accountStatus: 'full',
  chainStatus: 'full',
  label: 'Connect Wallet',
} as const;

// TODO: Eliminate flash of unconnected content on loading
export function ConnectButton({
  accountStatus = defaultProps.accountStatus,
  chainStatus = defaultProps.chainStatus,
  label = defaultProps.label,
}: ConnectButtonProps) {
  const {connect} = React.useContext(AppContext);
  const openConnectModal = async () => {
    await connect();
  };

  const mounted = useIsMounted();

  const { data: account } = useAccount();

  const {
    activeChain: chain,
    chains,
    // error: networkError,
    // switchNetwork,
  } = useNetwork();

  const unsupportedChain = chain?.unsupported;

  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        ...(!mounted
          ? {
              'aria-hidden': true,
              opacity: 0,
              pointerEvents: 'none',
              userSelect: 'none',
            }
          : {}),
      }}
    >
      {mounted && account ? (
        <>
          {chain && (chains.length > 1 || unsupportedChain) && (
            <button
              type="button"
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                borderRadius: '0.5rem',
                borderWidth: 0,
                cursor: 'pointer',
              }}
              key={unsupportedChain ? 'unsupported' : 'supported'} // Force re-mount to prevent CSS transition
            >
              <div
                style={{
                  alignItems: 'center',
                  background: unsupportedChain ? red.red3 : '#ffffff',
                  borderRadius: '4px',
                  boxShadow: 'connectButton',
                  color: unsupportedChain ? red.red11 : gray.gray12,
                  display: chainStatus == 'none' ? 'none' : 'flex',
                  fontFamily: 'sans-serif',
                  fontWeight: 'bold',
                  gap: 6,
                  paddingLeft: 10,
                  paddingRight: 10,
                  paddingTop: 8,
                  paddingBottom: 8,
                  transform: 'shrink',
                  transition: 'default',
                }}
              >
                {unsupportedChain ? (
                  <div
                    style={{
                      alignItems: 'center',
                      display: 'flex',
                      height: '24',
                      paddingLeft: '4',
                      paddingRight: '4',
                    }}
                  >
                    Wrong network
                  </div>
                ) : (
                  <div
                    style={{ alignItems: 'center', display: 'flex', gap: '6' }}
                  >
                    {chain.iconUrl ? (
                      <div
                        style={{
                          display:
                            chainStatus === 'full' || chainStatus === 'icon'
                              ? 'block'
                              : 'none',
                          height: '24',
                          width: '24',
                        }}
                      >
                        <Image
                          alt={chain.name ?? 'Chain icon'}
                          style={{
                            background: chain.iconBackground,
                            borderRadius: '100%',
                          }}
                          height="24"
                          src={DropdownSvg}
                          width="24"
                        />
                      </div>
                    ) : null}
                    <div
                      style={{
                        display:
                          (chainStatus == 'icon' && !chain.iconUrl) ||
                          chainStatus == 'full' ||
                          chainStatus == 'name'
                            ? 'block'
                            : 'none',
                      }}
                    >
                      {chain.name ?? chain.id}
                    </div>
                  </div>
                )}
              </div>
            </button>
          )}

          {!unsupportedChain && (
            <button
              type="button"
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                borderRadius: '0.5rem',
                borderWidth: 0,
                cursor: 'pointer',
              }}
            >
              <div
                style={{
                  alignItems: 'center',
                  background: '#ffffff',
                  borderRadius: '4px',
                  color: gray.gray12,
                  display: 'flex',
                  fontFamily: 'sans-serif',
                  fontWeight: 'bold',
                  transform: 'shrink',
                  transition: 'default',
                }}
              >
                <div
                  style={{
                    borderColor: 'transparent',
                    borderRadius: '0.5rem',
                    borderStyle: 'solid',
                    borderWidth: 0,
                    paddingLeft: 8,
                    paddingRight: 8,
                    paddingTop: 6,
                    paddingBottom: 6,
                  }}
                >
                  <div
                    style={{
                      alignItems: 'center',
                      display: 'flex',
                      gap: 6,
                      height: 24,
                    }}
                  >
                    <div
                      style={{
                        alignItems: 'center',
                        display: 'flex',
                        gap: '6',
                      }}
                    >
                      <div
                        style={{
                          display:
                            accountStatus === 'full' ||
                            accountStatus === 'address'
                              ? 'block'
                              : 'none',
                        }}
                      >
                        {account.displayName}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </button>
          )}
        </>
      ) : (
        <button
          type="button"
          style={{
            background: blue.blue9,
            color: gray.gray1,
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            borderRadius: '0.5rem',
            borderWidth: 0,
            cursor: 'pointer',
          }}
          key="connect"
          onClick={openConnectModal}
        >
          <div
            style={{
              fontFamily: 'sans-serif',
              fontWeight: 'bold',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              paddingLeft: 8,
              paddingRight: 8,
              paddingTop: 6,
              paddingBottom: 6,
            }}
          >
            <div
              style={{
                // accent color
                height: 24,
                paddingLeft: 8,
                paddingRight: 8,
                paddingTop: 6,
                paddingBottom: 6,
              }}
            >
              {label}
            </div>
          </div>
        </button>
      )}
    </div>
  )
}
