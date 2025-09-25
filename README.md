# 🛒 E-commerce Blockchain Platform

Una plataforma completa de e-commerce descentralizada construida con **Solidity**, **React**, **TypeScript** y **Foundry**. Este proyecto demuestra la implementación de un sistema de comercio electrónico moderno utilizando tecnología blockchain, con funcionalidades avanzadas de gestión de empresas, productos, clientes, facturación y tokens.

## 🎯 Visión del Proyecto

Este proyecto fue desarrollado como parte de un curso de desarrollo blockchain, demostrando las mejores prácticas en:

- **Desarrollo de Smart Contracts** con Solidity 0.8.20
- **Frontend moderno** con React y TypeScript
- **Integración blockchain** con ethers.js
- **Arquitectura descentralizada** y optimización de gas
- **UX/UI optimizada** para aplicaciones Web3

## 🏗️ Arquitectura del Sistema

### Stack Tecnológico Completo

#### 🔗 Backend (Blockchain)
- **Solidity 0.8.20** - Lenguaje de contratos inteligentes
- **Foundry** - Framework de desarrollo y testing
- **OpenZeppelin** - Librerías de contratos seguros
- **Anvil** - Red local de desarrollo
- **Forge** - Compilador y test runner

#### 🎨 Frontend (Web3)
- **React 18** - Biblioteca de UI moderna
- **TypeScript** - Tipado estático
- **Vite** - Build tool ultra-rápido
- **Tailwind CSS** - Framework CSS utility-first
- **Ethers.js** - Interacción con blockchain
- **React Router** - Navegación SPA
- **Zustand** - Gestión de estado

#### 🛠️ Herramientas de Desarrollo
- **MetaMask** - Wallet de usuario
- **ESLint** - Linting de código
- **Prettier** - Formateo de código
- **Git** - Control de versiones

## 📁 Estructura del Proyecto

```
codeEcommerce/
├── backend/                    # Smart Contracts
│   ├── src/
│   │   ├── contracts/         # Contratos principales
│   │   │   ├── ITCToken20.sol
│   │   │   ├── Company.sol
│   │   │   ├── Products.sol
│   │   │   ├── Invoice.sol
│   │   │   └── Clients.sol
│   │   └── interfaces/        # Interfaces de contratos
│   ├── test/                  # Tests comprehensivos
│   ├── script/                # Scripts de deployment
│   └── deploy_contracts.sh    # Deployment automatizado
├── frontend/                   # Aplicación Web
│   ├── src/
│   │   ├── components/        # Componentes reutilizables
│   │   ├── pages/             # Páginas de la aplicación
│   │   ├── hooks/             # Custom hooks
│   │   ├── services/          # Servicios de integración
│   │   ├── types/             # Definiciones TypeScript
│   │   └── config/            # Configuración
│   └── dist/                  # Build de producción
└── README.md                  # Este archivo
```

## 🚀 Funcionalidades Principales

### 💰 Sistema de Tokens (ITCToken20)
- **Token ERC-20** personalizado con funcionalidades avanzadas
- **Compra de tokens** con ETH
- **Retiro de tokens** por ETH
- **Sistema de quemado** con seguimiento completo
- **Estadísticas de quemado** y historial
- **Gestión de precios** dinámica

### 🏢 Gestión de Empresas
- **CRUD completo** de empresas
- **Sistema de propietarios** con transferencia
- **Estados activo/inactivo**
- **Filtrado y búsqueda** avanzada
- **Validación de permisos**

### 📦 Catálogo de Productos
- **Gestión completa** de productos
- **Asociación con empresas**
- **Control de stock** en tiempo real
- **Filtrado avanzado** por múltiples criterios
- **Búsqueda de texto** inteligente
- **Metadatos IPFS** para imágenes

### 🧾 Sistema de Facturación
- **Creación de facturas** por propietarios y clientes
- **Gestión de items** de factura
- **Integración con tokens** para pagos
- **Actualización automática** de stock
- **Registro de compras** de clientes
- **Historial completo** de transacciones

