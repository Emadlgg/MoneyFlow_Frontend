/* eslint-disable no-empty */
import React, { useCallback, useEffect, useState } from "react";
import "../assets/style/notifications.css";
import { supabase } from '../services/supabaseClient' // ajusta ruta si tu cliente está en otro sitio

type TaxItem = { id: string; label: string; enabled: boolean; dueDay?: number | string; dueMonth?: number | string };
type Preferences = {
  taxes: TaxItem[];
  lowBalance: { enabled: boolean; threshold?: number };
  largeTransaction: { enabled: boolean; threshold?: number };
};

const STORAGE_KEY = "notificationPreferences";
const LAST_SHOWN_KEY = "notificationLastShown";
const API = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const MONTH_NAMES = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"
];

const defaultPrefs: Preferences = {
  taxes: [
    { id: "isr", label: "ISR (impuesto sobre la renta)", enabled: false },
    { id: "iusi", label: "IUSI (predial)", enabled: false },
    { id: "circulacion", label: "Impuesto sobre circulación", enabled: false },
  ],
  lowBalance: { enabled: false, threshold: 100 },
  largeTransaction: { enabled: false, threshold: 1000 },
};

// Normaliza/mezcla prefs cargadas con los impuestos por defecto
function normalizePrefs(loaded: any): Preferences {
  const loadedTaxesRaw: any[] = Array.isArray(loaded?.taxes) ? loaded.taxes : [];

  // Mapeo de IDs legacy -> ID actual (migramos valores antiguos hacia el impuesto correcto)
  const legacyMap: Record<string, string> = {
    "calcomania": "circulacion",
    "calcomania_carro": "circulacion",
    "calcomania_de_carro": "circulacion",
    // agrega otros legacy si hace falta
  };

  // Normalizar ids y consolidar entradas cargadas (si múltiples legacy apuntan al mismo objetivo)
  const loadedById: Record<string, any> = {};
  for (const item of loadedTaxesRaw) {
    if (!item || !item.id) continue;
    const targetId = legacyMap[item.id] ?? item.id;
    // merge para no perder enabled/dueDay/dueMonth; later entries override
    loadedById[targetId] = { ...(loadedById[targetId] || {}), ...item, id: targetId };
  }

  const defaultIds = defaultPrefs.taxes.map((t) => t.id);

  // Partimos de los impuestos por defecto, sobrescribiendo enabled/dueDay/dueMonth si vienen en loaded
  const merged = defaultPrefs.taxes.map((def) => {
    const found = loadedById[def.id];
    return {
      ...def,
      enabled: found?.enabled ?? def.enabled,
      dueDay: found?.dueDay ?? found?.due_day ?? def.dueDay,
      dueMonth: found?.dueMonth ?? found?.due_month ?? def.dueMonth,
    };
  });

  // Añadir extras: solo aquellos que no colisionan con defaults y que no son entries legacy mapeadas
  const extras = Object.values(loadedById)
    .filter((e: any) => e?.id && !defaultIds.includes(e.id))
    .map((e: any) => ({
      id: e.id,
      label: e.label ?? e.id,
      enabled: !!e.enabled,
      dueDay: e.dueDay ?? e.due_day,
      dueMonth: e.dueMonth ?? e.due_month,
    }));

  const result: Preferences = {
    taxes: [...merged, ...extras],
    lowBalance: { ...(defaultPrefs.lowBalance), ...(loaded?.lowBalance || {}) },
    largeTransaction: { ...(defaultPrefs.largeTransaction), ...(loaded?.largeTransaction || {}) },
  };
  return result;
}

