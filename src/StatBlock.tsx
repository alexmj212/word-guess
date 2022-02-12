import React from "react";
import { GameLog } from "./GameLogManager";

type StatBlockType = {
  gameLog: GameLog;
};

const StatBlock: React.FC<StatBlockType> = ({ gameLog }) => {
  return (
    <dl>
      <div className="grid-row">
        <dt className="grid-label">Played</dt>
        <dd className="grid-field">{gameLog.gamesPlayed}</dd>
      </div>
      <div className="grid-row">
        <dt className="grid-label">Won</dt>
        <dd className="grid-field">{gameLog.winCount}</dd>
      </div>
      <div className="grid-row">
        <dt className="grid-label">Current Streak</dt>
        <dd className="grid-field">{gameLog.winStreak}</dd>
      </div>
      <div className="grid-row">
        <dt className="grid-label">Longest Streak</dt>
        <dd className="grid-field">{gameLog.maxWinStreak}</dd>
      </div>
      <div className="grid-row">
        <dt className="grid-label">Win Percentage</dt>
        <dd className="grid-field">{gameLog.gamesPlayed ? ((+gameLog.winCount / +gameLog.gamesPlayed) * 100).toFixed(2) : "0"}%</dd>
      </div>
      <div className="grid-row">
        <dt className="grid-label">Lost</dt>
        <dd className="grid-field">{gameLog.lossCount}</dd>
      </div>
      <div className="grid-row">
        <dt className="grid-label">Forfeited</dt>
        <dd className="grid-field">{gameLog.forfeitCount}</dd>
      </div>
      <div className="grid-row">
        <dt className="grid-label">Total Guesses</dt>
        <dd className="grid-field">{gameLog.guessCount}</dd>
      </div>
      <div className="grid-row">
        <dt className="grid-label">Invalid Words</dt>
        <dd className="grid-field">{gameLog.invalidWordCount}</dd>
      </div>
    </dl>
  );
};

export default StatBlock;
