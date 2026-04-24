'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTelemetry } from '@/contexts/TelemetryContext';

interface TelemetryMeta {
  id: string;
  name: string;
  unit: string;
}

interface EclssCategory {
  name: string;
  description: string;
  icon: string;
  accentColor: string;
  telemetry: TelemetryMeta[];
  link?: string;
}

const ECLSS_CATEGORIES: EclssCategory[] = [
  {
    name: 'Oxygen Generation',
    description: 'Produces oxygen for crew using OGS Racks. This is part of Water Recovery & Management.',
    icon: '💨',
    accentColor: '#00AAFF',
    telemetry: [
      { id: 'NODE3000010', name: 'Oxygen Generator State', unit: '' },
      { id: 'NODE3000011', name: 'O₂ Production Rate', unit: 'lb/day' },
    ],
  },
  {
    name: 'Water Recovery',
    description: 'Provides water by reclaiming wastewater using WRS Racks to make potable water for the crew.',
    icon: '💧',
    accentColor: '#00DD66',
    link: '/3d-model/eclss/wrm',
    telemetry: [
      { id: 'NODE3000009', name: 'Clean Water Tank', unit: '%' },
      { id: 'NODE3000008', name: 'Waste Water Tank', unit: '%' },
    ],
  },
  {
    name: 'Atmosphere Control & Supply',
    description: 'Provides cabin atmosphere pressure control, nitrogen and oxygen distribution.',
    icon: '🌬️',
    accentColor: '#FF8C00',
    telemetry: [
      { id: 'USLAB000058', name: 'Cabin Pressure', unit: 'torr' },
      { id: 'AIRLOCK000054', name: 'Airlock Pressure', unit: 'torr' },
      { id: 'AIRLOCK000049', name: 'Crewlock Pressure', unit: 'torr' },
    ],
  },
  {
    name: 'Atmosphere Revitalization',
    description: 'Cleans circulating cabin air and removes carbon dioxide using CDRA.',
    icon: '♻️',
    accentColor: '#FF44FF',
    telemetry: [
      { id: 'USLAB000062', name: 'VRS Valve Position', unit: '' },
      { id: 'USLAB000063', name: 'VES Valve Position', unit: '' },
    ],
  },
  {
    name: 'Temp & Humidity Control',
    description: 'Maintains temperature and humidity levels. Circulates air between modules.',
    icon: '🌡️',
    accentColor: '#FFD700',
    telemetry: [
      { id: 'USLAB000059', name: 'Cabin Temperature', unit: '°C' },
    ],
  },
];

const ALL_TELEMETRY: TelemetryMeta[] = ECLSS_CATEGORIES.flatMap(c => c.telemetry);

function formatValue(raw: string | undefined | null, unit: string): string {
  if (raw == null || raw === '') return '---';
  const num = parseFloat(raw);
  if (isNaN(num)) return raw;
  return unit ? `${num.toFixed(2)} ${unit}` : num.toFixed(2);
}

function CategoryCard({
  category,
  onClick,
}: {
  category: EclssCategory;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#0d1117',
        border: `1px solid ${hovered ? category.accentColor : '#1a2a3a'}`,
        borderRadius: 12,
        padding: '28px 24px',
        cursor: 'pointer',
        transition: 'border-color 0.3s, box-shadow 0.3s, transform 0.2s',
        boxShadow: hovered
          ? `0 0 24px ${category.accentColor}22, 0 4px 20px rgba(0,0,0,0.4)`
          : '0 2px 8px rgba(0,0,0,0.3)',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        minHeight: 200,
      }}
    >
      <div style={{ fontSize: 36 }}>{category.icon}</div>
      <div style={{
        color: category.accentColor,
        fontSize: 18,
        fontWeight: 700,
        fontFamily: 'monospace',
        letterSpacing: 0.5,
      }}>
        {category.name}
      </div>
      <div style={{
        color: '#8b949e',
        fontSize: 13,
        lineHeight: 1.5,
        flex: 1,
      }}>
        {category.description}
      </div>
      <div style={{
        color: hovered ? category.accentColor : '#484f58',
        fontSize: 12,
        fontFamily: 'monospace',
        textTransform: 'uppercase',
        letterSpacing: 1,
        transition: 'color 0.3s',
        marginTop: 4,
      }}>
        ▸ {category.link ? 'View Diagram' : 'View Live Data'}
      </div>
    </div>
  );
}

