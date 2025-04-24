# 💰 MoneyFlow - Gestión Financiera Personal (Frontend)

## 🚀 Tecnologías Principales
<div align="center">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E" alt="Vite">
  <img src="https://img.shields.io/badge/Axios-5A29E4?style=for-the-badge&logo=axios&logoColor=white" alt="Axios">
</div>

## 📂 Estructura del Proyecto
```
src/
├── components/     # Componentes reutilizables
│   ├── charts/     # Gráficos y visualizaciones
│   ├── ui/         # Elementos UI (botones, inputs)
│   └── layouts/    # Estructuras de página
├── pages/          # Vistas principales
│   ├── Dashboard/  # Vista principal
│   ├── Transactions/ # Gestión de transacciones
│   └── Auth/       # Autenticación
├── types/          # Definiciones TypeScript
├── utils/          # Utilidades y helpers
└── styles/         # Estilos globales y módulos
```

## 🛠️ Configuración Inicial

### Requisitos
- Node.js v18+
- npm v9+

### Instalación
```bash
git clone https://github.com/tu-org/moneyflow-frontend.git
cd moneyflow-frontend
npm install
```

### Variables de Entorno (`.env`)
```env
VITE_API_URL=http://localhost:3000/api
VITE_ENV=development
```

## 🔥 Comandos Básicos
| Comando             | Descripción                       |
|---------------------|-----------------------------------|
| `npm run dev`       | Inicia servidor de desarrollo     |
| `npm run build`     | Crea build de producción          |
| `npm run preview`   | Previsualiza build localmente     |
| `npm run lint`      | Ejecuta ESLint                    |
| `npm run test`      | Ejecuta pruebas unitarias         |

## 🐳 Ejecución con Docker
```bash
docker build -t moneyflow-frontend .
docker run -p 3001:3000 moneyflow-frontend
```

## 🧪 Testing
```bash
npm test
```

### Cobertura de Pruebas
```bash
npm run test:coverage
```

## 📊 Estructura de Componentes Principales
```typescript
// Ejemplo de componente TransactionList.tsx
interface Transaction {
  id: string;
  amount: number;
  category: string;
}

const TransactionList = ({ transactions }: { transactions: Transaction[] }) => (
  <ul className="transaction-list">
    {transactions.map((t) => (
      <li key={t.id}>
        <span>{t.category}</span>
        <span>${t.amount}</span>
      </li>
    ))}
  </ul>
);
```

## 🌐 Configuración Vite
```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
});
```

## 🤝 Cómo Contribuir
1. Crea un fork del proyecto
2. Crea una rama (`git checkout -b feature/nueva-funcionalidad`)
3. Haz commit de tus cambios (`git commit -m 'Add some feature'`)
4. Haz push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📌 Mejoras Pendientes
- Añadir Storybook para documentación de componentes
- Implementar testing E2E con Cypress
- Internacionalización (i18n)