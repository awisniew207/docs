import React from 'react';

interface BalanceDisplayProps {
    ethBalance: string;
    loading: boolean;
    refreshBalance: () => void;
}

export const BalanceDisplay: React.FC<BalanceDisplayProps> = ({ 
    ethBalance, 
    loading, 
    refreshBalance,
}) => (
    <div className="mb-4 p-4 border rounded-lg bg-gray-50">
        <div className="flex justify-between items-center">
            <div>
                <h4 className="font-medium">Your Balance</h4>
                <p className="text-2xl font-bold mt-1">{ethBalance} ETH</p>
            </div>
        </div>
        <button
            onClick={refreshBalance}
            disabled={loading}
            className="mt-3 px-4 py-2 text-sm font-medium text-black border border-black rounded hover:bg-gray-100 transition-colors flex items-center"
        >
            {loading ? (
                <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
            ) : (
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
            )}
            {loading ? 'Refreshing...' : 'Refresh Balance'}
        </button>
    </div>
);