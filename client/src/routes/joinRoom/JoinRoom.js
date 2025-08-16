import { useState, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { v4 as uuidv4, validate } from 'uuid';
import { Toaster, toast } from 'react-hot-toast';
import ThemeToggle from '../../components/ThemeToggle/ThemeToggle';
import '../../styles/theme.css';
import './JoinRoom.css'

export default function JoinRoom() {
    const navigate = useNavigate()
    const [roomId, setRoomId] = useState(() => "")
    const [username, setUsername] = useState(() => "")
    const [isCreatingRoom, setIsCreatingRoom] = useState(false)
    const roomInputRef = useRef(null)

    function handleRoomSubmit(e) {
        e.preventDefault()
        if (!validate(roomId)) {
            toast.error("Incorrect room ID")
            return
        }
        username && navigate(`/room/${roomId}`, { state: { username } })
    }

    function createRoomId(e) {
        try {
            setIsCreatingRoom(true);
            const newRoomId = uuidv4();
            setRoomId(newRoomId);
            
            // Highlight the input
            if (roomInputRef.current) {
                roomInputRef.current.classList.add('highlight');
                setTimeout(() => {
                    roomInputRef.current?.classList.remove('highlight');
                }, 1000);
            }

            // Copy to clipboard
            navigator.clipboard.writeText(newRoomId)
                .then(() => {
                    toast.success("Room created and ID copied to clipboard!");
                })
                .catch(() => {
                    toast.success("Room created!");
                });

        } catch (exp) {
            console.error(exp);
            toast.error("Failed to create room");
        } finally {
            setIsCreatingRoom(false);
        }
    }

    return (
        <div className="joinBoxWrapper">
            <div className="joinBox">
                <div style={{ position: 'absolute', top: '20px', right: '20px' }}>
                    <ThemeToggle />
                </div>
                
                <h1 className="joinBoxTitle">Welcome to CodeCollab</h1>
                <p className="joinBoxSubtitle">Real-time collaborative code editor</p>

                <form onSubmit={handleRoomSubmit}>
                    <div className="joinBoxInputWrapper">
                        <input
                            className="joinBoxInput"
                            id="roomIdInput"
                            type="text"
                            placeholder="Enter room ID"
                            required
                            onChange={(e) => { setRoomId(e.target.value.trim()) }}
                            value={roomId}
                            autoSave="off"
                            autoComplete="off"
                            ref={roomInputRef}
                            aria-label="Room ID"
                        />
                        <label htmlFor="roomIdInput" className="joinBoxWarning">
                            {!roomId ? "Room ID required" : 
                             !validate(roomId) ? "Invalid room ID format" : ""}
                        </label>
                    </div>

                    <div className="joinBoxInputWrapper">
                        <input
                            className="joinBoxInput"
                            id="usernameInput"
                            type="text"
                            placeholder="Enter your name"
                            required
                            value={username}
                            onChange={e => { setUsername(e.target.value.trim()) }}
                            autoSave="off"
                            autoComplete="off"
                            maxLength={20}
                            aria-label="Username"
                        />
                        <label htmlFor="usernameInput" className="joinBoxWarning">
                            {!username ? "Please enter your name" : ""}
                        </label>
                    </div>

                    <button 
                        className="joinBoxBtn" 
                        type="submit"
                        disabled={!roomId || !username || !validate(roomId)}
                        aria-label="Join room"
                    >
                        Join Room
                    </button>
                </form>

                <p className="createRoomText">
                    Don't have an invite code? {' '}
                    <button
                        className="createRoomLink"
                        onClick={createRoomId}
                        disabled={isCreatingRoom}
                        aria-label="Create new room"
                    >
                        Create your own room
                    </button>
                </p>
            </div>
            <Toaster 
                position="bottom-center"
                toastOptions={{
                    duration: 3000,
                    style: {
                        background: 'var(--surface-color)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border-color)'
                    }
                }}
            />
        </div>
    )
}