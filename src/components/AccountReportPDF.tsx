import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

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
}

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 12, fontFamily: 'Helvetica' },
  title: { fontSize: 22, marginBottom: 12, textAlign: 'center', fontWeight: 'bold' },
  section: { marginBottom: 16 },
  card: { marginBottom: 8, padding: 8, border: '1 solid #eee', borderRadius: 4 },
  label: { fontSize: 14, fontWeight: 'bold' },
  value: { fontSize: 14, marginBottom: 4 },
  table: { width: '100%', marginBottom: 12 }, // Cambia display: 'table' por width
  tableRow: { flexDirection: 'row' },
  tableCell: { flex: 1, padding: 4, borderBottom: '1 solid #eee' },
});

export function AccountReportPDF({
  accountName,
  dateRange,
  reportData,
  transactions,
}: Props) {
  return (
    <Document>
      <Page style={styles.page}>
        <Text style={styles.title}>Reporte de Cuenta: {accountName}</Text>
        <View style={styles.section}>
          <Text>Período: {dateRange.start} a {dateRange.end}</Text>
        </View>
        <View style={styles.section}>
          <View style={styles.card}>
            <Text style={styles.label}>Ingresos Totales:</Text>
            <Text style={styles.value}>${reportData.totalIncome.toLocaleString()}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.label}>Gastos Totales:</Text>
            <Text style={styles.value}>${reportData.totalExpense.toLocaleString()}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.label}>Balance Neto:</Text>
            <Text style={styles.value}>${reportData.netBalance.toLocaleString()}</Text>
          </View>
        </View>
        <View style={styles.section}>
          <Text style={styles.label}>Transacciones:</Text>
          <View style={styles.table}>
            <View style={styles.tableRow}>
              <Text style={styles.tableCell}>Fecha</Text>
              <Text style={styles.tableCell}>Tipo</Text>
              <Text style={styles.tableCell}>Categoría</Text>
              <Text style={styles.tableCell}>Monto</Text>
            </View>
            {transactions.map((t: Transaction, idx: number) => (
              <View style={styles.tableRow} key={idx}>
                <Text style={styles.tableCell}>{t.date}</Text>
                <Text style={styles.tableCell}>{t.type === 'income' ? 'Ingreso' : 'Gasto'}</Text>
                <Text style={styles.tableCell}>{reportData.categoryMap[t.category_id]?.name || 'Sin Categoría'}</Text>
                <Text style={styles.tableCell}>${t.amount.toLocaleString()}</Text>
              </View>
            ))}
          </View>
        </View>
      </Page>
    </Document>
  );
}