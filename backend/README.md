# E-commerce Smart Contract Platform - Backend

A complete e-commerce platform built with Solidity 0.8.20 and Foundry, featuring ERC-20 tokens, company management, product catalog, invoicing system, and client tracking with advanced filtering and search capabilities.

## 🏗️ Architecture

### Main Contracts

1. **ITCToken20** - ERC-20 token with buy/withdraw functionality and burn tracking
2. **Company** - Company management system
3. **Products** - Product catalog with advanced filtering and search
4. **Invoice** - Invoicing system and purchase management
5. **Clients** - Client management and tracking

### Directory Structure

```
backend/
├── src/
│   ├── contracts/          # Smart contracts
│   │   ├── ITCToken20.sol
│   │   ├── Company.sol
│   │   ├── Products.sol
│   │   ├── Invoice.sol
│   │   └── Clients.sol
│   └── interfaces/         # Contract interfaces
│       ├── IITCToken20.sol
│       ├── ICompany.sol
│       ├── IProducts.sol
│       ├── IInvoice.sol
│       └── IClients.sol
├── test/                   # Foundry tests
│   ├── ITCToken20.t.sol
│   ├── Company.t.sol
│   ├── Products.t.sol
│   ├── Invoice.t.sol
│   ├── Clients.t.sol
│   └── Integration.t.sol
├── script/                 # Deployment scripts
│   ├── Deploy.s.sol
│   ├── DeployLocal.s.sol
│   └── SetupTestData.s.sol
├── deploy_contracts.sh     # Automated deployment script
└── foundry.toml           # Foundry configuration
```

## 🚀 Features

### ITCToken20 (ERC-20 Token)
- ✅ Standard ERC-20 functionality
- ✅ Buy tokens with ETH
- ✅ Withdraw tokens for ETH
- ✅ Configurable token price
- ✅ Maximum supply limit (1M tokens)
- ✅ Owner minting/burning capabilities
- ✅ Reentrancy protection
- ✅ **Complete burned token tracking**
- ✅ **Self-burn function for users**
- ✅ **Burn statistics and history**

### Company Management
- ✅ Create companies with name and owner
- ✅ Update company information
- ✅ Activate/deactivate companies
- ✅ Query companies by owner
- ✅ Transfer company ownership
- ✅ Comprehensive filtering and search
- ✅ **Inter-contract authorization system**

### Product Catalog
- ✅ Create products with company association
- ✅ Product metadata (name, price, IPFS image hash)
- ✅ Advanced filtering by company, price range, active status
- ✅ Text search functionality
- ✅ CRUD operations for products
- ✅ Company ownership validation
- ✅ **Real-time stock management**
- ✅ **Automatic stock updates on purchases**

### Invoicing System
- ✅ **Invoice creation by company owners**
- ✅ **Invoice creation by clients (new feature)**
- ✅ **Invoice item management**
- ✅ **Token system integration**
- ✅ **Automatic stock updates**
- ✅ **Automatic client purchase registration**
- ✅ **Payment tracking**

### Client Management
- ✅ **Client registration by company**
- ✅ **Client purchase tracking**
- ✅ **Client statistics**
- ✅ **Active/inactive state management**
- ✅ **Invoice counters**

## 🛠️ Configuración e Instalación

