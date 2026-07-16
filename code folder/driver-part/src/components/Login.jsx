import React, { useState } from 'react';
import "./Login.css";

/**
 * 🚀 Driver Login — কেন রিফ্যাক্টর করা হলো:
 * ১) আগে লগইন API সফল হলেও পরের স্ক্রিনে সার্কুলার ইমপোর্টের কারণে পেজ ফ্রিজ হতো।
 * ২) এখন loading/error স্টেট আছে যাতে ডাবল-সাবমিট না হয় এবং ব্যর্থ API স্পষ্ট দেখায়।
 * ৩) gmail lowercase করা হয় — ব্যাকএন্ড রেজিস্ট্রেশনেও lowercase সেভ হয়।
 */
function Login({ onLoginComplete, switchToRegister }) {
  const [gmail, setGmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false); // বাটন স্প্যাম প্রতিরোধ
  const [error, setError] = useState(''); // alert-এর বদলে UI-তে এরর দেখানো

  // ---- লগইন সাবমিট: ব্যাকএন্ড /api/driver/login কল ----
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!gmail.trim() || !password.trim()) {
      setError('সবগুলো ফিল্ড পূরণ করুন!');
      return;
    }

    setLoading(true);
    try {
      // 🚀 সরাসরি FastAPI ড্রাইভার লগইন এন্ডপয়েন্ট
      const response = await fetch('http://127.0.0.1:8000/api/driver/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gmail: gmail.trim().toLowerCase(),
          password: password,
        }),
      });

      // রেসপন্স JSON না হলেও ক্র্যাশ না করে এরর দেখানো
      let data = {};
      try {
        data = await response.json();
      } catch {
        throw new Error('Invalid server response');
      }

      if (response.ok && data.success) {
        // WebSocket রেজিস্ট্রেশনের জন্য নাম রাখা (পুরনো কোড localStorage পড়তো)
        localStorage.setItem('driverName', data.name);
        // প্যারেন্ট App-কে ইউজার সেট করতে বলা → ড্যাশবোর্ড রেন্ডার হবে
        onLoginComplete({ name: data.name, role: 'Driver' });
      } else {
        // FastAPI HTTPException detail স্ট্রিং হিসেবে আসে
        setError(typeof data.detail === 'string' ? data.detail : 'লগইন ব্যর্থ হয়েছে।');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('সার্ভার কানেকশন এরর! ব্যাকএন্ড পোর্ট ৮০০০-এ চলছে কি না চেক করুন।');
    } finally {
      setLoading(false);
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
              placeholder="driver@test.com"
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

          {/* লোডিং চলাকালীন এরর/বাটন স্টেট UI-তে দেখানো */}
          {error && (
            <p style={{ color: '#ff5252', fontSize: '13px', margin: '0 0 8px' }}>{error}</p>
          )}

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'লগইন হচ্ছে...' : 'লগইন করুন'}
          </button>
        </form>

        {/* 🚀 onClick-এ switchToRegister — রেজিস্ট্রেশন স্ক্রিনে যাওয়ার জন্য */}
        <p>
          If you want to create new Account{' '}
          <span
            onClick={loading ? undefined : switchToRegister}
            style={{ color: '#00e676', cursor: 'pointer', textDecoration: 'underline' }}
          >
            Sign up
          </span>
        </p>
      </div>
    </div>
  );
}

export default Login;
