import { useEffect, useRef, useState } from 'react';

export default function Home() {
  const [user, setUser] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [messages, setMessages] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [msgText, setMsgText] = useState('');
  const messagesRef = useRef();

  // Load from localStorage
  useEffect(()=>{
    const u = JSON.parse(localStorage.getItem('sc_user') || 'null');
    const r = JSON.parse(localStorage.getItem('sc_rooms') || '[]');
    const m = JSON.parse(localStorage.getItem('sc_messages') || '[]');
    setUser(u);
    setRooms(r);
    setMessages(m);
  }, []);

  useEffect(()=>{
    if(activeRoom) scrollMessages();
  }, [messages, activeRoom]);

  function saveAll(newUser, newRooms, newMessages){
    if(newUser) localStorage.setItem('sc_user', JSON.stringify(newUser));
    if(newRooms) localStorage.setItem('sc_rooms', JSON.stringify(newRooms));
    if(newMessages) localStorage.setItem('sc_messages', JSON.stringify(newMessages));
  }

  function scrollMessages(){
    setTimeout(()=>{ 
      if(messagesRef.current) messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    },50);
  }

  function handleLogin(id, displayName){
    const u = { userId: id, displayName };
    setUser(u);
    saveAll(u);
  }

  function createRoom(name){
    const slug = Math.random().toString(36).substring(2,8);
    const r = { name: name||'Room '+slug, slug };
    const newRooms = [...rooms, r];
    setRooms(newRooms);
    saveAll(null,newRooms);
    setActiveRoom(r);
  }

  function joinRoom(slug){
    const r = rooms.find(r=>r.slug===slug);
    if(!r) return alert('No room found');
    setActiveRoom(r);
  }

  function sendMessage(){
    if(!activeRoom || !msgText.trim()) return;
    const m = { room: activeRoom.slug, userId: user.userId, displayName: user.displayName, text: msgText };
    const newMessages = [...messages, m];
    setMessages(newMessages);
    saveAll(null,null,newMessages);
    setMsgText('');
  }

  function exportData(){
    const data = {user, rooms, messages};
    const blob = new Blob([JSON.stringify(data, null,2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download='system_contact.json'; a.click();
    URL.revokeObjectURL(url);
  }

  function importData(e){
    const file = e.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = function(){ 
      const data = JSON.parse(reader.result);
      if(data.user) setUser(data.user);
      if(data.rooms) setRooms(data.rooms);
      if(data.messages) setMessages(data.messages);
      saveAll(data.user,data.rooms,data.messages);
    }
    reader.readAsText(file);
  }

  return (
    <div className="app">
      <div className="sidebar">
        <div className="brand">
          <div className="logo">SC</div>
          <div>
            System Contact<br/><small style={{opacity:0.6}}>Red • White • Black</small>
          </div>
        </div>

        {!user ? (
          <div>
            <input placeholder="Your ID" id="loginId"/>
            <input placeholder="Display Name" id="loginName"/>
            <button className="btn" onClick={()=>{
              const id=document.getElementById('loginId').value.trim();
              const name=document.getElementById('loginName').value.trim()||id;
              if(!id) return alert('Enter ID');
              handleLogin(id,name);
            }}>Login / Create</button>
          </div>
        ) : (
          <>
          <button className="btn small" onClick={()=>createRoom(prompt('Room Name'))}>New Room</button>
          <input placeholder="Join Room by Code" onKeyDown={e=>{if(e.key==='Enter') joinRoom(e.target.value)}}/>
          <div className="room-list">
            {rooms.map(r=>(
              <div key={r.slug} className="room" onClick={()=>joinRoom(r.slug)}>
                {r.name}<br/><small style={{opacity:0.6}}>Code: {r.slug}</small>
              </div>
            ))}
          </div>
          <div style={{marginTop:8}}>
            <button className="btn small" onClick={exportData}>Export Data</button>
            <input type="file" onChange={importData}/>
          </div>
          </>
        )}
      </div>

      <div className="main">
        <div className="header">
          <div>
            <div>{activeRoom ? activeRoom.name : 'No Room Selected'}</div>
            <div style={{fontSize:12,opacity:0.6}}>{activeRoom ? 'Code: '+activeRoom.slug : ''}</div>
          </div>
        </div>

        <div className="chat">
          <div className="messages" ref={messagesRef}>
            {messages.filter(m=>activeRoom && m.room===activeRoom.slug).map((m,i)=>(
              <div key={i} className={`message ${m.userId===user?.userId?'me':''}`}>
                <div className="bubble">
                  <b>{m.userId===user?.userId?'You':m.displayName}</b><br/>
                  {m.text}
                </div>
              </div>
            ))}
          </div>
          <div className="msg-input">
            <input value={msgText} disabled={!activeRoom} onChange={e=>setMsgText(e.target.value)} placeholder="Type message..." onKeyDown={e=>{if(e.key==='Enter') sendMessage()}}/>
            <button className="btn" onClick={sendMessage} disabled={!activeRoom}>Send</button>
          </div>
        </div>
      </div>
    </div>
  )
}
