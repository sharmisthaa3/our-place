import { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import { FaPaperPlane, FaMicrophone, FaPaintBrush, FaTimes, FaPalette, FaTrash } from "react-icons/fa";

const socket = io("https://explains-feeding-mental-flex.trycloudflare.com");
const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [wallpaper, setWallpaper] = useState("bg-pink-50");
  const username = localStorage.getItem("username") || "Sharmi";
  
  // Audio & Drawing Modal States
  const [isDrawing, setIsDrawing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  
  const messagesEndRef = useRef(null);
  const canvasRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const isPaintingRef = useRef(false);

useEffect(() => {
  fetch(`${SERVER_URL}/api/chat`)
    .then((res) => res.json())
    .then((data) => setMessages(data))
    .catch((err) => console.log(err));

  socket.on("receive_message", (message) => {
    setMessages((prev) => [...prev, message]);
  });

  socket.on("message_reacted", ({ messageId, reactions }) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId
          ? { ...msg, reactions }
          : msg
      )
    );
  });

  return () => {
    socket.off("receive_message");
    socket.off("message_reacted");
  };
}, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // WALLPAPER ROTATOR
  const toggleWallpaper = () => {
    const papers = ["bg-pink-50", "bg-gradient-to-b from-indigo-100 to-pink-100", "bg-slate-900", "bg-amber-50/60"];
    const currentIdx = papers.indexOf(wallpaper);
    setWallpaper(papers[(currentIdx + 1) % papers.length]);
  };

  // ACTIONS: SEND TEXT
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;
  socket.emit("send_message", {
  id: Date.now(),
  sender: username,
  text: inputMessage.trim(),
  type: "text",
  timestamp: new Date(),
  reactions: {}
});
    setInputMessage("");
  };

  // ACTIONS: REACTION SYSTEM (Double Tap / Double Click)
  const handleDoubleTap = (messageId) => {
    socket.emit("react_message", { messageId, username, emoji: "❤️" });
  };

  // AUDIO ENGINE: RECORDING VOICE NOTES
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          socket.emit("send_message", {
  id: Date.now(),
  sender: username,
  type: "audio",
  mediaUrl: reader.result,
  timestamp: new Date(),
  reactions: {}
});
        };
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      alert("Microphone permission denied or unsupported on this device.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  // DRAWING ENGINE: CANVAS DRAW AND SEND
  const startPainting = (e) => {
    isPaintingRef.current = true;
    draw(e);
  };

  const stopPainting = () => {
    isPaintingRef.current = false;
    canvasRef.current.getContext("2d").beginPath();
  };

  const draw = (e) => {
    if (!isPaintingRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    
    // Support both mouse and mobile touch inputs
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#db2777"; // Hot pink brush strokes

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const sendDrawing = () => {
    const dataUrl = canvasRef.current.toDataURL("image/png");
    socket.emit("send_message", {
  id: Date.now(),
  sender: username,
  type: "drawing",
  mediaUrl: dataUrl,
  timestamp: new Date(),
  reactions: {}
});
    setIsDrawing(false);
  };

  return (
    <div className={`flex flex-col h-full transition-colors duration-300 ${wallpaper}`}>
      
      {/* Dynamic Sub-header Customizer bar */}
      <div className="bg-white/80 backdrop-blur-md px-4 py-2 flex justify-between items-center border-b border-pink-100 shadow-sm shrink-0">
        <span className="text-xs font-bold text-pink-600">⚡ Live Workspace</span>
        <div className="flex gap-3">
          <button onClick={toggleWallpaper} className="text-gray-500 hover:text-pink-600 transition p-1" title="Change Theme Background">
            <FaPalette size={16} />
          </button>
          <button onClick={() => setIsDrawing(true)} className="text-gray-500 hover:text-pink-600 transition p-1" title="Draw and Send Sketch">
            <FaPaintBrush size={15} />
          </button>
        </div>
      </div>

      {/* Message Stream Streamer Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-2xl w-full mx-auto select-none">
        {messages.map((msg) => {
          const isMe = msg.sender === username;
          const uniqueReactions = Object.values(msg.reactions || {});

          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
              <span className={`text-[10px] mb-0.5 px-1 font-semibold ${wallpaper === "bg-slate-900" ? "text-gray-400" : "text-gray-500"}`}>{msg.sender}</span>
              
              {/* Double-tap interactive bubble */}
              <div 
                onDoubleClick={() => handleDoubleTap(msg.id)}
                onTouchEnd={(e) => {
                  // Quick touch implementation helper for double tap on mobile
                  if (!e.currentTarget.lastTap) { e.currentTarget.lastTap = Date.now(); return; }
                  if (Date.now() - e.currentTarget.lastTap < 300) { handleDoubleTap(msg.id); }
                  e.currentTarget.lastTap = Date.now();
                }}
                className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 shadow-sm relative transition-all ${
                  isMe ? "bg-pink-500 text-white rounded-tr-none" : "bg-white text-gray-800 rounded-tl-none border border-pink-100"
                }`}
              >
                {/* RENDER LOGIC BASED ON MESSAGE TYPE */}
                {msg.type === "text" && <p className="text-sm break-words whitespace-pre-wrap">{msg.text}</p>}
                
                {msg.type === "drawing" && (
                  <img src={msg.mediaUrl} alt="Sister Drawing" className="rounded-lg max-w-full h-auto bg-white border border-pink-50 p-1" />
                )}

                {msg.type === "audio" && (
                  <audio src={msg.mediaUrl} controls className="w-full max-w-[210px] h-8 accent-pink-600 mt-1" />
                )}

                <span className={`block text-[9px] mt-1 text-right ${isMe ? "text-pink-200" : "text-gray-400"}`}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>

                {/* Render reaction badges pinned to the bottom right of the message bubble */}
                {uniqueReactions.length > 0 && (
                  <div className="absolute -bottom-2 right-2 bg-white px-1.5 py-0.5 rounded-full text-xs shadow-md border border-pink-50 flex gap-0.5">
                    {Array.from(new Set(uniqueReactions)).map((emoji, idx) => (
                      <span key={idx}>{emoji}</span>
                    ))}
                    {uniqueReactions.length > 1 && <span className="text-[9px] font-black text-gray-400">+{uniqueReactions.length}</span>}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Action Panel */}
      <form onSubmit={handleSendMessage} className="bg-white p-3 border-t border-pink-100 shadow-xl fixed md:sticky bottom-16 md:bottom-0 left-0 right-0 z-40 shrink-0">
        <div className="max-w-2xl mx-auto flex items-center space-x-2">
          
          {/* AUDIO PUSH BUTTON CONTROLLER */}
          <button
            type="button"
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onTouchStart={(e) => { e.preventDefault(); startRecording(); }}
            onTouchEnd={(e) => { e.preventDefault(); stopRecording(); }}
            className={`p-3 rounded-full shadow transition shrink-0 ${isRecording ? "bg-red-500 text-white animate-ping" : "bg-purple-100 text-purple-600 hover:bg-purple-200"}`}
            title="Hold to Record Voice Memo"
          >
            <FaMicrophone size={14} />
          </button>

          <input
            type="text"
            className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
            placeholder={isRecording ? "Recording vocal file... release to send" : "Type a message..."}
            value={inputMessage}
            disabled={isRecording}
            onChange={(e) => setInputMessage(e.target.value)}
          />

          <button type="submit" disabled={isRecording || !inputMessage.trim()} className="bg-pink-500 hover:bg-pink-600 disabled:bg-gray-200 text-white p-3 rounded-full shadow transition shrink-0">
            <FaPaperPlane size={12} />
          </button>
        </div>
      </form>

      {/* SLIDING CANVAS DRAWING DRAWER DRAWER BOARD MODAL */}
      {isDrawing && (
        <div className="fixed inset-0 bg-black/60 z-50 flex flex-col items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-pink-100">
            <div className="bg-pink-600 px-5 py-3 text-white flex justify-between items-center font-bold text-sm">
              <span className="flex items-center gap-1.5"><FaPaintBrush /> Draw for Sis</span>
              <button onClick={() => setIsDrawing(false)} className="hover:bg-pink-700 p-1 rounded-full"><FaTimes size={16} /></button>
            </div>
            
            <canvas
              ref={canvasRef}
              width={340}
              height={340}
              onMouseDown={startPainting}
              onMouseUp={stopPainting}
              onMouseLeave={stopPainting}
              onMouseMove={draw}
              onTouchStart={startPainting}
              onTouchEnd={stopPainting}
              onTouchMove={draw}
              className="bg-gray-50 border-b border-gray-100 touch-none mx-auto block cursor-crosshair"
            />

            <div className="p-3 bg-gray-50 flex justify-between gap-2">
              <button 
                type="button" 
                onClick={() => {
                  const ctx = canvasRef.current.getContext("2d");
                  ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                }}
                className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-xl text-xs font-bold text-gray-600 flex items-center gap-1"
              >
                <FaTrash size={10} /> Clear
              </button>
              <button onClick={sendDrawing} className="bg-pink-500 hover:bg-pink-600 text-white font-bold text-xs px-5 py-2 rounded-xl shadow-md transition">
                Send Drawing ✨
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Chat;