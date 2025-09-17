// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/contracts/ITCToken20.sol";
import "../src/contracts/Company.sol";
import "../src/contracts/Products.sol";
import "../src/contracts/Invoice.sol";
import "../src/contracts/Clients.sol";
import "../src/interfaces/ICompany.sol";
import "../src/interfaces/IProducts.sol";
import "../src/interfaces/IInvoice.sol";
import "../src/interfaces/IClients.sol";

/**
 * @title SetupTestData
 * @dev Script to create comprehensive test data and verify deployer access
 * @notice This script creates companies, products, clients, and invoices for testing
 * @author E-commerce Platform Team
 */
contract SetupTestData is Script {
    // Contract addresses (will be read from deployed_addresses_local.txt)
    address payable constant TOKEN_ADDRESS = payable(0x5FbDB2315678afecb367f032d93F642f64180aa3);
    address constant COMPANY_ADDRESS = 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512;
    address constant PRODUCTS_ADDRESS = 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0;
    address constant INVOICE_ADDRESS = 0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9;
    address constant CLIENTS_ADDRESS = 0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9;
    
    // Deployer and test accounts
    address constant DEPLOYER = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266;
    address constant USER1 = 0x70997970C51812dc3A010C7d01b50e0d17dc79C8;
    address constant USER2 = 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC;
    address constant USER3 = 0x90F79bf6EB2c4f870365E785982E1f101E93b906;

    function run() external {
        console.log("Setting up comprehensive test data...");
        console.log("Deployer:", DEPLOYER);
        
        // Get contract instances
        ITCToken20 token = ITCToken20(TOKEN_ADDRESS);
        Company company = Company(COMPANY_ADDRESS);
        Products products = Products(PRODUCTS_ADDRESS);
        Invoice invoice = Invoice(INVOICE_ADDRESS);
        Clients clients = Clients(CLIENTS_ADDRESS);
        
        // Use specific private keys for broadcasting
        uint256 user1PrivateKey = 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d;
        uint256 user2PrivateKey = 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a;
        uint256 user3PrivateKey = 0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6;
        
        // 1. Create companies as different users
        console.log("\n=== Creating Companies ===");
        
        vm.startBroadcast(user1PrivateKey);
        uint256 companyId1 = company.createCompany("Tech Solutions Inc");
        console.log("Company 1 created by USER1:", companyId1);
        vm.stopBroadcast();
        
        vm.startBroadcast(user2PrivateKey);
        uint256 companyId2 = company.createCompany("Digital Products Ltd");
        console.log("Company 2 created by USER2:", companyId2);
        vm.stopBroadcast();
        
        vm.startBroadcast(user3PrivateKey);
        uint256 companyId3 = company.createCompany("E-commerce Experts");
        console.log("Company 3 created by USER3:", companyId3);
        vm.stopBroadcast();
        
        // 2. Create products for each company
        console.log("\n=== Creating Products ===");
        
        // Company 1 products
        vm.startBroadcast(user1PrivateKey);
        uint256 productId1 = products.createProduct(companyId1, "Gaming Laptop", 1500 ether, "QmLaptopHash", 50);
        console.log("Product 1 created:", productId1);
        
        uint256 productId2 = products.createProduct(companyId1, "Wireless Mouse", 75 ether, "QmMouseHash", 200);
        console.log("Product 2 created:", productId2);
        
        uint256 productId3 = products.createProduct(companyId1, "Mechanical Keyboard", 120 ether, "QmKeyboardHash", 100);
        console.log("Product 3 created:", productId3);
        vm.stopBroadcast();
        
        // Company 2 products
        vm.startBroadcast(user2PrivateKey);
        uint256 productId4 = products.createProduct(companyId2, "Smartphone Pro", 999 ether, "QmPhoneHash", 80);
        console.log("Product 4 created:", productId4);
        
        uint256 productId5 = products.createProduct(companyId2, "Tablet Ultra", 699 ether, "QmTabletHash", 60);
        console.log("Product 5 created:", productId5);
        vm.stopBroadcast();
        
        // Company 3 products
        vm.startBroadcast(user3PrivateKey);
        uint256 productId6 = products.createProduct(companyId3, "Smart Watch", 299 ether, "QmWatchHash", 150);
        console.log("Product 6 created:", productId6);
        vm.stopBroadcast();
        
        // 3. Create some invoices and client data
        console.log("\n=== Creating Invoices and Clients ===");
        
        // Prepare invoice items
        IInvoice.InvoiceItem[] memory items1 = new IInvoice.InvoiceItem[](2);
        items1[0] = IInvoice.InvoiceItem({
            productId: productId1,
            quantity: 1,
            unitPrice: 1500 ether,
            totalPrice: 1500 ether
        });
        items1[1] = IInvoice.InvoiceItem({
            productId: productId2,
            quantity: 2,
            unitPrice: 75 ether,
            totalPrice: 150 ether
        });
        
        // Create invoice (this will also register the client)
        vm.startBroadcast(user1PrivateKey);
        uint256 invoiceId1 = invoice.createInvoiceWithProducts(
            companyId1,
            1001,
            DEPLOYER, // Client address
            items1,
            false // Don't use tokens
        );
        console.log("Invoice 1 created:", invoiceId1);
        vm.stopBroadcast();
        
        // Create another invoice
        IInvoice.InvoiceItem[] memory items2 = new IInvoice.InvoiceItem[](1);
        items2[0] = IInvoice.InvoiceItem({
            productId: productId4,
            quantity: 1,
            unitPrice: 999 ether,
            totalPrice: 999 ether
        });
        
        vm.startBroadcast(user2PrivateKey);
        uint256 invoiceId2 = invoice.createInvoiceWithProducts(
            companyId2,
            2001,
            USER1, // Client address
            items2,
            false // Don't use tokens
        );
        console.log("Invoice 2 created:", invoiceId2);
        vm.stopBroadcast();
        
        // 4. Verify deployer access to all data
        console.log("\n=== DEPLOYER ACCESS VERIFICATION ===");
        console.log("Deployer address:", DEPLOYER);
        console.log("Verifying full access to all platform data...");
        
        // Companies access
        ICompany.CompanyData[] memory allCompanies = company.getAllCompanies();
        console.log("[OK] Companies - Total visible:", allCompanies.length);
        for (uint i = 0; i < allCompanies.length; i++) {
            console.log("  Company", i + 1, ":", allCompanies[i].name);
        }
        
        // Products access
        IProducts.ProductData[] memory allProducts = products.getAllProducts();
        console.log("[OK] Products - Total visible:", allProducts.length);
        for (uint i = 0; i < allProducts.length; i++) {
            console.log("  Product", i + 1, ":", allProducts[i].name);
        }
        
        // Invoices access
        IInvoice.InvoiceData[] memory allInvoices = invoice.getAllInvoices();
        console.log("[OK] Invoices - Total visible:", allInvoices.length);
        for (uint i = 0; i < allInvoices.length; i++) {
            console.log("  Invoice", i + 1, "- Number:", allInvoices[i].number);
            console.log("    Amount:", allInvoices[i].totalAmount);
        }
        
        // Clients access for each company
        console.log("[OK] Clients by Company:");
        for (uint i = 1; i <= 3; i++) {
            IClients.ClientData[] memory companyClients = clients.getClientsByCompany(i);
            console.log("  Company", i, "has clients:", companyClients.length);
        }
        
        // Token information
        console.log("[OK] Token Information:");
        console.log("  Name:", token.name());
        console.log("  Symbol:", token.symbol());
        console.log("  Total Supply:", token.totalSupply());
        console.log("  Price:", token.getTokenPrice());
        
        console.log("\n[SUCCESS] VERIFICATION COMPLETE!");
        console.log("[OK] Deployer has FULL ACCESS to:");
        console.log("   - All companies (", allCompanies.length, "total )");
        console.log("   - All products (", allProducts.length, "total )");
        console.log("   - All invoices (", allInvoices.length, "total )");
        console.log("   - All clients across all companies");
        console.log("   - Complete token information and management");
        
        // Save comprehensive test data
        string memory testDataSummary = string(abi.encodePacked(
            "=== COMPREHENSIVE TEST DATA SUMMARY ===\n",
            "Deployer=", vm.toString(DEPLOYER), "\n",
            "Companies=", vm.toString(allCompanies.length), "\n",
            "Products=", vm.toString(allProducts.length), "\n",
            "Invoices=", vm.toString(allInvoices.length), "\n",
            "Token=", vm.toString(TOKEN_ADDRESS), "\n",
            "Company=", vm.toString(COMPANY_ADDRESS), "\n",
            "Products=", vm.toString(PRODUCTS_ADDRESS), "\n",
            "Invoice=", vm.toString(INVOICE_ADDRESS), "\n",
            "Clients=", vm.toString(CLIENTS_ADDRESS)
        ));
        
        vm.writeFile("comprehensive_test_data.txt", testDataSummary);
        console.log("[SAVED] Test data summary saved to comprehensive_test_data.txt");
    }
}
