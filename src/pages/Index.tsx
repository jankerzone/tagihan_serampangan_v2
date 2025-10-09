"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, Edit3, Trash2, Settings, LogOut, Upload, Download, User, Sun, Moon } from 'lucide-react';
import { MadeWithDyad } from "@/components/made-with-dyad";
import { 
  getMonthKey, 
  loadGlobalSettings, 
  saveGlobalSettings, 
  loadMonthData, 
  saveMonthData, 
  formatCurrency,
  monthNames,
  monthNumbers,
  copyFromPreviousMonth,
  t,
  getPrefixedKey,
  loadUserProfile,
  saveUserProfile,
  getCurrentUser
} from "@/lib/utils";
import { Link, useNavigate } from 'react-router-dom';
import { showSuccess, showError } from "@/utils/toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useTheme } from "@/App"; // Import useTheme hook from App.tsx


// Types
interface IncomeSource {
  id: string;
  name: string;
  amount: number;
}

type SavingType = 'money' | 'gold' | 'crypto' | 'stock';

interface Saving {
  id: string;
  name: string;
  type: SavingType;
  amount: number; // Total value
  quantity?: number; // For gold, crypto, stock
  pricePerUnit?: number; // For gold, crypto, stock
  unit?: string; // e.g., "gram", "BTC", "lembar"
  ticker?: string; // For crypto, stock (e.g., "BTC", "BBCA")
}

interface BudgetItem {
  id: string;
  name: string;
  allocation: number;
  realization: number;
  category: string;
}

interface FinancialData {
  incomeSources: IncomeSource[];
  savingList: Saving[];
  budgetingList: BudgetItem[];
}

// Helper to derive specific shades for panel styling based on a base color (e.g., "green-100")
const getDerivedColorClasses = (selectedColor: string) => {
  const parts = selectedColor.split('-'); // e.g., ["green", "100"]
  const colorName = parts[0];
  const shade = parseInt(parts[1]);

  let bgColorShade = shade + 100;
  let textColorShade = 800; 
  let borderColorShade = shade + 200;

  if (bgColorShade > 900) bgColorShade = 900;
  if (borderColorShade > 900) borderColorShade = 900;

  return {
    bgColor: `bg-${colorName}-${bgColorShade}`,
    textColor: `text-${colorName}-${textColorShade}`,
    borderColor: `border-${colorName}-${borderColorShade}`
  };
};

