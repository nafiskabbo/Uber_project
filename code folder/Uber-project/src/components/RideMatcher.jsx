import React from 'react';

function RideMatcher({ drivers, selectedDriver, onSelectDriver, pointB, pointC, onSearchDrivers, isMatching }) {
  if (selectedDriver) return null; // ড্রাইভার সিলেক্ট হয়ে গেলে লিস্ট হাইড হয়ে যাবে

  return (
    <div className="ride-matcher-card">
      <h3>🚗 Available Drivers Nearby</h3>
      
      {drivers.length === 0 ? (
        <div>
          <p className="info-text">পিকআপ এবং ড্রপঅফ লোকেশন সেট করে ড্রাইভার খুঁজুন।</p>
          <button 
            className="action-btn"
            disabled={!pointB || !pointC || isMatching}
            onClick={onSearchDrivers}
          >
            {isMatching ? "Searching Drivers..." : "🔄 Find Available Drivers"}
          </button>
        </div>
      ) : (
        <div className="drivers-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
          <p style={{ fontSize: '13px', color: '#aaa' }}>আপনার রাইডের জন্য {drivers.length} জন ড্রাইভার পাওয়া গেছে। যেকোনো ১ জন সিলেক্ট করে চ্যাট শুরু করুন:</p>
          {drivers.map((driver) => (
            <div 
              key={driver.id} 
              className="driver-card"
              style={{
                background: '#2b2b2b', padding: '12px', borderRadius: '8px',
                border: '1px solid #444', cursor: 'pointer', transition: '0.2s'
              }}
              onClick={() => onSelectDriver(driver)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                <span>👤 {driver.name}</span>
                <span style={{ color: '#00e676' }}>{driver.basePrice} TK</span>
              </div>
              <div style={{ fontSize: '12px', color: '#aaa', marginTop: '4px' }}>
                🚗 {driver.vehicle} | ⭐ {driver.rating}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default RideMatcher;