### 👥 Gestión de Clientes
- **Registro automático** de clientes
- **Seguimiento de compras** por empresa
- **Estadísticas de clientes**
- **Gestión de estados** activo/inactivo
- **Contadores de facturas**

### 🎨 Experiencia de Usuario
- **Temas dinámicos** basados en rol (Azul/Naranja/Verde)
- **Navegación condicional** según estado de conexión
- **Optimización de transacciones** (mínimas confirmaciones)
- **Notificaciones toast** para feedback
- **Estados de carga** y manejo de errores

### 🔐 Panel de Administración
- **Dashboard completo** con estadísticas
- **Gestión CRUD** de todas las entidades
- **Estadísticas avanzadas** del sistema
- **Historial de facturas** y transacciones
- **Gestión de tokens** y balance

## 🛠️ Estrategias de Desarrollo

### 🔒 Seguridad
- **ReentrancyGuard** en operaciones críticas
- **Validación de entrada** comprehensiva
- **Control de acceso** basado en roles
- **Verificación de permisos** entre contratos
- **Safe Math** integrado para prevenir overflow

### ⚡ Optimización de Gas
- **Transacciones agrupadas** para reducir costos
- **Aprobación única** de tokens para múltiples operaciones
- **Patrones de almacenamiento** eficientes
- **Llamadas externas** mínimas
- **Structs empaquetados** para ahorrar espacio

### 🎯 UX/UI Optimizada
- **Code splitting** para mejor rendimiento
- **Lazy loading** de componentes
- **Bundle optimization** con Vite
- **Tree shaking** de dependencias
- **Temas dinámicos** para mejor experiencia

### 🧪 Testing Comprehensivo
- **190+ tests** cubriendo todos los contratos
- **Tests unitarios** para cada función
- **Tests de integración** entre contratos
- **Tests fuzz** para validación robusta
- **Tests de casos edge** y manejo de errores

## 🚀 Instalación y Configuración

### Prerrequisitos
- **Node.js 18+**
- **Foundry** instalado
- **MetaMask** en el navegador
- **Git** para clonar el repositorio

### Configuración Rápida

1. **Clona el repositorio:**
```bash
git clone <repository-url>
cd codeEcommerce
```

2. **Configura el backend:**
```bash
cd backend
forge install
forge build
```

3. **Configura el frontend:**
```bash
cd ../frontend
npm install
```

4. **Inicia Anvil (en una terminal separada):**
```bash
anvil
```

5. **Despliega los contratos:**
```bash
cd backend
./deploy_contracts.sh
```

6. **Inicia el frontend:**
```bash
cd ../frontend
npm run dev
```

