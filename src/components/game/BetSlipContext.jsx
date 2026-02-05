import { createContext, useContext, useState } from "react";

const BetSlipContext = createContext();

export const useBetSlip = () => {
  const context = useContext(BetSlipContext);
  if (!context) {
    throw new Error("useBetSlip must be used within BetSlipProvider");
  }
  return context;
};

export const BetSlipProvider = ({ children }) => {
  const [bets, setBets] = useState([]);

  const addBet = (bet) => {
    // Check if bet already exists (same game, market, outcome, sportsbook)
    const exists = bets.some(
      b => b.gameId === bet.gameId && 
           b.market === bet.market && 
           b.outcome === bet.outcome && 
           b.sportsbook === bet.sportsbook &&
           b.point === bet.point
    );

    if (exists) {
      // Remove it if it exists (toggle)
      removeBet(bet);
    } else {
      setBets([...bets, bet]);
    }
  };

  const removeBet = (bet) => {
    setBets(bets.filter(
      b => !(b.gameId === bet.gameId && 
             b.market === bet.market && 
             b.outcome === bet.outcome && 
             b.sportsbook === bet.sportsbook &&
             b.point === bet.point)
    ));
  };

  const clearBets = () => setBets([]);

  const isBetSelected = (gameId, market, outcome, sportsbook, point) => {
    return bets.some(
      b => b.gameId === gameId && 
           b.market === market && 
           b.outcome === outcome && 
           b.sportsbook === sportsbook &&
           b.point === point
    );
  };

  return (
    <BetSlipContext.Provider value={{ bets, addBet, removeBet, clearBets, isBetSelected }}>
      {children}
    </BetSlipContext.Provider>
  );
};