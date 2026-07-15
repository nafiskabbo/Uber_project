import React, { useState } from 'react';
import "./Login.css"; 

function Login({ onLoginComplete, switchToRegister }) { // 💡 নিশ্চিত করুন switchToRegister এখানে রিসিভ হচ্ছে
  const [gmail, setGmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!gmail.trim() || !password.trim()) return alert("সবগুলো ফিল্ড পূরণ করুন!");

    try {
      const response = await fetch('http://127.0.0.1:8000/api/driver/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gmail: gmail.trim(), password: password })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        onLoginComplete({ name: data.name, role: 'Driver' });
      } else {
        alert(data.detail || "লগইন ব্যর্থ হয়েছে।");
      }
    } catch (err) {
      console.error("Login error:", err);
      alert("সার্ভার কানেকশন এরর!");
    }
  };

  return (
    <div className="login-overlay">
      <div className="login-card glass-card">
        <h2>🚖 Driver Login</h2>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Gmail:</label>
            <input 
              type="email" 
              placeholder="example@gmail.com" 
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

          <button type="submit" className="login-btn">লগইন করুন</button>
        </form>
        
        {/* 🚀 এখানে onClick ইভেন্টে switchToRegister ফাংশনটি সঠিকভাবে যুক্ত করা হয়েছে */}
        <p>
          If you want to create new Account{' '}
          <span onClick={switchToRegister} style={{ color: '#00e676', cursor: 'pointer', textDecoration: 'underline' }}>
            Sign up
          </span>
        </p>
      </div>
    </div>
  );
}

export default Login;