function EclssModal({
  category,
  onClose,
  telemetryItems,
}: {
  category: EclssCategory;
  onClose: () => void;
  telemetryItems: Record<string, { value: string; timestamp: string }>;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleClose = useCallback(() => {
    setVisible(false);
    setTimeout(onClose, 200);
  }, [onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleClose]);

  return (
    <div
      onClick={handleClose}
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        background: `rgba(0,0,0,${visible ? 0.75 : 0})`,
        zIndex: 1050,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background 0.2s',
        padding: 20,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '90vw',
          maxWidth: 520,
          background: '#0d1117',
          border: `1px solid ${category.accentColor}`,
          borderRadius: 16,
          padding: '32px',
          boxShadow: `0 0 40px ${category.accentColor}33, 0 8px 32px rgba(0,0,0,0.6)`,
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(-16px)',
          transition: 'opacity 0.2s, transform 0.2s',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 20,
        }}>
          <div>
            <div style={{ fontSize: 28, marginBottom: 4 }}>{category.icon}</div>
            <div style={{
              color: category.accentColor,
              fontSize: 22,
              fontWeight: 700,
              fontFamily: 'monospace',
            }}>
              {category.name}
            </div>
          </div>
          <button
            onClick={handleClose}
            style={{
              background: 'none',
              border: '1px solid #30363d',
              borderRadius: 8,
              color: '#8b949e',
              fontSize: 18,
              cursor: 'pointer',
              padding: '4px 10px',
              lineHeight: 1,
              transition: 'color 0.2s, border-color 0.2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = '#ffffff';
              e.currentTarget.style.borderColor = '#484f58';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = '#8b949e';
              e.currentTarget.style.borderColor = '#30363d';
            }}
          >
            ✕
          </button>
        </div>

        {/* Description */}
        <div style={{
          color: '#8b949e',
          fontSize: 14,
          lineHeight: 1.6,
          marginBottom: 24,
          paddingBottom: 20,
          borderBottom: '1px solid #1a2a3a',
        }}>
          {category.description}
        </div>

        {/* Telemetry rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {category.telemetry.map(t => {
            const item = telemetryItems[t.id];
            const rawValue = item?.value;
            return (
              <div key={t.id} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#161b22',
                borderRadius: 8,
                padding: '14px 18px',
                border: '1px solid #21262d',
              }}>
                <div>
                  <div style={{
                    color: '#c9d1d9',
                    fontSize: 14,
                    fontWeight: 600,
                  }}>
                    {t.name}
                  </div>
                  <div style={{
                    color: '#484f58',
                    fontSize: 11,
                    fontFamily: 'monospace',
                    marginTop: 2,
                  }}>
                    {t.id}
                  </div>
                </div>
                <div style={{
                  color: '#FF8C00',
                  fontSize: 20,
                  fontWeight: 700,
                  fontFamily: 'monospace',
                  textAlign: 'right',
                }}>
                  {formatValue(rawValue, t.unit)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function EclssPage() {
  const { telemetryItems } = useTelemetry();
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  const handleCardClick = (index: number) => {
    const cat = ECLSS_CATEGORIES[index];
    if (cat.link) {
      router.push(cat.link);
    } else {
      setSelectedCategory(index);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#000000',
      padding: '40px 20px',
      userSelect: 'none',
    }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{
            color: '#00DD66',
            fontSize: 42,
            fontWeight: 800,
            fontFamily: 'monospace',
            letterSpacing: 4,
          }}>
            ECLSS
          </div>
          <div style={{
            color: '#00DD66',
            fontSize: 16,
            fontFamily: 'monospace',
            opacity: 0.7,
            marginTop: 6,
          }}>
            Environmental Control &amp; Life Support System
          </div>
        </div>

        {/* Category Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 20,
          marginBottom: 48,
        }}>
          {ECLSS_CATEGORIES.map((cat, i) => (
            <CategoryCard
              key={cat.name}
              category={cat}
              onClick={() => handleCardClick(i)}
            />
          ))}
        </div>

        {/* Summary Telemetry Strip */}
        <div style={{
          background: '#0d1117',
          border: '1px solid #1a2a3a',
          borderRadius: 12,
          padding: '24px 28px',
        }}>
          <div style={{
            color: '#484f58',
            fontSize: 12,
            fontFamily: 'monospace',
            textTransform: 'uppercase',
            letterSpacing: 1.5,
            marginBottom: 16,
          }}>
            Live Telemetry Overview
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '12px 24px',
          }}>
            {ALL_TELEMETRY.map(t => {
              const item = telemetryItems[t.id];
              return (
                <div key={t.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 0',
                  borderBottom: '1px solid #161b22',
                }}>
                  <span style={{
                    color: '#8b949e',
                    fontSize: 13,
                    fontFamily: 'monospace',
                  }}>
                    {t.name}
                  </span>
                  <span style={{
                    color: '#FF8C00',
                    fontSize: 15,
                    fontWeight: 700,
                    fontFamily: 'monospace',
                    marginLeft: 12,
                    whiteSpace: 'nowrap',
                  }}>
                    {formatValue(item?.value, t.unit)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal */}
      {selectedCategory !== null && (
        <EclssModal
          category={ECLSS_CATEGORIES[selectedCategory]}
          onClose={() => setSelectedCategory(null)}
          telemetryItems={telemetryItems}
        />
      )}
    </div>
  );
}