7. **Abre [http://localhost:5173](http://localhost:5173)** en tu navegador

## 📖 Documentación Detallada

### Backend (Smart Contracts)
📚 **[Ver README del Backend](./backend/README.md)**
- Arquitectura de contratos
- Funcionalidades detalladas
- Guías de testing
- Scripts de deployment
- Ejemplos de uso

### Frontend (Aplicación Web)
📚 **[Ver README del Frontend](./frontend/README.md)**
- Stack tecnológico
- Estructura de componentes
- Hooks personalizados
- Optimizaciones de rendimiento
- Guías de desarrollo

## 🎓 Conceptos de Blockchain Implementados

### 🔗 Smart Contracts
- **ERC-20 Token Standard** con extensiones personalizadas
- **Ownership Pattern** para control de acceso
- **Factory Pattern** para creación de entidades
- **Event-Driven Architecture** para indexación off-chain

### 💡 Patrones de Diseño
- **Repository Pattern** para gestión de datos
- **Service Layer** para lógica de negocio
- **Observer Pattern** con eventos de blockchain
- **Strategy Pattern** para diferentes tipos de usuarios

### 🔄 Flujos de Transacción
- **Multi-step Transactions** con validación
- **Batch Operations** para optimización de gas
- **Error Handling** comprehensivo
- **State Management** consistente

## 🧪 Testing y Calidad

### Backend Testing
```bash
# Ejecutar todos los tests
forge test

# Tests con reporte de gas
forge test --gas-report

# Tests con cobertura
forge coverage
```

### Frontend Testing
```bash
# Linting
npm run lint

# Type checking
npm run type-check

# Build de producción
npm run build
```

## 🚀 Deployment

### Desarrollo Local
- **Anvil** para red local
- **MetaMask** configurado para localhost
- **Hot reload** en desarrollo

### Producción
- **Sepolia Testnet** para testing
- **Mainnet** para producción
- **Verificación de contratos** en Etherscan

## 📊 Métricas del Proyecto

### Smart Contracts
- **5 contratos** principales
- **190+ tests** con 100% de cobertura
- **Optimización de gas** implementada
- **Eventos** para indexación off-chain

### Frontend
- **15+ páginas** y componentes
- **10+ hooks** personalizados
- **7 servicios** de integración
- **Bundle optimizado** < 1MB

### Funcionalidades
- **CRUD completo** para todas las entidades
- **Sistema de roles** (Admin, Cliente, No conectado)
- **Temas dinámicos** por rol de usuario
- **Optimización de transacciones** (2 confirmaciones máximo)

## 🤝 Contribución

### Cómo Contribuir
1. Fork el repositorio
2. Crea una rama de feature
3. Implementa tus cambios
4. Añade tests si es necesario
5. Ejecuta la suite de tests
6. Envía un Pull Request

### Estándares de Código
- **Solidity**: Sigue las mejores prácticas de OpenZeppelin
- **TypeScript**: Tipado estricto y interfaces claras
- **React**: Componentes funcionales con hooks
- **Testing**: Cobertura completa de funcionalidades

## 📄 Licencia

Este proyecto está licenciado bajo la **Licencia MIT** - ver el archivo [LICENSE](./LICENSE) para detalles.

## 🆘 Soporte

### Recursos de Ayuda
- **Issues del repositorio** para reportar bugs
- **Documentación detallada** en cada README
- **Ejemplos de código** en tests y componentes
- **Comentarios en código** para explicaciones

### Contacto
- Crea un issue en el repositorio
- Revisa la documentación existente
- Consulta los ejemplos de uso

## 🚀 Próximos Pasos

### Funcionalidades Completadas ✅
- [x] Sistema de tokens completo
- [x] Gestión de empresas y productos
- [x] Sistema de facturación
- [x] Panel de administración
- [x] Temas dinámicos
- [x] Optimización de transacciones
- [x] Historial de tokens quemados
- [x] Testing comprehensivo

### Roadmap Futuro 🎯
- [ ] **PWA (Progressive Web App)**
- [ ] **Modo offline** con sincronización
- [ ] **Internacionalización (i18n)**
- [ ] **Analytics y métricas** avanzadas
- [ ] **Sistema de notificaciones** push
- [ ] **Integración con más wallets**
- [ ] **Tests E2E** con Playwright
- [ ] **CI/CD pipeline** automatizado
- [ ] **Documentación interactiva**
- [ ] **Sistema de reviews** y ratings

## 🎓 Aprendizajes del Proyecto

### Blockchain Development
- **Smart Contract Architecture** y mejores prácticas
- **Gas Optimization** y eficiencia de transacciones
- **Security Patterns** y prevención de vulnerabilidades
- **Testing Strategies** para contratos inteligentes

### Frontend Development
- **Web3 Integration** con ethers.js
- **State Management** en aplicaciones blockchain
- **UX Optimization** para transacciones
- **Performance Optimization** con code splitting

### Full-Stack Integration
- **Contract-Frontend Communication** eficiente
- **Error Handling** en aplicaciones Web3
- **User Experience** en aplicaciones descentralizadas
- **Development Workflow** para proyectos blockchain

---

**🎉 ¡Este proyecto demuestra un ecosistema completo de e-commerce blockchain, desde smart contracts hasta una interfaz de usuario moderna y optimizada!**
