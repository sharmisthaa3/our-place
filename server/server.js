require("dotenv").config();

const mongoose = require("mongoose");

// Replace the string below with your actual connection string from MongoDB Atlas
  mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("✅ Connected to MongoDB Atlas"))
  .catch((err) => console.log("❌ DB Error:", err));
// Define the Data Structure

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const AppStateSchema = new mongoose.Schema({
  id: { type: String, default: "global-state" },
  chatMessages: Array,
  houseState: Object,
  gamesState: Object,
  memories: { sharu: Array, akkshu: Array }
});
const AppState = mongoose.model("AppState", AppStateSchema);
async function loadState() {
  let state = await AppState.findOne({ id: "global-state" });

  if (!state) {
    state = await AppState.create({
      id: "global-state",
      chatMessages: [],
      houseState,
      gamesState,
      memories
    });

    console.log("✅ Created initial DB state");
  }

  houseState = state.houseState || houseState;
  gamesState = state.gamesState || gamesState;
  memories = state.memories || memories;
  chatMessages = state.chatMessages || [];

  console.log("✅ Loaded saved state");
}
async function saveState() {
 await AppState.findOneAndUpdate(
  { id: "global-state" },
  {
    houseState,
    gamesState,
    memories,
    chatMessages
  },
  { upsert: true }
);
}
const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));

