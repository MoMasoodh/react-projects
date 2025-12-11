import React, { useEffect, useRef, useState } from "react";
import "./index.css";

/* constants */
const LINES = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6]
];

function checkWinner(board) {
  for (const [a,b,c] of LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line: [a,b,c] };
    }
  }
  if (board.every(Boolean)) return { winner: "TIE", line: [] };
  return null;
}

export default function App(){
  const [board, setBoard] = useState(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState(true);
  const [mode, setMode] = useState("vs-computer"); // or "two"
  const [aiThinking, setAiThinking] = useState(false);
  const [scores, setScores] = useState({X:0, O:0, T:0});
  const [whoStarts, setWhoStarts] = useState("X");

  const cellRefs = useRef([]);
  const [winInfo, setWinInfo] = useState({ winner: null, line: [] });

  useEffect(() => {
    setXIsNext(whoStarts === "X");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const res = checkWinner(board);
    if (res) {
      setWinInfo(res);
      if (res.winner && res.winner !== "TIE") {
        setScores(s => ({...s, [res.winner]: s[res.winner] + 1}));
      } else if (res.winner === "TIE") {
        setScores(s => ({...s, T: s.T + 1}));
      }
    } else {
      setWinInfo({ winner: null, line: [] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board]);

  /* Minimax AI (unbeatable) */
  const minimax = (boardState, player, maximizing) => {
    const winnerCheck = checkWinner(boardState);
    if (winnerCheck) {
      if (winnerCheck.winner === "X") return { score: 10 };
      if (winnerCheck.winner === "O") return { score: -10 };
      if (winnerCheck.winner === "TIE") return { score: 0 };
    }
    const moves = [];
    for (let i=0;i<boardState.length;i++){
      if (!boardState[i]) {
        const nb = boardState.slice();
        nb[i] = player;
        const nextP = player === "X" ? "O" : "X";
        const res = minimax(nb, nextP, !maximizing);
        moves.push({ index: i, score: res.score });
      }
    }
    if (maximizing) {
      let best = moves[0];
      for (const m of moves) if (m.score > best.score) best = m;
      return best;
    } else {
      let best = moves[0];
      for (const m of moves) if (m.score < best.score) best = m;
      return best;
    }
  };

  useEffect(() => {
    if (mode !== "vs-computer") return;
    const compSymbol = (whoStarts === "X") ? "O" : "X";
    if (checkWinner(board)) return;
    const current = xIsNext ? "X" : "O";
    if (current === compSymbol) {
      setAiThinking(true);
      setTimeout(() => {
        const maximizing = current === "X";
        const best = minimax(board, current, maximizing);
        if (best && typeof best.index === "number") {
          makeMove(best.index, compSymbol, true);
        }
        setAiThinking(false);
      }, 380 + Math.random()*180);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board, xIsNext, mode, whoStarts]);

  const makeMove = (idx, forced=null, fromAi=false) => {
    if (board[idx] || checkWinner(board)) return;
    const nb = board.slice();
    const symbol = forced || (xIsNext ? "X" : "O");
    nb[idx] = symbol;
    setBoard(nb);
    setXIsNext(!xIsNext);
  };

  const handleCell = (i) => {
    const compSymbol = (whoStarts === "X") ? "O" : "X";
    const current = xIsNext ? "X" : "O";
    if (mode === "vs-computer" && current === compSymbol) return;
    if (winInfo && winInfo.winner) return;
    makeMove(i);
  };

  const resetBoard = (keepScores=true) => {
    setBoard(Array(9).fill(null));
    setXIsNext(whoStarts === "X");
    setWinInfo({ winner: null, line: [] });
    if (!keepScores) setScores({X:0,O:0,T:0});
  };

  const toggleStarter = (sym) => {
    setWhoStarts(sym);
    setXIsNext(sym === "X");
    setBoard(Array(9).fill(null));
  };

  const winningLineIndices = winInfo && winInfo.line ? winInfo.line : [];

  return (
    <div className="xo-root">
      <div className="xo-shell">
        <header className="xo-header">
          <div>
            <div className="xo-title">TIC TAC TOE</div>
            <div className="xo-sub">X vs O</div>
          </div>

          <div className="xo-controls">
            <div className="mode-switch">
              <button className={`mode-btn ${mode==="vs-computer" ? "active" : ""}`} onClick={() => { setMode("vs-computer"); resetBoard(true); }}>Vs Computer</button>
              <button className={`mode-btn ${mode==="two" ? "active" : ""}`} onClick={() => { setMode("two"); resetBoard(true); }}>Two Player</button>
            </div>

            <div className="starter-row">
              <label className="small">Starter:</label>
              <button className={`starter ${whoStarts==="X" ? "on" : ""}`} onClick={() => toggleStarter("X")}>X</button>
              <button className={`starter ${whoStarts==="O" ? "on" : ""}`} onClick={() => toggleStarter("O")}>O</button>
            </div>

            <div className="scoreboard">
              <div className="s-item">X: <strong>{scores.X}</strong></div>
              <div className="s-item">T: <strong>{scores.T}</strong></div>
              <div className="s-item">O: <strong>{scores.O}</strong></div>
            </div>

            <div className="actions">
              <button className="action" onClick={() => resetBoard(true)}>New Round</button>
              <button className="action ghost" onClick={() => resetBoard(false)}>Reset Scores</button>
            </div>
          </div>
        </header>

        <main className="xo-board-wrap">
          <div className="xo-board-area">
            <div className="xo-board">
              {board.map((cell, i) => (
                <button
                  key={i}
                  ref={el => cellRefs.current[i] = el}
                  className={`xo-cell ${cell ? "filled" : ""} ${winningLineIndices.includes(i) ? "win" : ""}`}
                  onClick={() => handleCell(i)}
                >
                  <span className={`mark ${cell === "X" ? "x" : cell === "O" ? "o" : ""}`}>{cell || ""}</span>
                </button>
              ))}
            </div>

            <div className="xo-status">
              <div className="status-text">
                { checkWinner(board) ? (checkWinner(board).winner === "TIE" ? "Tie!" : `${checkWinner(board).winner} Wins!`) : `${xIsNext ? "X" : "O"} to move` }
              </div>
              <div className="status-note">{ aiThinking ? "Computer is thinking..." : "" }</div>
            </div>
          </div>
        </main>

        <footer className="xo-footer">
          <div className="note"></div>
        </footer>
      </div>
    </div>
  );
}
