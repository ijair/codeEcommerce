const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Starting deployment and setup of E-commerce Platform...");
  
  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("👤 Deploying contracts with the account:", deployer.address);
  console.log("💰 Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  // Configuration
  const TREASURY_ADDRESS = deployer.address;

  try {
    // ===== DEPLOYMENT PHASE =====
    console.log("\n" + "=".repeat(60));
    console.log("DEPLOYMENT PHASE");
    console.log("=".repeat(60));

    // 1. Deploy ITCToken
    console.log("\n1️⃣ Deploying ITCToken...");
    const ITCToken = await ethers.getContractFactory("ITCToken");
    const itcToken = await ITCToken.deploy();
    await itcToken.waitForDeployment();
    const itcTokenAddress = await itcToken.getAddress();
    console.log("✅ ITCToken deployed to:", itcTokenAddress);

    // 2. Deploy Company contract
    console.log("\n2️⃣ Deploying Company contract...");
    const Company = await ethers.getContractFactory("Company");
    const companyContract = await Company.deploy();
    await companyContract.waitForDeployment();
    const companyAddress = await companyContract.getAddress();
    console.log("✅ Company contract deployed to:", companyAddress);

    // 3. Deploy Product contract
    console.log("\n3️⃣ Deploying Product contract...");
    const Product = await ethers.getContractFactory("Product");
    const productContract = await Product.deploy();
    await productContract.waitForDeployment();
    const productAddress = await productContract.getAddress();
    console.log("✅ Product contract deployed to:", productAddress);

    // 4. Deploy Invoice contract
    console.log("\n4️⃣ Deploying Invoice contract...");
    const Invoice = await ethers.getContractFactory("Invoice");
    const invoiceContract = await Invoice.deploy();
    await invoiceContract.waitForDeployment();
    const invoiceAddress = await invoiceContract.getAddress();
    console.log("✅ Invoice contract deployed to:", invoiceAddress);

    // 5. Deploy Client contract
    console.log("\n5️⃣ Deploying Client contract...");
    const Client = await ethers.getContractFactory("Client");
    const clientContract = await Client.deploy();
    await clientContract.waitForDeployment();
    const clientAddress = await clientContract.getAddress();
    console.log("✅ Client contract deployed to:", clientAddress);

    // 6. Deploy main Ecommerce contract
    console.log("\n6️⃣ Deploying main Ecommerce contract...");
    const Ecommerce = await ethers.getContractFactory("Ecommerce");
    const ecommerce = await Ecommerce.deploy(
      itcTokenAddress,
      companyAddress,
      productAddress,
      invoiceAddress,
      clientAddress,
      TREASURY_ADDRESS
    );
    await ecommerce.waitForDeployment();
    const ecommerceAddress = await ecommerce.getAddress();
    console.log("✅ Ecommerce contract deployed to:", ecommerceAddress);

    // 7. Authorize Ecommerce contract in all other contracts
    console.log("\n7️⃣ Authorizing Ecommerce contract...");
    await companyContract.authorizeContract(ecommerceAddress);
    console.log("✅ Company contract authorized Ecommerce");
    
    await productContract.authorizeContract(ecommerceAddress);
    console.log("✅ Product contract authorized Ecommerce");
    
    await invoiceContract.authorizeContract(ecommerceAddress);
    console.log("✅ Invoice contract authorized Ecommerce");
    
    await clientContract.authorizeContract(ecommerceAddress);
    console.log("✅ Client contract authorized Ecommerce");

    // ===== TESTING PHASE =====
    console.log("\n" + "=".repeat(60));
    console.log("TESTING PHASE");
    console.log("=".repeat(60));

    // Test all contracts
    console.log("\n🧪 Testing all contracts...");
    
    const totalCompanies = await companyContract.getTotalCompanies();
    console.log("✅ Company.getTotalCompanies():", totalCompanies.toString());
    
    const totalProducts = await productContract.getTotalProducts();
    console.log("✅ Product.getTotalProducts():", totalProducts.toString());
    
    const totalInvoices = await invoiceContract.getTotalInvoices();
    console.log("✅ Invoice.getTotalInvoices():", totalInvoices.toString());
    
    const totalClients = await clientContract.getTotalClients();
    console.log("✅ Client.getTotalClients():", totalClients.toString());
    
    const [companies, products, invoices, clients] = await ecommerce.getPlatformStats();
    console.log("✅ Ecommerce.getPlatformStats():");
    console.log("   - Companies:", companies.toString());
    console.log("   - Products:", products.toString());
    console.log("   - Invoices:", invoices.toString());
    console.log("   - Clients:", clients.toString());

    // ===== SETUP PHASE =====
    console.log("\n" + "=".repeat(60));
    console.log("SETUP PHASE");
    console.log("=".repeat(60));

    console.log("\n1️⃣ Registering sample company...");
    const companyName = "Sample Company";
    await ecommerce.registerCompany(deployer.address, companyName);
    console.log(`✅ Registered company: ${companyName} at ${deployer.address}`);
    
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
    
    console.log("\n3️⃣ Registering sample client...");
    const accounts = await ethers.getSigners();
    if (accounts.length > 1) {
      await ecommerce.registerClient(deployer.address, accounts[1].address);
      console.log(`✅ Registered client: ${accounts[1].address} for Company: ${deployer.address}`);
    } else {
      console.log("⚠️ Only one account available, skipping client registration");
    }
    
    // ===== FINAL STATISTICS =====
    console.log("\n" + "=".repeat(60));
    console.log("FINAL STATISTICS");
    console.log("=".repeat(60));
    
    console.log("\n📊 Platform Statistics:");
    const [finalCompanies, finalProducts, finalInvoices, finalClients] = 
      await ecommerce.getPlatformStats();
    
    console.log(`📈 Total Companies: ${finalCompanies}`);
    console.log(`📈 Total Products: ${finalProducts}`);
    console.log(`📈 Total Invoices: ${finalInvoices}`);
    console.log(`📈 Total Clients: ${finalClients}`);
    
    console.log("\n📊 Company Statistics:");
    const [productCount, invoiceCount, clientCount, totalRevenue] = 
      await ecommerce.getCompanyStats(deployer.address);
    
    console.log(`📈 Product Count: ${productCount}`);
    console.log(`📈 Invoice Count: ${invoiceCount}`);
    console.log(`📈 Client Count: ${clientCount}`);
    console.log(`📈 Total Revenue: ${ethers.formatEther(totalRevenue)} ECO tokens`);

    // ===== DEPLOYMENT SUMMARY =====
    console.log("\n" + "=".repeat(60));
    console.log("DEPLOYMENT SUMMARY");
    console.log("=".repeat(60));
    console.log("🌐 Network:", (await ethers.provider.getNetwork()).name);
    console.log("👤 Deployer:", deployer.address);
    console.log("💰 Treasury:", TREASURY_ADDRESS);
    console.log("\n📋 Contract Addresses:");
    console.log("🔹 ITCToken:", itcTokenAddress);
    console.log("🔹 Company:", companyAddress);
    console.log("🔹 Product:", productAddress);
    console.log("🔹 Invoice:", invoiceAddress);
    console.log("🔹 Client:", clientAddress);
    console.log("🔹 Ecommerce:", ecommerceAddress);
    console.log("=".repeat(60));

    console.log("\n🎉 Deployment and setup completed successfully! 🎉");

  } catch (error) {
    console.error("💥 Deployment and setup failed:", error);
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
