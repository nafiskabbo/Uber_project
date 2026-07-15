import React, { useState, useEffect } from 'react';

function ChatBargain({ 
  selectedDriver, 
  onAcceptRide, 
  isRideAccepted, 
  waitTime, 
  loadingTimePrediction, 
  messages,      // App.jsx থেকে আসা গ্লোবাল মেসেজ স্টেট
  onSendMessage  // App.jsx থেকে আসা গ্লোবাল সেন্ড ফাংশন
}) {
  const [inputText, setInputText] = useState('');
  const [currentOffer, setCurrentOffer] = useState(selectedDriver.basePrice);

  // ড্রাইভার যদি টেক্সটে নতুন কোনো ভাড়ার অফার পাঠায়, তবে স্ক্রিনের প্রাইস ট্যাগ আপডেট করা
  useEffect(() => {
    if (messages.length === 0) return;
    
    // সর্বশেষ মেসেজটি চেক করা
    const lastMessage = messages[messages.length - 1];
    
    // মেসেজটি যদি ড্রাইভারের কাছ থেকে আসে এবং তাতে কোনো সংখ্যা থাকে
    if (lastMessage.sender === 'Driver') {
      const priceMatch = lastMessage.text.match(/\d+/);
      if (priceMatch) {
        setCurrentOffer(parseInt(priceMatch[0]));
      }
    }
  }, [messages]);

  // মেসেজ সাবমিট হ্যান্ডলার
  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    // ১. প্যারেন্টের গ্লোবাল মেথডের মাধ্যমে WebSocket-এ মেসেজ পাঠানো
    onSendMessage(inputText);

    // ২. কাস্টমার নিজে কোনো সংখ্যা (টাকা) লিখলে লোকাল অফার স্টেট আপডেট করা
    const offerMatch = inputText.match(/\d+/);
    if (offerMatch) {
      setCurrentOffer(parseInt(offerMatch[0]));
    }

    setInputText('');
  };

  return (
    <div className="chat-bargain-container glass-card">
      <div className="chat-header">
        <h3>💬 Chat with {selectedDriver.name}</h3>
        <div className="current-price-tag">{currentOffer} TK</div>
      </div>
      
      <div className="chat-box" style={{ height: '200px', overflowY: 'auto' }}>
        {messages.map((msg, idx) => (
          <div key={idx} className={`message-bubble ${msg.sender.toLowerCase()}`}>
            <span className="sender-name">{msg.sender === 'Customer' ? 'You' : msg.sender}</span>
            <p className="message-text">{msg.text}</p>
          </div>
        ))}
      </div>

      {!isRideAccepted ? (
        <div className="chat-actions-footer">
          <form onSubmit={handleFormSubmit} className="chat-input-form">
            <input 
              type="text" 
              placeholder="Type counter offer or message..." 
              value={inputText} 
              onChange={(e) => setInputText(e.target.value)}
            />
            <button type="submit">Send</button>
          </form>

          <button 
            className="accept-ride-btn-interactive pulse-glow" 
            onClick={() => onAcceptRide(currentOffer)}
            disabled={loadingTimePrediction}
          >
            {loadingTimePrediction ? '🔄 Fetching ML Wait Time...' : `🤝 Accept Ride & Calculate Time (${currentOffer} TK)`}
          </button>
        </div>
      ) : (
        <div className="ride-confirmed-banner">
          🎉 Ride Booked! 
          {waitTime !== null && (
            <div style={{ marginTop: '10px', color: '#000', background: '#fff', padding: '8px', borderRadius: '4px' }}>
              ⏱️ Estimated Trip Duration: {waitTime.toFixed(1)} mins
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ChatBargain;