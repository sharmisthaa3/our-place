import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";
import Navbar from "./components/Navbar";
import Chat from "./pages/Chat";
import Room from "./pages/Room";
import Games from "./pages/Games";
import Memories from "./pages/Memories";

function App() {
  const [user, setUser] = useState(localStorage.getItem("username") || "");

  if (!user) {
    return <WelcomeGate onJoin={(name) => {
      localStorage.setItem("username", name);
      setUser(name);
    }} />;
  }

  return (
    <Router>
      {/* Mobile-first layout engine */}
      <div className="flex flex-col h-[100dvh] bg-pink-50 text-gray-800 overflow-hidden">
        {/* Main Content View Port */}
        <div className="flex-1 overflow-y-auto pb-16 md:pb-0">
          <Routes>
            <Route path="/chat" element={<Chat />} />
            <Route path="/room" element={<Room />} />
            <Route path="/games" element={<Games />} />
            <Route path="/memories" element={<Memories />} />
            <Route path="*" element={<Navigate to="/chat" replace />} />
          </Routes>
        </div>
        
        {/* Smart Contextual Navigation */}
        <Navbar onLogout={() => {
          localStorage.removeItem("username");
          setUser("");
        }} />
      </div>
    </Router>
  );
}

function WelcomeGate({ onJoin }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-200 to-rose-400 flex items-center justify-center p-6">
      <div className="bg-white/90 backdrop-blur-md p-8 rounded-3xl shadow-xl w-full max-w-sm text-center border border-white/20">
        <h2 className="text-3xl font-black text-pink-600 mb-2 tracking-wide">Our Place 💖</h2>
        <p className="text-gray-500 text-xs mb-8 font-medium">Select your profile to enter our secret space</p>
        <div className="space-y-4">
          <button onClick={() => onJoin("Sharmi")} className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition">
            I am Sharmi 👩‍🦰
          </button>
          <button onClick={() => onJoin("Sister")} className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition">
            I am Sister 👩
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;