import React, { useState } from 'react';
import "./Login.css";

/**
 * Customer Login / Sign-Up
 * 🚀 ফিক্স (ড্রাইভার অ্যাপের মতোই):
 * - loading স্টেট → ডাবল সাবমিট বন্ধ
 * - error UI → alert-এর ওপর নির্ভর কম
 * - gmail lowercase → ব্যাকএন্ড ম্যাচ নিশ্চিত
 * API: /api/customer/login ও /api/customer/register
 */
function Login({ onLoginComplete }) {
  const [isSignUp, setIsSignUp] = useState(false); // লগইন নাকি সাইন-আপ ট্র্যাক
  const [name, setName] = useState('');
  const [gmail, setGmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!gmail.trim() || !password.trim() || (isSignUp && !name.trim())) {
      setError("সবগুলো ফিল্ড সঠিকভাবে পূরণ করুন!");
      return;
    }

    // সাইন-আপ নাকি লগইন—তার ওপর ভিত্তি করে আলাদা এন্ডপয়েন্ট
    const endpoint = isSignUp ? '/api/customer/register' : '/api/customer/login';
    const normalizedGmail = gmail.trim().toLowerCase();
    const payload = isSignUp
      ? { name: name.trim(), gmail: normalizedGmail, password: password }
      : { gmail: normalizedGmail, password: password };

    setLoading(true);
    try {
      const response = await fetch(`http://127.0.0.1:8000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      let data = {};
      try {
        data = await response.json();
      } catch {
        throw new Error('Invalid server response');
      }

      if (response.ok && data.success) {
        if (isSignUp) {
          // সাইন-আপ সফল → লগইন স্ক্রিনে ফেরত
          alert("🎉 অ্যাকাউন্ট তৈরি সফল হয়েছে! এখন লগইন করুন।");
          setIsSignUp(false);
          setPassword('');
        } else {
          // লগইন সফল → প্যারেন্ট স্টেটে ইউজার পাঠানো
          localStorage.setItem('customerName', data.name);
          onLoginComplete({ name: data.name, role: 'Customer' });
        }
      } else {
        setError(typeof data.detail === 'string' ? data.detail : "কার্যক্রমটি ব্যর্থ হয়েছে।");
      }
    } catch (err) {
      console.error("Auth error:", err);
      setError("সার্ভার কানেকশন এরর! ব্যাকএন্ড পোর্ট ৮০০০ চলছে কি না চেক করুন।");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-overlay">
      <div className="login-card glass-card">
        <h2>{isSignUp ? '👤 Customer Sign-Up' : '👤 Customer Login'}</h2>
        <form onSubmit={handleSubmit}>

          {/* সাইন-আপ মোডেই শুধু নামের ইনপুট দেখাবে */}
          {isSignUp && (
            <div className="input-group">
              <label>Full Name:</label>
              <input
                type="text"
                placeholder="Sadit Rahman"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
              />
            </div>
          )}

          <div className="input-group">
            <label>Gmail:</label>
            <input
              type="email"
              placeholder="customer@test.com"
              value={gmail}
              onChange={(e) => setGmail(e.target.value)}
              disabled={loading}
              autoComplete="username"
            />
          </div>

          <div className="input-group">
            <label>Password:</label>
            <input
              type="password"
              placeholder="******"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              autoComplete="current-password"
            />
          </div>

          {error && (
            <p style={{ color: '#ff5252', fontSize: '13px', margin: '0 0 8px' }}>{error}</p>
          )}

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'অপেক্ষা করুন...' : (isSignUp ? 'সাইন-আপ করুন' : 'লগইন করুন')}
          </button>
        </form>

        {/* ইন্টারঅ্যাক্টিভ মোড টগলার */}
        <p>
          {isSignUp ? 'আগে থেকেই অ্যাকাউন্ট আছে?' : 'নতুন অ্যাকাউন্ট তৈরি করতে চান?'}
          <span
            onClick={() => {
              if (loading) return;
              setIsSignUp(!isSignUp);
              setName('');
              setError('');
            }}
            style={{ cursor: 'pointer', color: '#00e676', textDecoration: 'underline', marginLeft: 4 }}
          >
            {isSignUp ? ' লগইন করুন' : ' এখানে সাইন-আপ করুন'}
          </span>
        </p>
      </div>
    </div>
  );
}

export default Login;
