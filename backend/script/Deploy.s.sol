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
 * @title Deploy
 * @dev Deployment script for all contracts
 * @notice This script deploys ITCToken20, Company, and Products contracts
 * @author E-commerce Platform Team
 */
contract Deploy is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deploying contracts with account:", deployer);
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
        
        // Verify deployer has access to all data
        console.log("\n=== Deployer Access Verification ===");
        console.log("Deployer address:", deployer);
        console.log("Deployer can access:");
        
        // Test access to all companies
        ICompany.CompanyData[] memory allCompanies = company.getAllCompanies();
        console.log("- Total companies visible:", allCompanies.length);
        
        // Test access to all products  
        IProducts.ProductData[] memory allProducts = products.getAllProducts();
        console.log("- Total products visible:", allProducts.length);
        
        console.log("[OK] Deployer has full read access to all contracts");
        
        vm.stopBroadcast();
        
        // Verify deployments
        console.log("\n=== Deployment Summary ===");
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
        
        vm.writeFile("deployed_addresses.txt", addresses);
        console.log("Contract addresses saved to deployed_addresses.txt");
    }
}
