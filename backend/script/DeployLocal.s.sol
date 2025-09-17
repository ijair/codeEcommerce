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

/**
 * @title DeployLocal
 * @dev Local deployment script for testing with Anvil
 * @notice This script deploys all contracts to a local Anvil network
 * @author E-commerce Platform Team
 */
contract DeployLocal is Script {
    function run() external {
        // Use the first Anvil account (0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266)
        address deployer = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266;
        uint256 deployerPrivateKey = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
        
        console.log("Deploying contracts locally with account:", deployer);
        console.log("Account balance:", deployer.balance);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy ITCToken20
        console.log("Deploying ITCToken20...");
        ITCToken20 token = new ITCToken20(deployer);
        console.log("ITCToken20 deployed at:", address(token));
        console.log("Token name:", token.name());
        console.log("Token symbol:", token.symbol());
        console.log("Token decimals:", token.decimals());
        console.log("Initial supply:", token.totalSupply());
        console.log("Max supply:", token.getMaxSupply());
        console.log("Token price:", token.getTokenPrice());
        
        // Deploy Company
        console.log("Deploying Company...");
        Company company = new Company(deployer);
        console.log("Company deployed at:", address(company));
        
        // Deploy Products
        console.log("Deploying Products...");
        Products products = new Products(deployer, address(company));
        console.log("Products deployed at:", address(products));
        
        // Deploy Clients
        console.log("Deploying Clients...");
        Clients clients = new Clients(deployer, address(company));
        console.log("Clients deployed at:", address(clients));
        
        // Deploy Invoice
        console.log("Deploying Invoice...");
        Invoice invoice = new Invoice(deployer, address(company));
        console.log("Invoice deployed at:", address(invoice));
        
        // Configure contract relationships
        console.log("Configuring contract relationships...");
        
        // Set up Invoice contract relationships
        invoice.setClientsContract(address(clients));
        invoice.setProductsContract(address(products));
        invoice.setTokenContract(address(token));
        
        // Authorize contracts to interact with each other
        clients.authorizeContract(address(invoice));
        products.authorizeContract(address(invoice));
        
        console.log("Invoice contract configured with all dependencies");
        console.log("Invoice contract authorized to register client purchases");
        console.log("Invoice contract authorized to update product stock");
        
        vm.stopBroadcast();
        
        // Verify deployments
        console.log("\n=== Local Deployment Summary ===");
        console.log("ITCToken20:", address(token));
        console.log("Company:", address(company));
        console.log("Products:", address(products));
        console.log("Invoice:", address(invoice));
        console.log("Clients:", address(clients));
        console.log("Deployer:", deployer);
        
        // Save addresses to file for frontend integration
        string memory addresses = string(abi.encodePacked(
            "ITCToken20=", vm.toString(address(token)), "\n",
            "Company=", vm.toString(address(company)), "\n",
            "Products=", vm.toString(address(products)), "\n",
            "Invoice=", vm.toString(address(invoice)), "\n",
            "Clients=", vm.toString(address(clients)), "\n",
            "Deployer=", vm.toString(deployer)
        ));
        
        vm.writeFile("deployed_addresses_local.txt", addresses);
        console.log("Contract addresses saved to deployed_addresses_local.txt");
        
        // Create some test data
        console.log("\n=== Creating Test Data ===");
        
        // Create test companies
        address user1 = 0x70997970C51812dc3A010C7d01b50e0d17dc79C8; // Anvil account 1
        address user2 = 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC; // Anvil account 2
        uint256 user1PrivateKey = 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d;
        uint256 user2PrivateKey = 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a;
        
        vm.stopBroadcast();
        
        // Create companies as different users
        vm.startBroadcast(user1PrivateKey);
        uint256 companyId1 = company.createCompany("Tech Solutions Inc");
        console.log("Created company 1:", companyId1);
        vm.stopBroadcast();
        
        vm.startBroadcast(user2PrivateKey);
        uint256 companyId2 = company.createCompany("Digital Products Ltd");
        console.log("Created company 2:", companyId2);
        vm.stopBroadcast();
        
        // Create test products
        vm.startBroadcast(user1PrivateKey);
        uint256 productId1 = products.createProduct(companyId1, "Laptop Computer", 1000 ether, "QmHash1", 100);
        console.log("Created product 1:", productId1);
        
        uint256 productId2 = products.createProduct(companyId1, "Gaming Mouse", 50 ether, "QmHash2", 100);
        console.log("Created product 2:", productId2);
        vm.stopBroadcast();
        
        vm.startBroadcast(user2PrivateKey);
        uint256 productId3 = products.createProduct(companyId2, "Smartphone", 800 ether, "QmHash3", 100);
        console.log("Created product 3:", productId3);
        vm.stopBroadcast();
        
        console.log("\n=== Test Data Created ===");
        console.log("Companies:", company.getCompanyCount());
        console.log("Products:", products.getProductCount());
        
        // Verify deployer has access to all data
        console.log("\n=== Deployer Access Verification ===");
        console.log("Deployer can access:");
        
        // Test access to all companies
        ICompany.CompanyData[] memory allCompanies = company.getAllCompanies();
        console.log("- Total companies visible:", allCompanies.length);
        
        // Test access to all products
        IProducts.ProductData[] memory allProducts = products.getAllProducts();
        console.log("- Total products visible:", allProducts.length);
        
        // Test access to active companies
        ICompany.CompanyData[] memory activeCompanies = company.getActiveCompanies();
        console.log("- Active companies:", activeCompanies.length);
        
        // Test access to active products
        IProducts.ProductData[] memory activeProducts = products.getActiveProducts();
        console.log("- Active products:", activeProducts.length);
        
        console.log("[OK] Deployer has full read access to all contracts");
        
        // Save test data addresses
        string memory testData = string(abi.encodePacked(
            "ITCToken20=", vm.toString(address(token)), "\n",
            "Company=", vm.toString(address(company)), "\n",
            "Products=", vm.toString(address(products)), "\n",
            "Deployer=", vm.toString(deployer), "\n",
            "User1=", vm.toString(user1), "\n",
            "User2=", vm.toString(user2), "\n",
            "Company1=", vm.toString(companyId1), "\n",
            "Company2=", vm.toString(companyId2), "\n",
            "Product1=", vm.toString(productId1), "\n",
            "Product2=", vm.toString(productId2), "\n",
            "Product3=", vm.toString(productId3)
        ));
        
        vm.writeFile("test_data_local.txt", testData);
        console.log("Test data saved to test_data_local.txt");
    }
}
