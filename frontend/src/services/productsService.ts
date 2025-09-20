import { ethers } from 'ethers';
import { contractService } from './contractService';

export interface ProductData {
  id: string;
  companyId: string;
  name: string;
  price: string; // in wei
  priceFormatted: string; // in ETH
  image: string; // IPFS hash
  stock: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface ProductFilters {
  companyId?: string;
  minPrice?: string;
  maxPrice?: string;
  searchQuery?: string;
  activeOnly?: boolean;
}

export interface ProductCreateData {
  companyId: string;
  name: string;
  price: string; // in ETH (will be converted to wei)
  image: string; // IPFS hash
  stock: string;
}

export interface ProductUpdateData {
  productId: string;
  name?: string;
  price?: string; // in ETH
  image?: string;
}

export interface ProductResult {
  success: boolean;
  message?: string;
  error?: string;
  productId?: string;
  transactionHash?: string;
}

class ProductsService {
  /**
   * Get all products from the contract
   */
  async getAllProducts(): Promise<ProductData[]> {
    try {
      const productsContract = contractService.getContract('products');
      
      if (!productsContract) {
        throw new Error('Products contract not available');
      }

      const products = await productsContract.getAllProducts();
      
      const formatted = this.formatProductsArray(products);
      
      return formatted;
    } catch (error: any) {
      console.error('Error getting all products:', error);
      return [];
    }
  }

  /**
   * Get products by company
   */
  async getProductsByCompany(companyId: string): Promise<ProductData[]> {
    try {
      const productsContract = contractService.getContract('products');
      if (!productsContract) {
        throw new Error('Products contract not available');
      }

      const products = await productsContract.getProductsByCompany(companyId);
      return this.formatProductsArray(products);
    } catch (error: any) {
      console.error('Error getting products by company:', error);
      return [];
    }
  }

  /**
   * Get only active products
   */
  async getActiveProducts(): Promise<ProductData[]> {
    try {
      const productsContract = contractService.getContract('products');
      if (!productsContract) {
        throw new Error('Products contract not available');
      }

      const products = await productsContract.getActiveProducts();
      return this.formatProductsArray(products);
    } catch (error: any) {
      console.error('Error getting active products:', error);
      return [];
    }
  }

  /**
   * Search products by query
   */
  async searchProducts(query: string): Promise<ProductData[]> {
    try {
      const productsContract = contractService.getContract('products');
      if (!productsContract) {
        throw new Error('Products contract not available');
      }

      const products = await productsContract.searchProducts(query);
      return this.formatProductsArray(products);
    } catch (error: any) {
      console.error('Error searching products:', error);
      return [];
    }
  }

  /**
   * Get products by price range
   */
  async getProductsByPriceRange(minPrice: string, maxPrice: string): Promise<ProductData[]> {
    try {
      const productsContract = contractService.getContract('products');
      if (!productsContract) {
        throw new Error('Products contract not available');
      }

      const minPriceWei = ethers.parseEther(minPrice);
      const maxPriceWei = ethers.parseEther(maxPrice);
      
      const products = await productsContract.getProductsByPriceRange(minPriceWei, maxPriceWei);
      return this.formatProductsArray(products);
    } catch (error: any) {
      console.error('Error getting products by price range:', error);
      return [];
    }
  }

  /**
   * Get products with filter
   */
  async getProductsWithFilter(filter: string): Promise<ProductData[]> {
    try {
      const productsContract = contractService.getContract('products');
      if (!productsContract) {
        throw new Error('Products contract not available');
      }

      const products = await productsContract.getProductsWithFilter(filter);
      return this.formatProductsArray(products);
    } catch (error: any) {
      console.error('Error getting products with filter:', error);
      return [];
    }
  }

  /**
   * Get single product by ID
   */
  async getProduct(productId: string): Promise<ProductData | null> {
    try {
      const productsContract = contractService.getContract('products');
      if (!productsContract) {
        throw new Error('Products contract not available');
      }

      const product = await productsContract.getProduct(productId);
      return this.formatProduct(product);
    } catch (error: any) {
      console.error('Error getting product:', error);
      return null;
    }
  }

  /**
   * Check if product has stock available
   */
  async hasStockAvailable(productId: string, quantity: string): Promise<boolean> {
    try {
      const productsContract = contractService.getContract('products');
      if (!productsContract) {
        throw new Error('Products contract not available');
      }

      return await productsContract.hasStockAvailable(productId, quantity);
    } catch (error: any) {
      console.error('Error checking stock availability:', error);
      return false;
    }
  }

  /**
   * Get product stock
   */
  async getProductStock(productId: string): Promise<string> {
    try {
      const productsContract = contractService.getContract('products');
      if (!productsContract) {
        throw new Error('Products contract not available');
      }

      const stock = await productsContract.getProductStock(productId);
      return stock.toString();
    } catch (error: any) {
      console.error('Error getting product stock:', error);
      return '0';
    }
  }

