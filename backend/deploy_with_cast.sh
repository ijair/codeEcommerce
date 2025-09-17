#!/bin/bash

# Deploy Contracts to Anvil using cast
echo "🚀 Deploying all contracts to Anvil using cast..."

# Configuration
DEPLOYER_ADDRESS="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
DEPLOYER_PRIVATE_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
RPC_URL="http://127.0.0.1:8545"

echo "Deployer: $DEPLOYER_ADDRESS"
echo "RPC URL: $RPC_URL"

# Get contract bytecode
echo "📄 1. Getting ITCToken20 bytecode..."
TOKEN_BYTECODE=$(forge inspect src/contracts/ITCToken20.sol:ITCToken20 bytecode)
TOKEN_CONSTRUCTOR_ARGS=$(cast abi-encode "constructor(address)" $DEPLOYER_ADDRESS)

echo "📄 2. Deploying ITCToken20..."
TOKEN_TX=$(ETH_RPC_URL=$RPC_URL cast send --from $DEPLOYER_ADDRESS --unlocked --create ${TOKEN_BYTECODE}${TOKEN_CONSTRUCTOR_ARGS:2})
TOKEN_ADDRESS=$(echo "$TOKEN_TX" | grep "contractAddress" | awk '{print $2}')
echo "✅ ITCToken20 deployed at: $TOKEN_ADDRESS"

# Verify token deployment
echo "Verifying token..."
TOKEN_NAME=$(ETH_RPC_URL=$RPC_URL cast call $TOKEN_ADDRESS "name()" | cast --to-ascii)
echo "Token name: $TOKEN_NAME"

# Deploy Company
echo "📄 3. Deploying Company..."
COMPANY_BYTECODE=$(forge inspect src/contracts/Company.sol:Company bytecode)
COMPANY_CONSTRUCTOR_ARGS=$(cast abi-encode "constructor(address)" $DEPLOYER_ADDRESS)

COMPANY_TX=$(ETH_RPC_URL=$RPC_URL cast send --from $DEPLOYER_ADDRESS --unlocked --create ${COMPANY_BYTECODE}${COMPANY_CONSTRUCTOR_ARGS:2})
COMPANY_ADDRESS=$(echo "$COMPANY_TX" | grep "contractAddress" | awk '{print $2}')
echo "✅ Company deployed at: $COMPANY_ADDRESS"

# Deploy Products
echo "📄 4. Deploying Products..."
PRODUCTS_BYTECODE=$(forge inspect src/contracts/Products.sol:Products bytecode)
PRODUCTS_CONSTRUCTOR_ARGS=$(cast abi-encode "constructor(address,address)" $DEPLOYER_ADDRESS $COMPANY_ADDRESS)

PRODUCTS_TX=$(ETH_RPC_URL=$RPC_URL cast send --from $DEPLOYER_ADDRESS --unlocked --create ${PRODUCTS_BYTECODE}${PRODUCTS_CONSTRUCTOR_ARGS:2})
PRODUCTS_ADDRESS=$(echo "$PRODUCTS_TX" | grep "contractAddress" | awk '{print $2}')
echo "✅ Products deployed at: $PRODUCTS_ADDRESS"

# Deploy Clients
echo "📄 5. Deploying Clients..."
CLIENTS_BYTECODE=$(forge inspect src/contracts/Clients.sol:Clients bytecode)
CLIENTS_CONSTRUCTOR_ARGS=$(cast abi-encode "constructor(address,address)" $DEPLOYER_ADDRESS $COMPANY_ADDRESS)

CLIENTS_TX=$(ETH_RPC_URL=$RPC_URL cast send --from $DEPLOYER_ADDRESS --unlocked --create ${CLIENTS_BYTECODE}${CLIENTS_CONSTRUCTOR_ARGS:2})
CLIENTS_ADDRESS=$(echo "$CLIENTS_TX" | grep "contractAddress" | awk '{print $2}')
echo "✅ Clients deployed at: $CLIENTS_ADDRESS"

