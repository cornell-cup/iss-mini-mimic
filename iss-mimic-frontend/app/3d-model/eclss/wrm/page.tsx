'use client';

import React from 'react';
import { useTelemetry } from '@/contexts/TelemetryContext';

export default function WrmPage() {
  const { telemetryItems } = useTelemetry();

  const fmtNumber = (id: string) => {
    const v = telemetryItems[id]?.value;
    if (!v) return '0.00';
    const n = parseFloat(v);
    return isNaN(n) ? v : n.toFixed(2);
  };

  const fmtText = (id: string) => {
    const v = telemetryItems[id]?.value;
    return v && v.trim().length > 0 ? v : 'n/a';
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#000',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '20px 10px',
    }}>
      <svg
        viewBox="0 0 1400 950"
        style={{ width: '100%', maxWidth: 1400 }}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* ── Arrow Markers ── */}
        <defs>
          <marker id="ar" viewBox="0 0 10 10" refX="9" refY="5"
            markerWidth="7" markerHeight="7" orient="auto">
            <path d="M0 0L10 5L0 10z" fill="#FF0000" />
          </marker>
          <marker id="ab" viewBox="0 0 10 10" refX="9" refY="5"
            markerWidth="7" markerHeight="7" orient="auto">
            <path d="M0 0L10 5L0 10z" fill="#2196F3" />
          </marker>
          <marker id="ab-s" viewBox="0 0 10 10" refX="1" refY="5"
            markerWidth="7" markerHeight="7" orient="auto">
            <path d="M10 0L0 5L10 10z" fill="#2196F3" />
          </marker>
          <marker id="ag" viewBox="0 0 10 10" refX="1" refY="5"
            markerWidth="7" markerHeight="7" orient="auto">
            <path d="M10 0L0 5L10 10z" fill="#00CC00" />
          </marker>
          <marker id="ay" viewBox="0 0 10 10" refX="9" refY="5"
            markerWidth="7" markerHeight="7" orient="auto">
            <path d="M0 0L10 5L0 10z" fill="#FFCC00" />
          </marker>
          <marker id="ac" viewBox="0 0 10 10" refX="9" refY="5"
            markerWidth="7" markerHeight="7" orient="auto">
            <path d="M0 0L10 5L0 10z" fill="#00BFFF" />
          </marker>
        </defs>

        {/* ══════════════════════════════════════════════════════ */}
        {/* ── TITLE ── */}
        <text x="30" y="52" fill="#00FF00" fontSize="48" fontWeight="bold"
          fontFamily="monospace">ECLSS</text>
        <text x="310" y="55" fill="white" fontSize="40" fontWeight="bold"
          fontFamily="sans-serif">Water Recovery &amp; Management</text>

        {/* ── Main border ── */}
        <rect x="15" y="75" width="1370" height="865" fill="none"
          stroke="#555" strokeWidth="2" />

        {/* ══════════════════════════════════════════════════════ */}
        {/* ── USOS CABIN (left column) ── */}
        <g id="usos-cabin">
          <rect x="25" y="85" width="210" height="745" fill="none"
            stroke="#888" strokeWidth="1.5" />
          <text x="35" y="108" fill="white" fontSize="18" fontWeight="bold">
            USOS Cabin
          </text>

          {/* WHC Urine Tank */}
          <rect x="55" y="128" width="145" height="30" fill="none"
            stroke="#888" strokeWidth="1" />
          <text x="128" y="149" fill="white" fontSize="14" textAnchor="middle">
            WHC
          </text>
          <text x="128" y="180" fill="white" fontSize="14" textAnchor="middle">
            Urine Tank
          </text>
          <rect x="60" y="190" width="135" height="38" fill="#CC0000"
            stroke="#FF0000" strokeWidth="1.5" rx="2" />
          <text x="128" y="216" fill="#00FF00" fontSize="24" fontWeight="bold"
            textAnchor="middle" fontFamily="monospace">
            {fmtNumber('NODE3000005')}
          </text>
          <text x="128" y="262" fill="#00FF00" fontSize="20" textAnchor="middle"
            fontFamily="monospace">n/a</text>

          {/* Crew figure (simplified astronaut) */}
          <g transform="translate(78, 280)">
            <circle cx="50" cy="12" r="14" fill="none" stroke="#4466BB"
              strokeWidth="2.5" />
            <rect x="32" y="28" width="36" height="55" rx="6" fill="none"
              stroke="#4466BB" strokeWidth="2.5" />
            <line x1="32" y1="42" x2="14" y2="68" stroke="#4466BB"
              strokeWidth="2.5" strokeLinecap="round" />
            <line x1="68" y1="42" x2="86" y2="68" stroke="#4466BB"
              strokeWidth="2.5" strokeLinecap="round" />
            <line x1="42" y1="83" x2="32" y2="120" stroke="#4466BB"
              strokeWidth="2.5" strokeLinecap="round" />
            <line x1="58" y1="83" x2="68" y2="120" stroke="#4466BB"
              strokeWidth="2.5" strokeLinecap="round" />
          </g>

          {/* Crew labels */}
          <text x="128" y="430" fill="white" fontSize="16" fontWeight="bold"
            textAnchor="middle">Crew</text>
          <text x="128" y="450" fill="#00CC00" fontSize="12" textAnchor="middle">
            Drinking Water (PWD)
          </text>
          <text x="128" y="467" fill="#00CC00" fontSize="12" textAnchor="middle">
            Hygiene
          </text>
          <text x="128" y="484" fill="#00CC00" fontSize="12" textAnchor="middle">
            Urine Flush
          </text>
          <text x="128" y="501" fill="#00CC00" fontSize="12" textAnchor="middle">
            EMU Sublimeter
          </text>

          <text x="128" y="540" fill="white" fontSize="15" fontWeight="bold"
            textAnchor="middle">Payloads</text>
          <text x="128" y="560" fill="#00CC00" fontSize="13" textAnchor="middle">
            Biological
          </text>
        </g>

        {/* ══════════════════════════════════════════════════════ */}
        {/* ── PRETREATED URINE FLOW (red, top) ── */}
        <g id="flow-urine">
          <text x="380" y="165" fill="white" fontSize="16" textAnchor="middle">
            Pretreated Urine
          </text>
          <line x1="235" y1="182" x2="640" y2="182"
            stroke="#FF0000" strokeWidth="4" />
          <polygon points="640,168 675,182 640,196" fill="#FF0000" />
        </g>

        {/* ══════════════════════════════════════════════════════ */}
        {/* ── WRS + UPA ── */}
        <g id="wrs">
          <rect x="660" y="85" width="310" height="285" fill="none"
            stroke="#888" strokeWidth="1.5" />
          <text x="675" y="115" fill="white" fontSize="24" fontWeight="bold">
            WRS
          </text>

          <rect x="720" y="135" width="195" height="105" fill="none"
            stroke="#888" strokeWidth="1.5" />
          <text x="818" y="175" fill="white" fontSize="22" fontWeight="bold"
            textAnchor="middle">UPA</text>
          <text x="818" y="197" fill="white" fontSize="12" textAnchor="middle">
            Urine Processor
          </text>
          <text x="818" y="213" fill="white" fontSize="12" textAnchor="middle">
            Assembly
          </text>
        </g>

        {/* ── Brine flow: UPA → BPA ── */}
        <g id="flow-brine">
          <text x="985" y="170" fill="white" fontSize="14" textAnchor="middle">
            Brine
          </text>
          <line x1="915" y1="182" x2="1080" y2="182"
            stroke="#FF0000" strokeWidth="3" />
          <polygon points="1080,170 1105,182 1080,194" fill="#FF0000" />
        </g>

        {/* ── Distillate flow: UPA → down ── */}
        <g id="flow-distillate">
          <text x="870" y="275" fill="white" fontSize="14">Distillate</text>
          <line x1="818" y1="240" x2="818" y2="395"
            stroke="#FF0000" strokeWidth="3" />
          <polygon points="805,395 818,420 831,395" fill="#FF0000" />
        </g>

        {/* ══════════════════════════════════════════════════════ */}
        {/* ── BPA ── */}
        <g id="bpa">
          <rect x="1100" y="85" width="170" height="230" fill="none"
            stroke="#888" strokeWidth="1.5" />
          <text x="1185" y="118" fill="white" fontSize="20" fontWeight="bold"
            textAnchor="middle">BPA</text>
          <text x="1185" y="145" fill="white" fontSize="12" textAnchor="middle">
            Brine
          </text>
          <text x="1185" y="162" fill="white" fontSize="12" textAnchor="middle">
            Processor
          </text>
          <text x="1185" y="179" fill="white" fontSize="12" textAnchor="middle">
            Assembly
          </text>

          {/* Output arrows */}
          <line x1="1270" y1="108" x2="1370" y2="108" stroke="#FF0000"
            strokeWidth="2" markerEnd="url(#ar)" />
          <text x="1310" y="103" fill="white" fontSize="11">Water</text>

          <line x1="1270" y1="148" x2="1370" y2="148" stroke="#FF0000"
            strokeWidth="2" markerEnd="url(#ar)" />
          <text x="1310" y="143" fill="white" fontSize="11">Vapor</text>

          <line x1="1270" y1="235" x2="1370" y2="235" stroke="#FF0000"
            strokeWidth="2" markerEnd="url(#ar)" />
          <text x="1300" y="230" fill="white" fontSize="11">Brine</text>

          <line x1="1270" y1="270" x2="1370" y2="270" stroke="#FF0000"
            strokeWidth="2" markerEnd="url(#ar)" />
          <text x="1300" y="265" fill="white" fontSize="11">Solids</text>
        </g>

        {/* ══════════════════════════════════════════════════════ */}
        {/* ── CREW LATENT FLOW (red, middle) ── */}
        <g id="flow-crew-latent">
          <text x="380" y="330" fill="white" fontSize="16" textAnchor="middle">
            Crew Latent
          </text>
          <line x1="235" y1="348" x2="790" y2="348"
            stroke="#FF0000" strokeWidth="4" />
          <polygon points="790,335 815,348 790,361" fill="#FF0000" />

          {/* Merge arrows into WPA (downward red triangles) */}
          <polygon points="802,400 818,425 834,400" fill="#FF0000" />
        </g>

        {/* ══════════════════════════════════════════════════════ */}
        {/* ── WSS RESUPPLY TANKS ── */}
        <g id="wss-resupply">
          {/* Pipes from crew latent line down */}
          {[0, 1, 2, 3].map(i => (
            <line key={`pipe-r-${i}`} x1={370 + i * 42} y1="348"
              x2={370 + i * 42} y2="385" stroke="#888" strokeWidth="1" />
          ))}
          {/* Horizontal pipe connecting tops */}
          <line x1="370" y1="385" x2="496" y2="385" stroke="#888" strokeWidth="1" />

          {/* Tank containers */}
          {[0, 1, 2, 3].map(i => (
            <g key={`tank-r-${i}`}>
              <rect x={355 + i * 42} y={390} width="28" height="55"
                fill="none" stroke="#888" strokeWidth="1" />
              <rect x={355 + i * 42} y={418} width="28" height="27"
                fill="#2196F3" opacity="0.85" />
            </g>
          ))}
          <text x="530" y="408" fill="white" fontSize="12">WSS</text>
          <text x="530" y="423" fill="white" fontSize="12">Resupply</text>
          <text x="530" y="438" fill="white" fontSize="12">Tanks</text>

          {/* Lab Condensate Tank */}
          <rect x="580" y="415" width="100" height="42" fill="none"
            stroke="#888" strokeWidth="1" />
          <text x="630" y="434" fill="white" fontSize="11" textAnchor="middle">
            Lab
          </text>
          <text x="630" y="449" fill="white" fontSize="11" textAnchor="middle">
            Condensate Tank
          </text>
        </g>

        {/* ══════════════════════════════════════════════════════ */}
        {/* ── WPA ── */}
        <g id="wpa">
          <rect x="730" y="430" width="185" height="100" fill="none"
            stroke="#888" strokeWidth="1.5" />
          <text x="823" y="470" fill="white" fontSize="22" fontWeight="bold"
            textAnchor="middle">WPA</text>
          <text x="823" y="492" fill="white" fontSize="12" textAnchor="middle">
            Water Processor
          </text>
          <text x="823" y="508" fill="white" fontSize="12" textAnchor="middle">
            Assembly
          </text>
        </g>

        {/* ── Water flow from WPA → right ── */}
        <g id="flow-water-right">
          <text x="968" y="465" fill="white" fontSize="14">Water</text>
          <line x1="915" y1="475" x2="1030" y2="475"
            stroke="#FF0000" strokeWidth="2" />
        </g>

        {/* ══════════════════════════════════════════════════════ */}
        {/* ── WATER PROCESSOR PANEL (right side) ── */}
        <g id="water-processor-panel">
          <text x="1040" y="395" fill="white" fontSize="18" fontWeight="bold">
            Water Processor:
          </text>
          <text x="1040" y="425" fill="white" fontSize="16">State</text>
          <text x="1200" y="425" fill="#FF8C00" fontSize="22" fontWeight="bold"
            fontFamily="monospace">{fmtText('NODE3000006')}</text>
          <text x="1040" y="455" fill="white" fontSize="16">Step</text>
          <text x="1200" y="455" fill="#FF8C00" fontSize="22" fontWeight="bold"
            fontFamily="monospace">{fmtText('NODE3000007')}</text>
          <text x="1040" y="488" fill="white" fontSize="16">Waste Water:</text>
          <text x="1200" y="518" fill="#FF8C00" fontSize="30" fontWeight="bold"
            fontFamily="monospace">{fmtNumber('NODE3000008')}</text>
          <text x="1040" y="555" fill="white" fontSize="16" fontWeight="bold">
            Clean Water:
          </text>
          <text x="1200" y="585" fill="#00FF00" fontSize="30" fontWeight="bold"
            fontFamily="monospace">{fmtNumber('NODE3000009')}</text>
        </g>

        {/* ══════════════════════════════════════════════════════ */}
        {/* ── POTABLE WATER FLOW (blue, going left) ── */}
        <g id="flow-potable-water">
          <text x="400" y="570" fill="white" fontSize="16" textAnchor="middle">
            Potable Water
          </text>
          <line x1="235" y1="588" x2="915" y2="588"
            stroke="#2196F3" strokeWidth="4" markerStart="url(#ab-s)" />

          {/* Label on right side */}
          <text x="930" y="583" fill="white" fontSize="13">Potable Water</text>

          {/* Vertical line from WPA down to potable water line */}
          <line x1="915" y1="530" x2="915" y2="588"
            stroke="#FF0000" strokeWidth="2" />

          {/* Vertical line from potable water down to OGS */}
          <line x1="740" y1="588" x2="740" y2="660"
            stroke="#00BFFF" strokeWidth="3" markerEnd="url(#ac)" />
        </g>

        {/* ══════════════════════════════════════════════════════ */}
        {/* ── WSS STORAGE TANKS ── */}
        <g id="wss-storage">
          {[0, 1, 2, 3].map(i => (
            <g key={`tank-s-${i}`}>
              <rect x={355 + i * 42} y={620} width="28" height="55"
                fill="none" stroke="#888" strokeWidth="1" />
              <rect x={355 + i * 42} y={648} width="28" height="27"
                fill="#2196F3" opacity="0.85" />
            </g>
          ))}
          <text x="530" y="642" fill="white" fontSize="12">WSS</text>
          <text x="530" y="657" fill="white" fontSize="12">Storage</text>
          <text x="530" y="672" fill="white" fontSize="12">Tanks*</text>
        </g>

        {/* ══════════════════════════════════════════════════════ */}
        {/* ── OGS SECTION ── */}
        <g id="ogs">
          <text x="700" y="650" fill="white" fontSize="22" fontWeight="bold">
            OGS
          </text>

          {/* OGA box */}
          <rect x="730" y="668" width="185" height="105" fill="none"
            stroke="#888" strokeWidth="1.5" />
          <text x="823" y="708" fill="white" fontSize="22" fontWeight="bold"
            textAnchor="middle">OGA</text>
          <text x="823" y="730" fill="white" fontSize="12" textAnchor="middle">
            Oxygen Generator
          </text>
          <text x="823" y="746" fill="white" fontSize="12" textAnchor="middle">
            Assembly
          </text>
        </g>

        {/* ══════════════════════════════════════════════════════ */}
        {/* ── CRS ── */}
        <g id="crs">
          <rect x="1050" y="668" width="155" height="105" fill="none"
            stroke="#888" strokeWidth="1.5" />
          <text x="1128" y="705" fill="white" fontSize="22" fontWeight="bold"
            textAnchor="middle">CRS</text>
          <text x="1128" y="725" fill="white" fontSize="12" textAnchor="middle">
            CO2
          </text>
          <text x="1128" y="740" fill="white" fontSize="12" textAnchor="middle">
            Reduction
          </text>
          <text x="1128" y="755" fill="white" fontSize="12" textAnchor="middle">
            System
          </text>
        </g>

        {/* ── Hydrogen flow: OGA → CRS ── */}
        <g id="flow-hydrogen">
          <text x="975" y="700" fill="white" fontSize="14" textAnchor="middle">
            Hydrogen
          </text>
          <line x1="915" y1="715" x2="1040" y2="715"
            stroke="#FFCC00" strokeWidth="4" />
          <polygon points="1040,703 1060,715 1040,727" fill="#FFCC00" />
        </g>

        {/* ── Methane flow: CRS → down/overboard ── */}
        <g id="flow-methane">
          <text x="1155" y="800" fill="white" fontSize="14">Methane</text>
          <line x1="1128" y1="773" x2="1128" y2="855"
            stroke="#FFCC00" strokeWidth="3" />
          <polygon points="1116,853 1128,875 1140,853" fill="#FFCC00" />

          {/* Methane → Overboard (right) */}
          <line x1="1128" y1="870" x2="1370" y2="870"
            stroke="#FFCC00" strokeWidth="3" markerEnd="url(#ay)" />
          <text x="1270" y="905" fill="white" fontSize="15" fontWeight="bold">
            Overboard
          </text>
        </g>

        {/* ══════════════════════════════════════════════════════ */}
        {/* ── CDRA ── */}
        <g id="cdra">
          <rect x="45" y="840" width="130" height="40" fill="none"
            stroke="#888" strokeWidth="1.5" />
          <text x="110" y="866" fill="white" fontSize="16" fontWeight="bold"
            textAnchor="middle">CDRA</text>
        </g>

        {/* ── Oxygen flow (green, going left) ── */}
        <g id="flow-oxygen">
          <text x="400" y="800" fill="white" fontSize="16" textAnchor="middle">
            Oxygen
          </text>
          <line x1="235" y1="815" x2="730" y2="815"
            stroke="#00CC00" strokeWidth="4" markerStart="url(#ag)" />
        </g>

        {/* ── Carbon Dioxide flow (yellow/orange, going right) ── */}
        <g id="flow-co2">
          <text x="400" y="850" fill="white" fontSize="16" textAnchor="middle">
            Carbon Dioxide
          </text>
          <line x1="175" y1="862" x2="1128" y2="862"
            stroke="#FFAA00" strokeWidth="4" />
          {/* CO2 goes up into CRS */}
          <line x1="1128" y1="862" x2="1128" y2="773"
            stroke="#FFCC00" strokeWidth="3" />
          <polygon points="1116,780 1128,762 1140,780" fill="#FFCC00" />
        </g>

      </svg>
    </div>
  );
}
