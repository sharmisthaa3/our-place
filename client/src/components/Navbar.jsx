import { Link, useLocation } from "react-router-dom";
import { FaHeart, FaComment, FaGamepad, FaHome, FaImages, FaUserCircle } from "react-icons/fa";

const Navbar = ({ onLogout }) => {
  const username = localStorage.getItem("username");
  const location = useLocation();

  const isActive = (path) => location.pathname === path 
    ? "text-pink-600 md:text-pink-200 font-bold scale-110" 
    : "text-gray-400 md:text-pink-100 hover:text-pink-200";

  return (
    <nav className="bg-white md:bg-pink-600 border-t md:border-t-0 border-gray-100 shadow-lg md:shadow-md px-4 md:px-6 py-2 md:py-3 flex justify-around md:justify-between items-center fixed bottom-0 left-0 right-0 md:relative z-50 h-16 md:h-auto select-none">
      {/* Laptop Brand Logo Header */}
      <div className="hidden md:flex items-center space-x-2 text-xl font-black tracking-wider text-white">
        <FaHeart className="animate-pulse" />
        <span>OUR PLACE</span>
      </div>
      
      {/* Navigation Tabs - Responsive Layout */}
      <div className="flex items-center justify-around w-full md:w-auto space-x-0 md:space-x-8 font-medium text-xs md:text-sm">
        <Link to="/chat" className={`flex flex-col md:flex-row items-center space-y-1 md:space-y-0 md:space-x-1.5 transition ${isActive("/chat")}`}>
          <FaComment size={20} className="md:w-4 md:h-4" /> <span>Chat</span>
        </Link>
        <Link to="/room" className={`flex flex-col md:flex-row items-center space-y-1 md:space-y-0 md:space-x-1.5 transition ${isActive("/room")}`}>
          <FaHome size={20} className="md:w-4 md:h-4" /> <span>Room</span>
        </Link>
        <Link to="/games" className={`flex flex-col md:flex-row items-center space-y-1 md:space-y-0 md:space-x-1.5 transition ${isActive("/games")}`}>
          <FaGamepad size={20} className="md:w-4 md:h-4" /> <span>Games</span>
        </Link>
        <Link to="/memories" className={`flex flex-col md:flex-row items-center space-y-1 md:space-y-0 md:space-x-1.5 transition ${isActive("/memories")}`}>
          <FaImages size={20} className="md:w-4 md:h-4" /> <span>Memories</span>
        </Link>
        
        {/* Mobile quick profile trigger */}
        <button onClick={onLogout} className="flex flex-col items-center space-y-1 text-gray-400 md:hidden">
          <FaUserCircle size={20} /> <span className="text-[10px] truncate">{username}</span>
        </button>
      </div>

      {/* Laptop Profile Block */}
      <div className="hidden md:flex items-center space-x-3 text-white">
        <span className="bg-pink-700 text-xs px-3 py-1 rounded-full font-bold shadow-inner">
          ✨ {username}
        </span>
        <button onClick={onLogout} className="text-xs bg-pink-700 hover:bg-pink-800 px-3 py-1 rounded-lg transition font-medium">
          Switch
        </button>
      </div>
    </nav>
  );
};

export default Navbar;