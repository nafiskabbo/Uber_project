import React, { useState, useEffect, useRef } from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';
import MapView from './components/MapView';
import ControlPanel from './components/ControlPanel';
import RideMatcher from './components/RideMatcher';
import ChatBargain from './components/ChatBargain';
import Login from './components/Login'; // ১. লগইন কম্পোনেন্ট ইম্পোর্ট
import { getAvailableDrivers, predictTripTime } from './services/driverService';
import './App.css';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

function App() {
  // ---- ১. স্টেটসমূহ ----
  const [user, setUser] = useState(null); 
  const [messages, setMessages] = useState([]); 
  const [defaultPosition, setDefaultPosition] = useState(null);
  const ws = useRef(null); 

  // ---- ২. লগইন সফল হলে শুধু লাইভ লোকেশন সেট করা (অটো-পয়েন্ট রিমুভড) 🚀 ----
  useEffect(() => {
    if (!user) return; 

    fetch('http://localhost:8000/location')
      .then(response => response.json())
      .then(res => {
        if (res.success && res.data) {
          console.log("📍 Live Location fetched:", res.data);
          
          const currentCoords = {
            lat: res.data.lat,
            lng: res.data.log
          };

          // 🚀 শুধু ম্যাপের ভিউ ফোকাস করার জন্য এটি থাকবে
          setDefaultPosition(currentCoords);

          // 🛑 নিচে থাকা setPointB এবং setPointC এর লাইন দুটি এখান থেকে ডিলিট করে দেওয়া হলো
        }
      })
      .catch(err => console.error("Location Fetch Error:", err));
  }, [user]);

  // ---- ৩. রিয়েল-টাইম WebSocket কানেকশন (একদম সেফড) 🔒 ----
  useEffect(() => {
    // 🚀 কন্ডিশন: ইউজার এবং ডিফল্ট পজিশন সেট হওয়ার পরেই কেবল সকেট রান করবে
    if (!user || !defaultPosition) return; 

    ws.current = new WebSocket("ws://localhost:8000/ws/chat"); 

    ws.current.onopen = () => {
      console.log(`✓ Connected to chat server safely as: ${user.name}`);
      // 🚀 ব্যাকএন্ডের প্রত্যাশা অনুযায়ী 'sender' হিসেবে নাম পাঠানো হচ্ছে
      ws.current.send(JSON.stringify({
        sender: user.name,
        action: "register" 
      }));
    };

    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.sender && (data.msg || data.text)) {
          setMessages((prev) => [...prev, { 
            sender: data.sender, 
            text: data.msg || data.text 
          }]);
        }
      } catch (err) {
        console.error("Error parsing message:", err);
      }
    };

    ws.current.onclose = () => console.log("❌ Chat server disconnected");

    return () => {
      // কম্পোনেন্ট আনমাউন্ট না হওয়া পর্যন্ত ক্লোজ হবে না
    };
  }, [user, defaultPosition]); // 🚀 লোকেশন সেট হয়ে যাওয়ার পর শান্তিতে সকেট কানেক্ট হবে, আর ডিসকানেক্ট হবে না!
  // ---- ৪. মেসেজ সেন্ডিং ফাংশন (সংশোধিত) ----
  // App.jsx (Customer Part) - handleSendMessage ফাংশনটি এভাবে আপডেট করুন
  const handleSendMessage = (text) => {
    // 🚀 ১. সেফটি চেক: selectedDriver বা তার নাম না থাকলে মেসেজ আটকে দেবে
    if (!selectedDriver || !selectedDriver.name) {
      console.log("❌ Driver object debug:", selectedDriver); // টার্মিনালে চেক করার জন্য
      return alert("মেসেজ পাঠানোর আগে ম্যাপ থেকে একজন ড্রাইভার সিলেক্ট করুন!");
    }

    // নিজের স্ক্রিনে মেসেজ পুশ করা
    setMessages((prev) => [...prev, { sender: user.name, text: text }]);

    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      const payload = {
        sender: user.name,           
        target: selectedDriver.name, // 🚀 ডাইনামিক নাম
        text: text,                  
        msg: text
      };
      
      console.log("🚀 Sending Chat Payload:", payload); // চেক করার জন্য লগে প্রিন্ট হবে
      ws.current.send(JSON.stringify(payload));
    } else {
      alert("চ্যাট সার্ভারের সাথে কানেকশন নেই।");
    }
  };
  // ম্যাপ ও রাইড ম্যাচিং স্টেটসমূহ
  const [pointA, setPointA] = useState(null);
  const [pointB, setPointB] = useState(null);
  const [pointC, setPointC] = useState(null);
  const [clickMode, setClickMode] = useState('B');

  const [drivers, setDrivers] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [isMatching, setIsMatching] = useState(false);
  const [isRideAccepted, setIsRideAccepted] = useState(false);
  const [loadingTimePrediction, setLoadingTimePrediction] = useState(false);
  const [waitTime, setWaitTime] = useState(null);
  const [error, setError] = useState(null);

  const handleMapClick = (e) => {
    if (!e.detail.latLng) return;
    const coords = { lat: e.detail.latLng.lat, lng: e.detail.latLng.lng };

    if (clickMode === 'A') {
      setPointA(coords);
    } else if (clickMode === 'B') {
      setPointB(coords);
      setClickMode('C');
    } else if (clickMode === 'C') {
      setPointC(coords);
    }
  };

  // Uber-project/src/App.jsx ফাইলের ভেতর handleSearchDrivers ফাংশনটি এভাবে পরিবর্তন করুন:

  const handleSearchDrivers = async () => {
    setIsMatching(true);
    setError(null);

    try {
      // এপিআই থেকে লাইভ অনলাইন ড্রাইভারদের নিয়ে আসা হচ্ছে 🚀
      const availableDrivers = await getAvailableDrivers();
      setDrivers(availableDrivers);
    } catch (err) {
      setError("ড্রাইভার লিস্ট লোড করতে সমস্যা হয়েছে।");
    } finally {
      setIsMatching(false);
    }
  };

  const handleAcceptRide = async (agreedPrice) => {
    setLoadingTimePrediction(true);
    setError(null);

    try {
      // ML Model Prediction Backend Call 🚀
      const predictedMinutes = await predictTripTime(pointB, pointC);
      setWaitTime(predictedMinutes);
      setIsRideAccepted(true);

      // ড্রাইভারকে ডিল ডান হওয়ার নোটিফিকেশন পাঠানো (ঐচ্ছিক)
      handleSendMessage(`🤝 Deal Closed! আমি ${agreedPrice} টাকাতেই রাইড এক্সেপ্ট করেছি।`);
    } catch (err) {
      console.error("ML Model Prediction failed:", err);
      setError("Failed to fetch wait time from backend model.");
    } finally {
      setLoadingTimePrediction(false);
    }
  };

  // ---- ৫. কন্ডিশনাল রেন্ডারিং (লগইন স্ক্রিন গেটওয়ে) ----
  if (!user) {
    return <Login onLoginComplete={(userData) => setUser(userData)} />;
  }

  return (
    // 🚀 ফিক্স: গ্লোবাল ভ্যারিয়েবলের ওপর ভরসা না করে সরাসরি ইন-লাইন Vite এনভায়রনমেন্ট রিড করা হলো
    <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY}>
      <div className="app-container">

        <ControlPanel
          selectionMode={clickMode} setSelectionMode={setClickMode}
          pickupLocation={pointB} dropoffLocation={pointC}
          loading={isMatching} driverFound={selectedDriver !== null}
          error={error} setPickupLocation={setPointB} setDropoffLocation={setPointC}
        >
          <RideMatcher
            drivers={drivers}
            selectedDriver={selectedDriver}
            onSelectDriver={setSelectedDriver}
            pointB={pointB}
            pointC={pointC}
            onSearchDrivers={handleSearchDrivers}
            isMatching={isMatching}
          />

          {selectedDriver && (
            <ChatBargain
              selectedDriver={selectedDriver}
              onAcceptRide={handleAcceptRide}
              isRideAccepted={isRideAccepted}
              waitTime={waitTime}
              loadingTimePrediction={loadingTimePrediction}
              messages={messages}
              onSendMessage={handleSendMessage}
            />
          )}
        </ControlPanel>

        {/* 🚀 সেফটি চেক: defaultPosition সাকসেসফুলি আসলেই কেবল ম্যাপভিউ মাউন্ট হবে */}
        {defaultPosition && (
          <MapView
            defaultPosition={defaultPosition} 
            onMapClick={handleMapClick}
            pointA={pointA} 
            pointB={pointB} 
            pointC={pointC}
          />
        )}

      </div>
    </APIProvider>
  );
}

export default App;