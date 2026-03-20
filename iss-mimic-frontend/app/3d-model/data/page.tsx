'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useTelemetry } from '@/contexts/TelemetryContext';

// ─── Types ───────────────────────────────────────────────────────────────────

type PanelKey = '1A' | '1B' | '2A' | '2B' | '3A' | '3B' | '4A' | '4B';
type PanelStatus = 'offline' | 'discharging' | 'charged' | 'charging' | 'unknown';

interface PanelConfig {
  key: PanelKey;
  voltageId: string;
  currentId: string;
  angleId: string;
}

interface PanelData {
  voltage: number | null;
  current: number | null;
  angle: number | null;
  avgVoltage: number | null;
  status: PanelStatus;
}

// ─── Panel → Telemetry ID Mapping ────────────────────────────────────────────
// Note: 1A and 1B intentionally share the same IDs — telemetry limitation.

const PANEL_CONFIGS: PanelConfig[] = [
  { key: '1A', voltageId: 'S4000001', currentId: 'S4000002', angleId: 'S4000007' },
  { key: '1B', voltageId: 'S4000001', currentId: 'S4000002', angleId: 'S4000007' },
  { key: '2A', voltageId: 'P4000001', currentId: 'P4000002', angleId: 'P4000007' },
  { key: '2B', voltageId: 'P6000004', currentId: 'P6000005', angleId: 'P6000008' },
  { key: '3A', voltageId: 'S4000004', currentId: 'S4000005', angleId: 'S4000008' },
  { key: '3B', voltageId: 'S6000001', currentId: 'S6000002', angleId: 'S6000007' },
  { key: '4A', voltageId: 'S6000004', currentId: 'S6000005', angleId: 'S6000008' },
  { key: '4B', voltageId: 'P6000001', currentId: 'P6000002', angleId: 'P6000007' },
];

// ─── Status Logic ─────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<PanelStatus, string> = {
  offline:     '#888888',
  discharging: '#FF6600',
  charged:     '#00DD66',
  charging:    '#00AAFF',
  unknown:     '#334466',
};

function getPanelStatus(instantCurrent: number, avgVoltage: number): PanelStatus {
  if (instantCurrent > 0.0) return 'offline';
  if (avgVoltage < 151.5)   return 'discharging';
  if (avgVoltage > 160.0)   return 'charged';
  return 'charging';
}

const EMPTY_PANEL: PanelData = {
  voltage: null, current: null, angle: null, avgVoltage: null, status: 'unknown',
};

// ─── SolarPanelUnit ───────────────────────────────────────────────────────────

function SolarPanelUnit({ panelKey, data }: { panelKey: PanelKey; data: PanelData }) {
  const statusColor = STATUS_COLORS[data.status];
  const fmt = (v: number | null, dec: number) => v !== null ? v.toFixed(dec) : '—';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      {/* Label stack */}
      <div style={{ textAlign: 'center', lineHeight: 1.5, fontFamily: 'monospace' }}>
        <div style={{ color: '#FF44FF', fontSize: 22, fontWeight: 'bold', letterSpacing: 1 }}>
          {panelKey}
        </div>
        <div style={{ color: '#FF8C00', fontSize: 18 }}>{fmt(data.angle, 2)}°</div>
        <div style={{ color: '#FF8C00', fontSize: 18 }}>{fmt(data.current, 2)}A</div>
        <div style={{ color: '#FF8C00', fontSize: 18 }}>{fmt(data.voltage, 2)}V</div>
      </div>

      {/* Solar panel rectangle */}
      <div style={{
        width: 84,
        height: 285,
        background: `
          repeating-linear-gradient(0deg,   rgba(0,0,0,0.28) 0px, transparent 1px, transparent 21px, rgba(0,0,0,0.28) 21px),
          repeating-linear-gradient(90deg,  rgba(0,0,0,0.28) 0px, transparent 1px, transparent 21px, rgba(0,0,0,0.28) 21px),
          linear-gradient(160deg, #1e5bb5 0%, #0a2d6e 55%, #1e5bb5 100%)
        `,
        border: `2px solid ${statusColor}`,
        borderRadius: 3,
        boxShadow: `0 0 14px ${statusColor}66, inset 0 0 8px rgba(0,0,80,0.4)`,
        transition: 'border-color 0.4s, box-shadow 0.4s',
      }} />
    </div>
  );
}

