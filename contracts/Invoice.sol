// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./AuthorizedContract.sol";

/**
 * @title Invoice
 * @dev Contract representing an invoice in the e-commerce platform
 * Each factura is defined by company address, number, date, client address, and total amount
 */
contract Invoice is AuthorizedContract, ReentrancyGuard {
    constructor() Ownable(msg.sender) {}
    // Struct to represent an invoice item
    struct InvoiceItem {
        uint256 productId;
        string productName;
        uint256 quantity;
        uint256 unitPrice;
        uint256 totalPrice;
    }
    
    // Struct to represent an invoice
    struct InvoiceData {
        address companyAddress;
        uint256 number;
        uint256 date;
        address clientAddress;
        uint256 incomeTotal;
        InvoiceItem[] items;
        bool isPaid;
        bool isCancelled;
        uint256 paymentDate;
        string paymentMethod;
    }
    
    // Mapping from company address to mapping of invoice number to invoice data
    mapping(address => mapping(uint256 => InvoiceData)) public invoices;
    
    // Mapping from company address to array of invoice numbers
    mapping(address => uint256[]) public companyInvoices;
    
    // Mapping from client address to array of invoice numbers (across all companies)
    mapping(address => uint256[]) public clientInvoices;
    
    // Global invoice counter for unique numbers across all companies
    uint256 public globalInvoiceCounter;
    
    // Mapping to check if an invoice exists
    mapping(address => mapping(uint256 => bool)) public invoiceExists;
    
    // Events
    event InvoiceCreated(
        address indexed companyAddress,
        uint256 indexed number,
        address indexed clientAddress,
        uint256 incomeTotal,
        uint256 fecha
    );
    event InvoicePaid(
        address indexed companyAddress,
        uint256 indexed number,
        address indexed clientAddress,
        uint256 incomeTotal,
        uint256 paymentDate
    );
    event InvoiceCancelled(
        address indexed companyAddress,
        uint256 indexed number,
        address indexed clientAddress
    );
    event InvoiceItemAdded(
        address indexed companyAddress,
        uint256 indexed number,
        uint256 productId,
        uint256 quantity,
        uint256 unitPrice,
        uint256 totalPrice
    );
    
    // Modifiers
    modifier onlyValidCompany(address companyAddress) {
        require(companyAddress != address(0), "Invoice: Invalid company address");
        _;
    }
    
    modifier onlyValidClient(address clientAddress) {
        require(clientAddress != address(0), "Invoice: Invalid client address");
        _;
    }
    
    modifier onlyExistingInvoice(address companyAddress, uint256 number) {
        require(invoiceExists[companyAddress][number], "Invoice: Invoice does not exist");
        _;
    }
    
    modifier onlyUnpaidInvoice(address companyAddress, uint256 number) {
        require(
            !invoices[companyAddress][number].isPaid,
            "Invoice: Invoice is already paid"
        );
        require(
            !invoices[companyAddress][number].isCancelled,
            "Invoice: Invoice is cancelled"
        );
        _;
    }
    
    
    /**
     * @dev Create a new invoice
     * @param companyAddress Address of the company
     * @param clientAddress Address of the client
     * @param items Array of invoice items
     * @return invoiceNumber The number of the created invoice
     */
    function createInvoice(
        address companyAddress,
        address clientAddress,
        InvoiceItem[] memory items
    ) 
        external 
        onlyValidCompany(companyAddress) 
        onlyValidClient(clientAddress) 
        onlyAuthorized
        nonReentrant 
        returns (uint256 invoiceNumber) 
    {
        require(items.length > 0, "Invoice: Invoice must have at least one item");
        
        // Generate unique invoice number
        invoiceNumber = ++globalInvoiceCounter;
        
        // Calculate total amount
        uint256 totalAmount = 0;
        for (uint256 i = 0; i < items.length; i++) {
            require(items[i].quantity > 0, "Invoice: Item quantity must be greater than 0");
            require(items[i].unitPrice > 0, "Invoice: Item unit price must be greater than 0");
            require(
                items[i].totalPrice == items[i].quantity * items[i].unitPrice,
                "Invoice: Item total price calculation is incorrect"
            );
            totalAmount += items[i].totalPrice;
        }
        
        require(totalAmount > 0, "Invoice: Total amount must be greater than 0");
        
        // Create invoice data
        InvoiceData storage newInvoice = invoices[companyAddress][invoiceNumber];
        newInvoice.companyAddress = companyAddress;
        newInvoice.number = invoiceNumber;
        newInvoice.date = block.timestamp;
        newInvoice.clientAddress = clientAddress;
        newInvoice.incomeTotal = totalAmount;
        newInvoice.isPaid = false;
        newInvoice.isCancelled = false;
        newInvoice.paymentDate = 0;
        newInvoice.paymentMethod = "";
        
        // Add items to invoice
        for (uint256 i = 0; i < items.length; i++) {
            newInvoice.items.push(items[i]);
            emit InvoiceItemAdded(
                companyAddress,
                invoiceNumber,
                items[i].productId,
                items[i].quantity,
                items[i].unitPrice,
                items[i].totalPrice
            );
        }
        
        // Update mappings
        companyInvoices[companyAddress].push(invoiceNumber);
        clientInvoices[clientAddress].push(invoiceNumber);
        invoiceExists[companyAddress][invoiceNumber] = true;
        
        emit InvoiceCreated(companyAddress, invoiceNumber, clientAddress, totalAmount, block.timestamp);
        return invoiceNumber;
    }
    
    /**
     * @dev Mark an invoice as paid
     * @param companyAddress Address of the company
     * @param number Invoice number
     * @param paymentMethod Payment method used
     */
    function markAsPaid(
        address companyAddress,
        uint256 number,
        string memory paymentMethod
    ) 
        external 
        onlyValidCompany(companyAddress) 
        onlyExistingInvoice(companyAddress, number) 
        onlyUnpaidInvoice(companyAddress, number) 
    {
        require(bytes(paymentMethod).length > 0, "Invoice: Payment method cannot be empty");
        
        InvoiceData storage invoice = invoices[companyAddress][number];
        invoice.isPaid = true;
        invoice.paymentDate = block.timestamp;
        invoice.paymentMethod = paymentMethod;
        
        emit InvoicePaid(companyAddress, number, invoice.clientAddress, invoice.incomeTotal, block.timestamp);
    }
    
    /**
     * @dev Cancel an invoice
     * @param companyAddress Address of the company
     * @param number Invoice number
     */
    function cancelInvoice(
        address companyAddress,
        uint256 number
    ) 
        external 
        onlyValidCompany(companyAddress) 
        onlyExistingInvoice(companyAddress, number) 
        onlyUnpaidInvoice(companyAddress, number) 
    {
        InvoiceData storage invoice = invoices[companyAddress][number];
        invoice.isCancelled = true;
        
        emit InvoiceCancelled(companyAddress, number, invoice.clientAddress);
    }
    
    /**
     * @dev Get invoice data
     * @param companyAddress Address of the company
     * @param number Invoice number
     * @return InvoiceData struct containing all invoice information
     */
    function getInvoiceData(
        address companyAddress,
        uint256 number
    ) 
        external 
        view 
        onlyValidCompany(companyAddress) 
        onlyExistingInvoice(companyAddress, number) 
        returns (InvoiceData memory) 
    {
        return invoices[companyAddress][number];
    }
    
    /**
     * @dev Get invoice items
     * @param companyAddress Address of the company
     * @param number Invoice number
     * @return Array of invoice items
     */
    function getInvoiceItems(
        address companyAddress,
        uint256 number
    ) 
        external 
        view 
        onlyValidCompany(companyAddress) 
        onlyExistingInvoice(companyAddress, number) 
        returns (InvoiceItem[] memory) 
    {
        return invoices[companyAddress][number].items;
    }
    
    /**
     * @dev Get all invoice numbers for an company
     * @param companyAddress Address of the company
     * @return Array of invoice numbers
     */
    function getCompanyInvoices(address companyAddress) 
        external 
        view 
        onlyValidCompany(companyAddress) 
        returns (uint256[] memory) 
    {
        return companyInvoices[companyAddress];
    }
    
    /**
     * @dev Get all invoice numbers for a client
     * @param clientAddress Address of the client
     * @return Array of invoice numbers
     */
    function getClientInvoices(address clientAddress) 
        external 
        view 
        onlyValidClient(clientAddress) 
        returns (uint256[] memory) 
    {
        return clientInvoices[clientAddress];
    }
    
    /**
     * @dev Get invoice count for an company
     * @param companyAddress Address of the company
     * @return Number of invoices
     */
    function getInvoiceCount(address companyAddress) 
        external 
        view 
        onlyValidCompany(companyAddress) 
        returns (uint256) 
    {
        return companyInvoices[companyAddress].length;
    }
    
    /**
     * @dev Get total revenue for an company
     * @param companyAddress Address of the company
     * @return Total revenue from paid invoices
     */
    function getTotalRevenue(address companyAddress) 
        external 
        view 
        onlyValidCompany(companyAddress) 
        returns (uint256) 
    {
        uint256 total = 0;
        uint256[] memory invoiceNumbers = companyInvoices[companyAddress];
        
        for (uint256 i = 0; i < invoiceNumbers.length; i++) {
            if (invoices[companyAddress][invoiceNumbers[i]].isPaid) {
                total += invoices[companyAddress][invoiceNumbers[i]].incomeTotal;
            }
        }
        
        return total;
    }
    
    /**
     * @dev Check if an invoice is paid
     * @param companyAddress Address of the company
     * @param number Invoice number
     * @return True if invoice is paid, false otherwise
     */
    function isInvoicePaid(
        address companyAddress,
        uint256 number
    ) 
        external 
        view 
        onlyValidCompany(companyAddress) 
        onlyExistingInvoice(companyAddress, number) 
        returns (bool) 
    {
        return invoices[companyAddress][number].isPaid;
    }
    
    /**
     * @dev Get total number of invoices across all companies
     * @return Total count of invoices
     */
    function getTotalInvoices() external view returns (uint256) {
        return globalInvoiceCounter;
    }
    
}
