import { FaComments, FaGamepad, FaHome, FaImages } from "react-icons/fa";

function Home() {
  return (
    <div className="min-h-screen bg-black text-white p-10">

      <h1 className="text-5xl font-bold text-pink-400 mb-10">
        Our Place 💖
      </h1>

      <div className="grid grid-cols-2 gap-8">

        <div className="bg-pink-500/20 p-8 rounded-3xl hover:scale-105 transition-all cursor-pointer">
          <FaComments className="text-5xl mb-4 text-pink-400" />
          <h2 className="text-3xl font-bold">Chat</h2>
          <p className="text-gray-300 mt-2">
            Private real-time messaging
          </p>
        </div>

        <div className="bg-blue-500/20 p-8 rounded-3xl hover:scale-105 transition-all cursor-pointer">
          <FaHome className="text-5xl mb-4 text-blue-400" />
          <h2 className="text-3xl font-bold">Room</h2>
          <p className="text-gray-300 mt-2">
            Decorate your shared virtual home
          </p>
        </div>

        <div className="bg-green-500/20 p-8 rounded-3xl hover:scale-105 transition-all cursor-pointer">
          <FaGamepad className="text-5xl mb-4 text-green-400" />
          <h2 className="text-3xl font-bold">Games</h2>
          <p className="text-gray-300 mt-2">
            Play cute multiplayer games
          </p>
        </div>

        <div className="bg-yellow-500/20 p-8 rounded-3xl hover:scale-105 transition-all cursor-pointer">
          <FaImages className="text-5xl mb-4 text-yellow-400" />
          <h2 className="text-3xl font-bold">Memories</h2>
          <p className="text-gray-300 mt-2">
            Photos, notes and moments together
          </p>
        </div>

      </div>

    </div>
  );
}

export default Home;