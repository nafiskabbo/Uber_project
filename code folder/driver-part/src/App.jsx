import React, { useState, useEffect, useRef } from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';
import MapView from './components/MapView';
import DriverControlPanel from './components/DriverControlPanel';
import DriverChat from './components/DriverChat';
import Login from './components/Login'; 
import Register from './components/Register'; 
import './App.css';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

function App() {
  const defaultPosition = { lat: 24.3636, lng: 88.6241 }; // Rajshahi

  // ---- ১. স্টেটসমূহ ----
  const [user, setUser] = useState(null); // { name: '...', role: 'Driver' }
  const [isRegistering, setIsRegistering] = useState(false); 

  const [activeRequest, setActiveRequest] = useState(null); // { customer_name: '...', pickup: {...}, dropoff: {...} }
  const [messages, setMessages] = useState([]);
  const [isConfirmedByCustomer, setIsConfirmedByCustomer] = useState(false);
  
  // 🚀 পিওর ওয়েবসকেট হ্যান্ডেল করার জন্য useRef
  const ws = useRef(null); 

  // ---- ২. ডাইনামিক চ্যাট কানেকশন (ws.current.onmessage সহ) 🔒 ----
  useEffect(() => {
    if (!user) return; // ইউজার লগইন না করা পর্যন্ত ওয়েবসকেট কানেক্ট হবে না

    // আপনার ব্যাকএন্ড পোর্ট ৮০০০ অনুযায়ী কানেকশন
    ws.current = new WebSocket("ws://localhost:8000/ws/chat"); 

    ws.current.onopen = () => {
      console.log(`✓ Connected to chat server as Driver: ${user.name}`);
      // ব্যাকএন্ডে ড্রাইভার হিসেবে নিজের নাম রেজিস্টার করা
      ws.current.send(JSON.stringify({
        sender: user.name,
        action: "register" 
      }));
    };

    // 🎯 আপনার রিকোয়েস্ট অনুযায়ী ws.current.onmessage ব্লকটি ডায়নামিক করা হলো
    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // যদি কোনো কাস্টমার মেসেজ পাঠায়
        if (data.sender && (data.msg || data.text)) {
          
          // 🚀 ম্যাজিক লাইন: কোনো ফিক্সড নাম নেই! যে কাস্টমার প্রথম মেসেজ পাঠাবে, 
          // ড্রাইভারের 'activeRequest' অটোমেটিক তার নামে তৈরি হয়ে যাবে।
          setActiveRequest(prev => {
            if (!prev) {
              return {
                customer_name: data.sender,
                // কাস্টমার যদি ম্যাপের পয়েন্ট পাঠায় তবে সেট হবে, না হলে ডিফল্ট
                pickup: data.pickup || { lat: 24.3745, lng: 88.6042 }, 
                dropoff: data.dropoff || { lat: 24.3945, lng: 88.6242 }
              };
            }
            return prev;
          });

          // চ্যাটবক্সে কাস্টমারের মেসেজটি পুশ করা
          setMessages((prev) => [...prev, { 
            sender: data.sender, 
            text: data.msg || data.text 
          }]);
        }
      } catch (err) {
        console.error("Error parsing incoming message:", err);
      }
    };

    ws.current.onclose = () => {
      console.log("❌ Driver Chat server disconnected");
    };

    return () => {
      if (ws.current) ws.current.close();
    };
  }, [user]);

  // ---- ৩. ডাইনামিক মেসেজ রিপ্লাই ফাংশন ----
  const handleSendReply = (replyText) => {
    if (!user || !activeRequest) return;
  
    // নিজের স্ক্রিনে মেসেজ পুশ করা
    setMessages(prev => [...prev, { sender: user.name, text: replyText }]);
  
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        sender: user.name,
        target: activeRequest.customer_name, // 🚀 কাস্টমার যে নামে মেসেজ দিয়েছিল, টার্গেট অটোমেটিক সে!
        text: replyText,
        msg: replyText
      }));
    } else {
      alert("চ্যাট সার্ভারের সাথে কোনো কানেকশন নেই!");
    }
  };

  // ---- ৪. গেটওয়ে: লগইন এবং রেজিস্ট্রেশন স্ক্রিন কন্ডিশনাল রেন্ডারিং ----
  if (!user) {
    if (isRegistering) {
      return (
        <Register
          onRegisterSuccess={(driverName) => {
            setUser({ name: driverName, role: 'Driver' });
            setIsRegistering(false);
          }}
          switchToLogin={() => setIsRegistering(false)}
        />
      );
    }

    return (
      <Login
        onLoginComplete={(userData) => setUser(userData)}
        switchToRegister={() => setIsRegistering(true)} 
      />
    );
  }

  // ---- ৫. মূল ড্যাশবোর্ড UI ----
  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
      <div className="app-container">

        <DriverControlPanel
          activeRequest={activeRequest}
          isConfirmedByCustomer={isConfirmedByCustomer}
        >
          <DriverChat
            messages={messages}
            onSendReply={handleSendReply}
            isConfirmedByCustomer={isConfirmedByCustomer}
            myName={user.name} 
          />
        </DriverControlPanel>

        <MapView
          defaultPosition={defaultPosition}
          pointB={activeRequest?.pickup}
          pointC={activeRequest?.dropoff}
        />

      </div>
    </APIProvider>
  );
}

export default App;