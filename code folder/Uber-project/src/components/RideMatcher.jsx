import React from 'react';

/**
 * ড্রাইভার লিস্ট + সার্চ
 * 🚀 ফিক্স: ম্যাপ API কী না থাকলেও ডিফল্ট পিকআপ/ড্রপঅফ দিয়ে সার্চ করা যায়
 * API থেকে car_name আসে — UI-তে vehicle/basePrice/rating নরমালাইজ করা হয়
 */
function RideMatcher({
  drivers,
  selectedDriver,
  onSelectDriver,
  pointB,
  pointC,
  onSearchDrivers,
  isMatching,
  onUseDefaultLocations,
}) {
  if (selectedDriver) return null; // ড্রাইভার সিলেক্ট হলে লিস্ট হাইড

  return (
    <div className="ride-matcher-card">
      <h3>🚗 Available Drivers Nearby</h3>

      {drivers.length === 0 ? (
        <div>
          <p className="info-text">
            পিকআপ + ড্রপঅফ সেট করে <strong>Find Available Drivers</strong> চাপুন।
            শুধু WebSocket-এ অনলাইন ড্রাইভাররাই লিস্টে আসবে।
          </p>

          {/* ম্যাপ ছাড়াই টেস্ট করার জন্য */}
          {(!pointB || !pointC) && onUseDefaultLocations && (
            <button
              type="button"
              className="action-btn"
              style={{ marginBottom: '10px', background: '#333', color: '#00e676' }}
              onClick={onUseDefaultLocations}
            >
              📍 Use default Rajshahi pickup/dropoff
            </button>
          )}

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
          <p style={{ fontSize: '13px', color: '#aaa' }}>
            {drivers.length} জন ড্রাইভার পাওয়া গেছে — একজন সিলেক্ট করে চ্যাট শুরু করুন:
          </p>
          {drivers.map((driver) => {
            const vehicle = driver.vehicle || driver.car_name || 'Car';
            const price = driver.basePrice ?? 200;
            const rating = driver.rating ?? '4.8';
            return (
              <div
                key={driver.id || driver.name}
                className="driver-card"
                style={{
                  background: '#2b2b2b', padding: '12px', borderRadius: '8px',
                  border: '1px solid #444', cursor: 'pointer', transition: '0.2s'
                }}
                onClick={() => onSelectDriver({
                  ...driver,
                  vehicle,
                  basePrice: price,
                  rating,
                })}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                  <span>👤 {driver.name}</span>
                  <span style={{ color: '#00e676' }}>{price} TK</span>
                </div>
                <div style={{ fontSize: '12px', color: '#aaa', marginTop: '4px' }}>
                  🚗 {vehicle} | ⭐ {rating}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default RideMatcher;
