import React, { useState, useEffect, useRef } from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';
import MapView from './components/MapView';
import ControlPanel from './components/ControlPanel';
import RideMatcher from './components/RideMatcher';
import ChatBargain from './components/ChatBargain';
import Login from './components/Login'; // ১. লগইন কম্পোনেন্ট ইম্পোর্ট
import { getAvailableDrivers, predictTripTime } from './services/driverService';
import './App.css';

// Vite env থেকে Maps কী
// 🚀 ফিক্স: প্লেসহোল্ডার/খালি কী দিয়ে APIProvider মাউন্ট করলে পেজ স্লো/হ্যাং হতে পারে
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const hasValidMapsKey =
  Boolean(GOOGLE_MAPS_API_KEY) &&
  !String(GOOGLE_MAPS_API_KEY).includes('YourActualGoogleMapsAPIKeyHere');

// লোকেশন API ফেল করলেও UI আটকে না থাকার জন্য Rajshahi fallback
const FALLBACK_POSITION = { lat: 24.3636, lng: 88.6241 };

function App() {
  // ---- ১. স্টেটসমূহ ----
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  // 🚀 ফিক্স: আগে defaultPosition null থাকলে ম্যাপ/WebSocket কখনো মাউন্ট হতো না
  // এখন সাথে সাথে fallback দিয়ে UI চালু, পরে লাইভ লোকেশন এলে আপডেট
  const [defaultPosition, setDefaultPosition] = useState(FALLBACK_POSITION);
  const ws = useRef(null);

  // ---- ২. লগইন সফল হলে লাইভ লোকেশন সেট (অটো-পয়েন্ট রিমুভড) 🚀 ----
  useEffect(() => {
    if (!user) return;

    // geocoder.ip স্লো হতে পারে — তাই fallback আগেই সেট, পরে আপডেট
    fetch('http://127.0.0.1:8000/location')
      .then(response => response.json())
      .then(res => {
        if (res.success && res.data) {
          console.log("📍 Live Location fetched:", res.data);
          setDefaultPosition({
            lat: res.data.lat,
            lng: res.data.log // ব্যাকএন্ডে টাইপো: 'log' = longitude
          });
          // 🛑 setPointB / setPointC এখান থেকে ইচ্ছাকৃতভাবে বাদ — ইউজার ম্যাপে নিজে সিলেক্ট করবে
        }
      })
      .catch(err => {
        console.error("Location Fetch Error (using Rajshahi fallback):", err);
        setDefaultPosition(FALLBACK_POSITION);
      });
  }, [user]);

  // ---- ৩. রিয়েল-টাইম WebSocket কানেকশন 🔒 ----
  useEffect(() => {
    if (!user) return;

    // 🚀 ফিক্স: localhost → 127.0.0.1 (ড্রাইভার অ্যাপের সাথে সিঙ্ক)
    ws.current = new WebSocket("ws://127.0.0.1:8000/ws/chat");

    ws.current.onopen = () => {
      console.log(`✓ Connected to chat server safely as: ${user.name}`);
      // ব্যাকএন্ড প্রত্যাশা: action "register" + sender নাম
      ws.current.send(JSON.stringify({
        sender: user.name,
        action: "register"
      }));
    };

    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const text = data.msg || data.text;
        // System অ্যাকও চ্যাটে দেখানো যায়; শুধু খালি মেসেজ স্কিপ
        if (data.sender && text) {
          setMessages((prev) => [...prev, {
            sender: data.sender,
            text
          }]);
        }
      } catch (err) {
        console.error("Error parsing message:", err);
      }
    };

    ws.current.onclose = () => console.log("❌ Chat server disconnected");

    // 🚀 ফিক্স: আগে cleanup খালি ছিল → মেমোরি লিক / ডুপ্লিকেট সকেট। এখন ক্লোজ করা হয়।
    return () => {
      if (ws.current) ws.current.close();
    };
  }, [user]);

  // ---- ৪. মেসেজ সেন্ডিং ফাংশন ----
  const handleSendMessage = (text) => {
    // সেফটি চেক: ড্রাইভার সিলেক্ট না থাকলে মেসেজ আটকানো
    if (!selectedDriver || !selectedDriver.name) {
      console.log("❌ Driver object debug:", selectedDriver);
      return alert("মেসেজ পাঠানোর আগে ম্যাপ থেকে একজন ড্রাইভার সিলেক্ট করুন!");
    }

    setMessages((prev) => [...prev, { sender: user.name, text: text }]);

    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      const payload = {
        sender: user.name,
        target: selectedDriver.name, // ডাইনামিক ড্রাইভার নাম
        text: text,
        msg: text
      };

      console.log("🚀 Sending Chat Payload:", payload);
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

  const handleSearchDrivers = async () => {
    setIsMatching(true);
    setError(null);

    try {
      // এপিআই থেকে লাইভ অনলাইন ড্রাইভারদের নিয়ে আসা 🚀
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
    return (
      <Login
        onLoginComplete={(userData) => {
          localStorage.setItem('customerName', userData.name);
          setUser(userData);
        }}
      />
    );
  }

  // ---- ৬. মূল ড্যাশবোর্ড ----
  const dashboard = (
    <div className="app-container">
      <ControlPanel
        selectionMode={clickMode} setSelectionMode={setClickMode}
        pickupLocation={pointB} dropoffLocation={pointC}
        onPredict={handleSearchDrivers}
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
          onUseDefaultLocations={() => {
            // ম্যাপ কী না থাকলেও রাইড রিকোয়েস্ট টেস্ট করা যায়
            setPointB({ lat: 24.3745, lng: 88.6042 });
            setPointC({ lat: 24.3945, lng: 88.6242 });
            setClickMode('C');
          }}
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

      {/* ম্যাপ: ভ্যালিড কী থাকলেই Google Map, নাহলে প্লেসহোল্ডার */}
      {hasValidMapsKey ? (
        <MapView
          defaultPosition={defaultPosition}
          onMapClick={handleMapClick}
          pointA={pointA}
          pointB={pointB}
          pointC={pointC}
        />
      ) : (
        <div className="map-view" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', flexDirection: 'column', gap: '8px' }}>
          <div>Add a real VITE_GOOGLE_MAPS_API_KEY in <code>.env</code> to enable the map.</div>
          <div style={{ fontSize: '13px' }}>(packege.env is not loaded by Vite — use <code>.env</code>)</div>
        </div>
      )}
    </div>
  );

  if (!hasValidMapsKey) {
    return dashboard;
  }

  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
      {dashboard}
    </APIProvider>
  );
}

export default App;
