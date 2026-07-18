import React, { useState, useEffect, useRef } from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';
import MapView from './components/MapView';
import DriverControlPanel from './components/DriverControlPanel';
import DriverChat from './components/DriverChat';
import Login from './components/Login';
import Register from './components/Register';
import './App.css';

// Vite env থেকে Google Maps কী রিড করা হচ্ছে
// 🚀 ফিক্স: কী না থাকলে APIProvider মাউন্ট করা যাবে না — নাহলে ম্যাপ লাইব্রেরি হ্যাং/স্লো করে
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

function App() {
  const defaultPosition = { lat: 24.3636, lng: 88.6241 }; // Rajshahi fallback

  // ---- ১. স্টেটসমূহ ----
  const [user, setUser] = useState(null); // { name: '...', role: 'Driver' }
  const [isRegistering, setIsRegistering] = useState(false);

  const [activeRequest, setActiveRequest] = useState(null); // { customer_name, pickup, dropoff }
  const [messages, setMessages] = useState([]);
  const [isConfirmedByCustomer, setIsConfirmedByCustomer] = useState(false);

  // 🚀 পিওর ওয়েবসকেট হ্যান্ডেল করার জন্য useRef (রি-রেন্ডারে কানেকশন হারাবে না)
  const ws = useRef(null);

  // ---- ২. ডাইনামিক চ্যাট কানেকশন (লগইনের পরেই) 🔒 ----
  // কেন এখানে রাখা হলো: আগে DriverControlPanel-এও আলাদা WebSocket ছিল।
  // দুই জায়গায় সকেট খুললে ডুপ্লিকেট রেজিস্ট্রেশন/মেসেজ হয় — তাই একমাত্র সোর্স App.jsx।
  useEffect(() => {
    if (!user) return; // ইউজার লগইন না করা পর্যন্ত ওয়েবসকেট কানেক্ট হবে না

    // ব্যাকএন্ড পোর্ট ৮০০০ অনুযায়ী কানেকশন
    ws.current = new WebSocket("ws://127.0.0.1:8000/ws/chat");

    ws.current.onopen = () => {
      console.log(`✓ Connected to chat server as Driver: ${user.name}`);
      // ব্যাকএন্ডে ড্রাইভার হিসেবে নিজের নাম রেজিস্টার করা (action: "register" বাধ্যতামূলক)
      ws.current.send(JSON.stringify({
        sender: user.name,
        action: "register"
      }));
    };

    // 🎯 ws.current.onmessage: যে কাস্টমার প্রথম মেসেজ পাঠাবে, activeRequest তার নামে তৈরি হবে
    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const text = data.msg || data.text;
        if (!data.sender || !text) return;

        // 🚀 ফিক্স: ব্যাকএন্ড "System" অ্যাক (Connected / offline notice) কাস্টমার নয়।
        // আগে System-কে activeRequest বানিয়ে রিপ্লাই target="System" হতো → "System অফলাইন" এরর।
        const isSystem = data.sender === "System";

        if (!isSystem) {
          setActiveRequest(prev => {
            if (!prev || prev.customer_name === "System") {
              return {
                customer_name: data.sender,
                pickup: data.pickup || { lat: 24.3745, lng: 88.6042 },
                dropoff: data.dropoff || { lat: 24.3945, lng: 88.6242 }
              };
            }
            return prev;
          });
        }

        setMessages((prev) => [...prev, {
          sender: data.sender,
          text
        }]);
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
    if (!user) return;

    // আসল কাস্টমার না থাকলে পাঠাবে না (System টার্গেট ব্লক)
    const targetCustomer = activeRequest?.customer_name;
    if (!targetCustomer || targetCustomer === "System") {
      alert("এখনো কোনো কাস্টমার মেসেজ পাঠায়নি। আগে কাস্টমার অ্যাপ থেকে মেসেজ আসুক।");
      return;
    }

    // নিজের স্ক্রিনে মেসেজ পুশ করা
    setMessages(prev => [...prev, { sender: user.name, text: replyText }]);

    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        sender: user.name,
        target: targetCustomer, // 🚀 টার্গেট = যে কাস্টমার মেসেজ দিয়েছিল
        text: replyText,
        msg: replyText
      }));
    } else {
      alert("চ্যাট সার্ভারের সাথে কোনো কানেকশন নেই!");
    }
  };

  // ---- ৪. গেটওয়ে: লগইন / রেজিস্ট্রেশন ----
  if (!user) {
    if (isRegistering) {
      return (
        <Register
          onRegisterSuccess={(driverName) => {
            // রেজিস্ট্রেশন সফল হলে সরাসরি ড্যাশবোর্ডে ঢোকানো
            localStorage.setItem('driverName', driverName);
            setUser({ name: driverName, role: 'Driver' });
            setIsRegistering(false);
          }}
          switchToLogin={() => setIsRegistering(false)}
        />
      );
    }

    return (
      <Login
        // 🚀 ফিক্স: লগইন সফল হলে নাম localStorage-এ রাখা (পুরনো কোড যেখানে driverName পড়তো)
        onLoginComplete={(userData) => {
          localStorage.setItem('driverName', userData.name);
          setUser(userData);
        }}
        switchToRegister={() => setIsRegistering(true)}
      />
    );
  }

  // ---- ৫. মূল ড্যাশবোর্ড UI ----
  // 🚀 ফিক্স কেন: আগে DriverChat.jsx ফাইলে ভুল করে DriverControlPanel-এর কোড ছিল,
  // এবং সেটা নিজেকেই import করতো → সার্কুলার ইমপোর্ট → Chrome "page is slowing down"।
  // এখন: ControlPanel শুধু UI শেল, Chat শুধু প্রেজেন্টেশন, WebSocket শুধু App-এ।
  const dashboard = (
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

      {/* কী না থাকলে ম্যাপ স্কিপ — undefined apiKey দিয়ে APIProvider হ্যাং হতে পারে */}
      {GOOGLE_MAPS_API_KEY ? (
        <MapView
          defaultPosition={defaultPosition}
          pointB={activeRequest?.pickup}
          pointC={activeRequest?.dropoff}
        />
      ) : (
        <div className="map-view" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
          Add VITE_GOOGLE_MAPS_API_KEY to enable the map.
        </div>
      )}
    </div>
  );

  if (!GOOGLE_MAPS_API_KEY) {
    return dashboard;
  }

  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
      {dashboard}
    </APIProvider>
  );
}

export default App;
