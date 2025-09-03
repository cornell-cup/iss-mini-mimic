'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Navbar() {
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark mb-4">
      <div className="container">
        <Link href="/" className="navbar-brand">
          ISS Telemetry
        </Link>
        
        <button 
          className="navbar-toggler" 
          type="button" 
          onClick={() => setIsExpanded(!isExpanded)}
          aria-controls="navbarNav" 
          aria-expanded={isExpanded} 
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        
        <div className={`collapse navbar-collapse ${isExpanded ? 'show' : ''}`} id="navbarNav">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <Link href="/" className="nav-link active">
                Dashboard
              </Link>
            </li>
            <li className="nav-item">
              <Link href="/about" className="nav-link">
                About
              </Link>
            </li>
          </ul>
          <span className="navbar-text">
            International Space Station Live Data
          </span>
        </div>
      </div>
    </nav>
  );
}
