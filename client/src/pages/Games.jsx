import { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import { FaPalette, FaDice, FaGamepad, FaTh, FaColumns, FaBolt, FaTrash, FaHandPaper, FaFont, FaQuestionCircle, FaRunning, FaSkullCrossbones } from "react-icons/fa";

const socket = io("https://explains-feeding-mental-flex.trycloudflare.com");
const socket = io(SERVER_URL);
const Games = () => {
  const currentUsername =
  (localStorage.getItem("username") || "sharu").toLowerCase() === "akkshu"
    ? "Akkshu"
    : "Sharu";
      const [gameState, setGameState] = useState(null);
  
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawColor, setDrawColor] = useState("#ec4899");

  const [chainInput, setChainInput] = useState("");
  const [guessInput, setGuessInput] = useState("");

  useEffect(() => {
    fetch(`${SERVER_URL}/api/games`)
  .then((res) => res.json())
  .then((data) => setGameState(data))
  .catch((err) => console.log(err));
    socket.on("game_changed", (updatedState) => setGameState(updatedState));
    socket.on("games_updated", (updatedState) => setGameState(updatedState));

    socket.on("receive_stroke", ({ x, y, color }) => {
      const canvas = canvasRef.current; if (!canvas) return;
      const ctx = canvas.getContext("2d"); ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill();
    });

    socket.on("canvas_cleared", () => {
      const canvas = canvasRef.current; if (canvas) canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    });

    return () => {
      socket.off("game_changed"); socket.off("games_updated");
      socket.off("receive_stroke"); socket.off("canvas_cleared");
    };
  }, []);

  if (!gameState) return <div className="h-full flex items-center justify-center bg-slate-950 text-pink-500 font-mono tracking-widest animate-pulse">BOOTING 9-GAME ARENA MATRIX...</div>;

  const handleCanvasDrawing = (e) => {
    if (!isDrawing || gameState.activeGame !== "sketch") return;
    const canvas = canvasRef.current; const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left; const y = clientY - rect.top;

    const ctx = canvas.getContext("2d"); ctx.fillStyle = drawColor;
    ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill();
    socket.emit("draw_stroke", { x, y, color: drawColor });
  };

  const submitWordChain = (e) => {
    e.preventDefault(); if (!chainInput.trim()) return;
    socket.emit("submit_chain_word", { user: currentUsername, word: chainInput });
    setChainInput("");
  };

  const submitGuessValue = (e) => {
    e.preventDefault(); if (!guessInput.trim()) return;
    socket.emit("submit_guess", { user: currentUsername, guess: guessInput });
    setGuessInput("");
  };

  const gameList = {
    sketch: { name: "Co-Draw Canvas", icon: <FaPalette /> },
    rps: { name: "RPS Classic", icon: <FaHandPaper /> },
    wordChain: { name: "Word Chain", icon: <FaFont /> },
    hotCold: { name: "Hot / Cold", icon: <FaQuestionCircle /> },
    maze: { name: "Maze Race", icon: <FaRunning /> },
    clickWar: { name: "Click War", icon: <FaSkullCrossbones /> },
    ticTacToe: { name: "Tic-Tac-Toe", icon: <FaTh /> },
    connectFour: { name: "Connect Four", icon: <FaColumns /> },
    memory: { name: "Memory Duel", icon: <FaDice /> },
    pong: { name: "Tap Speed", icon: <FaBolt /> }
  };

  return (
    <div className="h-full flex flex-col bg-slate-950 text-slate-100 select-none font-sans overflow-y-auto pb-24">
      
      {/* Top Menu Ribbon Bar */}
      <div className="p-4 bg-slate-900 border-b border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-3 shrink-0">
        <div>
          <h1 className="text-sm font-black tracking-widest text-pink-500 uppercase flex items-center gap-1.5"><FaGamepad/> Sibling Arena v3</h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase">Active Node: <span className="text-white">{currentUsername}</span></p>
        </div>
        <div className="flex gap-1.5 overflow-x-auto w-full sm:w-auto p-1 scrollbar-none">
          {Object.entries(gameList).map(([key, item]) => (
            <button
              key={key}
              onClick={() => socket.emit("switch_game", key)}
              className={`px-3 py-2 rounded-xl text-[10px] font-black tracking-wider uppercase transition flex items-center gap-1.5 shrink-0 ${gameState.activeGame === key ? "bg-pink-500 text-white shadow-lg" : "bg-slate-800 text-slate-400 hover:text-white"}`}
            >
              {item.icon} {item.name}
            </button>
          ))}
        </div>
      </div>

      {/* Viewport Dashboard Arena Container */}
      <div className="flex-1 max-w-4xl w-full mx-auto p-4 flex flex-col justify-center items-center">
        
        {/* GAME 1: CO-DRAW CANVA */}
        {gameState.activeGame === "sketch" && (
          <div className="w-full max-w-[420px] bg-slate-900 p-4 rounded-3xl border border-slate-800 flex flex-col items-center shadow-2xl">
            <div className="w-full flex justify-between items-center mb-3 text-xs font-black uppercase text-pink-400">
              <span>Shared Whiteboard</span>
              <button onClick={() => socket.emit("clear_canvas")} className="text-slate-500 hover:text-rose-400"><FaTrash size={12}/></button>
            </div>
            <canvas ref={canvasRef} width={360} height={300} onMouseDown={() => setIsDrawing(true)} onMouseUp={() => setIsDrawing(false)} onMouseMove={handleCanvasDrawing} onTouchStart={() => setIsDrawing(true)} onTouchEnd={() => setIsDrawing(false)} onTouchMove={handleCanvasDrawing} className="bg-slate-950 rounded-2xl border border-slate-800 cursor-crosshair touch-none" />
            <div className="flex gap-2 mt-4">
              {["#ec4899", "#a855f7", "#3b82f6", "#10b981", "#f59e0b", "#ef4444"].map(c => (
                <button key={c} onClick={() => setDrawColor(c)} style={{ backgroundColor: c }} className={`w-6 h-6 rounded-full border-2 transition ${drawColor === c ? "border-white scale-110" : "border-transparent"}`} />
              ))}
            </div>
          </div>
        )}

        {/* GAME 2: CLASSIC RPS */}
        {gameState.activeGame === "rps" && (
          <div className="w-full max-w-[400px] bg-slate-900 p-5 rounded-3xl border border-slate-800 shadow-2xl text-center space-y-4">
            <span className="text-xs font-black tracking-widest text-pink-500 uppercase block">Rock Paper Scissors Classic</span>
            <div className="grid grid-cols-2 bg-slate-950 p-2.5 rounded-2xl border border-slate-800 text-xs font-mono">
              <div className="border-r border-slate-800"><span className="text-slate-500 block text-[9px] font-bold">SHARU SCORE</span><span className="text-base font-black text-amber-400">{gameState.rpsClassic?.scores?.Sharu || 0}</span></div>
              <div><span className="text-slate-500 block text-[9px] font-bold">AKKSHU SCORE</span><span className="text-base font-black text-purple-400">{gameState.rpsClassic?.scores?.Akkshu || 0}</span></div>
            </div>
            <p className="text-xs font-bold text-slate-300 py-2 bg-slate-950 rounded-xl border border-slate-800/60 min-h-[36px] flex items-center justify-center px-3">{gameState.rpsClassic?.result || "Lock your decision choice:"}</p>
            <div className="grid grid-cols-3 gap-2 pt-2">
              {["rock", "paper", "scissors"].map(m => (
                <button key={m} onClick={() => socket.emit("submit_classic_rps", { user: currentUsername, move: m })} className="bg-slate-800 hover:bg-slate-700 py-3 text-xs font-black uppercase rounded-xl border border-slate-700 transition active:scale-95 text-slate-200">
                  {m.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* GAME 3: WORD CHAIN REACTION */}
        {gameState.activeGame === "wordChain" && (
          <div className="w-full max-w-[400px] bg-slate-900 p-5 rounded-3xl border border-slate-800 shadow-2xl space-y-4 text-center">
            <span className="text-xs font-black tracking-widest text-pink-500 uppercase block">Word Chain Loop</span>
            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 text-center">
              <span className="text-[9px] text-slate-500 font-bold uppercase block mb-1">Last Word Given:</span>
              <span className="text-xl font-black text-green-400 font-mono tracking-wide">{gameState.wordChain?.lastWord?.toUpperCase() || "---"}</span>
            </div>
            <p className="text-[11px] font-medium text-slate-400 bg-slate-950/40 py-1.5 rounded-lg border border-slate-850">{gameState.wordChain?.status}</p>
            <div className="text-xs font-bold text-slate-400">Current Turn: <b className="text-white uppercase underline">{gameState.wordChain?.currentTurn}</b></div>
            <form onSubmit={submitWordChain} className="flex gap-2">
              <input type="text" placeholder="Type next word entry..." value={chainInput} onChange={(e) => setChainInput(e.target.value)} disabled={gameState.wordChain?.currentTurn !== currentUsername} className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 text-xs text-white outline-none focus:border-pink-500 disabled:opacity-40" />
              <button type="submit" disabled={gameState.wordChain?.currentTurn !== currentUsername} className="bg-pink-500 text-white text-xs font-black px-4 py-2 rounded-xl disabled:opacity-40">Send</button>
            </form>
            <button onClick={() => socket.emit("reset_chain")} className="text-[10px] text-slate-500 font-bold uppercase block mx-auto hover:text-slate-300">Reset Loop</button>
          </div>
        )}

        {/* GAME 4: HOT / COLD GUESSING */}
        {gameState.activeGame === "hotCold" && (
          <div className="w-full max-w-[400px] bg-slate-900 p-5 rounded-3xl border border-slate-800 shadow-2xl space-y-4 text-center">
            <span className="text-xs font-black tracking-widest text-pink-500 uppercase block">Hot or Cold Guessing Vault</span>
            <p className="text-xs font-semibold py-3 px-4 bg-slate-950 rounded-2xl border border-slate-800 text-slate-200 leading-relaxed">{gameState.hotCold?.status}</p>
            <div className="text-xs font-bold text-slate-400">Guesser: <b className="text-white uppercase">{gameState.hotCold?.currentTurn}</b></div>
            <form onSubmit={submitGuessValue} className="flex gap-2">
              <input type="number" min="1" max="50" placeholder="1-50" value={guessInput} onChange={(e) => setGuessInput(e.target.value)} disabled={gameState.hotCold?.currentTurn !== currentUsername || gameState.hotCold?.winner} className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 text-xs text-white outline-none focus:border-pink-500 disabled:opacity-40" />
              <button type="submit" disabled={gameState.hotCold?.currentTurn !== currentUsername || gameState.hotCold?.winner} className="bg-pink-500 text-white text-xs font-black px-4 py-2 rounded-xl disabled:opacity-40">Submit</button>
            </form>
            <button onClick={() => socket.emit("reset_hotcold")} className="text-[10px] text-slate-500 font-bold uppercase block mx-auto hover:text-slate-300">Reset Target</button>
          </div>
        )}

        {/* NEW GAME 5: MAZE RUNNER RACE */}
        {gameState.activeGame === "maze" && (
          <div className="w-full max-w-[400px] bg-slate-900 p-5 rounded-3xl border border-slate-800 shadow-2xl space-y-4 text-center">
            <span className="text-xs font-black tracking-widest text-pink-500 uppercase block">Maze Track Sprint</span>
            
            {/* Visual Tracks */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3 relative text-left">
              {/* Sharu Lane */}
              <div>
                <span className="text-[9px] font-bold text-amber-400 uppercase font-mono">SHARU LANE:</span>
                <div className="h-6 w-full bg-slate-900 rounded-md border border-slate-800 flex items-center p-1 mt-1 relative overflow-hidden">
                  <div style={{ left: `${(gameState.mazeRunner?.SharuPos / 15) * 85}%` }} className="absolute text-sm transition-all duration-300">🐹</div>
                  <div className="absolute right-2 text-[9px] text-slate-600 font-bold">GOAL</div>
                </div>
              </div>
              {/* Akkshu Lane */}
              <div>
                <span className="text-[9px] font-bold text-purple-400 uppercase font-mono">AKKSHU LANE:</span>
                <div className="h-6 w-full bg-slate-900 rounded-md border border-slate-800 flex items-center p-1 mt-1 relative overflow-hidden">
                  <div style={{ left: `${(gameState.mazeRunner?.AkkshuPos / 15) * 85}%` }} className="absolute text-sm transition-all duration-300">🐰</div>
                  <div className="absolute right-2 text-[9px] text-slate-600 font-bold">GOAL</div>
                </div>
              </div>
            </div>

            {gameState.mazeRunner?.winner ? (
              <div className="text-xs font-black uppercase text-green-400 tracking-wide">🏆 Winner: {gameState.mazeRunner.winner} Wins the Sprint!</div>
            ) : (
              <button onClick={() => socket.emit("step_maze", { user: currentUsername })} className="w-full bg-pink-500 py-3 text-xs font-black uppercase tracking-wider text-white rounded-xl active:scale-95 transition">
                👟 ADVANCE RUNNER STEP
              </button>
            )}
            <button onClick={() => socket.emit("reset_maze")} className="text-[10px] text-slate-500 font-bold uppercase block mx-auto hover:text-slate-300">Reset Track</button>
          </div>
        )}

        {/* NEW GAME 6: CLICK VELOCITY WAR */}
        {gameState.activeGame === "clickWar" && (
          <div className="w-full max-w-[400px] bg-slate-900 p-5 rounded-3xl border border-slate-800 shadow-2xl space-y-4 text-center">
            <span className="text-xs font-black tracking-widest text-pink-500 uppercase block">Click Velocity Tug-Of-War</span>
            
            {/* Health Bar Balance Slider */}
            <div className="h-8 w-full bg-purple-600 rounded-2xl relative overflow-hidden border border-slate-800 shadow-inner">
              <div style={{ width: `${gameState.clickWar?.balance}%` }} className="h-full bg-amber-400 transition-all duration-75 relative">
                <div className="absolute right-2 inset-y-0 flex items-center font-mono text-[9px] font-black text-slate-950">SHARU LINE</div>
              </div>
              <div className="absolute left-2 inset-y-0 flex items-center font-mono text-[9px] font-black text-white mix-blend-difference">AKKSHU LINE</div>
            </div>

            {gameState.clickWar?.winner ? (
              <div className="text-xs font-black text-green-400 uppercase tracking-widest">👑 War Conquered By {gameState.clickWar.winner}!</div>
            ) : (
              <button onClick={() => socket.emit("tap_war", { user: currentUsername })} className="w-full bg-gradient-to-r from-red-500 to-pink-500 py-3.5 text-xs font-black uppercase text-white rounded-2xl tracking-widest active:scale-95 shadow-lg">
                💥 PUSH THE LINE TUG!
              </button>
            )}
            <button onClick={() => socket.emit("reset_war")} className="text-[10px] text-slate-500 font-bold uppercase block mx-auto hover:text-slate-300">Reset Tug Field</button>
          </div>
        )}

        {/* GAME 7: TIC TAC TOE */}
        {gameState.activeGame === "ticTacToe" && (
          <div className="w-full max-w-[340px] bg-slate-900 p-5 rounded-3xl border border-slate-800 shadow-2xl text-center space-y-4">
            <div className="flex justify-between items-center text-xs font-black uppercase tracking-wider text-slate-400">
              <span>Turn: <b className="text-white">{gameState.ticTacToe.turn}</b></span>
              {gameState.ticTacToe.winner && <span className="text-green-400">Winner: {gameState.ticTacToe.winner}</span>}
            </div>
            <div className="grid grid-cols-3 gap-2 bg-slate-950 p-2.5 rounded-2xl border border-slate-800 aspect-square">
              {gameState.ticTacToe.board.map((cell, idx) => (
                <button key={idx} onClick={() => socket.emit("make_ttt_move", { index: idx, user: currentUsername })} className="bg-slate-900 rounded-xl flex items-center justify-center text-xl font-black font-mono border border-slate-800">
                  <span className={cell === "X" ? "text-amber-400" : "text-purple-400"}>{cell}</span>
                </button>
              ))}
            </div>
            <button onClick={() => socket.emit("reset_ttt")} className="w-full text-xs bg-slate-800 font-black uppercase py-2.5 rounded-xl border border-slate-700">Reset Grid</button>
          </div>
        )}

        {/* GAME 8: CONNECT FOUR */}
        {gameState.activeGame === "connectFour" && (
          <div className="w-full max-w-[380px] bg-slate-900 p-4 rounded-3xl border border-slate-800 shadow-2xl text-center space-y-3">
            <span className="text-[10px] font-black tracking-widest uppercase block text-slate-400">Turn: <b className="text-white">{gameState.connectFour.turn}</b></span>
            <div className="grid grid-cols-7 gap-1 px-1">
              {Array(7).fill(null).map((_, colIdx) => (
                <button key={colIdx} onClick={() => socket.emit("make_c4_move", { col: colIdx, user: currentUsername })} className="bg-slate-800 py-1 rounded font-bold text-[9px] text-pink-400 hover:bg-pink-500 hover:text-white transition">Drop</button>
              ))}
            </div>
            <div className="bg-slate-950 p-2 rounded-2xl border border-slate-800 space-y-1">
              {gameState.connectFour.board.map((row, rIdx) => (
                <div key={rIdx} className="grid grid-cols-7 gap-1">
                  {row.map((cell, cIdx) => (
                    <div key={cIdx} className="aspect-square rounded-full border border-slate-900 bg-slate-900 flex items-center justify-center relative">
                      {cell === "Sharu" && <div className="absolute inset-1 rounded-full bg-amber-400" />}
                      {cell === "Akkshu" && <div className="absolute inset-1 rounded-full bg-purple-500" />}
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <button onClick={() => socket.emit("reset_c4")} className="w-full text-xs bg-slate-800 font-black uppercase py-2 rounded-xl border border-slate-700">Clear Matrix</button>
          </div>
        )}

        {/* GAME 9: MEMORY DUEL */}
        {gameState.activeGame === "memory" && (
          <div className="w-full max-w-[360px] bg-slate-900 p-4 rounded-3xl border border-slate-800 shadow-2xl space-y-3 text-center">
            <div className="flex justify-between items-center text-[11px] font-mono bg-slate-950 p-2 rounded-xl border border-slate-800">
              <span className="text-amber-400 font-bold">SHARU: {gameState.memory.scores?.Sharu || 0}</span>
              <span className="text-white bg-slate-800 px-2 py-0.5 rounded text-[9px]">TURN: {gameState.memory.turn}</span>
              <span className="text-purple-400 font-bold">AKKSHU: {gameState.memory.scores?.Akkshu || 0}</span>
            </div>
            <div className="grid grid-cols-4 gap-2 bg-slate-950 p-2 rounded-2xl border border-slate-800">
              {gameState.memory.cards.map((card, idx) => {
                const isFlipped = gameState.memory.selected.includes(idx) || gameState.memory.pairsFound.includes(idx);
                return (
                  <button key={card.id} onClick={() => socket.emit("flip_memory_card", { cardId: idx, user: currentUsername })} className={`aspect-square rounded-xl flex items-center justify-center text-lg transition-all border ${isFlipped ? "bg-slate-900 border-slate-800 transform rotate-180" : "bg-gradient-to-br from-pink-500 to-rose-600 border-pink-400"}`}>{isFlipped ? card.icon : ""}</button>
                );
              })}
            </div>
            <button onClick={() => socket.emit("reset_memory")} className="w-full text-xs bg-slate-800 font-black uppercase py-2 rounded-xl border border-slate-700">Reshuffle</button>
          </div>
        )}

        {/* GAME 10: TAP SPEED PONG */}
        {gameState.activeGame === "pong" && (
          <div className="w-full max-w-[360px] bg-slate-900 p-4 rounded-3xl border border-slate-800 shadow-2xl space-y-4 text-center">
            <span className="text-xs font-black tracking-widest uppercase text-pink-400 block">Tap Speed Response Field</span>
            <div className="w-full h-44 bg-slate-950 rounded-2xl border border-slate-800 shadow-inner relative overflow-hidden">
              <div className="absolute inset-y-0 left-1/2 w-0.5 bg-dashed border-r border-slate-800/60" />
              <div style={{ left: `${gameState.pong.ballX}%`, top: `${gameState.pong.ballY}%` }} className="w-5 h-5 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full shadow-lg absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-150 animate-pulse" />
              <div className="absolute top-2 left-4 text-xs font-bold font-mono text-amber-400">Sharu: {gameState.pong.score.Sharu}</div>
              <div className="absolute top-2 right-4 text-xs font-bold font-mono text-purple-400">Akkshu: {gameState.pong.score.Akkshu}</div>
            </div>
            <button onClick={() => socket.emit("tap_pong", { user: currentUsername })} className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs font-black py-3 rounded-2xl shadow-lg active:scale-95 transform transition uppercase tracking-widest">💥 TAP REFLEX HIT!</button>
            <button onClick={() => socket.emit("reset_pong")} className="text-[10px] text-slate-500 font-bold uppercase block tracking-wider mx-auto hover:text-slate-300">Reset Score</button>
          </div>
        )}

      </div>
    </div>
  );
};

export default Games;