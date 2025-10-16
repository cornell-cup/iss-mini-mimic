'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const [isExpanded, setIsExpanded] = useState(false);
  const pathname = usePathname();
  
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark mb-4">
      <div className="container">
        <Link href="/" className="navbar-brand">
          ISS Mimic
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
              <Link href="/" className={`nav-link ${pathname === '/' ? 'active' : ''}`}>
                ISS Telemetry
              </Link>
            </li>
            <li className="nav-item">
              <Link href="/3d-model" className={`nav-link ${pathname === '/3d-model' ? 'active' : ''}`}>
                3D Model (Live)
              </Link>
            </li>
            <li className="nav-item">
              <Link href="/3d-model/manual_v2" className={`nav-link ${pathname === '/3d-model/manual_v2' ? 'active' : ''}`}>
                3D Model (Manual)
              </Link>
            </li>
            <li className="nav-item">
              <Link href="/map/manual" className={`nav-link ${pathname === '/map/manual' ? 'active' : ''}`}>
                Map (Manual)
              </Link>
            </li>
            <li className="nav-item">
              <Link href="/map" className={`nav-link ${pathname === '/map' ? 'active' : ''}`}>
                Map (Live)
              </Link>
            </li>
            {/*
            <li className="nav-item">
              <Link href="/about" className={`nav-link ${pathname === '/about' ? 'active' : ''}`}>
                About
              </Link>
            </li>
            */}
            <li className="nav-item">
              <Link href="https://github.com/David-Fuq/Cornell-ISS-Mimic-Mini.git" className="nav-link" target="_blank">
                Github Repo
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