# Deploy Invoice
echo "📄 6. Deploying Invoice..."
INVOICE_BYTECODE=$(forge inspect src/contracts/Invoice.sol:Invoice bytecode)
INVOICE_CONSTRUCTOR_ARGS=$(cast abi-encode "constructor(address,address)" $DEPLOYER_ADDRESS $COMPANY_ADDRESS)

INVOICE_TX=$(ETH_RPC_URL=$RPC_URL cast send --from $DEPLOYER_ADDRESS --unlocked --create ${INVOICE_BYTECODE}${INVOICE_CONSTRUCTOR_ARGS:2})
INVOICE_ADDRESS=$(echo "$INVOICE_TX" | grep "contractAddress" | awk '{print $2}')
echo "✅ Invoice deployed at: $INVOICE_ADDRESS"

# Configure contract relationships
echo "⚙️  Configuring contract relationships..."

# Set up Invoice contract relationships
echo "Setting Invoice clients contract..."
ETH_RPC_URL=$RPC_URL cast send $INVOICE_ADDRESS "setClientsContract(address)" $CLIENTS_ADDRESS --from $DEPLOYER_ADDRESS --unlocked

echo "Setting Invoice products contract..."
ETH_RPC_URL=$RPC_URL cast send $INVOICE_ADDRESS "setProductsContract(address)" $PRODUCTS_ADDRESS --from $DEPLOYER_ADDRESS --unlocked

echo "Setting Invoice token contract..."
ETH_RPC_URL=$RPC_URL cast send $INVOICE_ADDRESS "setTokenContract(address)" $TOKEN_ADDRESS --from $DEPLOYER_ADDRESS --unlocked

# Authorize contracts
echo "Authorizing Invoice contract in Clients..."
ETH_RPC_URL=$RPC_URL cast send $CLIENTS_ADDRESS "authorizeContract(address)" $INVOICE_ADDRESS --from $DEPLOYER_ADDRESS --unlocked

echo "Authorizing Invoice contract in Products..."
ETH_RPC_URL=$RPC_URL cast send $PRODUCTS_ADDRESS "authorizeContract(address)" $INVOICE_ADDRESS --from $DEPLOYER_ADDRESS --unlocked

# Create deployed addresses file
echo "📁 Creating deployed addresses file..."
cat > deployed_addresses_local.txt << EOF
ITCToken20=$TOKEN_ADDRESS
Company=$COMPANY_ADDRESS
Products=$PRODUCTS_ADDRESS
Invoice=$INVOICE_ADDRESS
Clients=$CLIENTS_ADDRESS
Deployer=$DEPLOYER_ADDRESS
EOF

# Display summary
echo ""
echo "🎉 DEPLOYMENT COMPLETE!"
echo "========================="
echo "ITCToken20:  $TOKEN_ADDRESS"
echo "Company:     $COMPANY_ADDRESS"
echo "Products:    $PRODUCTS_ADDRESS"
echo "Invoice:     $INVOICE_ADDRESS"
echo "Clients:     $CLIENTS_ADDRESS"
echo "Deployer:    $DEPLOYER_ADDRESS"
echo ""
echo "📋 All addresses saved to: deployed_addresses_local.txt"
echo ""

# Verify deployer access
echo "🔍 Verifying deployer access..."
echo "Token name: $(ETH_RPC_URL=$RPC_URL cast call $TOKEN_ADDRESS "name()" | cast --to-ascii)"
echo "Token symbol: $(ETH_RPC_URL=$RPC_URL cast call $TOKEN_ADDRESS "symbol()" | cast --to-ascii)"
echo "Company count: $(ETH_RPC_URL=$RPC_URL cast call $COMPANY_ADDRESS "getCompanyCount()" | cast --to-dec)"
echo "Product count: $(ETH_RPC_URL=$RPC_URL cast call $PRODUCTS_ADDRESS "getProductCount()" | cast --to-dec)"
echo "Invoice count: $(ETH_RPC_URL=$RPC_URL cast call $INVOICE_ADDRESS "getInvoiceCount()" | cast --to-dec)"

echo ""
echo "✅ Deployment and verification complete!"
echo "🚀 Ready to use with frontend!"
