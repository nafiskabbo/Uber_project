import React, { useState } from 'react';
import "./Login.css";

/**
 * ড্রাইভার রেজিস্ট্রেশন ফর্ম
 * 🚀 ফিক্স: API URL localhost → 127.0.0.1 (লগইনের সাথে কনসিস্টেন্ট)
 * সফল হলে driverName localStorage-এ সেভ — পরে WebSocket/অন্যান্য জায়গায় লাগে
 */
function Register({ onRegisterSuccess, switchToLogin }) {
    const [formData, setFormData] = useState({
        name: '', gmail: '', password: '', car_name: '', license_number: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.gmail || !formData.password || !formData.car_name || !formData.license_number) {
            alert("সবগুলো তথ্য সঠিকভাবে পূরণ করুন!");
            return;
        }

        try {
            // ব্যাকএন্ড ড্রাইভার রেজিস্ট্রেশন এন্ডপয়েন্ট
            const response = await fetch('http://127.0.0.1:8000/api/driver/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            if (response.ok && data.success) {
                alert("রেজিস্ট্রেশন সফল হয়েছে!");
                localStorage.setItem('driverName', formData.name);
                onRegisterSuccess(formData.name);
            } else {
                alert(data.detail || "রেজিস্ট্রেশন ব্যর্থ হয়েছে।");
            }
        } catch (err) {
            alert("সার্ভার কানেকশন এরর!");
        }
    };

    return (
        <div className="login-overlay">
            <div className="login-card glass-card" style={{ width: '380px', maxHeight: '85vh', overflowY: 'auto' }}>
                <h2>🚖 Driver Registration</h2>
                <form onSubmit={handleSubmit}>
                    <div className="input-group"><label>Name:</label><input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Farhan" /></div>
                    <div className="input-group"><label>Gmail:</label><input type="email" name="gmail" value={formData.gmail} onChange={handleChange} placeholder="farhan@gmail.com" /></div>
                    <div className="input-group"><label>Password:</label><input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="******" /></div>
                    <div className="input-group"><label>Car Name:</label><input type="text" name="car_name" value={formData.car_name} onChange={handleChange} placeholder="Toyota Corolla" /></div>
                    <div className="input-group"><label>License Number:</label><input type="text" name="license_number" value={formData.license_number} onChange={handleChange} placeholder="DHAKA-1234" /></div>
                    <button type="submit" className="login-btn">Register Account</button>
                </form>
                <p>If you have an account <span onClick={switchToLogin} style={{ color: '#00e676', cursor: 'pointer', textDecoration: 'underline' }}>Login</span></p>
            </div>
        </div>
    );
}

export default Register;
