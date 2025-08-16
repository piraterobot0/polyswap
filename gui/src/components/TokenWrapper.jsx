import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther, encodePacked, pad, toHex } from 'viem';
import { ERC1155_ABI, ERC20_ABI, WRAPPED_1155_FACTORY_ABI, FACTORY_ADDRESS } from '../config/contracts';

function TokenWrapper() {
  const { address } = useAccount();
  const [activeTab, setActiveTab] = useState('wrap');
  const [tokenAddress, setTokenAddress] = useState('');
  const [tokenId, setTokenId] = useState('');
  const [amount, setAmount] = useState('');
  const [tokenName, setTokenName] = useState('W1155');
  const [tokenSymbol, setTokenSymbol] = useState('W1155');
  const [tokenDecimals, setTokenDecimals] = useState('18');
  const [wrappedTokenAddress, setWrappedTokenAddress] = useState('');

  // Read ERC1155 balance
  const { data: erc1155Balance, refetch: refetchERC1155Balance } = useReadContract({
    address: tokenAddress,
    abi: ERC1155_ABI,
    functionName: 'balanceOf',
    args: [address, BigInt(tokenId || 0)],
    enabled: !!tokenAddress && !!tokenId && !!address,
  });

  // Check if approved
  const { data: isApproved } = useReadContract({
    address: tokenAddress,
    abi: ERC1155_ABI,
    functionName: 'isApprovedForAll',
    args: [address, FACTORY_ADDRESS],
    enabled: !!tokenAddress && !!address && FACTORY_ADDRESS !== "0x0000000000000000000000000000000000000000",
  });

  // Get wrapped token address
  const { data: wrappedAddress } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: WRAPPED_1155_FACTORY_ABI,
    functionName: 'getWrapped1155',
    args: [
      tokenAddress,
      BigInt(tokenId || 0),
      getTokenData(tokenName, tokenSymbol, tokenDecimals)
    ],
    enabled: !!tokenAddress && !!tokenId && FACTORY_ADDRESS !== "0x0000000000000000000000000000000000000000",
  });

  // Read wrapped token balance
  const { data: wrappedBalance, refetch: refetchWrappedBalance } = useReadContract({
    address: wrappedAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [address],
    enabled: !!wrappedAddress && !!address,
  });

  // Contract write hooks
  const { writeContract: approve, data: approveHash } = useWriteContract();
  const { writeContract: wrap, data: wrapHash } = useWriteContract();
  const { writeContract: unwrap, data: unwrapHash } = useWriteContract();

  // Transaction receipts
  const { isLoading: isApproving, isSuccess: approveSuccess } = useWaitForTransactionReceipt({ hash: approveHash });
  const { isLoading: isWrapping, isSuccess: wrapSuccess } = useWaitForTransactionReceipt({ hash: wrapHash });
  const { isLoading: isUnwrapping, isSuccess: unwrapSuccess } = useWaitForTransactionReceipt({ hash: unwrapHash });

  useEffect(() => {
    if (wrappedAddress) {
      setWrappedTokenAddress(wrappedAddress);
    }
  }, [wrappedAddress]);

  useEffect(() => {
    if (approveSuccess || wrapSuccess || unwrapSuccess) {
      refetchERC1155Balance();
      refetchWrappedBalance();
    }
  }, [approveSuccess, wrapSuccess, unwrapSuccess]);

  function getTokenData(name, symbol, decimals) {
    const nameBytes = pad(toHex(name), { size: 32 });
    const symbolBytes = pad(toHex(symbol), { size: 32 });
    const decimalsBytes = toHex(Number(decimals), { size: 1 });
    return encodePacked(['bytes32', 'bytes32', 'uint8'], [nameBytes, symbolBytes, decimalsBytes]);
  }

  const handleApprove = () => {
    if (!tokenAddress) return;
    approve({
      address: tokenAddress,
      abi: ERC1155_ABI,
      functionName: 'setApprovalForAll',
      args: [FACTORY_ADDRESS, true],
    });
  };

  const handleWrap = () => {
    if (!tokenAddress || !tokenId || !amount) return;
    const data = getTokenData(tokenName, tokenSymbol, tokenDecimals);
    
    wrap({
      address: tokenAddress,
      abi: ERC1155_ABI,
      functionName: 'safeTransferFrom',
      args: [
        address,
        FACTORY_ADDRESS,
        BigInt(tokenId),
        BigInt(amount),
        data
      ],
    });
  };

  const handleUnwrap = () => {
    if (!tokenAddress || !tokenId || !amount) return;
    const data = getTokenData(tokenName, tokenSymbol, tokenDecimals);
    
    unwrap({
      address: FACTORY_ADDRESS,
      abi: WRAPPED_1155_FACTORY_ABI,
      functionName: 'unwrap',
      args: [
        tokenAddress,
        BigInt(tokenId),
        BigInt(amount),
        address,
        data
      ],
    });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('wrap')}
            className={`flex-1 px-6 py-4 font-semibold transition-colors ${
              activeTab === 'wrap'
                ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Wrap Tokens
          </button>
          <button
            onClick={() => setActiveTab('unwrap')}
            className={`flex-1 px-6 py-4 font-semibold transition-colors ${
              activeTab === 'unwrap'
                ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Unwrap Tokens
          </button>
        </div>

        <div className="p-6 space-y-4">
          {FACTORY_ADDRESS === "0x0000000000000000000000000000000000000000" && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                Please deploy the Wrapped1155Factory contract and update FACTORY_ADDRESS in src/config/contracts.js
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ERC-1155 Contract Address
            </label>
            <input
              type="text"
              value={tokenAddress}
              onChange={(e) => setTokenAddress(e.target.value)}
              placeholder="0x..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Token ID
            </label>
            <input
              type="text"
              value={tokenId}
              onChange={(e) => setTokenId(e.target.value)}
              placeholder="Enter token ID"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {erc1155Balance !== undefined && (
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-600">
                Your ERC-1155 Balance: <span className="font-semibold text-gray-900">{erc1155Balance.toString()}</span>
              </p>
            </div>
          )}

          {activeTab === 'wrap' && (
            <>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Token Name
                  </label>
                  <input
                    type="text"
                    value={tokenName}
                    onChange={(e) => setTokenName(e.target.value)}
                    placeholder="W1155"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Symbol
                  </label>
                  <input
                    type="text"
                    value={tokenSymbol}
                    onChange={(e) => setTokenSymbol(e.target.value)}
                    placeholder="W1155"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Decimals
                  </label>
                  <input
                    type="text"
                    value={tokenDecimals}
                    onChange={(e) => setTokenDecimals(e.target.value)}
                    placeholder="18"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              {wrappedTokenAddress && wrappedTokenAddress !== '0x0000000000000000000000000000000000000000' && (
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    Wrapped Token Address: <span className="font-mono">{wrappedTokenAddress}</span>
                  </p>
                </div>
              )}
            </>
          )}

          {wrappedBalance !== undefined && activeTab === 'unwrap' && (
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-600">
                Your Wrapped Balance: <span className="font-semibold text-gray-900">{wrappedBalance.toString()}</span>
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount to {activeTab === 'wrap' ? 'Wrap' : 'Unwrap'}
            </label>
            <input
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {activeTab === 'wrap' ? (
            <div className="space-y-3">
              {!isApproved && (
                <button
                  onClick={handleApprove}
                  disabled={isApproving || !tokenAddress}
                  className="w-full py-3 px-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isApproving ? 'Approving...' : 'Approve Factory'}
                </button>
              )}
              <button
                onClick={handleWrap}
                disabled={isWrapping || !isApproved || !amount || !tokenAddress || !tokenId}
                className="w-full py-3 px-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-lg hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isWrapping ? 'Wrapping...' : 'Wrap Tokens'}
              </button>
            </div>
          ) : (
            <button
              onClick={handleUnwrap}
              disabled={isUnwrapping || !amount || !tokenAddress || !tokenId}
              className="w-full py-3 px-4 bg-gradient-to-r from-red-500 to-pink-500 text-white font-semibold rounded-lg hover:from-red-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isUnwrapping ? 'Unwrapping...' : 'Unwrap Tokens'}
            </button>
          )}

          {(wrapSuccess || unwrapSuccess) && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800">
                Transaction successful! Your tokens have been {activeTab === 'wrap' ? 'wrapped' : 'unwrapped'}.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 bg-white rounded-2xl shadow-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">How It Works</h3>
        <div className="space-y-3 text-sm text-gray-600">
          <div className="flex items-start">
            <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-semibold text-xs mr-3">1</span>
            <p>Enter the ERC-1155 contract address and token ID you want to wrap</p>
          </div>
          <div className="flex items-start">
            <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-semibold text-xs mr-3">2</span>
            <p>Approve the factory contract to handle your ERC-1155 tokens</p>
          </div>
          <div className="flex items-start">
            <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-semibold text-xs mr-3">3</span>
            <p>Wrap your tokens to receive fungible ERC-20 tokens</p>
          </div>
          <div className="flex items-start">
            <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-semibold text-xs mr-3">4</span>
            <p>All users wrapping the same token ID get the same ERC-20 token, making them fungible!</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TokenWrapper;