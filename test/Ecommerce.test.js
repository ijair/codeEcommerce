const { expect } = require("chai");
const { ethers, console } = require("hardhat");

describe("Ecommerce Platform", function () {
  let itcToken, companyContract, productContract, invoiceContract, clientContract, ecommerce;
  let owner, company, client, treasury;
  
  const COMPANY_NAME = "Test Company";
  const PRODUCT_NAME = "Test Product";
  const PRODUCT_IMAGE = "https://example.com/image.jpg";
  let PRODUCT_PRICE; // Will be set in beforeEach
  const PRODUCT_STOCK = 100;

  beforeEach(async function () {
    [owner, company, client, treasury] = await ethers.getSigners();
    
    // Set PRODUCT_PRICE after ethers is available
    PRODUCT_PRICE = ethers.parseEther("10"); // 10 ECO tokens

    // Deploy ITCToken
    const ITCToken = await ethers.getContractFactory("ITCToken");
    itcToken = await ITCToken.deploy();
    await itcToken.waitForDeployment();

    // Deploy Company contract
    const Company = await ethers.getContractFactory("Company");
    companyContract = await Company.deploy();
    await companyContract.waitForDeployment();

    // Deploy Product contract
    const Product = await ethers.getContractFactory("Product");
    productContract = await Product.deploy();
    await productContract.waitForDeployment();

    // Deploy Invoice contract
    const Invoice = await ethers.getContractFactory("Invoice");
    invoiceContract = await Invoice.deploy();
    await invoiceContract.waitForDeployment();

    // Deploy Client contract
    const Client = await ethers.getContractFactory("Client");
    clientContract = await Client.deploy();
    await clientContract.waitForDeployment();


    // Deploy main Ecommerce contract
    const Ecommerce = await ethers.getContractFactory("Ecommerce");
    ecommerce = await Ecommerce.deploy(
      await itcToken.getAddress(),
      await companyContract.getAddress(),
      await productContract.getAddress(),
      await invoiceContract.getAddress(),
      await clientContract.getAddress(),
      treasury.address
    );
    await ecommerce.waitForDeployment();

    // Authorize Ecommerce contract in all other contracts
    const ecommerceAddress = await ecommerce.getAddress();
    await companyContract.authorizeContract(ecommerceAddress);
    await productContract.authorizeContract(ecommerceAddress);
    await invoiceContract.authorizeContract(ecommerceAddress);
    await clientContract.authorizeContract(ecommerceAddress);
  });

  describe("Deployment", function () {
    it("Should deploy all contracts successfully", async function () {
      expect(await itcToken.getAddress()).to.not.equal(ethers.ZeroAddress);
      expect(await companyContract.getAddress()).to.not.equal(ethers.ZeroAddress);
      expect(await productContract.getAddress()).to.not.equal(ethers.ZeroAddress);
      expect(await invoiceContract.getAddress()).to.not.equal(ethers.ZeroAddress);
      expect(await clientContract.getAddress()).to.not.equal(ethers.ZeroAddress);
      expect(await ecommerce.getAddress()).to.not.equal(ethers.ZeroAddress);
    });

    it("Should set the correct owner", async function () {
      expect(await itcToken.owner()).to.equal(owner.address);
      expect(await companyContract.owner()).to.equal(owner.address);
      expect(await productContract.owner()).to.equal(owner.address);
      expect(await invoiceContract.owner()).to.equal(owner.address);
      expect(await clientContract.owner()).to.equal(owner.address);
      expect(await ecommerce.owner()).to.equal(owner.address);
    });
  });

  describe("ITC Token", function () {
    it("Should have correct name and symbol", async function () {
      expect(await itcToken.name()).to.equal("ITC Token");
      expect(await itcToken.symbol()).to.equal("ITC");
      expect(await itcToken.decimals()).to.equal(18);
    });

    it("Should have correct initial supply", async function () {
      const totalSupply = await itcToken.totalSupply();
      const expectedSupply = ethers.parseEther("1000000000"); // 1 billion tokens
      expect(totalSupply).to.equal(expectedSupply);
    });

  });

  describe("Company Management", function () {
    it("Should register a new company", async function () {
      await expect(ecommerce.registerCompany(company.address, COMPANY_NAME))
        .to.emit(ecommerce, "CompanyRegistered")
        .withArgs(company.address, COMPANY_NAME);
      
      const companyData = await companyContract.getCompanyData(company.address);
      expect(companyData.companyAddress).to.equal(company.address);
      expect(companyData.name).to.equal(COMPANY_NAME);
      expect(companyData.isActive).to.be.true;
    });

    it("Should not allow duplicate company registration", async function () {
      await ecommerce.registerCompany(company.address, COMPANY_NAME);
      
      await expect(
        ecommerce.registerCompany(company.address, "Another Name")
      ).to.be.revertedWith("Company: Already registered");
    });
  });

  describe("Product Management", function () {
    beforeEach(async function () {
      await ecommerce.registerCompany(company.address, COMPANY_NAME);
    });

    it("Should create a new product", async function () {
      await expect(
        ecommerce.createProduct(
          company.address,
          PRODUCT_NAME,
          PRODUCT_PRICE,
          PRODUCT_IMAGE,
          PRODUCT_STOCK
        )
      ).to.emit(ecommerce, "ProductCreated")
        .withArgs(company.address, 1, PRODUCT_NAME, PRODUCT_PRICE);
      
      const productData = await productContract.getProductData(company.address, 1);
      expect(productData.name).to.equal(PRODUCT_NAME);
      expect(productData.price).to.equal(PRODUCT_PRICE);
      expect(productData.stock).to.equal(PRODUCT_STOCK);
    });

    it("Should not allow non-empresa to create products", async function () {
      await expect(
        ecommerce.connect(client).createProduct(
          company.address,
          PRODUCT_NAME,
          PRODUCT_PRICE,
          PRODUCT_IMAGE,
          PRODUCT_STOCK
        )
      ).to.be.revertedWith("E-commerce: Only company owner or contract owner can create products");
    });
  });

  describe("Client Management", function () {
    beforeEach(async function () {
      await ecommerce.registerCompany(company.address, COMPANY_NAME);
    });

    it("Should register a new client", async function () {
      await expect(ecommerce.registerClient(company.address, client.address))
        .to.emit(ecommerce, "ClientRegistered")
        .withArgs(company.address, client.address);
      
      const clientData = await clientContract.getClientData(company.address, client.address);
      expect(clientData.companyAddress).to.equal(company.address);
      expect(clientData.clientAddress).to.equal(client.address);
      expect(clientData.isActive).to.be.true;
    });
  });

  describe("Purchase Flow", function () {
    beforeEach(async function () {
      // Setup complete e-commerce flow
      await ecommerce.registerCompany(company.address, COMPANY_NAME);
      await ecommerce.registerClient(company.address, client.address);
      await ecommerce.createProduct(
        company.address,
        PRODUCT_NAME,
        PRODUCT_PRICE,
        PRODUCT_IMAGE,
        PRODUCT_STOCK
      );
      
      // Transfer some ITC tokens from owner to client (since token has max supply already minted)
      await itcToken.transfer(client.address, ethers.parseEther("500")); // 500 ITC tokens
      
      // Approve ecommerce contract to spend client's tokens
      await itcToken.connect(client).approve(await ecommerce.getAddress(), ethers.parseEther("10000"));
    });

    it("Should process a complete purchase", async function () {
      const productIds = [1];
      const quantities = [2];
      const expectedTotal = PRODUCT_PRICE * 2n; // 2 products
      const expectedPlatformFee = expectedTotal / 100n; // 1% platform fee
      const expectedNetAmount = expectedTotal - expectedPlatformFee;
      
      const initialCompanyBalance = await itcToken.balanceOf(company.address);
      const initialTreasuryBalance = await itcToken.balanceOf(treasury.address);
      
      await expect(
        ecommerce.processPurchase(company.address, client.address, productIds, quantities)
      ).to.emit(ecommerce, "PurchaseCompleted")
        .withArgs(company.address, client.address, 1, expectedTotal, expectedPlatformFee);
      
      // Check balances
      expect(await itcToken.balanceOf(company.address)).to.equal(
        initialCompanyBalance + expectedNetAmount
      );
      expect(await itcToken.balanceOf(treasury.address)).to.equal(
        initialTreasuryBalance + expectedPlatformFee
      );
      
      // Check product stock
      const productData = await productContract.getProductData(company.address, 1);
      expect(productData.stock).to.equal(PRODUCT_STOCK - 2);
      expect(productData.totalSold).to.equal(2);
      
      // Check client data
      const clientData = await clientContract.getClientData(company.address, client.address);
      expect(clientData.totalPurchases).to.equal(expectedTotal);
      expect(clientData.totalInvoices).to.equal(1);
    });

    it("Should not allow purchase with insufficient tokens", async function () {
      // Try to buy more than client can afford
      const productIds = [1];
      const quantities = [60]; // 60 products = 600 ITC tokens + 1% fee = 606 ITC tokens, more than client's 500 balance
      
      await expect(
        ecommerce.processPurchase(company.address, client.address, productIds, quantities)
      ).to.be.revertedWith("E-commerce: Insufficient ITC token balance");
    });

    it("Should not allow purchase with insufficient stock", async function () {
      const productIds = [1];
      const quantities = [200]; // More than available stock
      
      await expect(
        ecommerce.processPurchase(company.address, client.address, productIds, quantities)
      ).to.be.revertedWith("E-commerce: Product not available in requested quantity");
    });
  });

  describe("Platform Statistics", function () {
    beforeEach(async function () {
      await ecommerce.registerCompany(company.address, COMPANY_NAME);
      await ecommerce.registerClient(company.address, client.address);
      await ecommerce.createProduct(
        company.address,
        PRODUCT_NAME,
        PRODUCT_PRICE,
        PRODUCT_IMAGE,
        PRODUCT_STOCK
      );
    });

    it("Should return correct platform statistics", async function () {
      const [totalCompanies, totalProducts, totalInvoices, totalClients] = 
        await ecommerce.getPlatformStats();
      
      expect(totalCompanies).to.equal(1);
      expect(totalProducts).to.equal(1);
      expect(totalInvoices).to.equal(0);
      expect(totalClients).to.equal(1);
    });

    it("Should return correct company statistics", async function () {
      const [productCount, invoiceCount, clientCount, totalRevenue] = 
        await ecommerce.getCompanyStats(company.address);
      
      expect(productCount).to.equal(1);
      expect(invoiceCount).to.equal(0);
      expect(clientCount).to.equal(1);
      expect(totalRevenue).to.equal(0);
    });
  });
});
