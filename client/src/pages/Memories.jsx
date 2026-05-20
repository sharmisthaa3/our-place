import { useState, useEffect } from "react";
import io from "socket.io-client";
const socket = io("https://explains-feeding-mental-flex.trycloudflare.com");
const socket = io(SERVER_URL);

const Memories = () => {
  const [data, setData] = useState({ sharu: [], akkshu: [] });
  const [input, setInput] = useState("");
const username = (localStorage.getItem("username") || "sharu").toLowerCase();// Make sure this is stored

  useEffect(() => {
  fetch(`${SERVER_URL}/api/memories`)
    .then((res) => res.json())
    .then((data) => setData(data))
    .catch((err) => console.log(err));

  // LIVE UPDATE LISTENER
  socket.on("memories_updated", (updatedData) => {
    setData(updatedData);
  });

  return () => {
    socket.off("memories_updated");
  };
}, []);

 const submitMemory = (e) => {
  e.preventDefault();

  if (!input.trim()) return;

  socket.emit("add_core_memory", {
    user: username,
    text: input.trim()
  });

  setInput("");
};

  const deleteMem = (user, id) => socket.emit("delete_core_memory", { user, id });

  return (
    <div className="p-4 bg-slate-950 min-h-screen text-white">
      <h2 className="text-center text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500 mb-8">CORE MEMORY VAULT</h2>
      
      <form onSubmit={submitMemory} className="max-w-md mx-auto mb-8 flex gap-2">
        <input className="flex-1 bg-slate-900 border border-slate-700 p-2 rounded-lg" placeholder="Write a core memory..." value={input} onChange={(e) => setInput(e.target.value)} />
        <button className="bg-pink-600 px-4 rounded-lg font-bold">Post</button>
      </form>

      <div className="grid grid-cols-2 gap-4">
        {/* Sharu's Side */}
        <div className="bg-slate-900 p-4 rounded-2xl border-t-4 border-pink-500">
          <h3 className="font-bold text-pink-500 mb-4">Sharu's Vault</h3>
          {data.sharu.map(m => (
            <div key={m.id} className="bg-slate-800 p-3 mb-2 rounded-lg text-sm relative group">
              {m.text}
              <button onClick={() => deleteMem("sharu", m.id)}className="absolute top-1 right-1 text-slate-500 hover:text-red-400 text-xs">✕</button>
            </div>
          ))}
        </div>

        {/* Akkshu's Side */}
        <div className="bg-slate-900 p-4 rounded-2xl border-t-4 border-purple-500">
          <h3 className="font-bold text-purple-500 mb-4">Akkshu's Vault</h3>
          {data.akkshu.map(m => (
            <div key={m.id} className="bg-slate-800 p-3 mb-2 rounded-lg text-sm relative group">
              {m.text}
              <button onClick={() => deleteMem("akkshu", m.id)} className="absolute top-1 right-1 text-slate-500 hover:text-red-400 text-xs">✕</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Memories;