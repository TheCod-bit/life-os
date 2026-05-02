import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface TokenEntry {
  amount: number;
  reason: string;
  timestamp: number;
}

interface TokenContextValue {
  balance: number;
  history: TokenEntry[];
  earn: (amount: number, reason: string) => void;
  spend: (amount: number, reason: string) => boolean;
  resetTokens: () => void;
}

const TokenContext = createContext<TokenContextValue>({
  balance: 0,
  history: [],
  earn: () => {},
  spend: () => false,
  resetTokens: () => {},
});

const BALANCE_KEY = '@life-os/token-balance';
const HISTORY_KEY = '@life-os/token-history';

export function TokenProvider({ children }: { children: ReactNode }) {
  const [balance, setBalance] = useState(0);
  const [history, setHistory] = useState<TokenEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(BALANCE_KEY),
      AsyncStorage.getItem(HISTORY_KEY),
    ]).then(([bal, hist]) => {
      setBalance(bal ? Number(bal) : 0);
      setHistory(hist ? JSON.parse(hist) : []);
      setLoaded(true);
    });
  }, []);

  const saveBalance = useCallback(async (newBalance: number) => {
    setBalance(newBalance);
    await AsyncStorage.setItem(BALANCE_KEY, String(newBalance));
  }, []);

  const saveHistory = useCallback(async (newHistory: TokenEntry[]) => {
    setHistory(newHistory);
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory.slice(-100)));
  }, []);

  function earn(amount: number, reason: string) {
    const newBalance = balance + amount;
    saveBalance(newBalance);
    const entry: TokenEntry = { amount, reason, timestamp: Date.now() };
    saveHistory([entry, ...history]);
  }

  function spend(amount: number, reason: string): boolean {
    if (balance < amount) return false;
    const newBalance = balance - amount;
    saveBalance(newBalance);
    const entry: TokenEntry = { amount: -amount, reason, timestamp: Date.now() };
    saveHistory([entry, ...history]);
    return true;
  }

  function resetTokens() {
    saveBalance(0);
    saveHistory([]);
  }

  if (!loaded) return null;

  return (
    <TokenContext.Provider value={{ balance, history, earn, spend, resetTokens }}>
      {children}
    </TokenContext.Provider>
  );
}

export function useTokens() {
  return useContext(TokenContext);
}
