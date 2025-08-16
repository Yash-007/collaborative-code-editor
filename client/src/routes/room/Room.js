import { useEffect, useState } from "react";
import AceEditor from "react-ace";
import { Toaster, toast } from 'react-hot-toast';
import { useNavigate, useParams } from "react-router-dom";
import { generateColor } from "../../utils";
import ThemeToggle from "../../components/ThemeToggle/ThemeToggle";
import '../../styles/theme.css';
import './Room.css';


// imports from ace-builds 
import "ace-builds/src-noconflict/mode-javascript";
import "ace-builds/src-noconflict/mode-typescript";
import "ace-builds/src-noconflict/mode-python";
import "ace-builds/src-noconflict/mode-java";
import "ace-builds/src-noconflict/mode-yaml";
import "ace-builds/src-noconflict/mode-golang";
import "ace-builds/src-noconflict/mode-c_cpp";
import "ace-builds/src-noconflict/mode-html";
import "ace-builds/src-noconflict/mode-css";

import "ace-builds/src-noconflict/keybinding-emacs";
import "ace-builds/src-noconflict/keybinding-vim";

import "ace-builds/src-noconflict/theme-monokai";
import "ace-builds/src-noconflict/theme-github";
import "ace-builds/src-noconflict/theme-dracula";
import "ace-builds/src-noconflict/theme-solarized_dark";
import "ace-builds/src-noconflict/theme-solarized_light";
import "ace-builds/src-noconflict/ext-language_tools";
import "ace-builds/src-noconflict/ext-searchbox";
import Loader from "../../components/loader/Loader";


