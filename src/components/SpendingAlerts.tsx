import React, { useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { useSpendingLimits } from '../hooks/useSpendingLimits';
import { useAuth } from '../contexts/AuthContext';

interface SpendingAlertsRef {
  forceCheck: (overrideHidden?: boolean) => void;
}

type AlertItem = {
  categoryId: string;
  categoryName: string;
  percentage: number;
  currentSpent: number;
  limit: number;
};

const LAST_SHOWN_KEY = "notificationLastShown";

const containerStyle: React.CSSProperties = {
  position: 'fixed',
  top: 20,
  right: 20,
  zIndex: 9999,
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
};

const cardStyle = (isCritical: boolean): React.CSSProperties => ({
  maxWidth: 350,
  // tarjeta fría para SpendingAlerts: azul oscuro / rojo crítico
  background: isCritical ? '#6b0f0f' : '#071033',
  color: isCritical ? '#fff' : '#cfeffd',
  padding: 14,
  paddingRight: 140,
  borderRadius: 8,
  boxShadow: '0 8px 28px rgba(2,6,23,0.6)', // sombra más fría/oscura
  border: `2px solid ${isCritical ? '#a72323' : '#0b4b78'}`,
  position: 'relative',
});

const closeBtnStyle = (isCritical: boolean): React.CSSProperties => ({
  position: 'absolute',
  top: 10,
  right: 12,
  // botón "Cerrar" pequeño, oscuro pero con texto/acento frío
  background: isCritical ? 'rgba(0,0,0,0.5)' : 'rgba(2,8,20,0.7)',
  color: isCritical ? '#ffdddd' : '#9fe7ff',
  border: '1px solid rgba(255,255,255,0.03)',
  borderRadius: 8,
  padding: '6px 10px',
  minWidth: 64,
  height: 32,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 13,
  fontWeight: 700,
  boxShadow: '0 6px 18px rgba(0,0,0,0.28)',
});

const pillStyle: React.CSSProperties = {
  position: 'absolute',
  top: 46,
  right: 12,
  minWidth: 96,
  padding: '6px 10px',
  borderRadius: 8,
  // pill con acento frío
  background: 'rgba(6,32,58,0.9)',
  color: '#bff1ff',
  border: '1px solid rgba(16,88,132,0.16)',
  boxShadow: '0 8px 20px rgba(0,0,0,0.36)',
  cursor: 'pointer',
  fontWeight: 700,
  fontSize: 13,
  textAlign: 'center',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const titleStyle: React.CSSProperties = { margin: 0, fontSize: 16, fontWeight: 800 };
const metaStyle: React.CSSProperties = { fontSize: 13, lineHeight: 1.4 };

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function readLastShown(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(LAST_SHOWN_KEY) || "{}");
  } catch {
    return {};
  }
}
function writeLastShown(map: Record<string, string>) {
  try {
    localStorage.setItem(LAST_SHOWN_KEY, JSON.stringify(map));
  } catch {}
}