  /**
   * Create a new product (company owner only)
   */
  async createProduct(productData: ProductCreateData): Promise<ProductResult> {
    try {
      const productsContract = contractService.getContract('products');
      if (!productsContract) {
        throw new Error('Products contract not available');
      }

      const priceWei = ethers.parseEther(productData.price);
      const companyIdNum = parseInt(productData.companyId);
      const stockNum = parseInt(productData.stock);
      
      console.log('Creating product with params:', {
        companyId: companyIdNum,
        name: productData.name,
        price: productData.price,
        priceWei: priceWei.toString(),
        image: productData.image,
        stock: stockNum,
      });
      
      const tx = await productsContract.createProduct(
        companyIdNum,
        productData.name,
        priceWei,
        productData.image || '', // Ensure empty string if no image
        stockNum,
        {
          gasLimit: 500000,
        }
      );

      const receipt = await tx.wait();
      
      // Extract product ID from event logs if needed
      const productId = await this.getLastProductId();

      return {
        success: true,
        message: 'Product created successfully!',
        productId: productId,
        transactionHash: receipt.transactionHash,
      };
    } catch (error: any) {
      console.error('Error creating product:', error);
      return {
        success: false,
        message: 'Failed to create product',
        error: error.message || 'Unknown error',
      };
    }
  }

  /**
   * Update product (company owner only)
   */
  async updateProduct(updateData: ProductUpdateData): Promise<ProductResult> {
    try {
      const productsContract = contractService.getContract('products');
      if (!productsContract) {
        throw new Error('Products contract not available');
      }

      const priceWei = updateData.price ? ethers.parseEther(updateData.price) : undefined;
      
      const tx = await productsContract.updateProduct(
        updateData.productId,
        updateData.name || '',
        priceWei || 0,
        updateData.image || '',
        {
          gasLimit: 300000,
        }
      );

      const receipt = await tx.wait();

      return {
        success: true,
        message: 'Product updated successfully!',
        transactionHash: receipt.transactionHash,
      };
    } catch (error: any) {
      console.error('Error updating product:', error);
      return {
        success: false,
        message: 'Failed to update product',
        error: error.message || 'Unknown error',
      };
    }
  }

  /**
   * Deactivate product (company owner only)
   */
  async deactivateProduct(productId: string): Promise<ProductResult> {
    try {
      const productsContract = contractService.getContract('products');
      if (!productsContract) {
        throw new Error('Products contract not available');
      }

      const tx = await productsContract.deactivateProduct(productId, {
        gasLimit: 200000,
      });

      const receipt = await tx.wait();

      return {
        success: true,
        message: 'Product deactivated successfully!',
        transactionHash: receipt.transactionHash,
      };
    } catch (error: any) {
      console.error('Error deactivating product:', error);
      return {
        success: false,
        message: 'Failed to deactivate product',
        error: error.message || 'Unknown error',
      };
    }
  }

  /**
   * Reactivate product (company owner only)
   */
  async reactivateProduct(productId: string): Promise<ProductResult> {
    try {
      const productsContract = contractService.getContract('products');
      if (!productsContract) {
        throw new Error('Products contract not available');
      }

      const tx = await productsContract.reactivateProduct(productId, {
        gasLimit: 200000,
      });

      const receipt = await tx.wait();

      return {
        success: true,
        message: 'Product reactivated successfully!',
        transactionHash: receipt.transactionHash,
      };
    } catch (error: any) {
      console.error('Error reactivating product:', error);
      return {
        success: false,
        message: 'Failed to reactivate product',
        error: error.message || 'Unknown error',
      };
    }
  }

  // Helper methods
  private formatProductsArray(products: any[]): ProductData[] {
    return products.map(product => this.formatProduct(product));
  }

  private formatProduct(product: any): ProductData {
    return {
      id: product.id.toString(),
      companyId: product.companyId.toString(),
      name: product.name,
      price: product.price.toString(),
      priceFormatted: ethers.formatEther(product.price), // This is actually in ITC tokens
      image: product.image,
      stock: product.stock.toString(),
      createdAt: product.createdAt.toString(),
      updatedAt: product.updatedAt.toString(),
      isActive: product.isActive,
    };
  }

  private async getLastProductId(): Promise<string> {
    try {
      const productsContract = contractService.getContract('products');
      if (!productsContract) {
        return '0';
      }
      
      const count = await productsContract.getProductCount();
      return count.toString();
    } catch (error) {
      console.error('Error getting last product ID:', error);
      return '0';
    }
  }

  /**
   * Generate IPFS URL from hash (for displaying images)
   */
  getIPFSUrl(hash: string): string {
    if (!hash || hash.startsWith('http')) {
      return hash; // Return as-is if it's already a URL or empty
    }
    return `https://gateway.pinata.cloud/ipfs/${hash}`;
  }

  /**
   * Format price for display (in ITC tokens)
   */
  formatPrice(priceWei: string): string {
    try {
      return `${ethers.formatEther(priceWei)} ITC`;
    } catch (error) {
      return '0 ITC';
    }
  }

  /**
   * Get product count
   */
  async getProductCount(): Promise<number> {
    try {
      const productsContract = contractService.getContract('products');
      if (!productsContract) {
        return 0;
      }

      const count = await productsContract.getProductCount();
      return parseInt(count.toString());
    } catch (error: any) {
      console.error('Error getting product count:', error);
      return 0;
    }
  }
}

export const productsService = new ProductsService();