export default function Room({ socket }) {
  const navigate = useNavigate()
  const { roomId } = useParams()
  const [fetchedUsers, setFetchedUsers] = useState(() => [])
  const [fetchedCode, setFetchedCode] = useState(() => "")
  const [language, setLanguage] = useState(() => "javascript")
  const [codeKeybinding, setCodeKeybinding] = useState(() => undefined)
  const [editorTheme, setEditorTheme] = useState(() => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    return isDark ? 'dracula' : 'github';
  })
  
  const languagesAvailable = ["javascript", "java", "c_cpp", "python", "typescript", "golang", "yaml", "html"]
  const codeKeybindingsAvailable = ["default", "emacs", "vim"]
  const themesAvailable = ["github", "dracula", "monokai", "solarized_light", "solarized_dark"]

  // Update editor theme when system theme changes
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'data-theme') {
          const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
          setEditorTheme(isDark ? 'dracula' : 'github');
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });

    return () => observer.disconnect();
  }, []);

  function onChange(newValue) {
    setFetchedCode(newValue)
    socket.emit("update code", { roomId, code: newValue })
    socket.emit("syncing the code", { roomId: roomId })
  }

  function handleLanguageChange(e) {
    setLanguage(e.target.value)
    socket.emit("update language", { roomId, languageUsed: e.target.value })
    socket.emit("syncing the language", { roomId: roomId })
  }

  function handleCodeKeybindingChange(e) {
    setCodeKeybinding(e.target.value === "default" ? undefined : e.target.value)
  }

  function handleLeave() {
    socket.disconnect()
    !socket.connected && navigate('/', { replace: true, state: {} })
  }

  function copyToClipboard(text) {
    // Try the modern clipboard API first
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text)
        .then(() => toast.success('Room ID copied'))
        .catch(() => fallbackCopyToClipboard(text));
    } else {
      fallbackCopyToClipboard(text);
    }
  }

  function fallbackCopyToClipboard(text) {
    try {
      // Create a temporary input element
      const textArea = document.createElement('textarea');
      textArea.value = text;
      
      // Make it readonly to avoid mobile keyboard
      textArea.setAttribute('readonly', '');
      
      // Set styles to make it invisible but selectable
      textArea.style.position = 'fixed';
      textArea.style.top = '0';
      textArea.style.left = '0';
      textArea.style.opacity = '0';
      
      document.body.appendChild(textArea);
      
      // Handle iOS devices
      if (navigator.userAgent.match(/ipad|iphone/i)) {
        // Save current selection
        const range = document.createRange();
        range.selectNodeContents(textArea);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        textArea.setSelectionRange(0, 999999);
      } else {
        textArea.select();
      }
      
      document.execCommand('copy');
      document.body.removeChild(textArea);
      toast.success('Room ID copied');
    } catch (err) {
      console.error('Failed to copy: ', err);
      // If all else fails, show the room ID to user
      toast.error('Could not copy automatically. Room ID: ' + text);
    }
  }

  useEffect(() => {
    socket.on("updating client list", ({ userslist }) => {
          setFetchedUsers(userslist)
    })

    socket.on("on language change", ({ languageUsed }) => {
      setLanguage(languageUsed)
    })

    socket.on("on code change", ({ code }) => {
      setFetchedCode(code)
    })

    socket.on("new member joined", ({ username }) => {
      toast(`${username} joined`)
    })

    socket.on("member left", ({ username }) => {
      toast(`${username} left`)
    })

     // this code sets up an event listener for the "popstate" event, which is triggered when the
    //  user navigates through their browser's history (forward button or backward button). When the event occurs, it checks the state associated 
    // with the history entry. If the state doesn't contain the expected properties, it disconnects the socket.
    //  The cleanup function is returned to remove the event listener when the component is unmounted to 
    // ensure proper cleanup. 

    const backButtonEventListner = window.addEventListener("popstate", function (e) {
      const eventStateObj = e.state
      if (!('usr' in eventStateObj) || !('username' in eventStateObj.usr)) {
        socket.disconnect()
      }
    });

    return () => {
      window.removeEventListener("popstate", backButtonEventListner)
    }
  }, [socket])

  return (
    <>
     <div className="room">
      <div className="roomSidebar">
        <div className="roomControls">
          <ThemeToggle />
          <div className="languageFieldWrapper">
            <select 
              className="languageField" 
              name="language" 
              id="language" 
              value={language} 
              onChange={handleLanguageChange}
              aria-label="Select programming language"
            >
              {languagesAvailable.map(eachLanguage => (
                <option key={eachLanguage} value={eachLanguage}>{eachLanguage}</option>
              ))}
            </select>
          </div>

          <div className="languageFieldWrapper">
            <select 
              className="languageField" 
              name="codeKeybinding" 
              id="codeKeybinding" 
              value={codeKeybinding} 
              onChange={handleCodeKeybindingChange}
              aria-label="Select editor keybinding"
            >
              {codeKeybindingsAvailable.map(eachKeybinding => (
                <option key={eachKeybinding} value={eachKeybinding}>{eachKeybinding}</option>
              ))}
            </select>
          </div>

          <div className="languageFieldWrapper">
            <select 
              className="languageField" 
              name="editorTheme" 
              id="editorTheme" 
              value={editorTheme} 
              onChange={(e) => setEditorTheme(e.target.value)}
              aria-label="Select editor theme"
            >
              {themesAvailable.map(theme => (
                <option key={theme} value={theme}>{theme.replace('_', ' ')}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="roomSidebarUsersWrapper surface">
          <p>Connected Users:</p>
          <div className="roomSidebarUsers">
            {fetchedUsers.length ? fetchedUsers.map((each) => (
              <div key={each} className="roomSidebarUsersEach" role="listitem">
                <div 
                  className="roomSidebarUsersEachAvatar" 
                  style={{ backgroundColor: `${generateColor(each)}` }}
                  aria-label={`${each}'s avatar`}
                >
                  {each.slice(0, 2).toUpperCase()}
                </div>
                <div className="roomSidebarUsersEachName">{each}</div>
              </div>
            )) : <Loader/>}
          </div>
        </div>

        <div className="roomControls">
          <button 
            className="roomSidebarCopyBtn" 
            onClick={() => { copyToClipboard(roomId) }}
            data-tooltip="Copy room ID to clipboard"
            aria-label="Copy room ID"
          >
            Copy Room ID
          </button>
          <button 
            className="roomSidebarBtn" 
            onClick={handleLeave}
            data-tooltip="Leave the room"
            aria-label="Leave room"
          >
            Leave
          </button>
        </div>
      </div>

      <AceEditor
        placeholder="Write your code here."
        className="roomCodeEditor"
        mode={language}
        keyboardHandler={codeKeybinding}
        theme={editorTheme}
        name="collabEditor"
        width="auto"
        height="auto"
        value={fetchedCode}
        onChange={onChange}
        fontSize={15}
        showPrintMargin={true}
        showGutter={true}
        highlightActiveLine={true}
        enableLiveAutocompletion={true}
        enableBasicAutocompletion={false}
        enableSnippets={false}
        wrapEnabled={true}
        tabSize={2}
        editorProps={{
          $blockScrolling: true
        }}
        setOptions={{ useWorker: false }}
      />
      <Toaster />
    </div>
    </>
  )
}