export default function Notifications(): JSX.Element {
  const [prefs, setPrefs] = useState<Preferences>(defaultPrefs);
  const [saved, setSaved] = useState(false);
  const [dueAlerts, setDueAlerts] = useState<TaxItem[]>([]);
  const [tempClosedIds, setTempClosedIds] = useState<string[]>([]);
  const [alertTopOffset, setAlertTopOffset] = useState<number>(120);

  // Fecha local helpers
  const todayDay = () => new Date().getDate();
  const todayMonth = () => new Date().getMonth() + 1;
  const todayISO = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };
  const todayISO_utc = () => new Date().toISOString().slice(0, 10);

  // read/write last shown (persistente "no mostrar hoy")
  function readLastShown(): Record<string, string> {
    try { return JSON.parse(localStorage.getItem(LAST_SHOWN_KEY) || "{}"); } catch { return {}; }
  }
  function writeLastShown(map: Record<string, string>) {
    try { localStorage.setItem(LAST_SHOWN_KEY, JSON.stringify(map)); } catch {}
  }

  // Auth header helper (intenta usar supabase token en localStorage si existe)
  async function getAuthHeader(): Promise<Record<string, string>> {
    try {
      // supabase v2: obtener sesión
      if (supabase && supabase.auth && typeof supabase.auth.getSession === "function") {
        const { data, error } = await supabase.auth.getSession();
        if (!error && data?.session?.access_token) {
          return { Authorization: `Bearer ${data.session.access_token}` };
        }
      }
      // supabase v1 fallback
      if (supabase && (supabase.auth as any)?.session) {
        const session = (supabase.auth as any).session?.();
        const token = session?.access_token || session?.accessToken;
        if (token) return { Authorization: `Bearer ${token}` };
      }
    } catch (e) {
      console.warn("[getAuthHeader] supabase error", e);
    }

    // fallback a keys en localStorage (compatibilidad)
    try {
      const candidates = [
        localStorage.getItem("supabase.auth.token"),
        localStorage.getItem("supabase.auth.session"),
        localStorage.getItem("sb:token"),
        localStorage.getItem("sb:session")
      ];
      for (const c of candidates) {
        if (!c) continue;
        try {
          const parsed = JSON.parse(c);
          const token =
            parsed?.currentSession?.access_token ||
            parsed?.access_token ||
            parsed?.accessToken;
          if (token) return { Authorization: `Bearer ${token}` };
        } catch {}
      }
    } catch {}
    return {};
  }

  // Cargar prefs: API -> localStorage fallback
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const headers = { "Content-Type": "application/json", ...(await getAuthHeader()) };
        const res = await fetch(`${API}/notifications/preferences`, { method: "GET", headers });
        if (res.ok) {
          const json = await res.json();
          if (mounted && json?.preferences) {
            setPrefs(normalizePrefs(json.preferences));
            return;
          }
        }
      } catch {
        // ignore
      }
      // fallback local
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) setPrefs(JSON.parse(raw));
      } catch {}
    })();
    return () => { mounted = false; };
  }, []);

  // Persistencia local inmediata cuando cambian prefs
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs)); } catch {}
  }, [prefs]);

  // Calcular alerts due hoy (ignorando las marcadas "no mostrar hoy" y las cerradas temporalmente)
  const computeDueAlerts = useCallback(() => {
    const d = todayDay();
    const m = todayMonth();
    const isoLocal = todayISO();
    const isoUTC = todayISO_utc();
    const last = readLastShown();
    const due: TaxItem[] = [];

    (prefs.taxes || []).forEach((t) => {
      if (!t || !t.enabled) return;
      const dueDayRaw = (t as any).dueDay ?? (t as any).due_day ?? null;
      const dueMonthRaw = (t as any).dueMonth ?? (t as any).due_month ?? null;
      const dueDay = dueDayRaw == null ? null : Number(dueDayRaw);
      const dueMonth = dueMonthRaw == null ? null : Number(dueMonthRaw);
      const key = t.id;
      if (!dueDay || !dueMonth) return;
      if (last[key] === isoLocal || last[key] === isoUTC) return; // dismiss for today
      if (tempClosedIds.includes(key)) return; // closed this session
      if (dueDay === d && dueMonth === m) due.push(t);
    });

    setDueAlerts(due);
    // also keep console trace for debug
    console.log("[Notifications] computeDueAlerts ->", { date: isoLocal, dueCount: due.length, due });
  }, [prefs, tempClosedIds]);

  useEffect(() => { computeDueAlerts(); }, [prefs, computeDueAlerts]);

  // Guardar prefs: guarda a localStorage y si hay token intenta guardar en backend
  const save = useCallback(async () => {
    // normalizar antes de guardar (asegura impuestos correctos y orden)
    const toSave = normalizePrefs(prefs);

    // 1) guardar local inmediato
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
      console.log("[Notifications] saved prefs to localStorage");
    } catch (err) {
      console.warn("[Notifications] localStorage write failed", err);
    }

    // 2) intentar guardar en backend solo si hay token de sesión
    try {
      const authHeader = await getAuthHeader();
      const hasToken = Boolean(authHeader && Object.keys(authHeader).length && String(authHeader.Authorization || "").startsWith("Bearer "));
      if (!hasToken) {
        console.log("[Notifications] No auth token - prefs saved locally only");
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        computeDueAlerts();
        return;
      }

      const headers = { "Content-Type": "application/json", ...authHeader };
      const res = await fetch(`${API}/notifications/preferences`, {
        method: "POST",
        headers,
        body: JSON.stringify({ preferences: toSave })
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.warn("[Notifications] save to API returned", res.status, text);
        throw new Error(`status ${res.status}`);
      }

      const json = await res.json();
      if (json?.preferences) {
        setPrefs(normalizePrefs(json.preferences));
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizePrefs(json.preferences))); } catch {}
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      console.log("[Notifications] saved prefs to API and synced local");
    } catch (err) {
      console.warn("[Notifications] save to API failed; kept local:", err);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }

    computeDueAlerts();
  }, [prefs, computeDueAlerts]);

  // Close temporary (session) and dismiss for today (persist)
  function closeTempAlert(key: string) {
    setTempClosedIds((s) => (s.includes(key) ? s : [...s, key]));
    setDueAlerts((s) => s.filter((t) => (t.id ?? "") !== key));
  }
  function dismissForToday(key: string) {
    const iso = todayISO();
    const last = readLastShown();
    last[key] = iso;
    writeLastShown(last);
    setDueAlerts((s) => s.filter((t) => (t.id ?? "") !== key));
  }

  // Calcular offset para no solapar con SpendingAlerts
  useEffect(() => {
    function updateOffset() {
      try {
        const el = document.querySelector<HTMLElement>(".spending-alerts-container");
        if (el) {
          const rect = el.getBoundingClientRect();
          setAlertTopOffset(Math.ceil(20 + rect.height + 12));
          return;
        }
      } catch {}
      setAlertTopOffset(120);
    }
    updateOffset();

    let ro: ResizeObserver | null = null;
    try {
      const target = document.querySelector<HTMLElement>(".spending-alerts-container");
      if (target && (window as any).ResizeObserver) {
        ro = new (window as any).ResizeObserver(() => updateOffset());
        ro.observe(target);
      }
    } catch (e) {
      // ignore
    }
    const mo = new MutationObserver(updateOffset);
    mo.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("resize", updateOffset);
    return () => {
      window.removeEventListener("resize", updateOffset);
      mo.disconnect();
      if (ro) ro.disconnect();
    };
  }, [dueAlerts.length]);

  // UI helpers (reemplazados): input date que guarda solo día/mes (año actual usado para el picker)
  const DatePicker = ({ valueDay, valueMonth, onChange }: { valueDay?: number; valueMonth?: number; onChange: (d?: number, m?: number) => void }) => {
    const year = new Date().getFullYear();
    const value = valueDay && valueMonth ? `${year}-${String(valueMonth).padStart(2, "0")}-${String(valueDay).padStart(2, "0")}` : "";
    return (
      <input
        type="date"
        value={value}
        onChange={(e) => {
          const v = e.target.value;
          if (!v) {
            onChange(undefined, undefined);
            return;
          }
          const [y, mo, da] = v.split("-").map((s) => Number(s));
          // guardamos solo día/mes
          onChange(Number(da), Number(mo));
        }}
        style={{ padding: "6px 8px", borderRadius: 6, border: "1px solid #333", background: "#0b0b0b", color: "#fff" }}
      />
    );
  };

  // estilos alertas (ajustados para igualar SpendingAlerts pero con paleta distinta)
  const alertContainerStyle: React.CSSProperties = {
    position: "fixed",
    top: alertTopOffset,
    right: 20,
    zIndex: 9999,
    display: "flex",
    flexDirection: "column",
    gap: 10,
  };

  const alertCardStyle = (isCritical: boolean): React.CSSProperties => ({
    maxWidth: 350,
    // tarjeta púrpura/coral para Notifications: fondo oscuro púrpura, borde coral; crítico mantiene rojo
    background: isCritical ? '#6b0f0f' : '#2a1b3d',
    color: isCritical ? '#fff' : '#f6eaff',
    padding: 14,
    paddingRight: 140, // espacio para botones a la derecha (coincide con SpendingAlerts)
    borderRadius: 8,
    boxShadow: isCritical ? '0 10px 30px rgba(107,15,15,0.45)' : '0 10px 30px rgba(26,12,40,0.6)',
    border: `2px solid ${isCritical ? '#a71e2a' : '#5b2a86'}`,
    position: 'relative',
  });

  const closeBtnStyle = (isCritical: boolean): React.CSSProperties => ({
    position: 'absolute',
    top: 10,
    right: 12,
    // botón "Cerrar" oscuro con acento cálido-rosado para distinguir
    background: isCritical ? 'rgba(0,0,0,0.6)' : 'rgba(8,6,12,0.75)',
    color: isCritical ? '#ffdede' : '#ffd1ff',
    border: '1px solid rgba(255,255,255,0.04)',
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
    boxShadow: '0 6px 18px rgba(0,0,0,0.24)',
  });

  const pillStyle: React.CSSProperties = {
    position: 'absolute',
    top: 46,
    right: 12,
    minWidth: 96,
    padding: '6px 10px',
    borderRadius: 8,
    // pill coral suave para destacar sobre el púrpura y quedar bien en modo oscuro
    background: '#ffb38a',
    color: '#2a1b3d',
    border: '1px solid rgba(255,180,138,0.14)',
    boxShadow: '0 8px 20px rgba(0,0,0,0.36)',
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: 13,
    textAlign: 'center',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  return (
    <div className="notifications-page">
      <div className="notifications-card">
        <h1>Notificaciones</h1>
        <p className="muted">Selecciona notificaciones y configura día/mes (recurrente cada año).</p>

        <div className="prefs-list">
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Impuestos / pagos periódicos</div>
          {prefs.taxes.map((t, i) => (
            <label key={t.id} className="pref-row" style={{ alignItems: "center" }}>
              <div style={{ flex: 1 }}>
                <div className="pref-title">{t.label}</div>
                <div style={{ fontSize: 12, color: "#666" }}>
                  Vencimiento: {(!t.dueDay || !t.dueMonth) ? "No configurado" : `${t.dueDay} de ${MONTH_NAMES[(Number(t.dueMonth) - 1) ?? 0]} (cada año)`}
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input type="checkbox" checked={Boolean(t.enabled)} onChange={() => {
                  setPrefs((p) => ({ ...p, taxes: p.taxes.map((x, ix) => ix === i ? { ...x, enabled: !x.enabled } : x) }));
                  setSaved(false);
                }} />
                <DatePicker
                  valueDay={t.dueDay ? Number(t.dueDay) : undefined}
                  valueMonth={t.dueMonth ? Number(t.dueMonth) : undefined}
                  onChange={(d, m) => {
                    setPrefs((p) => ({ ...p, taxes: p.taxes.map((x, ix) => ix === i ? { ...x, dueDay: d, dueMonth: m } : x) }));
                    setSaved(false);
                  }}
                />
                <button className="btn-ghost" onClick={() => {
                  // prueba toast simple
                  try {
                    const title = `Prueba: ${t.label}`;
                    const body = `Simulación enviada para ${t.label}`;
                    // quick native alert as fallback
                    alert(`${title}\n${body}`);
                  } catch {}
                }}>Enviar prueba</button>
              </div>
            </label>
          ))}
        </div>

        <div className="actions">
          <button data-testid="save-btn" className="btn-primary" onClick={save}>Guardar</button>
          <button data-testid="reset-btn" className="btn-secondary" onClick={() => {
            setPrefs(normalizePrefs(defaultPrefs));
            try { localStorage.removeItem(STORAGE_KEY); } catch {}
            setSaved(false);
          }}>Reset</button>
          <button className="btn-ghost" onClick={() => { localStorage.removeItem(LAST_SHOWN_KEY); setTempClosedIds([]); computeDueAlerts(); }} style={{ marginLeft: 12 }}>Forzar comprobación</button>
          {saved && <span className="saved-badge">Preferencias guardadas</span>}
        </div>

        <p className="note">Se guardan en el usuario (si hay sesión) y en localStorage como fallback.</p>
      </div>

      {/* Contenedor de alertas de impuestos (apiladas sin solaparse con SpendingAlerts) */}
      <div style={alertContainerStyle}>
        {dueAlerts.map((a, idx) => {
          const key = a.id ?? `${idx}`;
          const isCritical = false;
          return (
            <div key={key} style={alertCardStyle(isCritical)}>
              <button
                onClick={() => closeTempAlert(key)}
                style={closeBtnStyle(isCritical)}
                title="Cerrar"
                aria-label={`Cerrar notificación ${a.label}`}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 12px 28px rgba(0,0,0,0.22)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = ''; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 18px rgba(0,0,0,0.18)'; }}
              >
                Cerrar
              </button>

              <button
                onClick={() => dismissForToday(key)}
                style={pillStyle}
                title="No mostrar hoy"
                aria-label={`No mostrar hoy ${a.label}`}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 12px 28px rgba(0,0,0,0.24)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = ''; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 20px rgba(0,0,0,0.28)'; }}
              >
                No mostrar hoy
              </button>

              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ fontSize: 22, marginTop: 2 }}>{isCritical ? '🚫' : '⚠️'}</div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: 16, fontWeight: 800 }}>{isCritical ? '¡Vencido!' : '¡Recordatorio de impuesto!'}</h3>
                  <div style={{ fontSize: 13, lineHeight: 1.4 }}>
                    <div style={{ fontWeight: 700, marginBottom: 6 }}>{a.label}</div>
                    <div>Hoy es {(a.dueDay ?? '?')} de {MONTH_NAMES[((Number(a.dueMonth ?? 1)) - 1) ?? 0]}.</div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}