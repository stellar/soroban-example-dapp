import React from 'react';
import { useAccount } from '../hooks/useAccount';
import { useNetwork } from '../hooks/useNetwork';
import { useIsMounted } from '../hooks/useIsMounted';
import { DropdownIcon } from "./Icons/Dropdown";

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
  const [modalOpen, setModalOpen] = React.useState<'connect' | 'chain' | 'account' | null>(null);
  const openConnectModal = () => {
    throw "Modals not implemented";
  };
  const openChainModal = () => {
    throw "Modals not implemented";
  };
  const openAccountModal = () => {
    throw "Modals not implemented";
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
        display: "flex",
        gap: 12,
        ...(!mounted ? {
          'aria-hidden': true,
          'style': {
            opacity: 0,
            pointerEvents: 'none',
            userSelect: 'none',
          },
        } : {})
      }}
    >
      {mounted && account ? (
        <>
          {chain && (chains.length > 1 || unsupportedChain) && (
            <button
              type="button"
              style={{
                display: "flex",
                borderRadius: "connectButton",
              }}
              key={unsupportedChain ? 'unsupported' : 'supported'} // Force re-mount to prevent CSS transition
              onClick={openChainModal}
            >
              <div
                style={{
                  alignItems: "center",
                  background: unsupportedChain
                    ? 'connectButtonBackgroundError'
                    : 'connectButtonBackground',
                  borderRadius: "connectButton",
                  boxShadow: "connectButton",
                  color: unsupportedChain
                    ? 'connectButtonTextError'
                    : 'connectButtonText',
                  display: chainStatus == 'none' ? 'none' : 'flex',
                  fontFamily: "body",
                  fontWeight: "bold",
                  gap: 6,
                  paddingLeft: 10,
                  paddingRight: 10,
                  paddingTop: 8,
                  paddingBottom: 8,
                  transform: 'shrink',
                  transition: "default",
                }}
              >
                {unsupportedChain ? (
                  <div
                    style={{
                      alignItems: "center",
                      display: "flex",
                      height: "24",
                      paddingLeft: "4",
                      paddingRight: "4",
                    }}
                  >
                    Wrong network
                  </div>
                ) : (
                  <div style={{alignItems: "center", display: "flex", gap: "6"}}>
                    {chain.hasIcon ? (
                      <div
                        style={{
                          display: chainStatus === 'full' || chainStatus === 'icon'
                            ? 'block'
                            : 'none',
                          height: "24",
                          width: "24",
                        }}
                      >
                        <img
                          alt={chain.name ?? 'Chain icon'}
                          style={{
                            background: chain.iconBackground,
                            borderRadius: "full",
                          }}
                          height="24"
                          src={chain.iconUrl}
                          width="24"
                        />
                      </div>
                    ) : null}
                    <div
                      style={{
                        display:
                          (chainStatus == 'icon' && !chain.iconUrl) || (chainStatus == 'full' || chainStatus == 'name')
                            ? 'block'
                            : 'none'
                      }}
                    >
                      {chain.name ?? chain.id}
                    </div>
                  </div>
                )}
                <DropdownIcon />
              </div>
            </button>
          )}

          {!unsupportedChain && (
            <button
              type="button"
              onClick={openAccountModal}
              style={{
                display: "flex",
                borderRadius: "connectButton",
              }}
            >
              <div
                style={{
                  alignItems: "center",
                  background: "connectButtonBackground",
                  borderRadius: "connectButton",
                  boxShadow: "connectButton",
                  color: "connectButtonText",
                  display: "flex",
                  fontFamily: "body",
                  fontWeight: "bold",
                  transform: 'shrink',
                  transition: "default",
                }}
              >
                <div
                  style={{
                    background: 'connectButtonBackground',
                    borderColor: "connectButtonBackground",
                    borderRadius: "connectButton",
                    borderStyle: "solid",
                    borderWidth: "2",
                    color: "connectButtonText",
                    fontFamily: "body",
                    fontWeight: "bold",
                    paddingLeft: "8",
                    paddingRight: "8",
                    paddingTop: "6",
                    paddingBottom: "6",
                    transition: "default",
                  }}
                >
                  <div
                    style={{
                      alignItems: "center",
                      display: "flex",
                      gap: "6",
                      height: "24",
                    }}
                  >
                    <div style={{alignItems: "center", display: "flex", gap: "6"}}>
                      <div
                        style={{
                          display: accountStatus === 'full' || accountStatus === 'address'
                            ? 'block'
                            : 'none',
                        }}
                      >
                        {account.displayName}
                      </div>
                      <DropdownIcon />
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
            display: "flex",
            borderRadius: "connectButton",
          }}
          key="connect"
          onClick={openConnectModal}
        >
          <div
            style={{
              background: "accentColor",
              borderRadius: "connectButton",
              boxShadow: "connectButton",
              color: "accentColorForeground",
              fontFamily: "body",
              fontWeight: "bold",
              paddingLeft: "14",
              paddingRight: "14",
              paddingTop: "10",
              paddingBottom: "10",
              transform: 'shrink',
              transition: "default",
            }}
          >
            {label}
          </div>
        </button>
      )}
    </div>
  );
}