const Index = () => {
  const navigate = useNavigate();
  // State
  const [globalSettings, setGlobalSettings] = useState(loadGlobalSettings());
  const [userProfile, setUserProfile] = useState(loadUserProfile());
  const [data, setData] = useState<FinancialData>({
    incomeSources: [],
    savingList: [],
    budgetingList: []
  });
  const [isAddIncomeOpen, setIsAddIncomeOpen] = useState(false);
  const [isAddSavingOpen, setIsAddSavingOpen] = useState(false);
  const [isAddBudgetOpen, setIsAddBudgetOpen] = useState(false);
  const [isBulkAddBudgetOpen, setIsBulkAddBudgetOpen] = useState(false);
  const [bulkBudgetData, setBulkBudgetData] = useState('');
  const [isEditRealizationOpen, setIsEditRealizationOpen] = useState(false);
  const [selectedBudgetId, setSelectedBudgetId] = useState<string | null>(null);
  const [newIncome, setNewIncome] = useState({ name: '', amount: '' });
  
  const [newSaving, setNewSaving] = useState<Partial<Saving>>({ 
    name: '', 
    type: 'money', 
    amount: 0, 
    quantity: 0, 
    pricePerUnit: 0, 
    unit: '', 
    ticker: '' 
  });

  const [newBudget, setNewBudget] = useState({ name: '', allocation: '', category: globalSettings.categories[0] || "Lainnya" });
  const [newRealization, setNewRealization] = useState('');

  const [isEditCategoryOpen, setIsEditCategoryOpen] = useState(false);
  const [selectedBudgetItemForCategoryEdit, setSelectedBudgetItemForCategoryEdit] = useState<BudgetItem | null>(null);
  const [newCategoryForBudgetItem, setNewCategoryForBudgetItem] = useState('');

  // New state for bulk realization
  const [isBulkRealizationOpen, setIsBulkRealizationOpen] = useState(false);
  const [bulkPercentage, setBulkPercentage] = useState(100);

  // Ref for the hidden file input
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use theme hook
  const { theme, toggleTheme } = useTheme();

  // Load data when month/year or global settings (e.g., language) changes
  useEffect(() => {
    const currentKey = getMonthKey(globalSettings.currentYear, globalSettings.currentMonth);
    const monthData = loadMonthData(currentKey);
    setData(monthData);
  }, [globalSettings.currentYear, globalSettings.currentMonth, globalSettings.lang]);

  // Save global settings when they change
  useEffect(() => {
    saveGlobalSettings(globalSettings);
  }, [globalSettings]);

  // Effect to listen for storage changes (for live color/profile updates from settings/profile page)
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === getPrefixedKey('tagihan_global_settings')) {
        setGlobalSettings(loadGlobalSettings());
      }
      if (event.key === getPrefixedKey('user_profile')) {
        setUserProfile(loadUserProfile());
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Calculations
  const totalIncome = data.incomeSources.reduce((sum, item) => sum + item.amount, 0);
  const totalBudgetedExpenses = data.budgetingList.reduce((sum, item) => sum + item.allocation, 0);
  const totalSpending = data.budgetingList.reduce((sum, item) => sum + item.realization, 0);
  const totalSavingsAmount = data.savingList.reduce((sum, item) => sum + item.amount, 0);

  // Handlers
  const handleAddIncome = () => {
    if (newIncome.name && newIncome.amount) {
      const newIncomeItem: IncomeSource = {
        id: Date.now().toString(),
        name: newIncome.name,
        amount: parseInt(newIncome.amount)
      };
      
      const currentKey = getMonthKey(globalSettings.currentYear, globalSettings.currentMonth);
      const updatedData = {
        ...data,
        incomeSources: [...data.incomeSources, newIncomeItem]
      };
      
      saveMonthData(currentKey, updatedData);
      setData(updatedData);
      
      setNewIncome({ name: '', amount: '' });
      setIsAddIncomeOpen(false);
    } else {
      showError(t('requiredFields'));
    }
  };

  const handleAddSaving = () => {
    if (!newSaving.name) {
      showError(t('requiredFields'));
      return;
    }

    let finalAmount = 0;
    let savingToAdd: Saving;

    if (newSaving.type === 'money') {
      if (!newSaving.amount || isNaN(Number(newSaving.amount))) {
        showError(t('requiredFields'));
        return;
      }
      finalAmount = Number(newSaving.amount);
      savingToAdd = {
        id: Date.now().toString(),
        name: newSaving.name,
        type: 'money',
        amount: finalAmount,
      };
    } else {
      if (!newSaving.quantity || isNaN(Number(newSaving.quantity)) || !newSaving.pricePerUnit || isNaN(Number(newSaving.pricePerUnit))) {
        showError(t('requiredFields'));
        return;
      }
      // Use parseFloat for quantity and pricePerUnit to support decimals
      const quantity = parseFloat(String(newSaving.quantity));
      const pricePerUnit = parseFloat(String(newSaving.pricePerUnit));

      finalAmount = quantity * pricePerUnit;
      savingToAdd = {
        id: Date.now().toString(),
        name: newSaving.name,
        type: newSaving.type,
        amount: finalAmount,
        quantity: quantity,
        pricePerUnit: pricePerUnit,
        unit: newSaving.unit || (newSaving.type === 'gold' ? t('grams') : newSaving.type === 'stock' ? t('shares') : newSaving.ticker),
        ticker: newSaving.ticker || '',
      };
    }
      
    const currentKey = getMonthKey(globalSettings.currentYear, globalSettings.currentMonth);
    const updatedData = {
      ...data,
      savingList: [...data.savingList, savingToAdd]
    };
    
    saveMonthData(currentKey, updatedData);
    setData(updatedData);
    
    setNewSaving({ name: '', type: 'money', amount: 0, quantity: 0, pricePerUnit: 0, unit: '', ticker: '' });
    setIsAddSavingOpen(false);
  };

  const handleAddBudget = () => {
    if (newBudget.name && newBudget.allocation) {
      const newBudgetItem: BudgetItem = {
        id: Date.now().toString(),
        name: newBudget.name,
        allocation: parseInt(newBudget.allocation),
        realization: 0,
        category: newBudget.category
      };
      
      const currentKey = getMonthKey(globalSettings.currentYear, globalSettings.currentMonth);
      const updatedData = {
        ...data,
        budgetingList: [...data.budgetingList, newBudgetItem]
      };
      
      saveMonthData(currentKey, updatedData);
      setData(updatedData);
      
      setNewBudget({ name: '', allocation: '', category: globalSettings.categories[0] || "Lainnya" });
      setIsAddBudgetOpen(false);
    } else {
      showError(t('requiredFields'));
    }
  };

  const handleBulkAddBudget = () => {
    const lines = bulkBudgetData.split('\n').filter(line => line.trim() !== '');
    const newBudgetItems: BudgetItem[] = [];
    const errors: string[] = [];
    const currentKey = getMonthKey(globalSettings.currentYear, globalSettings.currentMonth);
    const existingCategories = globalSettings.categories;
    const defaultCategory = existingCategories[0] || "Lainnya";

    lines.forEach(line => {
      const parts = line.split('\t').map(part => part.trim());
      
      if (parts.length < 2) {
        errors.push(t('invalidRowFormat', { row: line }));
        return;
      }

      const name = parts[0];
      const allocationStr = parts[1];
      let category = parts.length > 2 ? parts[2] : defaultCategory;

      const allocation = parseInt(allocationStr);
      if (isNaN(allocation)) {
        errors.push(t('invalidAllocation', { name }));
        return;
      }

      if (!existingCategories.includes(category)) {
        errors.push(t('categoryNotFound', { category, name }));
        category = defaultCategory;
      }

      newBudgetItems.push({
        id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
        name,
        allocation,
        realization: 0,
        category
      });
    });

    if (newBudgetItems.length > 0) {
      const updatedData = {
        ...data,
        budgetingList: [...data.budgetingList, ...newBudgetItems]
      };
      saveMonthData(currentKey, updatedData);
      setData(updatedData);
      showSuccess(t('bulkAddSuccess'));
      setBulkBudgetData('');
      setIsBulkAddBudgetOpen(false);
    }

    if (errors.length > 0) {
      errors.forEach(msg => showError(msg));
      if (newBudgetItems.length === 0) {
        showError(t('bulkAddError'));
      }
    }
  };

  const handleEditRealization = () => {
    if (selectedBudgetId && newRealization) {
      const currentKey = getMonthKey(globalSettings.currentYear, globalSettings.currentMonth);
      const updatedData = {
        ...data,
        budgetingList: data.budgetingList.map(item => 
          item.id === selectedBudgetId 
            ? { ...item, realization: parseInt(newRealization) } 
            : item
        )
      };
      
      saveMonthData(currentKey, updatedData);
      setData(updatedData);
      
      setNewRealization('');
      setSelectedBudgetId(null);
      setIsEditRealizationOpen(false);
    } else {
      showError(t('requiredFields'));
    }
  };

  const handleEditCategoryForBudgetItem = () => {
    if (selectedBudgetItemForCategoryEdit && newCategoryForBudgetItem) {
      const currentKey = getMonthKey(globalSettings.currentYear, globalSettings.currentMonth);
      const updatedData = {
        ...data,
        budgetingList: data.budgetingList.map(item => 
          item.id === selectedBudgetItemForCategoryEdit.id
            ? { ...item, category: newCategoryForBudgetItem }
            : item
        )
      };

      saveMonthData(currentKey, updatedData);
      setData(updatedData);
      showSuccess(t('categoryUpdated'));
      
      setNewCategoryForBudgetItem('');
      setSelectedBudgetItemForCategoryEdit(null);
      setIsEditCategoryOpen(false);
    } else {
      showError(t('requiredFields'));
    }
  };

  const handleBulkRealization = () => {
    if (data.budgetingList.length === 0) {
      showError(t('noExpensesToUpdate'));
      return;
    }

    const percentage = parseFloat(String(bulkPercentage));
    if (isNaN(percentage) || percentage < 0 || percentage > 100) {
      showError(t('invalidPercentage'));
      return;
    }

    const currentKey = getMonthKey(globalSettings.currentYear, globalSettings.currentMonth);
    const updatedBudgetingList = data.budgetingList.map(item => ({
      ...item,
      realization: Math.round(item.allocation * (percentage / 100))
    }));

    const updatedData = {
      ...data,
      budgetingList: updatedBudgetingList
    };

    saveMonthData(currentKey, updatedData);
    setData(updatedData);
    showSuccess(t('bulkRealizationSuccess'));
    setIsBulkRealizationOpen(false);
    setBulkPercentage(100); // Reset percentage after applying
  };

  const handleDeleteItem = (type: 'income' | 'saving' | 'budget', id: string) => {
    const currentKey = getMonthKey(globalSettings.currentYear, globalSettings.currentMonth);
    let updatedData;
    
    switch (type) {
      case 'income':
        updatedData = { ...data, incomeSources: data.incomeSources.filter(item => item.id !== id) };
        break;
      case 'saving':
        updatedData = { ...data, savingList: data.savingList.filter(item => item.id !== id) };
        break;
      case 'budget':
        updatedData = { ...data, budgetingList: data.budgetingList.filter(item => item.id !== id) };
        break;
      default:
        return;
    }
    
    saveMonthData(currentKey, updatedData);
    setData(updatedData);
  };

  const handleMonthChange = (month: string) => {
    setGlobalSettings(prev => ({ ...prev, currentMonth: month }));
  };

  const handleYearChange = (year: string) => {
    const yearNum = parseInt(year);
    if (!isNaN(yearNum)) {
      setGlobalSettings(prev => ({ ...prev, currentYear: yearNum }));
    }
  };

  const openEditRealization = (id: string, currentRealization: number) => {
    setSelectedBudgetId(id);
    setNewRealization(currentRealization.toString());
    setIsEditRealizationOpen(true);
  };

  const openEditCategory = (budgetItem: BudgetItem) => {
    setSelectedBudgetItemForCategoryEdit(budgetItem);
    setNewCategoryForBudgetItem(budgetItem.category);
    setIsEditCategoryOpen(true);
  };

  const handleCopyFromPreviousMonth = () => {
    const currentKey = getMonthKey(globalSettings.currentYear, globalSettings.currentMonth);
    const success = copyFromPreviousMonth(currentKey);
    
    if (success) {
      showSuccess(t('copySuccess'));
      const monthData = loadMonthData(currentKey);
      setData(monthData);
    } else {
      showError(t('copyError'));
    }
  };

  const handleExport = () => {
    try {
      const currentKey = getMonthKey(globalSettings.currentYear, globalSettings.currentMonth);
      const exportData = {
        month: currentKey,
        data: {
          incomeSources: data.incomeSources,
          savingList: data.savingList,
          budgetingList: data.budgetingList,
        },
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tagihan-${currentKey}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showSuccess(t('exportSuccess'));
    } catch (error) {
      console.error('Error exporting data:', error);
      showError(t('exportError'));
    }
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (file.size > 1024 * 1024) { // 1MB limit
      showError(t('fileTooLarge'));
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const result = e.target?.result as string;
        const imported = JSON.parse(result);

        const currentKey = getMonthKey(globalSettings.currentYear, globalSettings.currentMonth);

        // Removed the check for imported.month !== currentKey
        // The imported data will always overwrite the currently selected month's data.

        if (window.confirm(t('confirmOverwrite'))) {
          const importedData: FinancialData = {
            incomeSources: imported.data.incomeSources || [],
            savingList: imported.data.savingList || [],
            budgetingList: imported.data.budgetingList || [],
          };

          saveMonthData(currentKey, importedData);
          setData(importedData); // Update local state
          showSuccess(t('importSuccess'));
        }
      } catch (error) {
        console.error('Error importing data:', error);
        showError(t('invalidJsonFile'));
      } finally {
        // Reset file input to allow re-importing the same file
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };
    reader.readAsText(file);
  };

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('currentUser');
    // Clear all user-specific data by iterating through prefixed keys if necessary,
    // or simply rely on the next login to re-initialize.
    // For now, we'll clear the specific keys we know.
    localStorage.removeItem(getPrefixedKey('tagihan_global_settings'));
    localStorage.removeItem(getPrefixedKey('tagihan_data'));
    localStorage.removeItem(getPrefixedKey('user_profile'));
    navigate('/login');
  };

  const selectedBudget = data.budgetingList.find(item => item.id === selectedBudgetId);

  const incomeColors = getDerivedColorClasses(globalSettings.colors.income || "green-100");
  const budgetedColors = getDerivedColorClasses(globalSettings.colors.budgeted_expenses || "orange-100");
  const spendingColors = getDerivedColorClasses(globalSettings.colors.spending || "red-100");
  const savingsColors = getDerivedColorClasses(globalSettings.colors.savings || "blue-100");

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div className="flex items-center gap-4">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">{t('appName')}</h1>
          </div>
          
          <div className="flex flex-wrap items-center gap-4 mt-4 md:mt-0">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('year')}:</span>
                <Input
                  type="number"
                  value={globalSettings.currentYear}
                  onChange={(e) => handleYearChange(e.target.value)}
                  className="w-20 h-8 text-sm dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
                />
              </div>
              
              <div className="flex items-center gap-1">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('month')}:</span>
                <Select value={globalSettings.currentMonth} onValueChange={handleMonthChange}>
                  <SelectTrigger className="w-32 h-8 text-sm dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                    {monthNames.map(month => (
                      <SelectItem key={month} value={month} className="dark:hover:bg-gray-700">
                        {month}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Dark/Light Mode Toggle Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-xl ml-2"
              title={theme === 'light' ? t('switchToDark') : t('switchToLight')}
            >
              {theme === 'light' ? <Moon className="h-5 w-5 text-gray-700 dark:text-gray-300" /> : <Sun className="h-5 w-5 text-gray-700 dark:text-gray-300" />}
            </Button>
            
            {userProfile && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 px-3 py-2 rounded-full border border-gray-200 hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800">
                    <img src={userProfile.avatar} alt="User Avatar" className="h-8 w-8 rounded-full" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('welcome', { name: userProfile.name })}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 dark:bg-gray-800 dark:border-gray-700" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal dark:text-gray-100">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{userProfile.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {getCurrentUser()}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="dark:bg-gray-700" />
                  <DropdownMenuItem onClick={() => navigate('/profile')} className="dark:hover:bg-gray-700 dark:text-gray-100">
                    <User className="mr-2 h-4 w-4" />
                    <span>{t('profile')}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/settings')} className="dark:hover:bg-gray-700 dark:text-gray-100">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>{t('settings')}</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="dark:bg-gray-700" />
                  <DropdownMenuItem onClick={handleLogout} className="dark:hover:bg-gray-700 dark:text-gray-100">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>{t('logout')}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Monthly Report */}
        <Card className="mb-6 bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
          <CardHeader>
            <CardTitle className="text-green-800 flex items-center gap-2 dark:text-green-200">
              <span>{t('monthlyReport')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className={`${incomeColors.bgColor} ${incomeColors.borderColor} border dark:bg-opacity-20 dark:border-opacity-50`}>
                <CardContent className="p-4">
                  <div className={`text-sm font-medium ${incomeColors.textColor}`}>{t('totalIncome')}</div>
                  <div className={`text-xl font-bold ${incomeColors.textColor}`}>{formatCurrency(totalIncome)}</div>
                </CardContent>
              </Card>
              
              <Card className={`${budgetedColors.bgColor} ${budgetedColors.borderColor} border dark:bg-opacity-20 dark:border-opacity-50`}>
                <CardContent className="p-4">
                  <div className={`text-sm font-medium ${budgetedColors.textColor}`}>{t('budgetedExpenses')}</div>
                  <div className={`text-xl font-bold ${budgetedColors.textColor}`}>{formatCurrency(totalBudgetedExpenses)}</div>
                </CardContent>
              </Card>
              
              <Card className={`${spendingColors.bgColor} ${spendingColors.borderColor} border dark:bg-opacity-20 dark:border-opacity-50`}>
                <CardContent className="p-4">
                  <div className={`text-sm font-medium ${spendingColors.textColor}`}>{t('spending', { month: globalSettings.currentMonth })}</div>
                  <div className={`text-xl font-bold ${spendingColors.textColor}`}>{formatCurrency(totalSpending)}</div>
                </CardContent>
              </Card>
              
              <Card className={`${savingsColors.bgColor} ${savingsColors.borderColor} border dark:bg-opacity-20 dark:border-opacity-50`}>
                <CardContent className="p-4">
                  <div className={`text-sm font-medium ${savingsColors.textColor}`}>{t('savings', { month: globalSettings.currentMonth })}</div>
                  <div className={`text-xl font-bold ${savingsColors.textColor}`}>{formatCurrency(totalSavingsAmount)}</div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Data Management - Copy from Previous Month & Export/Import */}
        <Card className="mb-6 border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="text-blue-800 dark:text-blue-200">{t('dataManagement')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {t('copyPrevMonthDesc')}
              </p>
              <Button onClick={handleCopyFromPreviousMonth} className="bg-blue-600 hover:bg-blue-700 text-white">
                {t('copyPrevMonthButton')}
              </Button>
            </div>
            <div className="mt-6 pt-4 border-t border-blue-100 dark:border-blue-700 flex flex-col sm:flex-row gap-2">
              <Button onClick={handleExport} className="bg-green-600 hover:bg-green-700 text-white">
                <Download className="h-4 w-4 mr-1" />
                {t('exportCurrentMonth')}
              </Button>
              <Input
                type="file"
                ref={fileInputRef}
                onChange={handleImport}
                className="hidden"
                accept=".json"
              />
              <Button onClick={() => fileInputRef.current?.click()} className="bg-blue-600 hover:bg-blue-700 text-white">
                <Upload className="h-4 w-4 mr-1" />
                {t('importData')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Income & Savings */}
          <div className="lg:col-span-1 space-y-6">
            {/* Income Sources */}
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="dark:text-gray-100">{t('incomeSources')}</CardTitle>
                <Dialog open={isAddIncomeOpen} onOpenChange={setIsAddIncomeOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 dark:hover:bg-gray-600">
                      <PlusCircle className="h-4 w-4 mr-1" />
                      {t('add')}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="dark:bg-gray-800 dark:border-gray-700">
                    <DialogHeader>
                      <DialogTitle className="dark:text-gray-100">{t('addIncomeSource')}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="incomeName" className="dark:text-gray-300">{t('name')}</Label>
                        <Input
                          id="incomeName"
                          value={newIncome.name}
                          onChange={(e) => setNewIncome({...newIncome, name: e.target.value})}
                          placeholder="e.g., Gaji Bulanan"
                          className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                        />
                      </div>
                      <div>
                        <Label htmlFor="incomeAmount" className="dark:text-gray-300">{t('amount')} (Rp)</Label>
                        <Input
                          id="incomeAmount"
                          type="number"
                          value={newIncome.amount}
                          onChange={(e) => setNewIncome({...newIncome, amount: e.target.value})}
                          placeholder="e.g., 10000000"
                          className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                        />
                      </div>
                      <Button onClick={handleAddIncome} className="w-full">{t('addIncomeSource')}</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {data.incomeSources.length === 0 ? (
                  <p className="text-gray-500 text-center py-4 dark:text-gray-400">{t('noIncomeSources')}</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="dark:border-gray-700">
                        <TableHead className="dark:text-gray-300">{t('name')}</TableHead>
                        <TableHead className="dark:text-gray-300">{t('amount')}</TableHead>
                        <TableHead className="w-16 dark:text-gray-300">{t('actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.incomeSources.map((income) => (
                        <TableRow key={income.id} className="dark:border-gray-700">
                          <TableCell className="font-medium dark:text-gray-100">{income.name}</TableCell>
                          <TableCell className="dark:text-gray-100">{formatCurrency(income.amount)}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteItem('income', income.id)}
                              className="dark:hover:bg-gray-700"
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Savings */}
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="dark:text-gray-100">{t('savingsTitle')}</CardTitle>
                <Dialog open={isAddSavingOpen} onOpenChange={setIsAddSavingOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 dark:hover:bg-gray-600">
                      <PlusCircle className="h-4 w-4 mr-1" />
                      {t('add')}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="dark:bg-gray-800 dark:border-gray-700">
                    <DialogHeader>
                      <DialogTitle className="dark:text-gray-100">{t('addSaving')}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="savingType" className="dark:text-gray-300">{t('savingType')}</Label>
                        <Select
                          value={newSaving.type}
                          onValueChange={(value: SavingType) => setNewSaving(prev => ({ ...prev, type: value, amount: 0, quantity: 0, pricePerUnit: 0, unit: '', ticker: '' }))}
                        >
                          <SelectTrigger id="savingType" className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600">
                            <SelectValue placeholder={t('savingType')} />
                          </SelectTrigger>
                          <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                            <SelectItem value="money" className="dark:hover:bg-gray-700">{t('money')}</SelectItem>
                            <SelectItem value="gold" className="dark:hover:bg-gray-700">{t('gold')}</SelectItem>
                            <SelectItem value="crypto" className="dark:hover:bg-gray-700">{t('crypto')}</SelectItem>
                            <SelectItem value="stock" className="dark:hover:bg-gray-700">{t('stock')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="savingName" className="dark:text-gray-300">{t('name')}</Label>
                        <Input
                          id="savingName"
                          value={newSaving.name}
                          onChange={(e) => setNewSaving({...newSaving, name: e.target.value})}
                          placeholder={
                            newSaving.type === 'money' ? t('enterSavingName') :
                            newSaving.type === 'gold' ? t('enterGoldName') :
                            newSaving.type === 'crypto' ? t('enterCryptoName') :
                            newSaving.type === 'stock' ? t('enterStockName') : ''
                          }
                          className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                        />
                      </div>

                      {newSaving.type === 'money' && (
                        <div>
                          <Label htmlFor="savingAmount" className="dark:text-gray-300">{t('amount')} (Rp)</Label>
                          <Input
                            id="savingAmount"
                            type="number"
                            value={newSaving.amount === 0 ? '' : newSaving.amount}
                            onChange={(e) => setNewSaving({...newSaving, amount: parseFloat(e.target.value) || 0})}
                            placeholder="e.g., 2000000"
                            className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                          />
                        </div>
                      )}

                      {(newSaving.type === 'gold' || newSaving.type === 'crypto' || newSaving.type === 'stock') && (
                        <>
                          {newSaving.type !== 'gold' && ( // Gold doesn't need a ticker, unit is always grams
                            <div>
                              <Label htmlFor="savingTicker" className="dark:text-gray-300">{t('ticker')}</Label>
                              <Input
                                id="savingTicker"
                                value={newSaving.ticker}
                                onChange={(e) => setNewSaving({...newSaving, ticker: e.target.value, unit: e.target.value})}
                                placeholder={t('enterTicker')}
                                className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                              />
                            </div>
                          )}
                          <div>
                            <Label htmlFor="savingQuantity" className="dark:text-gray-300">{t('quantity')}</Label>
                            <Input
                              id="savingQuantity"
                              // type="number" // Removed type="number"
                              value={newSaving.quantity === 0 ? '' : newSaving.quantity}
                              onChange={(e) => setNewSaving({...newSaving, quantity: parseFloat(e.target.value) || 0})}
                              placeholder={t('enterQuantity')}
                              className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                            />
                          </div>
                          <div>
                            <Label htmlFor="savingPricePerUnit" className="dark:text-gray-300">{t('pricePerUnit')}</Label>
                            <Input
                              id="savingPricePerUnit"
                              // type="number" // Removed type="number"
                              value={newSaving.pricePerUnit === 0 ? '' : newSaving.pricePerUnit}
                              onChange={(e) => setNewSaving({...newSaving, pricePerUnit: parseFloat(e.target.value) || 0})}
                              placeholder={t('enterPricePerUnit')}
                              className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                            />
                          </div>
                          <div>
                            <Label htmlFor="savingUnit" className="dark:text-gray-300">{t('unit')}</Label>
                            <Input
                              id="savingUnit"
                              value={newSaving.unit || (newSaving.type === 'gold' ? t('grams') : newSaving.type === 'stock' ? t('shares') : newSaving.ticker || '')}
                              onChange={(e) => setNewSaving({...newSaving, unit: e.target.value})}
                              placeholder={newSaving.type === 'gold' ? t('grams') : newSaving.type === 'stock' ? t('shares') : t('unit')}
                              disabled={newSaving.type === 'gold' || newSaving.type === 'stock'} // Disable for gold/stock as unit is fixed
                              className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                            />
                          </div>
                        </>
                      )}
                      <Button onClick={handleAddSaving} className="w-full">{t('addSaving')}</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {data.savingList.length === 0 ? (
                  <p className="text-gray-500 text-center py-4 dark:text-gray-400">{t('noSavings')}</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="dark:border-gray-700">
                        <TableHead className="dark:text-gray-300">{t('name')}</TableHead>
                        <TableHead className="dark:text-gray-300">{t('type')}</TableHead>
                        <TableHead className="dark:text-gray-300">{t('amount')}</TableHead>
                        <TableHead className="w-16 dark:text-gray-300">{t('actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.savingList.map((saving) => (
                        <TableRow key={saving.id} className="dark:border-gray-700">
                          <TableCell className="font-medium dark:text-gray-100">
                            {saving.name}
                            {saving.type !== 'money' && saving.quantity && saving.pricePerUnit && (
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {saving.quantity} {saving.unit} @ {formatCurrency(saving.pricePerUnit)}
                                {saving.ticker && ` (${saving.ticker})`}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="dark:bg-gray-700 dark:text-gray-100">{t(saving.type)}</Badge>
                          </TableCell>
                          <TableCell className="dark:text-gray-100">{formatCurrency(saving.amount)}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteItem('saving', saving.id)}
                              className="dark:hover:bg-gray-700"
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Budgeting List */}
          <div className="lg:col-span-2">
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="dark:text-gray-100">{t('expensesList')}</CardTitle>
                <div className="flex gap-2">
                  <Dialog open={isAddBudgetOpen} onOpenChange={setIsAddBudgetOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 dark:hover:bg-gray-600">
                        <PlusCircle className="h-4 w-4 mr-1" />
                        {t('add')}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="dark:bg-gray-800 dark:border-gray-700">
                      <DialogHeader>
                        <DialogTitle className="dark:text-gray-100">{t('addBudgetItem')}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="budgetName" className="dark:text-gray-300">{t('name')}</Label>
                          <Input
                            id="budgetName"
                            value={newBudget.name}
                            onChange={(e) => setNewBudget({...newBudget, name: e.target.value})}
                            placeholder="e.g., Zakat Wajib"
                            className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                          />
                        </div>
                        <div>
                          <Label htmlFor="budgetAllocation" className="dark:text-gray-300">{t('allocation')} (Rp)</Label>
                          <Input
                            id="budgetAllocation"
                            type="number"
                            value={newBudget.allocation}
                            onChange={(e) => setNewBudget({...newBudget, allocation: e.target.value})}
                            placeholder="e.g., 325000"
                            className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                          />
                        </div>
                        <div>
                          <Label htmlFor="budgetCategory" className="dark:text-gray-300">{t('category')}</Label>
                          <Select value={newBudget.category} onValueChange={(value) => setNewBudget({...newBudget, category: value})}>
                            <SelectTrigger className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                              {globalSettings.categories.map(category => (
                                <SelectItem key={category} value={category} className="dark:hover:bg-gray-700">{category}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Button onClick={handleAddBudget} className="w-full">{t('addBudgetItem')}</Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {/* Bulk Add Expenses Dialog */}
                  <Dialog open={isBulkAddBudgetOpen} onOpenChange={setIsBulkAddBudgetOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 dark:hover:bg-gray-600">
                        <Upload className="h-4 w-4 mr-1" />
                        {t('bulkAddExpenses')}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="dark:bg-gray-800 dark:border-gray-700">
                      <DialogHeader>
                        <DialogTitle className="dark:text-gray-100">{t('bulkAddExpenses')}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <p className="text-sm text-gray-600 dark:text-gray-300">{t('bulkAddExpensesDescription')}</p>
                        <Textarea
                          value={bulkBudgetData}
                          onChange={(e) => setBulkBudgetData(e.target.value)}
                          placeholder={t('pasteExcelData')}
                          rows={10}
                          className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                        />
                        <Button onClick={handleBulkAddBudget} className="w-full">{t('bulkAddButton')}</Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {/* Bulk Set Realization Button */}
                  <Dialog open={isBulkRealizationOpen} onOpenChange={setIsBulkRealizationOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        size="sm" 
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        disabled={data.budgetingList.length === 0}
                      >
                        <Edit3 className="h-4 w-4 mr-1" />
                        {t('bulkSetRealization')}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="dark:bg-gray-800 dark:border-gray-700">
                      <DialogHeader>
                        <DialogTitle className="dark:text-gray-100">{t('bulkSetRealization')}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {t('setRealizationForAll', { count: data.budgetingList.length })}
                        </p>
                        <div>
                          <Label htmlFor="bulkPercentage" className="dark:text-gray-300">{t('percentage')}</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              id="bulkPercentage"
                              type="number"
                              value={bulkPercentage}
                              onChange={(e) => setBulkPercentage(parseFloat(e.target.value) || 0)}
                              placeholder="100"
                              min="0"
                              max="100"
                              className="w-full border rounded p-2 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                            />
                            <Button 
                              size="sm" 
                              onClick={() => setBulkPercentage(100)}
                              className="bg-green-500 hover:bg-green-600 text-white text-sm"
                            >
                              {t('setTo100Percent')}
                            </Button>
                          </div>
                        </div>
                        <div className="text-sm text-gray-600 italic dark:text-gray-400">
                          {t('allocationTotal')}: {formatCurrency(totalBudgetedExpenses)}
                        </div>
                        <Button onClick={handleBulkRealization} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                          {t('applyBulk')}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {data.budgetingList.length === 0 ? (
                  <p className="text-gray-500 text-center py-4 dark:text-gray-400">{t('noExpenses')}</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="dark:border-gray-700">
                        <TableHead className="dark:text-gray-300">{t('name')}</TableHead>
                        <TableHead className="dark:text-gray-300">{t('category')}</TableHead>
                        <TableHead className="text-right dark:text-gray-300">{t('allocation')}</TableHead>
                        <TableHead className="text-right dark:text-gray-300">{t('realization')}</TableHead>
                        <TableHead className="dark:text-gray-300">{t('budgetUsage')}</TableHead>
                        <TableHead className="text-right dark:text-gray-300">{t('usagePercent')}</TableHead>
                        <TableHead className="w-24 dark:text-gray-300">{t('actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.budgetingList.map((budget) => {
                        const percentage = budget.allocation > 0 
                          ? Math.min(100, Math.round((budget.realization / budget.allocation) * 10000) / 100)
                          : 0;
                        
                        return (
                          <TableRow key={budget.id} className="dark:border-gray-700">
                            <TableCell className="font-medium dark:text-gray-100">{budget.name}</TableCell>
                            <TableCell>
                              <Badge 
                                variant="secondary" 
                                className="cursor-pointer hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
                                onClick={() => openEditCategory(budget)}
                              >
                                {budget.category}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right dark:text-gray-100">{formatCurrency(budget.allocation)}</TableCell>
                            <TableCell className="text-right dark:text-gray-100">{formatCurrency(budget.realization)}</TableCell>
                            <TableCell>
                              <Progress 
                                value={Math.min(100, percentage)} 
                                className={percentage > 100 ? "bg-red-200" : ""}
                              />
                            </TableCell>
                            <TableCell className="text-right">
                              <span className={percentage > 100 ? "text-red-600 font-bold" : "dark:text-gray-100"}>
                                {percentage.toFixed(2)}%
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openEditRealization(budget.id, budget.realization)}
                                  className="dark:hover:bg-gray-700"
                                >
                                  <Edit3 className="h-4 w-4 dark:text-gray-300" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteItem('budget', budget.id)}
                                  className="dark:hover:bg-gray-700"
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Edit Realization Dialog */}
        <Dialog open={isEditRealizationOpen} onOpenChange={setIsEditRealizationOpen}>
          <DialogContent className="dark:bg-gray-800 dark:border-gray-700">
            <DialogHeader>
              <DialogTitle className="dark:text-gray-100">{t('editRealization')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {selectedBudget && (
                <div className="text-sm text-gray-600 italic dark:text-gray-400">
                  Allocation: {formatCurrency(selectedBudget.allocation)}
                </div>
              )}
              <div>
                <Label htmlFor="realizationAmount" className="dark:text-gray-300">{t('realizationAmount')}</Label>
                <div className="flex gap-2">
                  <Input
                    id="realizationAmount"
                    type="number"
                    value={newRealization}
                    onChange={(e) => setNewRealization(e.target.value)}
                    placeholder="e.g., 325000"
                    className="flex-1 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                  />
                  <Button 
                    size="sm" 
                    onClick={() => selectedBudget && setNewRealization(selectedBudget.allocation.toString())}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Set to 100%
                  </Button>
                </div>
              </div>
              <Button onClick={handleEditRealization} className="w-full">{t('updateRealization')}</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Category Dialog */}
        <Dialog open={isEditCategoryOpen} onOpenChange={setIsEditCategoryOpen}>
          <DialogContent className="dark:bg-gray-800 dark:border-gray-700">
            <DialogHeader>
              <DialogTitle className="dark:text-gray-100">{t('editCategory')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {selectedBudgetItemForCategoryEdit && (
                <div className="text-sm text-gray-600 italic mb-2 dark:text-gray-400">
                  {t('name')}: {selectedBudgetItemForCategoryEdit.name}
                </div>
              )}
              <div>
                <Label htmlFor="newCategoryForBudgetItem" className="dark:text-gray-300">{t('category')}</Label>
                <Select 
                  value={newCategoryForBudgetItem} 
                  onValueChange={setNewCategoryForBudgetItem}
                >
                  <SelectTrigger className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                    {globalSettings.categories.map(category => (
                      <SelectItem key={category} value={category} className="dark:hover:bg-gray-700">{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleEditCategoryForBudgetItem} className="w-full">{t('updateCategory')}</Button>
            </div>
          </DialogContent>
        </Dialog>

        <MadeWithDyad />
      </div>
    </div>
  );
};

export default Index;