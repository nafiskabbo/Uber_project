import React, { useState } from 'react';
import "./Login.css"; 

function Login({ onLoginComplete }) {
  const [isSignUp, setIsSignUp] = useState(false); // লগইন নাকি সাইন-আপ ট্র্যাক করার জন্য
  const [name, setName] = useState('');
  const [gmail, setGmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!gmail.trim() || !password.trim() || (isSignUp && !name.trim())) {
      return alert("সবগুলো ফিল্ড সঠিকভাবে পূরণ করুন!");
    }

    // সাইন-আপ নাকি লগইন—তার ওপর ভিত্তি করে আলাদা এন্ডপয়েন্ট সিলেক্ট করা
    const endpoint = isSignUp ? '/api/customer/register' : '/api/customer/login';
    const payload = isSignUp 
      ? { name: name.trim(), gmail: gmail.trim(), password: password }
      : { gmail: gmail.trim(), password: password };

    try {
      const response = await fetch(`http://127.0.0.1:8000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        if (isSignUp) {
          alert("🎉 অ্যাকাউন্ট তৈরি সফল হয়েছে! এখন লগইন করুন।");
          setIsSignUp(false); // সাইন-আপ সফল হলে লগইন স্ক্রিনে ব্যাক করবে
          setPassword('');
        } else {
          // লগইন সফল হলে প্যারেন্ট স্টেটে ডেটা পাঠানো
          onLoginComplete({ name: data.name, role: 'Customer' });
        }
      } else {
        alert(data.detail || "কার্যক্রমটি ব্যর্থ হয়েছে।");
      }
    } catch (err) {
      console.error("Auth error:", err);
      alert("সার্ভার কানেকশন এরর!");
    }
  };

  return (
    <div className="login-overlay">
      <div className="login-card glass-card">
        <h2>{isSignUp ? '👤 Customer Sign-Up' : '👤 Customer Login'}</h2>
        <form onSubmit={handleSubmit}>
          
          {/* ইউজার যদি সাইন-আপ মোডে থাকে, তবেই শুধু নামের ইনপুটটি দেখাবে */}
          {isSignUp && (
            <div className="input-group">
              <label>Full Name:</label>
              <input 
                type="text" 
                placeholder="Sadit Rahman" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
              />
            </div>
          )}

          <div className="input-group">
            <label>Gmail:</label>
            <input 
              type="email" 
              placeholder="customer@gmail.com" 
              value={gmail} 
              onChange={(e) => setGmail(e.target.value)} 
            />
          </div>

          <div className="input-group">
            <label>Password:</label>
            <input 
              type="password" 
              placeholder="******" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
            />
          </div>

          <button type="submit" className="login-btn">
            {isSignUp ? 'সাইন-আপ করুন' : 'লগইন করুন'}
          </button>
        </form>

        {/* ইন্টারঅ্যাক্টিভ মোড টগলার লিঙ্ক */}
        <p>
          {isSignUp ? 'আগে থেকেই অ্যাকাউন্ট আছে?' : 'নতুন অ্যাকাউন্ট তৈরি করতে চান?'}
          <span onClick={() => { setIsSignUp(!isSignUp); setName(''); }}>
            {isSignUp ? ' লগইন করুন' : ' এখানে সাইন-আপ করুন'}
          </span>
        </p>
      </div>
    </div>
  );
}

export default Login;