// ─── SarjConnector ────────────────────────────────────────────────────────────

function SarjConnector() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      {/* Connector body */}
      <div style={{
        width: 18,
        height: 30,
        background: '#FFDD00',
        border: '2px solid #CC9900',
        borderRadius: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00CC44' }} />
      </div>
    </div>
  );
}

// ─── Sun Icon ─────────────────────────────────────────────────────────────────

function SunIcon({ totalPower }: { totalPower: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <div style={{
        fontSize: 57,
        lineHeight: 1,
        filter: 'drop-shadow(0 0 10px #FFB800)',
        color: '#FFD700',
      }}>
        ☀
      </div>
      <div style={{ color: '#FF8C00', fontFamily: 'monospace', fontSize: 19, fontWeight: 'bold' }}>
        {totalPower.toFixed(2)} W
      </div>
    </div>
  );
}

// ─── Center SARJ Strip ────────────────────────────────────────────────────────

function CenterStrip({
  ssarjAngle,
  psarjAngle,
  totalPower,
}: {
  ssarjAngle: number;
  psarjAngle: number;
  totalPower: number;
}) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      padding: '0 16px',
    }}>
      {/* Sun + total power */}
      <SunIcon totalPower={totalPower} />

      {/* Connector row with dashed line */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        gap: 0,
      }}>
        <SarjConnector />
        <SarjConnector />
        <div style={{ flex: 1, borderTop: '2px dashed #00CC44', margin: '0 4px' }} />
        {/* SARJ info block */}
        <div style={{
          textAlign: 'center',
          fontFamily: 'monospace',
          color: '#ffffff',
          fontSize: 16,
          padding: '0 10px',
          whiteSpace: 'nowrap',
        }}>
          <div style={{ fontSize: 19, fontWeight: 'bold', marginBottom: 2 }}>
            SSARJ
          </div>
          <div style={{ color: '#FF8C00' }}>{ssarjAngle.toFixed(2)}°</div>
        </div>

        <div style={{
          color: '#FF8C00',
          fontSize: 24,
          fontWeight: 'bold',
          fontFamily: 'monospace',
          padding: '0 10px',
        }}>
          -{totalPower.toFixed(0)} W
        </div>

        <div style={{
          textAlign: 'center',
          fontFamily: 'monospace',
          color: '#ffffff',
          fontSize: 16,
          padding: '0 10px',
          whiteSpace: 'nowrap',
        }}>
          <div style={{ fontSize: 19, fontWeight: 'bold', marginBottom: 2 }}>
            PSARJ
          </div>
          <div style={{ color: '#FF8C00' }}>{psarjAngle.toFixed(2)}°</div>
        </div>

        <div style={{ flex: 1, borderTop: '2px dashed #00CC44', margin: '0 4px' }} />
        <SarjConnector />
        <SarjConnector />
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function IssDataModel() {
  const { telemetryItems } = useTelemetry();

  const voltageBuffers = useRef<Record<PanelKey, number[]>>({
    '1A': [], '1B': [], '2A': [], '2B': [],
    '3A': [], '3B': [], '4A': [], '4B': [],
  });

  const [panelData, setPanelData] = useState<Record<PanelKey, PanelData>>({
    '1A': { ...EMPTY_PANEL }, '1B': { ...EMPTY_PANEL },
    '2A': { ...EMPTY_PANEL }, '2B': { ...EMPTY_PANEL },
    '3A': { ...EMPTY_PANEL }, '3B': { ...EMPTY_PANEL },
    '4A': { ...EMPTY_PANEL }, '4B': { ...EMPTY_PANEL },
  });

  const ssarjAngle = parseFloat(telemetryItems['S0000003']?.value ?? '0') || 0;
  const psarjAngle = parseFloat(telemetryItems['S0000004']?.value ?? '0') || 0;

  useEffect(() => {
    const next: Partial<Record<PanelKey, PanelData>> = {};

    for (const cfg of PANEL_CONFIGS) {
      const voltage = telemetryItems[cfg.voltageId]?.value != null
        ? parseFloat(telemetryItems[cfg.voltageId].value) : null;
      const current = telemetryItems[cfg.currentId]?.value != null
        ? parseFloat(telemetryItems[cfg.currentId].value) : null;
      const angle = telemetryItems[cfg.angleId]?.value != null
        ? parseFloat(telemetryItems[cfg.angleId].value) : null;

      if (voltage !== null && !isNaN(voltage)) {
        const buf = voltageBuffers.current[cfg.key];
        buf.push(voltage);
        if (buf.length > 10) buf.shift();
      }

      const buf = voltageBuffers.current[cfg.key];
      const avgVoltage = buf.length > 0
        ? buf.reduce((a, b) => a + b, 0) / buf.length
        : null;

      const hasData = current !== null && avgVoltage !== null;
      const status: PanelStatus = hasData
        ? getPanelStatus(current!, avgVoltage!)
        : 'unknown';

      next[cfg.key] = { voltage, current, angle, avgVoltage, status };
    }

    setPanelData(prev => ({ ...prev, ...(next as Record<PanelKey, PanelData>) }));
  }, [telemetryItems]);

  // Total power: sum V×I for non-offline panels
  const totalPower = PANEL_CONFIGS.reduce((sum, cfg) => {
    const d = panelData[cfg.key];
    if (d.status === 'offline' || d.status === 'unknown') return sum;
    if (d.voltage === null || d.current === null) return sum;
    return sum + Math.abs(d.voltage * d.current);
  }, 0);

  const p = panelData;

  return (
    <div style={{
      minHeight: '100vh',
      background: '#000000',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px 10px',
      userSelect: 'none',
    }}>
      {/* ── Top row panels ───────────────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'auto auto 1fr auto auto',
        gap: '0 24px',
        alignItems: 'end',
        width: '100%',
        maxWidth: 1160,
      }}>
        {/* Col 1: 1B */}
        <SolarPanelUnit panelKey="1B" data={p['1B']} />

        {/* Col 2: 3A */}
        <SolarPanelUnit panelKey="3A" data={p['3A']} />

        {/* Col 3: center top — sun + power */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 10 }}>
          <SunIcon totalPower={totalPower} />
        </div>

        {/* Col 4: 2A */}
        <SolarPanelUnit panelKey="2A" data={p['2A']} />

        {/* Col 5: 4B */}
        <SolarPanelUnit panelKey="4B" data={p['4B']} />
      </div>

      {/* ── Connector / SARJ strip ───────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'auto auto 1fr auto auto',
        gap: '0 24px',
        alignItems: 'center',
        width: '100%',
        maxWidth: 1160,
        margin: '10px 0',
      }}>
        {/* Spacer col 1 (align with outer panel) */}
        <div style={{ width: 62 }} />

        {/* Inner-left connector column */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <SarjConnector />
            <div style={{ width: 2, height: 28, background: '#00CC44', margin: '0 auto' }} />
            <SarjConnector />
          </div>
        </div>

        {/* Center SARJ strip */}
        <CenterStrip
          ssarjAngle={ssarjAngle}
          psarjAngle={psarjAngle}
          totalPower={totalPower}
        />

        {/* Inner-right connector column */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <SarjConnector />
            <div style={{ width: 2, height: 28, background: '#00CC44', margin: '0 auto' }} />
            <SarjConnector />
          </div>
        </div>

        {/* Spacer col 5 */}
        <div style={{ width: 62 }} />
      </div>

      {/* ── Bottom row panels ────────────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'auto auto 1fr auto auto',
        gap: '0 24px',
        alignItems: 'start',
        width: '100%',
        maxWidth: 1160,
      }}>
        {/* Col 1: 3B */}
        <SolarPanelUnit panelKey="3B" data={p['3B']} />

        {/* Col 2: 1A */}
        <SolarPanelUnit panelKey="1A" data={p['1A']} />

        {/* Col 3: center bottom — empty (SARJ angles shown in strip) */}
        <div />

        {/* Col 4: 4A */}
        <SolarPanelUnit panelKey="4A" data={p['4A']} />

        {/* Col 5: 2B */}
        <SolarPanelUnit panelKey="2B" data={p['2B']} />
      </div>

      {/* ── Status legend ────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        gap: 20,
        marginTop: 24,
        fontFamily: 'monospace',
        fontSize: 12,
      }}>
        {(Object.entries(STATUS_COLORS) as [PanelStatus, string][])
          .filter(([k]) => k !== 'unknown')
          .map(([status, color]) => (
            <div key={status} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 10, background: color, borderRadius: 2 }} />
              <span style={{ color: '#aaaaaa', textTransform: 'uppercase' }}>{status}</span>
            </div>
          ))}
      </div>
    </div>
  );
}
