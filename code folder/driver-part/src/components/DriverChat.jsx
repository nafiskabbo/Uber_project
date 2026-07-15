import React, { useState, useEffect, useRef } from 'react';
import DriverChat from './DriverChat';

function DriverControlPanel() {
  const [messages, setMessages] = useState([]);
  const socketRef = useRef(null);

  // ১. আপনার লগইন করা ড্রাইভারের নাম (এটি লোকাল স্টোরেজ বা স্টেট থেকে আসতে পারে)
  const myName = "Farhan"; 

  useEffect(() => {
    // WebSocket কানেকশন তৈরি
    socketRef.current = new WebSocket("ws://localhost:8000/ws/chat");

    socketRef.current.onopen = () => {
      console.log("Connected to Backend!");
      
      // 🚀 অত্যন্ত গুরুত্বপূর্ণ: কানেক্ট হয়েই ব্যাকএন্ডে প্রথম মেসেজে নিজের নাম রেজিস্টার করা
      const initPayload = { name: myName };
      socketRef.current.send(JSON.stringify(initPayload));
    };

    socketRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("Received from server:", data);

      // ব্যাকএন্ড থেকে যদি সফল মেসেজ আসে (error বা offline মেসেজ বাদে)
      if (data.msg !== "error") {
        // DriverChat-এর রিকোয়ারমেন্ট অনুযায়ী অবজেক্ট ফরম্যাট করা
        const newMessage = {
          sender: data.sender, // কে পাঠালো (কাস্টমারের নাম অথবা 'Farhan')
          text: data.msg       // মেসেজের মূল টেক্সট
        };

        setMessages((prev) => [...prev, newMessage]);
      }
    };

    return () => {
      if (socketRef.current) socketRef.current.close();
    };
  }, []);

  // ২. DriverChat থেকে যখন Send বাটনে চাপ দেওয়া হবে
  const handleSendReply = (replyText) => {
    if (!socketRef.current) return;

    // 🚀 এখানে target হিসেবে কাস্টমারের নাম ডায়নামিকালি বসাতে হবে। 
    // আপাতত টেস্ট করার জন্য আমরা 'Customer_User' বা চ্যাটে আসা লাস্ট স্পিকারের নাম দিতে পারি।
    const targetCustomer = messages.find(m => m.sender !== myName)?.sender || "Customer_User";

    const payload = {
      target: targetCustomer, // মেসেজটি কার কাছে যাবে
      text: replyText         // ভাড়ার অফার বা টেক্সট
    };

    // ব্যাকএন্ডে পাঠানো হলো
    socketRef.current.send(JSON.stringify(payload));

    // নিজের স্ক্রিনেও মেসেজটি সাথে সাথে আপডেট করার জন্য
    setMessages((prev) => [...prev, { sender: myName, text: replyText }]);
  };

  return (
    <div>
      {/* আপনার অন্যান্য ম্যাপ বা কন্ট্রোল ডিজাইন... */}
      
      {/* চ্যাট কম্পোনেন্ট কল */}
      <DriverChat 
        messages={messages} 
        onSendReply={handleSendReply} 
        isConfirmedByCustomer={false} // স্টেট অনুযায়ী চেঞ্জ হবে
        myName={myName} 
      />
    </div>
  );
}

export default DriverControlPanel;