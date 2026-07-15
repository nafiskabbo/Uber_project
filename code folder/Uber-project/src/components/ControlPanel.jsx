import React from 'react';

function ControlPanel({
  selectionMode,
  setSelectionMode,
  pickupLocation,
  dropoffLocation,
  onPredict,
  loading,
  driverFound,
  error,
  setPickupLocation,
  setDropoffLocation,
  children // 👈 এই children প্রপের মাধ্যমেই RideMatcher ও ChatBargain ভেতরে ঢুকবে
}) {
  const currentStep = !pickupLocation ? 1 : !dropoffLocation ? 2 : driverFound ? 3 : 2;

  return (
    <div className="controls-panel">
      <h2 className="title">Uber Dynamic Match</h2>
      
      {/* 📊 স্টেপ ইন্ডিকেটর */}
      <div className="step-indicator">
        <div className={`step ${currentStep >= 1 ? 'active' : ''}`}>1. Pickup</div>
        <div className={`step ${currentStep >= 2 ? 'active' : ''}`}>2. Dropoff</div>
        <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>3. Bargain</div>
      </div>

      {/* 📍 মোড সিলেক্টর বাটন গ্রুপ */}
      <div className="selection-status-box">
        <button className={selectionMode === 'B' ? 'active-pickup' : ''} onClick={() => setSelectionMode('B')}>📍 Set Pickup (B)</button>
        <button className={selectionMode === 'C' ? 'active-dropoff' : ''} onClick={() => setSelectionMode('C')}>🏁 Set Dropoff (C)</button>
        <button className={selectionMode === 'A' ? 'active-driver' : ''} onClick={() => setSelectionMode('A')}>🚗 Driver (A - Opt)</button>
      </div>

      {/* 🎫 লোকেশন ব্যাজ */}
      <div className="location-badges-container" style={{ marginTop: '10px', marginBottom: '10px' }}>
        {pickupLocation && (
          <div className="location-pill pickup">
            <span>📍 Pickup Ready</span>
            <button className="clear-pill-btn" onClick={() => { setPickupLocation(null); setSelectionMode('B'); }}>×</button>
          </div>
        )}
        {dropoffLocation && (
          <div className="location-pill dropoff">
            <span>🏁 Dropoff Ready</span>
            <button className="clear-pill-btn" onClick={() => { setDropoffLocation(null); setSelectionMode('C'); }}>×</button>
          </div>
        )}
      </div>

      {/* 🚀 মেইন সার্চ বাটন (ড্রাইভার পাওয়া গেলে এটি হাইড হয়ে যাবে) */}
      {!driverFound && (
        <button 
          className={`predict-button-interactive ${pickupLocation && dropoffLocation ? 'pulse-glow' : ''}`}
          onClick={onPredict} 
          disabled={loading || !pickupLocation || !dropoffLocation}
        >
          {loading ? <span className="spinner-loader">Searching Drivers...</span> : '🔥 Find Available Drivers'}
        </button>
      )}

      {error && <div className="error-banner">⚠️ {error}</div>}

      {/* 🗳️ এখানে স্বয়ংক্রিয়ভাবে RideMatcher এবং ChatBargain লোড হবে */}
      <div className="sub-components-holder" style={{ marginTop: '15px' }}>
        {children}
      </div>
    </div>
  );
}

export default ControlPanel;