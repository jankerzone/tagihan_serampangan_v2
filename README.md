# TagihanSerampangan 💰 Money Management App

A comprehensive personal finance management application built with React, TypeScript, and Tailwind CSS. This app helps you track income, expenses, savings, and budgeting with a clean, responsive interface.

## Features

### 📊 Dashboard Overview
- **Monthly Financial Summary**: View total income, budgeted expenses, spending, and savings at a glance
- **Color-coded panels**: Customizable dashboard colors for different financial categories
- **Real-time calculations**: Automatic updates of financial metrics

### 💰 Income Management
- Track multiple income sources with names and amounts
- Add, edit, and delete income entries
- Total income calculation

### 💸 Expense Tracking
- **Budget Allocation**: Set planned expenses with categories
- **Realization Tracking**: Record actual spending against budgets
- **Category Management**: Organize expenses into customizable categories
- **Bulk Import**: Paste Excel data to add multiple expenses at once
- **Budget Usage Visualization**: Progress bars showing spending vs allocation

### 💎 Savings Management
- **Multiple Saving Types**:
  - Cash savings
  - Gold investments (quantity and price per gram)
  - Cryptocurrency investments (ticker, quantity, price per unit)
  - Stock investments (ticker, quantity, price per share)
- Total savings value calculation
- Detailed saving item information

### ⚙️ Settings & Customization
- **Year & Month Selection**: Navigate between different months
- **Category Management**: Add, edit, and delete expense categories
- **Color Customization**: Choose colors for dashboard panels
- **Multi-language Support**: English and Bahasa Indonesia
- **Data Management**: Copy data from previous months

### 🔐 Authentication
- User registration and login system
- Password hashing for security
- User-specific data storage

## Tech Stack

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **Routing**: React Router DOM
- **State Management**: React hooks with localStorage persistence
- **Icons**: Lucide React
- **Build Tool**: Vite
- **Package Manager**: npm

## Key Components

### Pages
- `Index.tsx` - Main dashboard with financial overview
- `Settings.tsx` - Application configuration and customization
- `Login.tsx` - User authentication
- `NotFound.tsx` - 404 error page

### Utilities
- `utils.ts` - Core financial calculations, data persistence, and translations
- `translations.ts` - Multi-language support (English & Bahasa Indonesia)
- `toast.ts` - Notification system using Sonner

### UI Components
- Comprehensive shadcn/ui component library
- Custom financial cards and tables
- Responsive design for mobile and desktop

## Data Storage

The application uses browser localStorage for data persistence with:
- User-specific data isolation
- Encrypted password storage
- Month-based financial data organization
- Global settings management

## Getting Started

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start Development Server**:
   ```bash
   npm run dev
   ```

3. **Build for Production**:
   ```bash
   npm run build
   ```

## Usage

1. **First-time Setup**: Register a new account on the login page
2. **Configure Settings**: Set up categories and customize dashboard colors
3. **Add Financial Data**: Input income sources, savings, and budget allocations
4. **Track Expenses**: Update realization amounts as you spend
5. **Navigate Months**: Use the year/month selector to view different periods

## Features in Detail

### Financial Calculations
- Total income = Sum of all income sources
- Budgeted expenses = Sum of all allocation amounts
- Actual spending = Sum of all realization amounts
- Savings = Sum of all saving values
- Budget usage percentage = (Realization / Allocation) × 100

### Data Management
- Copy previous month's data with one click
- Bulk expense import from Excel/Spreadsheet data
- Category-based expense organization
- User-specific data isolation

### Responsive Design
- Mobile-first approach
- Adaptive layouts for different screen sizes
- Touch-friendly interface elements

## Security Features

- Password hashing using SHA-256
- User-specific data isolation in localStorage
- Secure authentication flow

## Browser Support

- Modern browsers with localStorage support
- Mobile browsers (iOS Safari, Chrome Mobile)
- Desktop browsers (Chrome, Firefox, Safari, Edge)

## Contributing

This is a Dyad-generated application. For modifications or enhancements, please work through the Dyad interface.

## License

This project is generated using Dyad and follows standard open-source licensing practices.

---

**Made with Dyad** - Rapid application development platform