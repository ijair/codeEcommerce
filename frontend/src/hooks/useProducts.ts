import { useState, useEffect, useCallback } from 'react';
import { productsService, type ProductData, type ProductFilters } from '../services/productsService';
import { useWallet } from './useWallet';
import { useContracts } from './useContracts';

export const useProducts = () => {
  const { isConnected } = useWallet();
  const { isInitialized } = useContracts();
  
  const [products, setProducts] = useState<ProductData[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ProductData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  // Load products when wallet connects and contracts are initialized
  useEffect(() => {
    if (isConnected && isInitialized) {
      loadAllProducts();
    }
  }, [isConnected, isInitialized]);

  const loadAllProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const [allProducts, productCount] = await Promise.all([
        productsService.getAllProducts(),
        productsService.getProductCount(),
      ]);
      
      
      setProducts(allProducts);
      setFilteredProducts(allProducts);
      setTotalCount(productCount);
    } catch (err: any) {
      console.error('Error loading products:', err);
      setError(err.message || 'Failed to load products');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadActiveProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const activeProducts = await productsService.getActiveProducts();
      setProducts(activeProducts);
      setFilteredProducts(activeProducts);
    } catch (err: any) {
      console.error('Error loading active products:', err);
      setError(err.message || 'Failed to load active products');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const searchProducts = useCallback(async (query: string) => {
    if (!query.trim()) {
      setFilteredProducts(products);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const searchResults = await productsService.searchProducts(query);
      setFilteredProducts(searchResults);
    } catch (err: any) {
      console.error('Error searching products:', err);
      setError(err.message || 'Failed to search products');
    } finally {
      setIsLoading(false);
    }
  }, [products]);

  const filterByPriceRange = useCallback(async (minPrice: string, maxPrice: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const priceFiltered = await productsService.getProductsByPriceRange(minPrice, maxPrice);
      setFilteredProducts(priceFiltered);
    } catch (err: any) {
      console.error('Error filtering by price range:', err);
      setError(err.message || 'Failed to filter by price range');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const filterByCompany = useCallback(async (companyId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const companyProducts = await productsService.getProductsByCompany(companyId);
      setFilteredProducts(companyProducts);
    } catch (err: any) {
      console.error('Error filtering by company:', err);
      setError(err.message || 'Failed to filter by company');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const applyFilters = useCallback(async (filters: ProductFilters) => {
    setIsLoading(true);
    setError(null);
    
    try {
      let results = products;

      // Apply company filter
      if (filters.companyId) {
        results = await productsService.getProductsByCompany(filters.companyId);
      }

      // Apply price range filter
      if (filters.minPrice && filters.maxPrice) {
        results = await productsService.getProductsByPriceRange(filters.minPrice, filters.maxPrice);
      }

      // Apply search query
      if (filters.searchQuery) {
        results = await productsService.searchProducts(filters.searchQuery);
      }

      // Apply active only filter (client-side)
      if (filters.activeOnly) {
        results = results.filter(product => product.isActive);
      }

      setFilteredProducts(results);
    } catch (err: any) {
      console.error('Error applying filters:', err);
      setError(err.message || 'Failed to apply filters');
    } finally {
      setIsLoading(false);
    }
  }, [products]);

  const clearFilters = useCallback(() => {
    setFilteredProducts(products);
  }, [products]);

  const refreshProducts = useCallback(() => {
    loadAllProducts();
  }, [loadAllProducts]);

  return {
    products: filteredProducts,
    allProducts: products,
    isLoading,
    error,
    totalCount,
    loadAllProducts,
    loadActiveProducts,
    searchProducts,
    filterByPriceRange,
    filterByCompany,
    applyFilters,
    clearFilters,
    refreshProducts,
  };
};
