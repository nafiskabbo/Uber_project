import React, { useState, useEffect, useRef } from 'react';
import DriverChat from "./DriverChat"; // একই ফোল্ডারে থাকা চ্যাট কম্পোনেন্টকে ইমপোর্ট করা হলো

function DriverControlPanel() {
  const [messages, setMessages] = useState([]);
  const [isConfirmed, setIsConfirmed] = useState(false);
  
  // ১. শুরুতে কাস্টমারের নাম খালি থাকবে, কাস্টমার মেসেজ দিলে এটি ডায়নামিকালি আপডেট হবে
  const [targetCustomer, setTargetCustomer] = useState(""); 
  
  const ws = useRef(null);
  
  // ২. এটি ডেটাবেজ থেকেই ডায়নামিকালি আসছে (লগইন করা ড্রাইভারের নাম)
  const myName = localStorage.getItem("driverName") || "Driver"; 

  useEffect(() => {
    // ব্যাকএন্ড WebSocket কানেকশন চালু করা
    ws.current = new WebSocket("ws://127.0.0.1:8000/ws/chat");

    ws.current.onopen = () => {
      console.log(`Connected to Backend as: ${myName}`);
      // কানেক্ট হয়েই ব্যাকএন্ডে নিজের নাম রেজিস্টার করা
      ws.current.send(JSON.stringify({ name: myName }));
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("Incoming WebSocket data:", data);

      // যদি ব্যাকএন্ড থেকে এরর আসে (যেমন কাস্টমার অফলাইন)
      if (data.msg === "error") {
        setMessages((prev) => [...prev, { 
          sender: "System", 
          text: `❌ মেসেজ যায়নি! কাস্টমার অফলাইন আছেন।` 
        }]);
        return;
      }

      // কাস্টমার থেকে আসা মেসেজ হ্যান্ডেল করা
      if (data.sender && data.msg) {
        // কাস্টমার মেসেজ পাঠালে তার আসল নাম ডায়নামিকালি ট্র্যাকিংয়ে রাখা
        if (data.sender !== myName) {
          setTargetCustomer(data.sender);
        }

        setMessages((prev) => [...prev, { 
          sender: data.sender, 
          text: data.msg 
        }]);
      }
    };

    return () => {
      if (ws.current) ws.current.close();
    };
  }, [myName]);

  // ড্রাইভার চ্যাটবক্স থেকে 'Send' বাটনে ক্লিক করলে এই ফাংশনটি চলবে
  const handleSendReply = (text) => {
    if (!text.trim()) return;

    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      const payload = {
        sender: myName,
        target: targetCustomer, 
        text: text
      };
      
      ws.current.send(JSON.stringify(payload));
      setMessages((prev) => [...prev, { sender: myName, text: text }]);
    } else {
      console.error("WebSocket is not open!");
    }
  };

  return (
    <div className="driver-dashboard" style={{ padding: '20px' }}>
      <h2>Driver Control Panel</h2>
      <div style={{ color: '#00e676', marginBottom: '10px' }}>
        🟢 Online as: <strong>{myName}</strong>
      </div>
      {targetCustomer && (
        <div style={{ color: '#aaa', fontSize: '14px', marginBottom: '10px' }}>
          💬 Chatting with: <strong>{targetCustomer}</strong>
        </div>
      )}
      
      {/* ম্যাপ বা অন্যান্য উইজেট এখানে থাকলে থাকবে */}
      {/* ... আপনার ম্যাপের কোড ... */}

      {/* ড্রাইভার চ্যাট কম্পোনেন্ট রেন্ডার */}
      <DriverChat 
        messages={messages} 
        onSendReply={handleSendReply} 
        isConfirmedByCustomer={isConfirmed}
        myName={myName}
      />
    </div>
  );
}

export default DriverControlPanel;