// Persistent Multi-Room State
let houseState = {
  living: { bg: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80", watchlist: [], notes: [] },
  bedroom: { bg: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80", sleepTracker: { Sharu: {}, Akkshu: {} }, notes: [] },
  kitchen: { bg: "https://images.unsplash.com/photo-1556912173-3bb406ef7e77?auto=format&fit=crop&w=1200&q=80", cookingScores: { Sharu: 0, Akkshu: 0 }, notes: [] },
  study: { bg: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80", notes: [] }
};
// Add this with your other 'let' variables
// Change your memories object to this
let memories = { 
  sharu: [], 
  akkshu: [] 
};
let avatars = { Sharu: { room: "living", x: 40, y: 60 }, Akkshu: { room: "living", x: 60, y: 65 } };
let studyState = { Sharu: { active: false, timeLeft: 1500, label: "25:00" }, Akkshu: { active: false, timeLeft: 1500, label: "25:00" } };
// ... existing state declarations
let chatMessages = []; // Add this line
// --- 🎮 MULTIPLAYER GAMES STATE ENGINE (FINAL VERSION) ---
let gamesState = {
  activeGame: "sketch",
  ticTacToe: { board: Array(9).fill(""), turn: "Sharu", winner: null },
  connectFour: { board: Array(6).fill(null).map(() => Array(7).fill("")), turn: "Sharu", winner: null },
  memory: { cards: [], selected: [], pairsFound: [], turn: "Sharu", scores: { Sharu: 0, Akkshu: 0 } },
  pong: { ballX: 50, ballY: 50, score: { Sharu: 0, Akkshu: 0 } },
  
  // Classic RPS (Lizard & Spock completely removed)
  rpsClassic: { SharuMove: "", AkkshuMove: "", result: "", scores: { Sharu: 0, Akkshu: 0 } },
  
  wordChain: { lastWord: "", currentTurn: "Sharu", status: "Start with any word!", scores: { Sharu: 0, Akkshu: 0 } },
  hotCold: { secretNum: Math.floor(Math.random() * 50) + 1, currentTurn: "Sharu", status: "Guess a number between 1 and 50", winner: null },
  
  // New Game 8: Maze Runner Race Track
  mazeRunner: { SharuPos: 0, AkkshuPos: 0, winner: null },
  
  // New Game 9: Click Velocity War Field
  clickWar: { balance: 50, winner: null } 
};

function resetMemoryGame() {
  const icons = ["💖", "🌟", "🍿", "🐈", "🍰", "🍕"];
  let deck = [...icons, ...icons].map((icon, idx) => ({ id: idx, icon, flipped: false }));
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  gamesState.memory = { cards: deck, selected: [], pairsFound: [], turn: "Sharu", scores: { Sharu: 0, Akkshu: 0 } };
}
resetMemoryGame();
app.get("/api/memories", (req, res) => res.json(memories));
app.get("/api/house", (req, res) => res.json(houseState));
app.get("/api/avatars", (req, res) => res.json(avatars));
app.get("/api/study", (req, res) => res.json(studyState));
app.get("/api/games", (req, res) => res.json(gamesState));
// ... existing app.get routes
app.get("/api/chat", (req, res) => res.json(chatMessages)); // Add this line
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

io.on("connection", (socket) => {

socket.on("add_core_memory", async({ user, text }) => {
  const newEntry = { id: Date.now(), text, timestamp: new Date().toLocaleTimeString() };
  if (user === "Sharu") memories.sharu.unshift(newEntry);
  else memories.akkshu.unshift(newEntry);
  await saveState();
  io.emit("memories_updated", memories);
});

socket.on("delete_core_memory", async({ user, id }) => {
  if (user === "Sharu") memories.sharu = memories.sharu.filter(m => m.id !== id);
  else memories.akkshu = memories.akkshu.filter(m => m.id !== id);
  await saveState();
  io.emit("memories_updated", memories);
});
  // ADD THIS CHAT LOGIC:
  socket.on("send_message", async (msg) => {
  chatMessages.push(msg);

  await saveState();

  io.emit("receive_message", msg);
});

// ... rest of your existing socket events
  socket.on("move_avatar", ({ name, direction }) => {
    if (!avatars[name]) return;
    const step = 6;
    if (direction === "up") avatars[name].y = Math.max(30, avatars[name].y - step);
    if (direction === "down") avatars[name].y = Math.min(85, avatars[name].y + step);
    if (direction === "left") avatars[name].x = Math.max(5, avatars[name].x - step);
    if (direction === "right") avatars[name].x = Math.min(90, avatars[name].x + step);
    io.emit("avatars_updated", avatars);
  });
  
  socket.on("change_room", ({ name, targetRoom }) => {
    if (!avatars[name]) return;
    avatars[name].room = targetRoom;
    io.emit("avatars_updated", avatars);
  });

socket.on("switch_game", async (gameKey) => {
  gamesState.activeGame = gameKey;

  await saveState();

  io.emit("game_changed", gamesState);
});

  // GAME 1: SKETCH CANVAS
  socket.on("draw_stroke", (strokeData) => { socket.broadcast.emit("receive_stroke", strokeData); });
  socket.on("clear_canvas", () => { io.emit("canvas_cleared"); });

  // GAME 2: CLASSIC RPS ENGINE
  socket.on("submit_classic_rps", async({ user, move }) => {
    let rps = gamesState.rpsClassic;
    if (user === "Sharu") rps.SharuMove = move;
    if (user === "Akkshu") rps.AkkshuMove = move;

    if (rps.SharuMove && rps.AkkshuMove) {
      if (rps.SharuMove === rps.AkkshuMove) {
        rps.result = `Both chose ${rps.SharuMove.toUpperCase()}! Draw!`;
      } else if (
        (rps.SharuMove === "rock" && rps.AkkshuMove === "scissors") ||
        (rps.SharuMove === "paper" && rps.AkkshuMove === "rock") ||
        (rps.SharuMove === "scissors" && rps.AkkshuMove === "paper")
      ) {
        rps.result = "Sharu wins this round!";
        rps.scores.Sharu += 10;
      } else {
        rps.result = "Akkshu wins this round!";
        rps.scores.Akkshu += 10;
      }
      setTimeout(() => {
        rps.SharuMove = ""; rps.AkkshuMove = ""; rps.result = "";
        io.emit("games_updated", gamesState);
      }, 2000);
    } else {
      rps.result = `${user} locked their choice...`;
    }
    await saveState();
    io.emit("games_updated", gamesState);
  });

  // GAME 3: WORD CHAIN
  socket.on("submit_chain_word", async({ user, word }) => {
    let chain = gamesState.wordChain;
    if (chain.currentTurn !== user) return;
    let cleanWord = word.trim().toLowerCase();
    if (cleanWord.length < 2) return;

    if (chain.lastWord) {
      let requiredLetter = chain.lastWord.slice(-1);
      if (cleanWord.charAt(0) !== requiredLetter) {
        chain.status = `Invalid! Word must start with "${requiredLetter.toUpperCase()}"`;
        await saveState();
        io.emit("games_updated", gamesState);
        return;
      }
    }
    chain.lastWord = cleanWord;
    chain.scores[user] += 5;
    chain.currentTurn = user === "Sharu" ? "Akkshu" : "Sharu";
    chain.status = `Nice! Next turn requires letter: "${cleanWord.slice(-1).toUpperCase()}"`;

await saveState();

io.emit("games_updated", gamesState);
  });
 socket.on("reset_chain", async () => {
  gamesState.wordChain = {
    lastWord: "",
    currentTurn: "Sharu",
    status: "Start with any word!",
    scores: { Sharu: 0, Akkshu: 0 }
  };

  await saveState();

  io.emit("games_updated", gamesState);
});

  // GAME 4: HOT/COLD NUMBER GUESSING
  socket.on("submit_guess", async({ user, guess }) => {
    let hc = gamesState.hotCold;
    if (hc.currentTurn !== user || hc.winner) return;
    let num = parseInt(guess);
    if (isNaN(num)) return;

    if (num === hc.secretNum) {
      hc.winner = user;
      hc.status = `🎉 Perfect! ${user} correctly guessed the secret number ${hc.secretNum}!`;
    } else {
      let diff = Math.abs(num - hc.secretNum);
      let hint = num > hc.secretNum ? "Too High" : "Too Low";
      let temp = diff <= 3 ? "🔥 Sizzling Hot!" : diff <= 7 ? "☀️ Warm" : "❄️ Freezing Cold";
      hc.status = `${user} guessed ${num}: ${hint} (${temp})`;
      hc.currentTurn = hc.currentTurn === "Sharu" ? "Akkshu" : "Sharu";
    }
    await saveState();
    io.emit("games_updated", gamesState);
  });
  socket.on("reset_hotcold", async() => {
    gamesState.hotCold = { secretNum: Math.floor(Math.random() * 50) + 1, currentTurn: "Sharu", status: "Guess a number between 1 and 50", winner: null };
    await saveState();
    io.emit("games_updated", gamesState);
  });

  // NEW GAME 5: MAZE RUNNER ENGINE
  socket.on("step_maze", async({ user }) => {
    let maze = gamesState.mazeRunner;
    if (maze.winner) return;

    if (user === "Sharu") maze.SharuPos += 1;
    if (user === "Akkshu") maze.AkkshuPos += 1;

    if (maze.SharuPos >= 15) maze.winner = "Sharu";
    else if (maze.AkkshuPos >= 15) maze.winner = "Akkshu";
    await saveState();
    io.emit("games_updated", gamesState);
  });
  socket.on("reset_maze", async() => {
    gamesState.mazeRunner = { SharuPos: 0, AkkshuPos: 0, winner: null };
    await saveState();
    io.emit("games_updated", gamesState);
  });

  // NEW GAME 6: CLICK VELOCITY WAR ENGINE
  socket.on("tap_war", async({ user }) => {
    let war = gamesState.clickWar;
    if (war.winner) return;

    // Sharu taps push toward 100, Akkshu pulls toward 0
    if (user === "Sharu") war.balance += 2;
    if (user === "Akkshu") war.balance -= 2;

    if (war.balance >= 100) war.winner = "Sharu";
    if (war.balance <= 0) war.winner = "Akkshu";
    await saveState();
    io.emit("games_updated", gamesState);
  });
  socket.on("reset_war", async () => {
  gamesState.clickWar = { balance: 50, winner: null };

  await saveState();

  io.emit("games_updated", gamesState);
});

  // CLASSIC BOARD COMPONENT CHANNELS
  socket.on("make_ttt_move", async({ index, user }) => {
    if (gamesState.ticTacToe.turn !== user || gamesState.ticTacToe.board[index] !== "" || gamesState.ticTacToe.winner) return;
    gamesState.ticTacToe.board[index] = user === "Sharu" ? "X" : "O";
    const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    let won = wins.some(comb => comb.every(i => gamesState.ticTacToe.board[i] === (user === "Sharu" ? "X" : "O")));
    if (won) gamesState.ticTacToe.winner = user;
    else if (!gamesState.ticTacToe.board.includes("")) gamesState.ticTacToe.winner = "Draw";
    else gamesState.ticTacToe.turn = user === "Sharu" ? "Akkshu" : "Sharu";
    await saveState();
    io.emit("games_updated", gamesState);
  });
  socket.on("reset_ttt", async () => {
  gamesState.ticTacToe = {
    board: Array(9).fill(""),
    turn: "Sharu",
    winner: null
  };

  await saveState();

  io.emit("games_updated", gamesState);
});
  socket.on("make_c4_move", async({ col, user }) => {
    if (gamesState.connectFour.turn !== user || gamesState.connectFour.winner) return;
    for (let r = 5; r >= 0; r--) {
      if (gamesState.connectFour.board[r][col] === "") { gamesState.connectFour.board[r][col] = user; gamesState.connectFour.turn = user === "Sharu" ? "Akkshu" : "Sharu"; break; }
    }
    await saveState();
    io.emit("games_updated", gamesState);
  });
socket.on("reset_c4", async () => {
  gamesState.connectFour = {
    board: Array(6).fill(null).map(() => Array(7).fill("")),
    turn: "Sharu",
    winner: null
  };

  await saveState();

  io.emit("games_updated", gamesState);
});

  socket.on("flip_memory_card", async({ cardId, user }) => {
    let mem = gamesState.memory; if (mem.turn !== user || mem.selected.length >= 2 || mem.pairsFound.includes(cardId)) return;
    mem.selected.push(cardId); io.emit("games_updated", gamesState);
    if (mem.selected.length === 2) {
      const [c1, c2] = mem.selected;
      if (mem.cards[c1].icon === mem.cards[c2].icon) { mem.pairsFound.push(c1, c2); mem.scores[user] += 10; mem.selected = []; io.emit("games_updated", gamesState); }
      else { setTimeout(() => { mem.selected = []; mem.turn = mem.turn === "Sharu" ? "Akkshu" : "Sharu"; io.emit("games_updated", gamesState); }, 1200); }
    }
  });
  socket.on("reset_memory", async () => {
  resetMemoryGame();

  await saveState();

  io.emit("games_updated", gamesState);
});
  socket.on("tap_pong", async({ user }) => {
    gamesState.pong.score[user] += 1; gamesState.pong.ballX = user === "Sharu" ? Math.floor(Math.random() * 30) + 10 : Math.floor(Math.random() * 30) + 60; gamesState.pong.ballY = Math.floor(Math.random() * 60) + 20;
    await saveState();
    io.emit("games_updated", gamesState);
  });
  socket.on("reset_pong", async () => {
  gamesState.pong = {
    ballX: 50,
    ballY: 50,
    score: { Sharu: 0, Akkshu: 0 }
  };

  await saveState();

  io.emit("games_updated", gamesState);
});
  // Dashboard state persistence sync lines
  socket.on("update_sleep", async(data) => { houseState.bedroom.sleepTracker[data.user][data.day] = data.hours ? `${data.hours} hrs` : "-"; await saveState();io.emit("house_updated", houseState); });
  socket.on("save_cooking_score", async(data) => { if (data.score > houseState.kitchen.cookingScores[data.user]) houseState.kitchen.cookingScores[data.user] = data.score; await saveState();io.emit("house_updated", houseState); });
  socket.on("add_room_note", async(data) => { if (houseState[data.room]) houseState[data.room].notes.push(data.note);await saveState(); io.emit("house_updated", houseState); });
  socket.on("clear_notes", async(room) => { if (houseState[room]) houseState[room].notes = []; await saveState();io.emit("house_updated", houseState); });
});

const PORT = process.env.PORT || 5000;
async function startServer() {
  await loadState();

  server.listen(PORT, () => {
    console.log(`🚀 Server running on ${PORT}`);
  });
}

startServer();