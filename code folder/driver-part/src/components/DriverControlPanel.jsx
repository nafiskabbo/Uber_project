import React from 'react';

/**
 * 🚀 ফিক্স নোট:
 * আগে এই কম্পোনেন্ট নিজেই WebSocket + DriverChat চালাতো, অথচ App.jsx-ও একই কাজ করতো।
 * দুই জায়গায় সকেট = ডুপ্লিকেট কানেকশন + বিভ্রান্তি।
 *
 * এখন এটি শুধু বাম পাশের UI শেল:
 * - activeRequest দেখায়
 * - children হিসেবে App থেকে পাঠানো <DriverChat /> রেন্ডার করে
 * WebSocket লজিক App.jsx-এই থাকবে।
 */
function DriverControlPanel({ activeRequest, isConfirmedByCustomer, children }) {
  return (
    <div className="controls-panel driver-theme">
      <h2 className="title" style={{ margin: 0 }}>Driver Dashboard</h2>
      <div className="badge-role driver-badge">DRIVER ONLINE</div>

      {/* প্রোগ্রেস স্টেপ — রাইড স্টেট অনুযায়ী হাইলাইট */}
      <div className="step-indicator">
        <div className={`step ${activeRequest ? 'active' : ''}`}>1. Request</div>
        <div className={`step ${activeRequest ? 'active' : ''}`}>2. Bargain</div>
        <div className={`step ${isConfirmedByCustomer ? 'active' : ''}`}>3. Confirmed</div>
      </div>

      {activeRequest ? (
        <div style={{ background: '#262626', padding: '12px', borderRadius: '8px', fontSize: '13px' }}>
          <div>Customer: <strong>{activeRequest.customer_name}</strong></div>
          <div style={{ marginTop: '6px', color: '#aaa' }}>
            Pickup / Dropoff markers are shown on the map.
          </div>
        </div>
      ) : (
        <div style={{ background: '#262626', padding: '12px', borderRadius: '8px', color: '#888', fontSize: '13px' }}>
          No active ride request yet. Stay online and wait for a customer.
        </div>
      )}

      {/* App.jsx থেকে children = <DriverChat ... /> */}
      {children}
    </div>
  );
}

export default DriverControlPanel;
