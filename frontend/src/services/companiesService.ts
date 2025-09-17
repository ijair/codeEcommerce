import { contractService } from './contractService';

export interface CompanyData {
  id: string;
  owner: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface CompanyCreateData {
  name: string;
}

export interface CompanyUpdateData {
  companyId: string;
  name: string;
}

export interface CompanyResult {
  success: boolean;
  message?: string;
  error?: string;
  companyId?: string;
  transactionHash?: string;
}

class CompaniesService {
  /**
   * Get all companies from the contract
   */
  async getAllCompanies(): Promise<CompanyData[]> {
    try {
      const companyContract = contractService.getContract('company');
      
      if (!companyContract) {
        throw new Error('Company contract not available');
      }

      const companies = await companyContract.getAllCompanies();
      
      // The contract returns CompanyData[] without IDs, so we need to add them manually
      const formatted = this.formatCompaniesArrayWithIds(companies);
      
      return formatted;
    } catch (error: any) {
      console.error('Error getting all companies:', error);
      return [];
    }
  }

  /**
   * Get companies by owner
   */
  async getCompaniesByOwner(ownerAddress: string): Promise<CompanyData[]> {
    try {
      const companyContract = contractService.getContract('company');
      if (!companyContract) {
        throw new Error('Company contract not available');
      }

      const companies = await companyContract.getCompaniesByOwner(ownerAddress);
      return this.formatCompaniesArrayWithIds(companies);
    } catch (error: any) {
      console.error('Error getting companies by owner:', error);
      return [];
    }
  }

  /**
   * Get active companies only
   */
  async getActiveCompanies(): Promise<CompanyData[]> {
    try {
      const companyContract = contractService.getContract('company');
      if (!companyContract) {
        throw new Error('Company contract not available');
      }

      const companies = await companyContract.getActiveCompanies();
      return this.formatCompaniesArrayWithIds(companies);
    } catch (error: any) {
      console.error('Error getting active companies:', error);
      return [];
    }
  }

  /**
   * Get single company by ID
   */
  async getCompany(companyId: string): Promise<CompanyData | null> {
    try {
      const companyContract = contractService.getContract('company');
      if (!companyContract) {
        throw new Error('Company contract not available');
      }

      const company = await companyContract.getCompany(companyId);
      return this.formatCompany(company);
    } catch (error: any) {
      console.error('Error getting company:', error);
      return null;
    }
  }

  /**
   * Create a new company
   */
  async createCompany(companyData: CompanyCreateData): Promise<CompanyResult> {
    try {
      const companyContract = contractService.getContract('company');
      if (!companyContract) {
        throw new Error('Company contract not available');
      }

      console.log('Creating company with name:', companyData.name);
      
      const tx = await companyContract.createCompany(companyData.name, {
        gasLimit: 300000,
      });

      console.log('Company creation transaction sent:', tx.hash);
      const receipt = await tx.wait();
      console.log('Company creation confirmed:', receipt.transactionHash);
      
      // Get the company ID from the latest count
      const companyId = await this.getLastCompanyId();

      return {
        success: true,
        message: 'Company created successfully!',
        companyId: companyId,
        transactionHash: receipt.transactionHash,
      };
    } catch (error: any) {
      console.error('Error creating company:', error);
      return {
        success: false,
        message: 'Failed to create company',
        error: error.message || 'Unknown error',
      };
    }
  }

  /**
   * Update company (owner only)
   */
  async updateCompany(updateData: CompanyUpdateData): Promise<CompanyResult> {
    try {
      const companyContract = contractService.getContract('company');
      if (!companyContract) {
        throw new Error('Company contract not available');
      }

      const tx = await companyContract.updateCompany(
        updateData.companyId,
        updateData.name,
        {
          gasLimit: 200000,
        }
      );

      const receipt = await tx.wait();

      return {
        success: true,
        message: 'Company updated successfully!',
        transactionHash: receipt.transactionHash,
      };
    } catch (error: any) {
      console.error('Error updating company:', error);
      return {
        success: false,
        message: 'Failed to update company',
        error: error.message || 'Unknown error',
      };
    }
  }

  /**
   * Deactivate company (owner only)
   */
  async deactivateCompany(companyId: string): Promise<CompanyResult> {
    try {
      const companyContract = contractService.getContract('company');
      if (!companyContract) {
        throw new Error('Company contract not available');
      }

      const tx = await companyContract.deactivateCompany(companyId, {
        gasLimit: 200000,
      });

      const receipt = await tx.wait();

      return {
        success: true,
        message: 'Company deactivated successfully!',
        transactionHash: receipt.transactionHash,
      };
    } catch (error: any) {
      console.error('Error deactivating company:', error);
      return {
        success: false,
        message: 'Failed to deactivate company',
        error: error.message || 'Unknown error',
      };
    }
  }

  /**
   * Reactivate company (owner only)
   */
  async reactivateCompany(companyId: string): Promise<CompanyResult> {
    try {
      const companyContract = contractService.getContract('company');
      if (!companyContract) {
        throw new Error('Company contract not available');
      }

      const tx = await companyContract.reactivateCompany(companyId, {
        gasLimit: 200000,
      });

      const receipt = await tx.wait();

      return {
        success: true,
        message: 'Company reactivated successfully!',
        transactionHash: receipt.transactionHash,
      };
    } catch (error: any) {
      console.error('Error reactivating company:', error);
      return {
        success: false,
        message: 'Failed to reactivate company',
        error: error.message || 'Unknown error',
      };
    }
  }

  /**
   * Check if user is owner of a company
   */
  async isCompanyOwner(companyId: string, userAddress: string): Promise<boolean> {
    try {
      const companyContract = contractService.getContract('company');
      if (!companyContract) {
        return false;
      }

      return await companyContract.isCompanyOwner(companyId, userAddress);
    } catch (error: any) {
      console.error('Error checking company ownership:', error);
      return false;
    }
  }

  /**
   * Get company count
   */
  async getCompanyCount(): Promise<number> {
    try {
      const companyContract = contractService.getContract('company');
      if (!companyContract) {
        return 0;
      }

      const count = await companyContract.getCompanyCount();
      return parseInt(count.toString());
    } catch (error: any) {
      console.error('Error getting company count:', error);
      return 0;
    }
  }

  // Helper methods

  private formatCompaniesArrayWithIds(companies: any[]): CompanyData[] {
    return companies.map((company, index) => ({
      id: (index + 1).toString(), // Companies are 1-indexed
      owner: company.owner,
      name: company.name,
      createdAt: company.createdAt.toString(),
      updatedAt: company.updatedAt.toString(),
      isActive: company.isActive,
    }));
  }

  private formatCompany(company: any): CompanyData {
    return {
      id: company.id?.toString() || '0',
      owner: company.owner,
      name: company.name,
      createdAt: company.createdAt.toString(),
      updatedAt: company.updatedAt.toString(),
      isActive: company.isActive,
    };
  }

  private async getLastCompanyId(): Promise<string> {
    try {
      const companyContract = contractService.getContract('company');
      if (!companyContract) {
        return '0';
      }
      
      const count = await companyContract.getCompanyCount();
      return count.toString();
    } catch (error) {
      console.error('Error getting last company ID:', error);
      return '0';
    }
  }
}

export const companiesService = new CompaniesService();