const SpendingAlerts = forwardRef<SpendingAlertsRef>((props, ref) => {
  const { user } = useAuth();
  const { alerts, loading, checkSpendingLimits } = useSpendingLimits(user?.id || '');
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);
  const [alertsVersion, setAlertsVersion] = useState(0);
  const [lastShownMap, setLastShownMap] = useState<Record<string, string>>({});
  const [showHiddenOverride, setShowHiddenOverride] = useState<boolean>(false);
  
  useEffect(() => {
    // cargar mapas de "no mostrar hoy"
    setLastShownMap(readLastShown());
  }, []);

  useEffect(() => {
    if (user?.id) checkSpendingLimits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // reset dismissed cuando cambian las alertas
  useEffect(() => {
    setDismissedAlerts([]);
    setAlertsVersion((v) => v + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alerts.length, JSON.stringify(alerts)]);

  useImperativeHandle(ref, () => ({
    // por defecto forzamos a mostrar aunque estén marcadas como "no mostrar hoy"
    forceCheck: (overrideHidden = true) => {
      // reset dismissed in-session
      setDismissedAlerts([]);
      setAlertsVersion((v) => v + 1);

      if (overrideHidden) {
        setShowHiddenOverride(true);
        // mostrar durante unos segundos sin modificar localStorage
        setTimeout(() => setShowHiddenOverride(false), 5000);
      }
      // siempre re-ejecutamos la comprobación
      checkSpendingLimits();
      // refrescar mapa persistente por si cambió en otra pestaña
      setLastShownMap(readLastShown());
    },
  }));

  const isoLocal = todayISO();
  const isoUTC = new Date().toISOString().slice(0, 10);

  const visibleAlerts: AlertItem[] = (alerts || []).filter((a: AlertItem) => {
    const id = a.categoryId;
    const isDismissed = dismissedAlerts.includes(id);
    const isHiddenToday = lastShownMap[id] === isoLocal || lastShownMap[id] === isoUTC;
    if (isDismissed) return false;
    if (isHiddenToday && !showHiddenOverride) return false;
    return true;
  });

  const dismissAlert = (categoryId: string) => {
    // asegurar que "Cerrar" sea solo temporal: quitar cualquier marca persistente si existe
    try {
      const map = readLastShown();
      if (map && map[categoryId]) {
        delete map[categoryId];
        writeLastShown(map);
        // actualizar el estado local para reflejar el cambio inmediatamente
        setLastShownMap(map);
      }
    } catch (err) {
      // noop
    }
    // ocultar en esta sesión
    setDismissedAlerts((s) => {
      if (s.includes(categoryId)) return s;
      return [...s, categoryId];
    });
  };

  const dismissForToday = (categoryId: string) => {
    const iso = todayISO();
    const last = { ...readLastShown(), [categoryId]: iso };
    writeLastShown(last);
    setLastShownMap(last);
    setDismissedAlerts((s) => ([...s, categoryId]));
  };

  if (loading) return null;
  if (!visibleAlerts.length) return null;

  return (
    <div className="spending-alerts-container" style={containerStyle}>
      {visibleAlerts.map((alert: AlertItem) => {
        const isCritical = (alert?.percentage ?? 0) >= 100;
        return (
          <div key={`${alert.categoryId}-${alertsVersion}`} style={cardStyle(isCritical)}>
            <button
              onClick={() => dismissAlert(alert.categoryId)}
              style={closeBtnStyle(isCritical)}
              title="Cerrar"
              aria-label={`Cerrar alerta ${alert.categoryName}`}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 12px 28px rgba(0,0,0,0.22)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = ''; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 18px rgba(0,0,0,0.18)'; }}
            >
              Cerrar
            </button>

            <button
              onClick={() => dismissForToday(alert.categoryId)}
              style={pillStyle}
              title="No mostrar hoy"
              aria-label={`No mostrar hoy ${alert.categoryName}`}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 12px 28px rgba(0,0,0,0.24)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = ''; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 20px rgba(0,0,0,0.28)'; }}
            >
              No mostrar hoy
            </button>

            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ fontSize: 22, marginTop: 2 }}>{isCritical ? '🚫' : '⚠️'}</div>

              <div style={{ flex: 1 }}>
                <h3 style={titleStyle}>{isCritical ? '¡Límite Superado!' : '¡Cerca del Límite!'}</h3>

                <div style={metaStyle}>
                  <div style={{ fontWeight: 700, marginBottom: 6 }}>{alert.categoryName}</div>
                  <div>💰 Gastado: Q{(alert.currentSpent ?? 0).toFixed(2)} / Q{(alert.limit ?? 0).toFixed(2)}</div>
                  <div style={{ fontWeight: 700, marginTop: 6 }}>{Math.round(alert.percentage ?? 0)}% del límite mensual</div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
});

SpendingAlerts.displayName = 'SpendingAlerts';

export default SpendingAlerts;
export type {
  SpendingAlertsRef,
};