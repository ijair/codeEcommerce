const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  console.log("🚀 Setting up E-commerce Platform...");
  
  // Load deployment info
  const networkName = (await ethers.provider.getNetwork()).name;
  const deploymentFile = path.join(__dirname, '..', 'deployments', `${networkName}.json`);
  
  if (!fs.existsSync(deploymentFile)) {
    console.error("❌ Deployment file not found. Please run deploy.js first.");
    process.exit(1);
  }
  
  const deploymentInfo = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'));
  console.log("📋 Loaded deployment info for network:", networkName);
  
  // Get contracts
  const [deployer] = await ethers.getSigners();
  console.log("👤 Using account:", deployer.address);
  
  try {
    // Get contract instances
    const ecommerce = await ethers.getContractAt("Ecommerce", deploymentInfo.contracts.Ecommerce);
    const itcToken = await ethers.getContractAt("ITCToken", deploymentInfo.contracts.ITCToken);
    const companyContract = await ethers.getContractAt("Company", deploymentInfo.contracts.Company);
    
    console.log("\n" + "=".repeat(60));
    console.log("SETUP PHASE");
    console.log("=".repeat(60));
    
    // 1. Register sample company
    console.log("\n1️⃣ Registering sample company...");
    const companyName = "Sample Company";
    await ecommerce.registerCompany(deployer.address, companyName);
    console.log(`✅ Registered company: ${companyName} at ${deployer.address}`);
    
    // 2. Create sample product
    console.log("\n2️⃣ Creating sample product...");
    const productName = "Sample Product";
    const productPrice = ethers.parseEther("10");
    const productImage = "https://example.com/sample-product.jpg";
    const productStock = 100;
    
    const productId = await ecommerce.createProduct(
      deployer.address,
      productName,
      productPrice,
      productImage,
      productStock
    );
    console.log(`✅ Created product: ${productName} with ID: ${productId}`);
    
    // 3. Register sample client
    console.log("\n3️⃣ Registering sample client...");
    const accounts = await ethers.getSigners();
    if (accounts.length > 1) {
      await ecommerce.registerClient(deployer.address, accounts[1].address);
      console.log(`✅ Registered client: ${accounts[1].address} for Company: ${deployer.address}`);
    } else {
      console.log("⚠️ Only one account available, skipping client registration");
    }
    
    // 4. Display final statistics
    console.log("\n" + "=".repeat(60));
    console.log("FINAL STATISTICS");
    console.log("=".repeat(60));
    
    console.log("\n📊 Platform Statistics:");
    const [totalCompanies, totalProducts, totalInvoices, totalClients] = 
      await ecommerce.getPlatformStats();
    
    console.log(`📈 Total Companies: ${totalCompanies}`);
    console.log(`📈 Total Products: ${totalProducts}`);
    console.log(`📈 Total Invoices: ${totalInvoices}`);
    console.log(`📈 Total Clients: ${totalClients}`);
    
    console.log("\n📊 Company Statistics:");
    const [productCount, invoiceCount, clientCount, totalRevenue] = 
      await ecommerce.getCompanyStats(deployer.address);
    
    console.log(`📈 Product Count: ${productCount}`);
    console.log(`📈 Invoice Count: ${invoiceCount}`);
    console.log(`📈 Client Count: ${clientCount}`);
    console.log(`📈 Total Revenue: ${ethers.formatEther(totalRevenue)} ECO tokens`);
    
    console.log("\n🎉 Setup completed successfully! 🎉");
    
  } catch (error) {
    console.error("💥 Setup failed:", error);
    console.error("💥 Error details:", error.message);
    if (error.reason) {
      console.error("💥 Error reason:", error.reason);
    }
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });