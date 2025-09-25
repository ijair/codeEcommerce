# E-commerce Frontend - React + TypeScript + Vite

Frontend moderno y optimizado para la plataforma de e-commerce construido con React, TypeScript, Vite y Tailwind CSS. Incluye integración completa con contratos inteligentes, gestión de estado avanzada, y una experiencia de usuario optimizada.

## 🏗️ Arquitectura

### Stack Tecnológico

- **React 18** - Biblioteca de UI con hooks modernos
- **TypeScript** - Tipado estático para mayor robustez
- **Vite** - Build tool ultra-rápido con HMR
- **Tailwind CSS** - Framework CSS utility-first
- **Ethers.js** - Interacción con blockchain Ethereum
- **React Router** - Navegación SPA
- **Zustand** - Gestión de estado ligera y eficiente

### Estructura de Directorios

```
frontend/
├── src/
│   ├── components/         # Componentes reutilizables
│   │   ├── ProductCard.tsx
│   │   ├── ShoppingCart.tsx
│   │   ├── Header.tsx
│   │   ├── Toast.tsx
│   │   └── ToastContainer.tsx
│   ├── pages/             # Páginas de la aplicación
│   │   ├── Home.tsx
│   │   ├── Products.tsx
│   │   ├── MyBalance.tsx
│   │   ├── WithdrawTokens.tsx
│   │   ├── PurchaseHistory.tsx
│   │   ├── Invoice.tsx
│   │   └── admin/         # Páginas de administración
│   │       ├── AdminDashboard.tsx
│   │       ├── AdminProducts.tsx
│   │       ├── AdminCompanies.tsx
│   │       ├── AdminClients.tsx
│   │       ├── AdminBalance.tsx
│   │       ├── AdminStatistics.tsx
│   │       └── AdminInvoiceHistory.tsx
│   ├── hooks/             # Custom hooks
│   │   ├── useWallet.ts
│   │   ├── useTokens.ts
│   │   ├── useAdmin.ts
│   │   ├── useCart.ts
│   │   ├── useCheckout.ts
│   │   ├── useProducts.ts
│   │   ├── useToast.ts
│   │   └── useTheme.ts
│   ├── services/          # Servicios de integración
│   │   ├── contractService.ts
│   │   ├── tokenService.ts
│   │   ├── productService.ts
│   │   ├── companyService.ts
│   │   ├── clientService.ts
│   │   ├── checkoutService.ts
│   │   ├── adminStatsService.ts
│   │   └── burnHistoryService.ts
│   ├── types/             # Definiciones de tipos
│   │   └── contracts.ts
│   ├── config/            # Configuración
│   │   └── contracts.ts
│   ├── common/            # Componentes comunes
│   │   ├── Header.tsx
│   │   └── Layout.tsx
│   └── utils/             # Utilidades
├── public/                # Archivos estáticos
├── dist/                  # Build de producción
└── package.json
```

## 🚀 Funcionalidades

### 🛍️ E-commerce Core
- ✅ **Catálogo de productos** con filtrado avanzado
- ✅ **Carrito de compras** persistente
- ✅ **Proceso de checkout** optimizado
- ✅ **Sistema de facturación** completo
- ✅ **Historial de compras** para clientes
- ✅ **Gestión de stock** en tiempo real

### 👤 Gestión de Usuarios
- ✅ **Conexión de wallet** (MetaMask)
- ✅ **Roles de usuario** (Admin, Cliente, No conectado)
- ✅ **Temas dinámicos** basados en rol de usuario
- ✅ **Navegación condicional** según estado de conexión
- ✅ **Gestión de balance** de tokens y ETH

### 🔐 Panel de Administración
- ✅ **Dashboard administrativo** con estadísticas
- ✅ **Gestión de empresas** (CRUD completo)
- ✅ **Gestión de productos** (CRUD completo)
- ✅ **Gestión de clientes** (activar/desactivar)
- ✅ **Historial de facturas** completo
- ✅ **Estadísticas avanzadas** del sistema
- ✅ **Gestión de tokens** y balance

### 🎨 Experiencia de Usuario
- ✅ **Temas dinámicos** (Azul, Naranja, Verde)
- ✅ **Navegación responsiva** y optimizada
- ✅ **Notificaciones toast** para feedback
- ✅ **Estados de carga** y manejo de errores
- ✅ **Optimización de confirmaciones** MetaMask
- ✅ **Búsqueda y filtrado** avanzado

### 🔥 Funcionalidades Avanzadas
- ✅ **Sistema de quemado de tokens** con historial
- ✅ **Estadísticas de tokens quemados**
- ✅ **Optimización de gas** y transacciones
- ✅ **Código splitting** para mejor rendimiento
- ✅ **Lazy loading** de componentes

## 🛠️ Configuración e Instalación

### Prerrequisitos
- Node.js 18+ 
- npm o yarn
- MetaMask instalado en el navegador
- Anvil ejecutándose localmente (para desarrollo)

### Instalación

1. Navega al directorio frontend:
```bash
cd frontend
```

2. Instala las dependencias:
```bash
npm install
```

3. Configura las variables de entorno:
```bash
cp env.example .env
```

4. Inicia el servidor de desarrollo:
```bash
npm run dev
```

5. Abre [http://localhost:5173](http://localhost:5173) en tu navegador

## 🏗️ Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Servidor de desarrollo con HMR

# Construcción
npm run build        # Build de producción optimizado
npm run preview      # Preview del build de producción

# Linting y Formateo
npm run lint         # Ejecutar ESLint
npm run lint:fix     # Corregir errores de linting automáticamente

# Type Checking
npm run type-check   # Verificar tipos TypeScript
```

## 🎨 Sistema de Temas

### Temas Dinámicos por Rol
- **🔵 Azul (Default)**: Usuario no conectado
- **🟠 Naranja (Admin)**: Usuario administrador conectado
- **🟢 Verde (Cliente)**: Usuario cliente conectado

### Implementación
```typescript
// Hook personalizado para temas
const { theme, getThemeClasses } = useTheme();

// Aplicar clases dinámicas
<button className={getThemeClasses('bg-primary text-white')}>
  Botón con tema dinámico
</button>
```

## 🔗 Integración con Blockchain

### Servicios de Contratos
- **contractService.ts**: Instancias de contratos y ABIs
- **tokenService.ts**: Operaciones con tokens ITC
- **productService.ts**: Gestión de productos
- **companyService.ts**: Gestión de empresas
- **clientService.ts**: Gestión de clientes
- **checkoutService.ts**: Proceso de checkout optimizado
- **burnHistoryService.ts**: Historial de tokens quemados

### Hooks Personalizados
```typescript
// Conexión de wallet
const { isConnected, address, connect, disconnect } = useWallet();

// Gestión de tokens
const { balance, buyTokens, burnTokens } = useTokens();

// Carrito de compras
const { items, addItem, removeItem, clearCart } = useCart();

// Proceso de checkout
const { processCheckout, isLoading } = useCheckout();

// Gestión de productos
const { products, loading, refreshProducts } = useProducts();
```

## 🚀 Optimizaciones de Rendimiento

### Code Splitting
- **Lazy loading** de páginas administrativas
- **Chunks optimizados** por funcionalidad
- **Tree shaking** de dependencias

### Bundle Optimization
```typescript
// Configuración de Vite optimizada
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'ethers-vendor': ['ethers'],
          'admin-pages': ['./src/pages/admin'],
          'user-pages': ['./src/pages'],
          'services': ['./src/services']
        }
      }
    },
    minify: 'esbuild',
    target: 'esnext'
  }
});
```

### Optimización de Transacciones
- **Aprobación única** de tokens para múltiples compras
- **Transacciones agrupadas** por compañía
- **Estimación de gas** optimizada

## 🎯 Flujo de Usuario

### Usuario No Conectado
1. **Navegación limitada**: Solo Home y Products
2. **Exploración libre**: Puede ver productos sin conexión
3. **Prompt de conexión**: Al intentar agregar al carrito

### Usuario Cliente
1. **Conexión de wallet**: MetaMask integration
2. **Navegación completa**: Acceso a todas las funciones
3. **Tema verde**: Indicador visual de rol
4. **Compra optimizada**: 2 confirmaciones máximo

### Usuario Administrador
1. **Panel administrativo**: Acceso completo al sistema
2. **Tema naranja**: Indicador visual de rol
3. **Gestión completa**: CRUD de empresas, productos, clientes
4. **Estadísticas avanzadas**: Dashboard con métricas

## 🔧 Configuración Avanzada

### Variables de Entorno
```bash
# .env
VITE_RPC_URL=http://127.0.0.1:8545
VITE_CHAIN_ID=31337
VITE_CONTRACT_ADDRESSES='{"ITCToken20":"0x...","Company":"0x..."}'
```

### Configuración de Contratos
```typescript
// src/config/contracts.ts
export const CONTRACT_ADDRESSES = {
  local: {
    ITCToken20: '0x...',
    Company: '0x...',
    Products: '0x...',
    Invoice: '0x...',
    Clients: '0x...'
  }
};
```

## 🧪 Testing y Calidad

### Herramientas de Calidad
- **ESLint**: Linting de código
- **TypeScript**: Verificación de tipos
- **Vite**: Build optimizado
- **Tailwind CSS**: Clases utilitarias

### Mejores Prácticas
- **Componentes funcionales** con hooks
- **Tipado estricto** con TypeScript
- **Separación de responsabilidades** en servicios
- **Manejo de errores** comprehensivo
- **Estados de carga** para mejor UX

## 🚀 Deployment

### Build de Producción
```bash
npm run build
```

### Optimizaciones de Build
- **Minificación** con esbuild
- **Code splitting** automático
- **Tree shaking** de dependencias
- **Compresión gzip** habilitada
- **Assets optimizados**

### Estructura de Build
```
dist/
├── index.html
├── assets/
│   ├── index-[hash].js
│   ├── react-vendor-[hash].js
│   ├── ethers-vendor-[hash].js
│   ├── admin-pages-[hash].js
│   └── index-[hash].css
└── vite.svg
```

## 🔍 Debugging y Desarrollo

### Herramientas de Desarrollo
- **React DevTools**: Inspección de componentes
- **MetaMask DevTools**: Debugging de transacciones
- **Vite HMR**: Hot Module Replacement
- **TypeScript**: IntelliSense y error checking

### Logs y Monitoreo
```typescript
// Logging estructurado
console.log('🛒 Adding item to cart:', { productId, quantity });
console.log('✅ Transaction completed:', { hash, receipt });
console.log('❌ Transaction failed:', { error, reason });
```

## 🤝 Contribución

1. Fork el repositorio
2. Crea una rama de feature: `git checkout -b feature/nueva-funcionalidad`
3. Realiza tus cambios
4. Ejecuta tests: `npm run lint && npm run type-check`
5. Commit tus cambios: `git commit -m 'feat: añadir nueva funcionalidad'`
6. Push a la rama: `git push origin feature/nueva-funcionalidad`
7. Abre un Pull Request

## 📄 Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo LICENSE para detalles.

## 🆘 Soporte

Para soporte y preguntas:
- Crea un issue en el repositorio
- Revisa la documentación de los hooks
- Consulta los ejemplos en los componentes
- Revisa la configuración de contratos

## 🚀 Próximos Pasos

- [x] Sistema de temas dinámicos
- [x] Optimización de transacciones
- [x] Panel administrativo completo
- [x] Sistema de notificaciones
- [x] Historial de tokens quemados
- [ ] Tests unitarios con Jest/Vitest
- [ ] PWA (Progressive Web App)
- [ ] Modo offline
- [ ] Internacionalización (i18n)
- [ ] Analytics y métricas de usuario
- [ ] Sistema de notificaciones push
- [ ] Integración con más wallets