### Prerrequisitos
- [Foundry](https://book.getfoundry.sh/getting-started/installation)
- [Anvil](https://book.getfoundry.sh/anvil/) para desarrollo local

### Instalación

1. Clona el repositorio y navega al directorio backend:
```bash
cd backend
```

2. Instala las dependencias:
```bash
forge install
```

3. Construye los contratos:
```bash
forge build
```

## 🧪 Testing

Ejecuta todos los tests:
```bash
forge test
```

Ejecuta archivos de test específicos:
```bash
forge test --match-contract ITCToken20Test
forge test --match-contract CompanyTest
forge test --match-contract ProductsTest
forge test --match-contract InvoiceTest
forge test --match-contract ClientsTest
forge test --match-contract IntegrationTest
```

Ejecuta tests con reporte de gas:
```bash
forge test --gas-report
```

Ejecuta tests con cobertura:
```bash
forge coverage
```

## 🚀 Deployment

### Desarrollo Local (Anvil)

1. Inicia Anvil en una terminal:
```bash
anvil
```

2. Despliega contratos localmente:
```bash
./deploy_contracts.sh
```

O manualmente:
```bash
forge script script/DeployLocal.s.sol --rpc-url http://localhost:8545 --broadcast
```

### Deployment en Testnet/Mainnet

1. Configura tu clave privada como variable de entorno:
```bash
export PRIVATE_KEY=tu_clave_privada_aqui
```

2. Despliega a Sepolia testnet:
```bash
forge script script/Deploy.s.sol --rpc-url sepolia --broadcast --verify
```

3. Despliega a mainnet:
```bash
forge script script/Deploy.s.sol --rpc-url mainnet --broadcast --verify
```

## 📖 Ejemplos de Uso

### Operaciones de Token
```solidity
// Comprar tokens
ITCToken20(tokenAddress).buyTokens{value: ethAmount}();

// Retirar tokens
ITCToken20(tokenAddress).withdrawTokens(tokenAmount);

// Quemar tokens propios
ITCToken20(tokenAddress).selfBurn(amount);

// Obtener precio del token
uint256 price = ITCToken20(tokenAddress).getTokenPrice();

// Obtener estadísticas de quemado
(uint256 totalBurned, uint256 totalTransactions, uint256 average) = 
    ITCToken20(tokenAddress).getBurnStatistics();
```

### Gestión de Empresas
```solidity
// Crear empresa
uint256 companyId = Company(companyAddress).createCompany("Mi Empresa");

// Obtener empresas por propietario
CompanyData[] memory companies = Company(companyAddress).getCompaniesByOwner(owner);

// Actualizar empresa
Company(companyAddress).updateCompany(companyId, "Nuevo Nombre");
```

### Operaciones de Productos
```solidity
// Crear producto
uint256 productId = Products(productsAddress).createProduct(
    companyId, 
    "Nombre del Producto", 
    price, 
    "QmIPFSHash",
    stock
);

// Buscar productos
ProductData[] memory results = Products(productsAddress).searchProducts("término de búsqueda");

// Filtrar productos
ProductFilter memory filter = ProductFilter({
    companyId: 0,        // 0 = todas las empresas
    minPrice: 100 ether,
    maxPrice: 1000 ether,
    isActive: true,
    searchTerm: "laptop"
});
ProductData[] memory filtered = Products(productsAddress).getProductsWithFilter(filter);
```

### Sistema de Facturación
```solidity
// Crear factura (solo propietario de empresa)
InvoiceItem[] memory items = new InvoiceItem[](1);
items[0] = InvoiceItem({
    productId: productId,
    quantity: 2,
    unitPrice: 100 ether,
    totalPrice: 200 ether
});

uint256 invoiceId = Invoice(invoiceAddress).createInvoiceWithProducts(
    companyId,
    invoiceNumber,
    clientAddress,
    items,
    true // usar tokens
);

// Crear factura (cliente)
uint256 invoiceId = Invoice(invoiceAddress).createInvoiceForPurchase(
    companyId,
    invoiceNumber,
    msg.sender, // dirección del cliente
    items,
    true // usar tokens
);
```

### Gestión de Clientes
```solidity
// Registrar cliente
Clients(clientsAddress).registerClient(companyId, clientAddress);

// Registrar compra de cliente
Clients(clientsAddress).registerClientPurchase(companyId, clientAddress, amount);

// Obtener clientes activos por empresa
address[] memory activeClients = Clients(clientsAddress).getActiveClientsByCompany(companyId);
```

## 🔧 Configuración

### Configuración de Foundry (foundry.toml)
- Versión de Solidity: 0.8.20
- Optimizador habilitado con 200 runs
- Testing fuzz configurado
- Endpoints RPC para Anvil, Sepolia y Mainnet

### Variables de Entorno
- `PRIVATE_KEY`: Tu clave privada de wallet para deployment
- `ALCHEMY_API_KEY`: Para endpoints RPC
- `ETHERSCAN_API_KEY`: Para verificación de contratos

## 🛡️ Características de Seguridad

- **ReentrancyGuard**: Previene ataques de reentrancia en operaciones de tokens
- **Control de Acceso**: Funciones solo para propietarios en operaciones críticas
- **Validación de Entrada**: Validación comprehensiva para todas las entradas
- **Safe Math**: Protección integrada contra overflow/underflow
- **Verificación de Propiedad**: Los propietarios de empresas solo pueden gestionar sus propias entidades
- **Autorización entre Contratos**: Sistema robusto de permisos entre contratos
- **Validación de Stock**: Verificación de disponibilidad antes de compras

## 📊 Optimización de Gas

- Patrones de almacenamiento eficientes
- Llamadas externas mínimas
- Bucles e iteraciones optimizadas
- Structs empaquetados cuando es posible
- Eventos para indexación eficiente off-chain
- **Transacciones agrupadas** para reducir costos de gas

## 🔍 Monitoreo y Eventos

Todos los contratos emiten eventos comprehensivos para:
- Compras y retiros de tokens
- Creación y actualización de empresas
- Operaciones de gestión de productos
- Transferencias de propiedad
- Actualizaciones de precios
- **Creación y actualización de facturas**
- **Registro de compras de clientes**
- **Eventos de quemado de tokens con seguimiento completo**

## 🧪 Testing Comprehensivo

### Cobertura de Tests
- ✅ **190+ tests** cubriendo todos los contratos
- ✅ Tests unitarios para cada función
- ✅ Tests de integración entre contratos
- ✅ Tests fuzz para validación robusta
- ✅ Tests de casos edge y manejo de errores
- ✅ Tests de autorización y permisos

### Tipos de Tests
- **Unit Tests**: Funcionalidad individual de cada contrato
- **Integration Tests**: Interacciones entre contratos
- **Fuzz Tests**: Validación con entradas aleatorias
- **Gas Tests**: Optimización de costos de gas
- **Security Tests**: Validación de medidas de seguridad

## 🤝 Contribución

1. Fork el repositorio
2. Crea una rama de feature
3. Realiza tus cambios
4. Añade tests para nueva funcionalidad
5. Ejecuta la suite de tests
6. Envía un pull request

## 📄 Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo LICENSE para detalles.

## 🆘 Soporte

Para soporte y preguntas:
- Crea un issue en el repositorio
- Revisa los archivos de test para ejemplos de uso
- Revisa las interfaces de contratos para firmas de funciones

## 🚀 Próximos Pasos

- [x] Sistema de facturación completo
- [x] Gestión de clientes
- [x] Seguimiento de tokens quemados
- [x] Optimización de gas y transacciones
- [ ] Integración con procesadores de pago
- [ ] Sistema de gestión de órdenes
- [ ] Reseñas y calificaciones de productos
- [ ] Dashboard de administración
- [ ] Soporte para wallet multi-firma
- [ ] Implementación de contratos actualizables
- [ ] Sistema de notificaciones
- [ ] Analytics y reportes avanzados