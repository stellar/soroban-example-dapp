import React from 'react';
import { useAccount } from '../hooks/useAccount';
import { useNetwork } from '../hooks/useNetwork';
import { useIsMounted } from '../hooks/useIsMounted';
import { DropdownIcon } from "./Icons/Dropdown";

const blue = {
  blue1: '#fbfdff',
  blue2: '#f5faff',
  blue3: '#edf6ff',
  blue4: '#e1f0ff',
  blue5: '#cee7fe',
  blue6: '#b7d9f8',
  blue7: '#96c7f2',
  blue8: '#5eb0ef',
  blue9: '#0091ff',
  blue10: '#0081f1',
  blue11: '#006adc',
  blue12: '#00254d',
};
const gray = {
  gray1: '#fcfcfc',
  gray2: '#f8f8f8',
  gray3: '#f3f3f3',
  gray4: '#ededed',
  gray5: '#e8e8e8',
  gray6: '#e2e2e2',
  gray7: '#dbdbdb',
  gray8: '#c7c7c7',
  gray9: '#8f8f8f',
  gray10: '#858585',
  gray11: '#6f6f6f',
  gray12: '#171717',
};
const red = {
  red1: '#fffcfc',
  red2: '#fff8f8',
  red3: '#ffefef',
  red4: '#ffe5e5',
  red5: '#fdd8d8',
  red6: '#f9c6c6',
  red7: '#f3aeaf',
  red8: '#eb9091',
  red9: '#e5484d',
  red10: '#dc3d43',
  red11: '#cd2b31',
  red12: '#381316',
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
                flexDirection: "row",
                alignItems: "center",
                borderRadius: "0.5rem",
                borderWidth: 0,
              }}
              key={unsupportedChain ? 'unsupported' : 'supported'} // Force re-mount to prevent CSS transition
              onClick={openChainModal}
            >
              <div
                style={{
                  alignItems: "center",
                  background: unsupportedChain
                    ? red.red3
                    : gray.gray3,
                  borderRadius: "0.5rem",
                  boxShadow: "connectButton",
                  color: unsupportedChain
                    ? red.red11
                    : gray.gray12,
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
                    {chain.iconUrl ? (
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
                            borderRadius: "100%",
                          }}
                          height="24"
                          src={chain.iconUrl()}
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
                <DropdownIcon style={{marginLeft: 5}}/>
              </div>
            </button>
          )}

          {!unsupportedChain && (
            <button
              type="button"
              onClick={openAccountModal}
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                borderRadius: "0.5rem",
                borderWidth: 0,
              }}
            >
              <div
                style={{
                  alignItems: "center",
                  background: gray.gray3,
                  color:gray.gray12,
                  display: "flex",
                  fontFamily: "body",
                  fontWeight: "bold",
                  transform: 'shrink',
                  transition: "default",
                }}
              >
                <div
                  style={{
                    background: gray.gray3,
                    borderColor: "transparent",
                    borderRadius: "0.5rem",
                    borderStyle: "solid",
                    borderWidth: "2",
                    color: gray.gray12,
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
                      <DropdownIcon style={{marginLeft: 5}}/>
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
            borderRadius: "0.5rem",
            borderWidth: 0,
          }}
          key="connect"
          onClick={openConnectModal}
        >
          <div
            style={{
              // accent color
              background: blue.blue3,
              color: gray.gray12,
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
