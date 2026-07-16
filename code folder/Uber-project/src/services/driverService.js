import axios from 'axios';

// ১. ব্যাকএন্ড থেকে লাইভ অনলাইন ড্রাইভারদের লিস্ট নিয়ে আসার ফাংশন
export const getAvailableDrivers = async () => {
  try {
    // 🚀 127.0.0.1 — ড্রাইভার অ্যাপ ও লগইনের সাথে কনসিস্টেন্ট
    const response = await fetch('http://127.0.0.1:8000/api/active-drivers');
    const data = await response.json();
    
    console.log("📡 Raw Driver Data from backend:", data);

    // 🚀 ফিক্স: যদি ব্যাকএন্ড সরাসরি লিস্ট পাঠায় তবে 'data' রিটার্ন হবে, আর যদি অবজেক্টের ভেতর পাঠায় তবে 'data.drivers' 
    if (Array.isArray(data)) {
      return data; 
    } else if (data && data.drivers) {
      return data.drivers;
    }
    
    return []; // কোনো ডাটা না মিললে খালি অ্যারে
  } catch (err) {
    console.error("Error fetching live drivers:", err);
    // ব্যাকএন্ড বন্ধ থাকলে বা এরর হলে টেস্ট করার সুবিধার জন্য ফলব্যাক ডেটা (id এবং car_name ফিল্ড সিঙ্ক করা হলো)
    return [{ 
      id: 999, 
      name: "Sujon (Offline Backup)", 
      car_name: "Suzuki Swift", 
      license_number: "DHAKA-METRO-5555",
      lat: 24.3745, 
      lng: 88.6042 
    }];
  }
};

// ২. রাইড অ্যাকসেপ্ট করার পর ফাইনাল ML মডেল প্রেডিকশন কল 🚀
export const predictTripTime = async (pickup, dropoff) => {
  try {
    const now = new Date();
    const pad = (num) => String(num).padStart(2, '0');
    
    const formattedDateTime = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

    const response = await axios.post('http://127.0.0.1:8000/predict', {
      pickup_datetime: formattedDateTime,
      pickup_longitude: pickup.lng,
      pickup_latitude: pickup.lat,
      dropoff_longitude: dropoff.lng,
      dropoff_latitude: dropoff.lat
    });

    const durationInSeconds = response.data.predict;
    return durationInSeconds / 60; 
    
  } catch (err) {
    console.error("Axios ML Model Prediction failed:", err);
    throw err; 
  }
};