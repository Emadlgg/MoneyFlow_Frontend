import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

interface Category {
  id: number;
  name: string;
  color: string;
  type: 'income' | 'expense';
}

interface Transaction {
  amount: number;
  category_id: number;
  type: 'income' | 'expense';
  date: string;
}

interface ReportData {
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  categoryMap: Record<number, Category>;
}

interface Props {
  accountName: string;
  dateRange: { start: string; end: string };
  reportData: ReportData;
  transactions: Transaction[];
  chartImages?: {
    trendChart?: string;
    expenseChart?: string;
    incomeChart?: string;
  };
}

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 12, fontFamily: 'Helvetica' },
  title: { fontSize: 26, marginBottom: 10, textAlign: 'center', fontWeight: 'bold', color: '#222' },
  subtitle: { fontSize: 14, marginBottom: 20, textAlign: 'center', color: '#555' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  summaryCard: { flex: 1, margin: 4, padding: 12, borderRadius: 8, backgroundColor: '#f6f6f6', border: '1 solid #e0e3e8' },
  summaryLabel: { fontSize: 13, color: '#333', marginBottom: 2 },
  summaryValueIncome: { fontSize: 16, fontWeight: 'bold', color: '#2e7d32' }, // verde
  summaryValueExpense: { fontSize: 16, fontWeight: 'bold', color: '#c62828' }, // rojo
  summaryValueBalance: { fontSize: 16, fontWeight: 'bold', color: '#1565c0' }, // azul
  sectionTitle: { fontSize: 15, fontWeight: 'bold', marginBottom: 8, marginTop: 16, color: '#222' },
  table: { width: '100%', borderRadius: 6, overflow: 'hidden' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#ececec', borderBottom: '1 solid #d1d5db' },
  tableHeaderCell: { flex: 1, padding: 6, fontWeight: 'bold', fontSize: 12, color: '#222' },
  tableRow: { flexDirection: 'row', borderBottom: '1 solid #f0f0f0' },
  tableCell: { flex: 1, padding: 6, fontSize: 11, color: '#444' },
  tableRowAlt: { backgroundColor: '#f8fafc' },
  noData: { fontSize: 12, color: '#888', marginTop: 12, textAlign: 'center' },
  chartImage: { width: '100%', marginTop: 16, marginBottom: 16 },
  chartTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 8, marginTop: 16, color: '#222', textAlign: 'center' },
});

function formatDate(date: string) {
  return date.split('T')[0];
}

export function AccountReportPDF({
  accountName,
  dateRange,
  reportData,
  transactions,
  chartImages,
}: Props) {
  return (
    <Document>
      <Page style={styles.page}>
        <Text style={styles.title}>Reporte de Cuenta: {accountName || 'Sin nombre'}</Text>
        <Text style={styles.subtitle}>
          Período: {dateRange.start} a {dateRange.end}
        </Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Ingresos Totales</Text>
            <Text style={styles.summaryValueIncome}>Q{reportData.totalIncome.toLocaleString()}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Gastos Totales</Text>
            <Text style={styles.summaryValueExpense}>Q{reportData.totalExpense.toLocaleString()}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Balance Neto</Text>
            <Text style={styles.summaryValueBalance}>Q{reportData.netBalance.toLocaleString()}</Text>
          </View>
        </View>
        
        {/* Gráfica de Tendencia */}
        {chartImages?.trendChart && (
          <>
            <Text style={styles.chartTitle}>Tendencia de Ingresos vs. Gastos (Mensual)</Text>
            <Image src={chartImages.trendChart} style={styles.chartImage} />
          </>
        )}
        
        <Text style={styles.sectionTitle}>Transacciones</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.tableHeaderCell}>Fecha</Text>
            <Text style={styles.tableHeaderCell}>Tipo</Text>
            <Text style={styles.tableHeaderCell}>Categoría</Text>
            <Text style={styles.tableHeaderCell}>Monto</Text>
          </View>
          {transactions.length === 0 ? (
            <Text style={styles.noData}>No hay transacciones en el período seleccionado.</Text>
          ) : (
            transactions.map((t: Transaction, idx: number) => (
              <View
                style={[
                  styles.tableRow,
                  idx % 2 === 1 ? styles.tableRowAlt : {}, // ✅ CAMBIADO: null por {}
                ]}
                key={idx}
              >
                <Text style={styles.tableCell}>{formatDate(t.date)}</Text>
                <Text style={styles.tableCell}>{t.type === 'income' ? 'Ingreso' : 'Gasto'}</Text>
                <Text style={styles.tableCell}>{reportData.categoryMap[t.category_id]?.name || 'Sin Categoría'}</Text>
                <Text style={styles.tableCell}>
                  {t.type === 'expense' ? `-Q${Math.abs(t.amount).toLocaleString()}` : `Q${Math.abs(t.amount).toLocaleString()}`}
                </Text>
              </View>
            ))
          )}
        </View>
      </Page>
    </Document>
  );
}