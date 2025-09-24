// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IInvoice
 * @dev Interface for Invoice contract
 * @notice This interface defines invoice management functionality for e-commerce
 */
interface IInvoice {
    /**
     * @dev Invoice item structure
     */
    struct InvoiceItem {
        uint256 productId;
        uint256 quantity;
        uint256 unitPrice;
        uint256 totalPrice;
    }

    /**
     * @dev Invoice data structure
     */
    struct InvoiceData {
        uint256 id;
        uint256 companyId;
        uint256 number;
        uint256 date;
        address clientAddress;
        uint256 totalAmount;
        bool isPaid;
        uint256 createdAt;
        uint256 updatedAt;
    }

    /**
     * @dev Invoice filter structure for queries
     */
    struct InvoiceFilter {
        uint256 companyId;
        address clientAddress;
        bool isPaid;
        uint256 fromDate;
        uint256 toDate;
        uint256 minAmount;
        uint256 maxAmount;
    }

    /**
     * @dev Invoice statistics structure
     */
    struct InvoiceStats {
        uint256 totalInvoices;
        uint256 paidInvoices;
        uint256 unpaidInvoices;
        uint256 totalAmount;
        uint256 paidAmount;
        uint256 unpaidAmount;
    }

    /**
     * @dev Emitted when an invoice is created
     * @param invoiceId Unique identifier for the invoice
     * @param companyId ID of the company
     * @param number Invoice number
     * @param clientAddress Address of the client
     * @param totalAmount Total amount of the invoice
     */
    event InvoiceCreated(uint256 indexed invoiceId, uint256 indexed companyId, uint256 number, address indexed clientAddress, uint256 totalAmount);

    /**
     * @dev Emitted when an invoice is updated
     * @param invoiceId Unique identifier for the invoice
     * @param totalAmount New total amount
     */
    event InvoiceUpdated(uint256 indexed invoiceId, uint256 totalAmount);

    /**
     * @dev Emitted when an invoice is marked as paid
     * @param invoiceId Unique identifier for the invoice
     */
    event InvoicePaid(uint256 indexed invoiceId);

    /**
     * @dev Create a new invoice
     * @param companyId ID of the company creating the invoice
     * @param number Invoice number
     * @param clientAddress Address of the client
     * @param totalAmount Total amount of the invoice in wei
     * @return invoiceId Unique identifier for the created invoice
     */
    function createInvoice(
        uint256 companyId,
        uint256 number,
        address clientAddress,
        uint256 totalAmount
    ) external returns (uint256 invoiceId);

    /**
     * @dev Create a new invoice with products and handle stock/token updates
     * @param companyId ID of the company creating the invoice
     * @param number Invoice number
     * @param clientAddress Address of the client
     * @param items Array of invoice items (products and quantities)
     * @param useTokens Whether to deduct tokens from client's balance
     * @return invoiceId Unique identifier for the created invoice
     */
    function createInvoiceWithProducts(
        uint256 companyId,
        uint256 number,
        address clientAddress,
        InvoiceItem[] memory items,
        bool useTokens
    ) external returns (uint256 invoiceId);

    /**
     * @dev Create a new invoice for client purchase (anyone can call this)
     * @param companyId ID of the company
     * @param number Invoice number
     * @param clientAddress Address of the client (must be msg.sender)
     * @param items Array of invoice items (products and quantities)
     * @param useTokens Whether to deduct tokens from client's balance
     * @return invoiceId Unique identifier for the created invoice
     */
    function createInvoiceForPurchase(
        uint256 companyId,
        uint256 number,
        address clientAddress,
        InvoiceItem[] memory items,
        bool useTokens
    ) external returns (uint256 invoiceId);

    /**
     * @dev Get invoice items
     * @param invoiceId Unique identifier for the invoice
     * @return items Array of invoice items
     */
    function getInvoiceItems(uint256 invoiceId) external view returns (InvoiceItem[] memory items);

    /**
     * @dev Set products contract address (only owner)
     * @param _productsContract Address of the Products contract
     */
    function setProductsContract(address _productsContract) external;

    /**
     * @dev Set token contract address (only owner)
     * @param _tokenContract Address of the ITCToken20 contract
     */
    function setTokenContract(address _tokenContract) external;

    /**
     * @dev Update invoice information
     * @param invoiceId Unique identifier for the invoice
     * @param totalAmount New total amount of the invoice
     */
    function updateInvoice(uint256 invoiceId, uint256 totalAmount) external;

    /**
     * @dev Mark invoice as paid
     * @param invoiceId Unique identifier for the invoice
     */
    function markInvoiceAsPaid(uint256 invoiceId) external;

    /**
     * @dev Get invoice information
     * @param invoiceId Unique identifier for the invoice
     * @return invoice Invoice data structure
     */
    function getInvoice(uint256 invoiceId) external view returns (InvoiceData memory invoice);

    /**
     * @dev Get all invoices
     * @return invoicesArray Array of all invoices
     */
    function getAllInvoices() external view returns (InvoiceData[] memory invoicesArray);

    /**
     * @dev Get invoices by company
     * @param companyId ID of the company
     * @return invoicesArray Array of invoices for the company
     */
    function getInvoicesByCompany(uint256 companyId) external view returns (InvoiceData[] memory invoicesArray);

    /**
     * @dev Get invoices by client
     * @param clientAddress Address of the client
     * @return invoicesArray Array of invoices for the client
     */
    function getInvoicesByClient(address clientAddress) external view returns (InvoiceData[] memory invoicesArray);

    /**
     * @dev Get invoices with filters
     * @param filter Filter structure for invoice queries
     * @return invoicesArray Array of filtered invoices
     */
    function getInvoicesWithFilter(InvoiceFilter memory filter) external view returns (InvoiceData[] memory invoicesArray);

    /**
     * @dev Get invoice statistics for a company
     * @param companyId ID of the company
     * @return stats Invoice statistics
     */
    function getInvoiceStatsByCompany(uint256 companyId) external view returns (InvoiceStats memory stats);

    /**
     * @dev Get invoice statistics for a client
     * @param clientAddress Address of the client
     * @return stats Invoice statistics
     */
    function getInvoiceStatsByClient(address clientAddress) external view returns (InvoiceStats memory stats);

    /**
     * @dev Check if an invoice exists
     * @param invoiceId Unique identifier for the invoice
     * @return exists True if invoice exists, false otherwise
     */
    function invoiceExists(uint256 invoiceId) external view returns (bool exists);

    /**
     * @dev Get total number of invoices
     * @return count Total number of invoices
     */
    function getInvoiceCount() external view returns (uint256 count);

    /**
     * @dev Get all invoice IDs
     * @return invoiceIds Array of all invoice IDs
     */
    function getAllInvoiceIds() external view returns (uint256[] memory invoiceIds);

    /**
     * @dev Get invoice IDs by company
     * @param companyId ID of the company
     * @return invoiceIds Array of invoice IDs for the company
     */
    function getInvoiceIdsByCompany(uint256 companyId) external view returns (uint256[] memory invoiceIds);

    /**
     * @dev Get invoice IDs by client
     * @param clientAddress Address of the client
     * @return invoiceIds Array of invoice IDs for the client
     */
    function getInvoiceIdsByClient(address clientAddress) external view returns (uint256[] memory invoiceIds);
}
