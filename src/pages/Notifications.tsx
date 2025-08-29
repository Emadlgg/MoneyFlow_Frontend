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
  const loadedTaxes: any[] = Array.isArray(loaded?.taxes) ? loaded.taxes : [];
  const defaultIds = defaultPrefs.taxes.map((t) => t.id);

  // Partimos de los impuestos por defecto, sobrescribiendo enabled/dueDay/dueMonth si vienen en loaded
  const merged = defaultPrefs.taxes.map((def) => {
    const found = loadedTaxes.find((lt) => lt?.id === def.id);
    return {
      ...def,
      // preserve user's enabled/dueDay/dueMonth if present
      enabled: found?.enabled ?? def.enabled,
      dueDay: found?.dueDay ?? found?.due_day ?? def.dueDay,
      dueMonth: found?.dueMonth ?? found?.due_month ?? def.dueMonth,
    };
  });

  // Añadir cualquier impuesto extra que estuviera en la DB pero no en defaults (opcional)
  const extras = loadedTaxes.filter((lt) => lt?.id && !defaultIds.includes(lt.id))
    .map((e) => ({ id: e.id, label: e.label ?? e.id, enabled: !!e.enabled, dueDay: e.dueDay ?? e.due_day, dueMonth: e.dueMonth ?? e.due_month }));

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

  // estilos alertas
  const alertContainerStyle: React.CSSProperties = {
    position: "fixed",
    top: alertTopOffset,
    right: 20,
    zIndex: 9999,
    display: "flex",
    flexDirection: "column",
    gap: 12,
    alignItems: "flex-end"
  };
  const alertCardStyle = (isCritical: boolean): React.CSSProperties => ({
    maxWidth: 380,
    background: isCritical ? "#dc3545" : "#ffd95a",
    color: isCritical ? "#fff" : "#111",
    padding: 12,
    borderRadius: 10,
    boxShadow: "0 6px 18px rgba(0,0,0,0.25)",
    border: `2px solid ${isCritical ? "#a71e2a" : "#e0a800"}`,
    position: "relative",
  });

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
        {dueAlerts.map((a) => {
          const key = a.id ?? "";
          const isCritical = false;
          return (
            <div key={key} style={alertCardStyle(isCritical)}>
              {/* botones apilados a la derecha; paddingRight en contenido evita solapamiento */}
              <div
                style={{
                  position: "absolute",
                  top: 14,
                  right: 14,
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  alignItems: "center",
                }}
              >
                <button
                  onClick={() => closeTempAlert(key)}
                  aria-label={`Cerrar notificación ${a.label}`}
                  title="Cerrar (temporal)"
                  style={{
                    minWidth: 110,
                    padding: "8px 12px",
                    borderRadius: 10,
                    background: "rgba(255,255,255,0.92)", // claro para buen contraste
                    color: "#0f1724",
                    border: "1px solid rgba(15,23,36,0.08)",
                    boxShadow: "0 6px 18px rgba(0,0,0,0.12)",
                    cursor: "pointer",
                    fontWeight: 700,
                    transition: "transform 120ms ease, box-shadow 120ms ease",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 12px 28px rgba(0,0,0,0.16)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = ""; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 6px 18px rgba(0,0,0,0.12)"; }}
                >
                  Cerrar
                </button>

                <button
                  onClick={() => dismissForToday(key)}
                  aria-label={`No mostrar hoy ${a.label}`}
                  title="No mostrar hoy (persistente)"
                  style={{
                    minWidth: 110,
                    padding: "8px 12px",
                    borderRadius: 10,
                    background: "#0f1724", // botón primario oscuro
                    color: "#FFD95A", // acento amarillo
                    border: "1px solid rgba(255,255,255,0.06)",
                    boxShadow: "0 10px 26px rgba(15,23,36,0.28)",
                    cursor: "pointer",
                    fontWeight: 800,
                    transition: "transform 120ms ease, box-shadow 120ms ease",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 18px 40px rgba(15,23,36,0.34)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = ""; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 10px 26px rgba(15,23,36,0.28)"; }}
                >
                  No mostrar hoy
                </button>
              </div>
               <div style={{ display: "flex", gap: 12 }}>
                <div style={{ fontSize: 20, marginTop: 2 }}>⚠️</div>
                <div style={{ flex: 1, paddingRight: 140 }}> {/* espacio para los botones a la derecha */}
                   <div style={{ fontWeight: 800, marginBottom: 6 }}>{a.label}</div>
                   <div style={{ fontSize: 13 }}>
                     Hoy es {(a.dueDay ?? "?")} de {MONTH_NAMES[((Number(a.dueMonth ?? 1)) - 1) ?? 0]}. Pulsa 'Cerrar' para ocultar (temporal) o 'No mostrar hoy' para persistir.
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