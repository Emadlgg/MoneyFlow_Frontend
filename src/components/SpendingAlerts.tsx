import { useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { useSpendingLimits } from '../hooks/useSpendingLimits';
import { useAuth } from '../contexts/AuthContext';

interface SpendingAlertsRef {
  forceCheck: () => void;
}

const SpendingAlerts = forwardRef<SpendingAlertsRef>((props, ref) => {
  const { user } = useAuth();
  const { alerts, loading, checkSpendingLimits } = useSpendingLimits(user?.id || '');
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);
  const [alertsVersion, setAlertsVersion] = useState(0);

  useEffect(() => {
    if (user?.id) {
      // Verificar inmediatamente al cargar
      checkSpendingLimits();
    }
  }, [user?.id]);

  // Resetear alertas cerradas cuando las alertas cambien
  useEffect(() => {
    console.log('🔄 Alertas actualizadas, reseteando alertas cerradas');
    console.log('📊 Alertas recibidas:', alerts);
    setDismissedAlerts([]);
    setAlertsVersion(prev => prev + 1); // Forzar re-render
  }, [alerts.length, JSON.stringify(alerts)]); // Dependencia más específica

  // Exponer función para forzar verificación y reset
  useImperativeHandle(ref, () => ({
    forceCheck: () => {
      console.log('🔄 Forzando verificación y reset de alertas cerradas...');
      setDismissedAlerts([]); // Resetear alertas cerradas PRIMERO
      setAlertsVersion(prev => prev + 1); // Forzar re-render
      checkSpendingLimits(); // Verificar límites
    }
  }));

  // Filtrar alertas que no han sido cerradas
  const visibleAlerts = alerts.filter(alert => {
    const isDismissed = dismissedAlerts.includes(alert.categoryId);
    console.log(`🔍 Alerta ${alert.categoryName} (ID: ${alert.categoryId}): ${isDismissed ? 'Cerrada' : 'Visible'}`);
    return !isDismissed;
  });

  const dismissAlert = (categoryId: string) => {
    console.log('❌ Cerrando alerta:', categoryId);
    setDismissedAlerts(prev => {
      const newDismissed = [...prev, categoryId];
      console.log('📝 Alertas cerradas actualizadas:', newDismissed);
      return newDismissed;
    });
  };

  console.log('📊 Estado actual:', {
    totalAlerts: alerts.length,
    dismissedCount: dismissedAlerts.length,
    visibleCount: visibleAlerts.length,
    loading,
    alertsVersion
  });

  if (loading) {
    console.log('⏳ Cargando alertas...');
    return null;
  }

  if (visibleAlerts.length === 0) {
    console.log('👀 No hay alertas visibles para mostrar');
    return null;
  }

  console.log('✅ Mostrando', visibleAlerts.length, 'alertas');

  return (
    <div
      className="spending-alerts-container"
      style={{
        position: 'fixed', 
        top: '20px', 
        right: '20px', 
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}
    >
      {visibleAlerts.map((alert) => (
        <div
          key={`${alert.categoryId}-${alertsVersion}`} // Key único con versión
          style={{
            maxWidth: '350px',
            backgroundColor: alert.percentage >= 100 ? '#dc3545' : '#ffc107',
            color: alert.percentage >= 100 ? '#fff' : '#000',
            padding: '16px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            border: '2px solid ' + (alert.percentage >= 100 ? '#a71e2a' : '#e0a800'),
            position: 'relative'
          }}
        >
          {/* Botón de cerrar */}
          <button
            onClick={() => dismissAlert(alert.categoryId)}
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              background: 'rgba(0,0,0,0.1)',
              border: 'none',
              borderRadius: '50%',
              width: '24px',
              height: '24px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              fontWeight: 'bold',
              color: alert.percentage >= 100 ? '#fff' : '#000',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.1)';
            }}
            title="Cerrar notificación"
          >
            ×
          </button>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', paddingRight: '20px' }}>
            <div style={{ fontSize: '24px', marginTop: '2px' }}>
              {alert.percentage >= 100 ? '🚫' : '⚠️'}
            </div>
            <div>
              <h3 style={{ 
                margin: '0 0 8px 0', 
                fontSize: '16px', 
                fontWeight: 'bold' 
              }}>
                {alert.percentage >= 100 ? '¡Límite Superado!' : '¡Cerca del Límite!'}
              </h3>
              <div style={{ fontSize: '14px', lineHeight: '1.4' }}>
                <p style={{ margin: '4px 0', fontWeight: 'bold' }}>
                  📊 {alert.categoryName}
                </p>
                <p style={{ margin: '4px 0' }}>
                  💰 Gastado: Q{alert.currentSpent.toFixed(2)} / Q{alert.limit.toFixed(2)}
                </p>
                <p style={{ margin: '4px 0', fontWeight: 'bold' }}>
                  📈 {alert.percentage.toFixed(0)}% del límite mensual
                </p>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
});

SpendingAlerts.displayName = 'SpendingAlerts';

export default SpendingAlerts;
export type { SpendingAlertsRef };