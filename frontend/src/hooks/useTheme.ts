import { useMemo } from 'react';
import { useWallet } from './useWallet';
import { useAdmin } from './useAdmin';

export type ThemeType = 'default' | 'admin' | 'client';

export interface ThemeColors {
  primary: string;
  primaryHover: string;
  primaryLight: string;
  primaryDark: string;
  primaryBg: string;
  primaryText: string;
  primaryBorder: string;
  primaryRing: string;
}

const themeConfig: Record<ThemeType, ThemeColors> = {
  default: {
    primary: 'primary-600',
    primaryHover: 'primary-700',
    primaryLight: 'primary-100',
    primaryDark: 'primary-800',
    primaryBg: 'primary-50',
    primaryText: 'primary-800',
    primaryBorder: 'primary-200',
    primaryRing: 'primary-300',
  },
  admin: {
    primary: 'admin-600',
    primaryHover: 'admin-700',
    primaryLight: 'admin-100',
    primaryDark: 'admin-800',
    primaryBg: 'admin-50',
    primaryText: 'admin-800',
    primaryBorder: 'admin-200',
    primaryRing: 'admin-300',
  },
  client: {
    primary: 'client-600',
    primaryHover: 'client-700',
    primaryLight: 'client-100',
    primaryDark: 'client-800',
    primaryBg: 'client-50',
    primaryText: 'client-800',
    primaryBorder: 'client-200',
    primaryRing: 'client-300',
  },
};

export const useTheme = () => {
  const { isConnected } = useWallet();
  const { isAdmin } = useAdmin();

  const theme = useMemo<ThemeType>(() => {
    if (!isConnected) {
      return 'default'; // Blue theme for unconnected users
    }
    
    if (isAdmin) {
      return 'admin'; // Orange theme for admin users
    }
    
    return 'client'; // Green theme for regular client users
  }, [isConnected, isAdmin]);

  const colors = useMemo(() => themeConfig[theme], [theme]);

  const getThemeClasses = (baseClasses: string) => {
    return baseClasses
      .replace(/primary-\d+/g, (match) => {
        const colorName = match.replace('primary-', '');
        return `${theme === 'default' ? 'primary' : theme}-${colorName}`;
      });
  };

  const getThemeName = () => {
    switch (theme) {
      case 'admin':
        return 'Admin Theme (Orange)';
      case 'client':
        return 'Client Theme (Green)';
      default:
        return 'Default Theme (Blue)';
    }
  };

  return {
    theme,
    colors,
    getThemeClasses,
    getThemeName,
    isAdminTheme: theme === 'admin',
    isClientTheme: theme === 'client',
    isDefaultTheme: theme === 'default',
  };
};
