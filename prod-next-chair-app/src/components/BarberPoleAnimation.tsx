// src/components/BarberPoleAnimation.tsx
import React from 'react';

const BarberPoleAnimation: React.FC = () => {
  return (
    <div className="barber-pole-container">
        <div className="barber-pole-ceiling">
        <div className="barber-pole-screw top-left"></div>
        <div className="barber-pole-screw top-right"></div>
        </div>
        <div className="barber-pole-mount"></div>
        <div className="barber-pole"></div>
    </div>
  );
};

export default BarberPoleAnimation;