import { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import { FaArrowUp, FaArrowDown, FaArrowLeft, FaArrowRight, FaTv, FaUtensils, FaGraduationCap, FaBed, FaPlus, FaCheckCircle, FaTrash, FaPlay, FaPause, FaHistory, FaMoon } from "react-icons/fa";

const socket = io("https://explains-feeding-mental-flex.trycloudflare.com");
const socket = io(SERVER_URL);
socket.on("connect", () => {
  console.log("Socket Connected");
});

socket.on("connect_error", (err) => {
  console.log("Socket Error:", err.message);
});
const Room = () => {
  const currentUsername = localStorage.getItem("username") === "Sister" ? "Akkshu" : "Sharu";
  const [activeRoom, setActiveRoom] = useState("living");
  const [house, setHouse] = useState({
  living: { watchlist: [], notes: [] },
  bedroom: { sleepTracker: {}, notes: [] },
  kitchen: { cookingScores: { Sharu: 0, Akkshu: 0 }, notes: [] },
  study: { notes: [] }
});
  const [avatars, setAvatars] = useState({});
  const [noteText, setNoteText] = useState("");

  // TV Lounge Watchlist States
  const [movieTitle, setMovieTitle] = useState("");
  const [moviePlatform, setMoviePlatform] = useState("Netflix");

  // Kitchen Cooking Game States
  const [gameScore, setGameScore] = useState(0);
  const [currentOrder, setCurrentOrder] = useState([]);
  const [assembledBurger, setAssembledBurger] = useState([]);
  const [cookingTime, setCookingTime] = useState(0);
  const [isGameActive, setIsGameActive] = useState(false);

  // Bedroom Sleep Input States
  const [selectedDay, setSelectedDay] = useState("Mon");
  const [sleepHours, setSleepHours] = useState("");

  // Study Pomodoro State
  const [studyTimers, setStudyTimers] = useState({ Sharu: {}, Akkshu: {} });
  const timersRef = useRef({});

  useEffect(() => {
    if (localStorage.getItem("username") === "Sister") localStorage.setItem("username", "Akkshu");
    if (localStorage.getItem("username") === "Sharmi") localStorage.setItem("username", "Sharu");

    fetch(`${SERVER_URL}/api/house`)
  .then(res => res.json())
  .then(data => {
    console.log("HOUSE:", data);
    setHouse(data);
  })
  .catch(err => {
    console.log("HOUSE FETCH ERROR:", err);
  });
   fetch(`${SERVER_URL}/api/avatars`).then(res => res.json()).then(data => setAvatars(data));
    fetch(`${SERVER_URL}/api/study`).then(res => res.json()).then(data => setStudyTimers(data));

    socket.on("house_updated", (updatedHouse) => setHouse(updatedHouse));
    socket.on("avatars_updated", (updatedAvatars) => setAvatars(updatedAvatars));
    socket.on("study_updated", (updatedStudy) => setStudyTimers(updatedStudy));

    return () => {
      socket.off("house_updated");
      socket.off("avatars_updated");
      socket.off("study_updated");
    };
  }, []);

  useEffect(() => {
    if (avatars[currentUsername]) setActiveRoom(avatars[currentUsername].room);
  }, [avatars, currentUsername]);

  const handleRoomJump = (roomKey) => {
    socket.emit("change_room", { name: currentUsername, targetRoom: roomKey });
  };

  const handleWalk = (direction) => {
    socket.emit("move_avatar", { name: currentUsername, direction });
  };

  // ROOM ACTION: WATCHLIST
  const handleAddMovie = (e) => {
    e.preventDefault();
    if (!movieTitle.trim()) return;
    socket.emit("add_movie", { id: "mov_" + Date.now(), title: movieTitle.trim(), platform: moviePlatform, watched: false });
    setMovieTitle("");
  };

  // ROOM ACTION: SLEEP TRACKER UPLOADER
  const handleUploadSleep = (e) => {
    e.preventDefault();
    if (!sleepHours) return;
    socket.emit("update_sleep", { user: currentUsername, day: selectedDay, hours: sleepHours });
    setSleepHours("");
  };

  // ROOM ACTION: BURGER COOKING GAME MECHANICS
  const startCookingGame = () => {
    setGameScore(0);
    generateNewOrder();
    setCookingTime(30);
    setIsGameActive(true);
  };

  const generateNewOrder = () => {
    const ingredients = ["Buns 🍞", "Patty 🥩", "Cheese 🧀", "Lettuce 🥬"];
    let order = ["Buns 🍞"];
    const size = Math.floor(Math.random() * 2) + 1;
    for (let i = 0; i < size; i++) order.push(ingredients[Math.floor(Math.random() * 3) + 1]);
    order.push("Buns 🍞");
    setCurrentOrder(order);
    setAssembledBurger([]);
  };

  const addIngredientToBurger = (ing) => {
    if (!isGameActive) return;
    const newBurger = [...assembledBurger, ing];
    setAssembledBurger(newBurger);

    if (JSON.stringify(newBurger) === JSON.stringify(currentOrder)) {
      setGameScore(prev => {
        const nextScore = prev + 10;
        // Broadcast and update high score directly
        socket.emit("save_cooking_score", { user: currentUsername, score: nextScore });
        return nextScore;
      });
      generateNewOrder();
    } else if (newBurger.length >= currentOrder.length) {
      setAssembledBurger([]);
    }
  };

  useEffect(() => {
    if (!isGameActive) return;
    if (cookingTime <= 0) {
      setIsGameActive(false);
      return;
    }
    const interval = setTimeout(() => setCookingTime(prev => prev - 1), 1000);
    return () => clearTimeout(interval);
  }, [cookingTime, isGameActive]);

  // ROOM ACTION: POMODORO TRACKER RUNNERS
  const toggleStudyTimer = (user) => {
    const target = studyTimers[user];
    if (!target) return;
    const nextActive = !target.active;

    if (nextActive) {
      timersRef.current[user] = setInterval(() => {
        fetch(`${SERVER_URL}/api/study`).then(res => res.json()).then(currentData => {
          const currentLeft = currentData[user].timeLeft;
          if (currentLeft <= 1) {
            clearInterval(timersRef.current[user]);
            socket.emit("update_timer", { user, timeLeft: 1500, active: false });
          } else {
            socket.emit("update_timer", { user, timeLeft: currentLeft - 1, active: true });
          }
        });
      }, 1000);
    } else {
      clearInterval(timersRef.current[user]);
      socket.emit("update_timer", { user, timeLeft: target.timeLeft, active: false });
    }
  };

  const resetStudyTimer = (user) => {
    clearInterval(timersRef.current[user]);
    socket.emit("update_timer", { user, timeLeft: 1500, active: false });
  };

  const stickANote = (e) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    socket.emit("add_room_note", {
      room: activeRoom,
      note: { id: "note_" + Date.now(), text: noteText.trim(), author: currentUsername, color: currentUsername === "Sharu" ? "bg-amber-100/90" : "bg-fuchsia-100/90" }
    });
    setNoteText("");
  };

  const roomNames = { living: "Hall & TV Lounge", bedroom: "Cozy Bedroom", kitchen: "Culinary Kitchen", study: "Shared Study Studio" };
  const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  if (!house) return <div className="h-full flex items-center justify-center bg-slate-950 text-pink-500 font-bold tracking-widest animate-pulse">BOOTING ESTATE GRAPHICS...</div>;

  return (
    <div className="h-full flex flex-col bg-slate-950 text-slate-100 overflow-y-auto pb-24 select-none font-sans">
      
      {/* Top Header Selector Dashboard */}
      <div className="p-4 bg-slate-900/90 border-b border-slate-800/60 flex flex-col sm:flex-row justify-between items-center gap-3 shrink-0">
        <div>
          <h1 className="text-md font-black tracking-widest text-pink-500 uppercase">OUR WORLD</h1>
          <p className="text-[10px] text-slate-400 font-bold">ZONE: <span className="text-white uppercase">{roomNames[activeRoom]}</span></p>
        </div>
        <div className="flex gap-2 overflow-x-auto w-full sm:w-auto p-1 scrollbar-none">
          {Object.entries(roomNames).map(([key, name]) => (
            <button
              key={key}
              onClick={() => handleRoomJump(key)}
              className={`px-4 py-2 rounded-xl text-[11px] font-black tracking-wide transition-all uppercase ${activeRoom === key ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg" : "bg-slate-800 text-slate-400 hover:text-white"}`}
            >
              {name.split(" ")[1] || name}
            </button>
          ))}
        </div>
      </div>

      {/* Main View Grid split */}
      <div className="flex-1 w-full max-w-5xl mx-auto p-4 grid lg:grid-cols-3 gap-6 items-center">
        
        {/* Left Aspect Viewport Display */}
        <div className="lg:col-span-2 flex flex-col items-center">
          <div 
            style={{ backgroundImage: `url(${activeRoom === 'kitchen' ? 'https://images.unsplash.com/photo-1556912173-3bb406ef7e77?auto=format&fit=crop&w=1200&q=80' : house[activeRoom]?.bg})` }}
            className="w-full aspect-[4/3] max-w-[500px] bg-cover bg-center rounded-[28px] border border-slate-800 shadow-2xl relative overflow-hidden"
          >
            {/* Clean Avatar Badges */}
            {Object.entries(avatars).map(([name, data]) => {
              if (data.room !== activeRoom) return null;
              const isMe = name === currentUsername;
              return (
                <div key={name} style={{ left: `${data.x}%`, top: `${data.y}%`, position: "absolute" }} className="transform -translate-x-1/2 -translate-y-1/2 z-30 transition-all duration-300">
                  <div className={`px-3 py-1 rounded-xl text-xs font-black shadow-2xl border backdrop-blur-sm tracking-wider uppercase ${isMe ? "bg-pink-500 text-white border-pink-400" : "bg-purple-600 text-white border-purple-400"}`}>
                    {name}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Controller Pad */}
          <div className="mt-5 grid grid-cols-3 gap-2 bg-slate-900/60 p-2 rounded-2xl border border-slate-800 w-32">
            <div /><button onClick={() => handleWalk("up")} className="bg-slate-800 active:bg-pink-500 py-2.5 rounded-xl text-white flex justify-center"><FaArrowUp size={11} /></button><div />
            <button onClick={() => handleWalk("left")} className="bg-slate-800 active:bg-pink-500 py-2.5 rounded-xl text-white flex justify-center"><FaArrowLeft size={11} /></button>
            <div className="bg-slate-950/40 rounded-xl flex items-center justify-center text-[9px] font-black text-slate-700">PAD</div>
            <button onClick={() => handleWalk("right")} className="bg-slate-800 active:bg-pink-500 py-2.5 rounded-xl text-white flex justify-center"><FaArrowRight size={11} /></button>
            <div /><button onClick={() => handleWalk("down")} className="bg-slate-800 active:bg-pink-500 py-2.5 rounded-xl text-white flex justify-center"><FaArrowDown size={11} /></button><div />
          </div>
        </div>

        {/* Right Feature Sidebar */}
        <div className="space-y-4 w-full">
          
          {/* CONTEXT WIDGET CARD */}
          <div className="bg-slate-900/60 backdrop-blur p-4 rounded-2xl border border-slate-800 shadow-md">
            
            {/* LIVING ROOM APPS */}
            {activeRoom === "living" && (
              <div className="space-y-3">
                <h3 className="text-xs font-black text-pink-500 tracking-wider flex items-center gap-1.5 uppercase"><FaTv /> Shared Watchlist</h3>
                <form onSubmit={handleAddMovie} className="flex gap-2">
                  <input type="text" placeholder="Movie title..." value={movieTitle} onChange={(e) => setMovieTitle(e.target.value)} className="flex-1 text-xs bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white outline-none focus:border-pink-500"/>
                  <select value={moviePlatform} onChange={(e) => setMoviePlatform(e.target.value)} className="text-xs bg-slate-950 border border-slate-800 rounded-lg px-2 text-slate-300 outline-none"><option>Netflix</option><option>Prime</option><option>Hotstar</option></select>
                  <button type="submit" className="bg-pink-500 hover:bg-pink-600 px-3 rounded-lg text-xs font-bold"><FaPlus /></button>
                </form>
                <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                  {(house.living?.watchlist || []).map((m) => (
                    <div key={m.id} className="flex justify-between items-center bg-slate-950 p-2 rounded-xl border border-slate-800 text-xs">
                      <span className={m.watched ? "line-through text-slate-500 flex items-center gap-2" : "text-slate-200 flex items-center gap-2"}>
                        <button onClick={() => socket.emit("toggle_movie", m.id)} className={m.watched ? "text-green-400" : "text-slate-600"}><FaCheckCircle size={13}/></button>{m.title}
                      </span>
                      <button onClick={() => socket.emit("delete_movie", m.id)} className="text-slate-600 hover:text-red-400"><FaTrash size={10} /></button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* BEDROOM: WEEKLY SLEEP TRACKER */}
            {activeRoom === "bedroom" && (
              <div className="space-y-3">
                <h3 className="text-xs font-black text-pink-500 tracking-wider flex items-center gap-1.5 uppercase"><FaMoon /> Weekly Sleep Log</h3>
                
                {/* Upload Form Selector */}
                <form onSubmit={handleUploadSleep} className="flex gap-1.5 bg-slate-950 p-2 rounded-xl border border-slate-800">
                  <select value={selectedDay} onChange={(e) => setSelectedDay(e.target.value)} className="text-xs bg-slate-900 border border-slate-700 rounded-lg px-2 text-white outline-none">
                    {daysOfWeek.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <input type="number" min="1" max="24" placeholder="Hours (e.g. 8)" value={sleepHours} onChange={(e) => setSleepHours(e.target.value)} className="flex-1 text-xs bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-white outline-none" />
                  <button type="submit" className="bg-pink-500 text-white font-bold text-xs px-3 rounded-lg">Log</button>
                </form>

                {/* Scoreboard display breakdown matrix */}
                <div className="space-y-2 mt-2 font-mono text-[10px]">
                  {["Sharu", "Akkshu"].map((user) => (
                    <div key={user} className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                      <span className="font-black text-pink-400 uppercase tracking-wider block mb-1">{user}'s Schedule:</span>
                      <div className="grid grid-cols-7 gap-1 text-center">
                        {daysOfWeek.map(day => (
                          <div key={day} className="bg-slate-900 p-1 rounded border border-slate-800">
                            <div className="text-slate-500 font-bold text-[8px]">{day}</div>
                            <div className="text-slate-200 font-bold mt-0.5">{house.bedroom?.sleepTracker?.[user]?.[day] || "-"}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* KITCHEN: SMART LOCALIZED COUNTER SCORE CHANNELS */}
            {activeRoom === "kitchen" && (
              <div className="space-y-3 text-center">
                <h3 className="text-xs font-black text-pink-500 tracking-wider flex items-center gap-1.5 uppercase justify-center"><FaUtensils /> Burger Cooking Dash</h3>
                
                {/* Real-time Login Dashboard Scoreboards */}
                <div className="grid grid-cols-2 gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800 font-mono text-xs">
                  <div className="border-r border-slate-800 text-center">
                    <div className="text-[9px] text-slate-500 font-bold uppercase">Sharu Highscore</div>
                    <div className="text-sm font-black text-amber-400 mt-0.5">{house.kitchen?.cookingScores?.Sharu || 0} pts</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[9px] text-slate-500 font-bold uppercase">Akkshu Highscore</div>
                    <div className="text-sm font-black text-purple-400 mt-0.5">{house.kitchen?.cookingScores?.Akkshu || 0} pts</div>
                  </div>
                </div>

                {!isGameActive ? (
                  <div className="py-3 bg-slate-950 rounded-xl border border-slate-800">
                    <p className="text-[10px] text-slate-400 mb-2.5 px-2">Playing as: <span className="text-white font-black uppercase">{currentUsername}</span></p>
                    <button onClick={startCookingGame} className="bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs font-black px-6 py-2 rounded-xl shadow-md">
                      Start Game
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs text-left">
                    <div className="flex justify-between text-[11px] font-mono border-b border-slate-800 pb-1.5 text-pink-400">
                      <span>⏱️ Clock: {cookingTime}s</span>
                      <span>⭐ Active Score: {gameScore}</span>
                    </div>
                    <div>
                      <span className="text-[9px] block text-slate-500 font-bold mb-1 uppercase">Target Order recipe:</span>
                      <div className="flex gap-1 flex-wrap text-[10px]">
                        {currentOrder.map((ing, idx) => <span key={idx} className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700 text-slate-200">{ing}</span>)}
                      </div>
                    </div>
                    <div>
                      <span className="text-[9px] block text-slate-500 font-bold mb-1 uppercase">Your Assembly Tray:</span>
                      <div className="flex gap-1 flex-wrap text-[10px] min-h-[24px] bg-slate-900 rounded p-1 border border-slate-800">
                        {assembledBurger.map((ing, idx) => <span key={idx} className="bg-pink-950/40 text-pink-300 border border-pink-900/60 px-2 rounded">{ing}</span>)}
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-1 pt-1 font-bold">
                      {["Buns 🍞", "Patty 🥩", "Cheese 🧀", "Lettuce 🥬"].map((ing) => (
                        <button key={ing} onClick={() => addIngredientToBurger(ing)} className="bg-slate-800 hover:bg-slate-700 text-[10px] py-1.5 rounded text-center border border-slate-700">
                          {ing.split(" ")[0]}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STUDY APPS */}
            {activeRoom === "study" && (
              <div className="space-y-3">
                <h3 className="text-xs font-black text-pink-500 tracking-wider flex items-center gap-1.5 uppercase"><FaGraduationCap /> Study Sessions</h3>
                <div className="grid grid-cols-2 gap-2">
                  {["Sharu", "Akkshu"].map((user) => (
                    <div key={user} className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-center">
                      <span className="text-[9px] font-black tracking-wider text-slate-500 uppercase">{user}</span>
                      <div className="text-md font-black font-mono text-white my-0.5">{studyTimers[user]?.label || "25:00"}</div>
                      <div className="flex gap-1 justify-center mt-1">
                        <button onClick={() => toggleStudyTimer(user)} className={`p-1.5 rounded ${studyTimers[user]?.active ? "bg-amber-600" : "bg-green-600"}`}>
                          {studyTimers[user]?.active ? <FaPause size={8}/> : <FaPlay size={8}/>}
                        </button>
                        <button onClick={() => resetStudyTimer(user)} className="p-1.5 bg-slate-800 rounded text-slate-400"><FaHistory size={8}/></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Sticky Clipboard Wall Component */}
          <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 shadow-md flex flex-col max-h-[180px]">
            <form onSubmit={stickANote} className="flex gap-2 mb-2">
              <input type="text" placeholder="Pin note to room..." value={noteText} onChange={(e) => setNoteText(e.target.value)} className="flex-1 text-xs bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-white outline-none focus:border-pink-500" />
              <button type="submit" className="bg-yellow-500 text-slate-950 font-black text-xs px-3 rounded-xl">Pin</button>
            </form>
            <div className="flex-1 overflow-y-auto space-y-1.5 text-slate-950">
              {(house[activeRoom]?.notes || []).map((n) => (
                <div key={n.id} className={`${n.color} p-1.5 rounded-lg text-[11px] flex flex-col`}>
                  <p className="font-semibold break-words">{n.text}</p>
                  <span className="text-[8px] text-slate-500 text-right font-black uppercase mt-0.5">By: {n.author}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Room;