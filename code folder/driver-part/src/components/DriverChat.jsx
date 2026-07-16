import React, { useState, useEffect, useRef } from 'react';

/**
 * 🚀 ফিক্স নোট (গুরুত্বপূর্ণ):
 * আগে এই ফাইলটিতে ভুল করে DriverControlPanel-এর কোড কপি হয়েছিল,
 * এবং ভিতরে `import DriverChat from './DriverChat'` ছিল → নিজেকেই ইমপোর্ট (সার্কুলার)।
 * ফলে লগইনের পর রেন্ডার লুপ হতো এবং Chrome বলতো "This page is slowing down"।
 *
 * এখন এটি শুধুমাত্র চ্যাট UI — WebSocket App.jsx-এ থাকে।
 * props: messages, onSendReply, isConfirmedByCustomer, myName
 */
function DriverChat({ messages = [], onSendReply, isConfirmedByCustomer, myName }) {
  const [inputText, setInputText] = useState('');
  const chatEndRef = useRef(null);

  // নতুন মেসেজ এলে অটো-স্ক্রল নিচে
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text || !onSendReply) return;
    // প্যারেন্টের handleSendReply → WebSocket দিয়ে কাস্টমারকে পাঠাবে
    onSendReply(text);
    setInputText('');
  };

  return (
    <div className="driver-chat glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
      <div className="chat-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0 }}>💬 Driver Chat</h3>
        {isConfirmedByCustomer && (
          <span style={{ color: '#00e676', fontSize: '12px' }}>Ride Confirmed</span>
        )}
      </div>

      <div className="chat-box">
        {messages.length === 0 ? (
          <p style={{ color: '#888', fontSize: '13px', textAlign: 'center', marginTop: '40px' }}>
            Waiting for customer messages...
          </p>
        ) : (
          messages.map((msg, idx) => {
            const isMine = msg.sender === myName;
            return (
              <div
                key={idx}
                className={`message-bubble ${isMine ? 'driver' : 'customer'}`}
              >
                <span className="sender-name" style={{ fontSize: '11px', opacity: 0.8, display: 'block' }}>
                  {isMine ? 'You' : msg.sender}
                </span>
                <p className="message-text" style={{ margin: '2px 0 0' }}>{msg.text}</p>
              </div>
            );
          })
        )}
        <div ref={chatEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="chat-input-form">
        <input
          type="text"
          placeholder="Type a reply or fare offer..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
        />
        <button type="submit" style={{ background: '#00e676', color: '#000', fontWeight: 'bold' }}>
          Send
        </button>
      </form>
    </div>
  );
}

export default DriverChat;
