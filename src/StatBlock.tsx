import { GameLog } from "./GameLogManager";

type StatBlockType = {
  gameLog: GameLog;
  showFull?: boolean;
};

const StatBlock = ({ gameLog, showFull = false }: StatBlockType) => {
  return (
    <div className="flex flex-col justify-center items-center">
      <div className="flex w-full flex-row justify-center items-center space-x-2 md:space-x-4 bg-slate-200 dark:bg-slate-800 px-2 py-2 rounded-md">
        <div className="flex w-full flex-col justif-center items-center text-center">
          <div className="text-sm">Games Played</div>
          <div className="text-2xl font-bold">{gameLog.gamesPlayed}</div>
        </div>
        <div className="flex w-full flex-col justif-center items-center text-center">
          <div className="text-sm">Win Percentage</div>
          <div className="text-2xl font-bold">
            {" "}
            {gameLog.gamesPlayed
              ? ((+gameLog.winCount / +gameLog.gamesPlayed) * 100).toFixed(2)
              : "0"}
            %
          </div>
        </div>
        <div className="flex w-full flex-col justif-center items-center text-center">
          <div className="text-sm">Current Streak</div>
          <div className="text-2xl font-bold">{gameLog.winStreak}</div>
        </div>
        <div className="flex w-full flex-col justif-center items-center text-center">
          <div className="text-sm">Longest Streak</div>
          <div className="text-2xl font-bold">{gameLog.maxWinStreak}</div>
        </div>
      </div>
      {showFull && (
        <dl className="mt-4">
          <div className="grid-row">
            <dt className="grid-label">Won</dt>
            <dd className="grid-field">{gameLog.winCount}</dd>
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
      )}
    </div>
  );
};

export default StatBlock;
