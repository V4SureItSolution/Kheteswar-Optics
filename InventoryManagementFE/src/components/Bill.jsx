// Bill.jsx
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { formatDate, formatTime, formatDateTime, parseDateTime } from '../utils/dateUtils';

const Bill = () => {
  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [barcode, setBarcode] = useState('');

  // Bill information
  const [billNumber, setBillNumber] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [currentTime, setCurrentTime] = useState('');

  // Customer information
  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerGST, setCustomerGST] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerDob, setCustomerDob] = useState('');
  const [customerType, setCustomerType] = useState('external'); // 'internal' or 'external'
  const [customerDiscount, setCustomerDiscount] = useState(0); // Default discount for customer type

  // Dual Payment Method states (Advance Payment & Balance Amount)
  const [advancePaymentMethod, setAdvancePaymentMethod] = useState('cash');
  const [advanceAmount, setAdvanceAmount] = useState(0);
  const [balancePaymentMethod, setBalancePaymentMethod] = useState('cash');
  const [balanceAmount, setBalanceAmount] = useState(0);

  // Vehicle information
  const [vehicleName, setVehicleName] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');

  // Company information (from selected company)
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [showCompanySelector, setShowCompanySelector] = useState(false);

  // User information (bill created by)
  const [createdBy, setCreatedBy] = useState('');

  // Discount information
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState('percentage'); // 'percentage' or 'fixed'
  const [manualDiscount, setManualDiscount] = useState(false); // Track if discount is manually set

  // Tax information
  const [tax, setTax] = useState(0);
  const [taxType, setTaxType] = useState('percentage'); // 'percentage' or 'fixed'

  // Payment information
  const [paidAmount, setPaidAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentStatus, setPaymentStatus] = useState('pending');

  // Payment details for different methods
  const [cashReceived, setCashReceived] = useState(0);
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolderName, setCardHolderName] = useState('');
  const [upiId, setUpiId] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [bankName, setBankName] = useState('');
  const [chequeNumber, setChequeNumber] = useState('');

  // Eye Prescription & Spec information (Lenscraft Order Form format)
  const [dvReSph, setDvReSph] = useState('');
  const [dvReCyl, setDvReCyl] = useState('');
  const [dvReAxis, setDvReAxis] = useState('');
  const [dvLeSph, setDvLeSph] = useState('');
  const [dvLeCyl, setDvLeCyl] = useState('');
  const [dvLeAxis, setDvLeAxis] = useState('');

  const [nvReSph, setNvReSph] = useState('');
  const [nvReCyl, setNvReCyl] = useState('');
  const [nvReAxis, setNvReAxis] = useState('');
  const [nvLeSph, setNvLeSph] = useState('');
  const [nvLeCyl, setNvLeCyl] = useState('');
  const [nvLeAxis, setNvLeAxis] = useState('');

  const [frameNo, setFrameNo] = useState('');
  const [brand, setBrand] = useState('');
  const [frameDetail, setFrameDetail] = useState('');
  const [rangeDetail, setRangeDetail] = useState('');
  const [lensesDetail, setLensesDetail] = useState('');
  const [sizeDetail, setSizeDetail] = useState('');
  const [shadeDetail, setShadeDetail] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [orderTime, setOrderTime] = useState('');
  const [byCourier, setByCourier] = useState('');

  // UI states
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [billSaved, setBillSaved] = useState(false);
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [showDiscountInput, setShowDiscountInput] = useState(false);
  const [lastGeneratedBill, setLastGeneratedBill] = useState(null);
  const [showWhatsApp, setShowWhatsApp] = useState(false);
  const [savedBillId, setSavedBillId] = useState(null);
  const [fetchingCustomer, setFetchingCustomer] = useState(false);
  const [isDraftInitialized, setIsDraftInitialized] = useState(false);

  // Shop details (will be overridden by selected company)
  const defaultShopDetails = {
    name: 'Avva Inventory',
    address: 'No.20, Satya Sai Nagar',
    city: ' Madhavaram, Chennai, Tamil Nadu 600060',
    phone: '',
    gst: '',
  };

  const [shopDetails, setShopDetails] = useState(defaultShopDetails);

  // Refs
  const billPaperRef = useRef(null);
  const downloadLinkRef = useRef(null);
  const customerNameInputRef = useRef(null);

  // Create axios instance with credentials
  const api = axios.create({
    baseURL: 'http://localhost:5000/api',
    withCredentials: true,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  // Add request interceptor for debugging
  api.interceptors.request.use(request => {
    console.log('Starting Request:', request.url);
    return request;
  });

  // Add response interceptor for error handling
  api.interceptors.response.use(
    response => {
      console.log('Response:', response.status);
      return response;
    },
    error => {
      console.log('Response Error:', error.response?.status, error.response?.data);
      if (error.response?.status === 401) {
        setIsAuthenticated(false);
        setError('Session expired. Please login again.');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      }
      return Promise.reject(error);
    }
  );

  // Base styles (without dynamic values)
  // Base styles (without dynamic values)
  const baseStyles = {
    container: {
      display: 'grid',
      gridTemplateColumns: 'minmax(360px, 1fr) 720px',
      gap: '24px',
      padding: '24px 20px',
      minHeight: '100vh',
      background: 'transparent',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    productPanel: {
      background: 'linear-gradient(145deg, #1e293b, #0f172a)',
      padding: '24px',
      borderRadius: '16px',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)',
      overflow: 'auto',
      maxHeight: 'calc(100vh - 95px)',
    },
    productPanelTitle: {
      marginBottom: '20px',
      color: '#f8fafc',
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      paddingBottom: '12px',
      fontSize: '22px',
      fontWeight: '700',
      letterSpacing: '0.5px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    },
    toastContainer: {
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      pointerEvents: 'none',
    },
    alert: {
      padding: '10px 16px',
      borderRadius: '8px',
      fontWeight: '600',
      fontSize: '13px',
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.45)',
      pointerEvents: 'auto',
      maxWidth: '320px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      backdropFilter: 'blur(8px)',
      transition: 'all 0.2s ease',
    },
    alertError: {
      background: 'linear-gradient(135deg, #ef4444, #dc2626)',
      color: '#ffffff',
      border: '1px solid rgba(255, 255, 255, 0.2)',
    },
    alertSuccess: {
      background: 'linear-gradient(135deg, #10b981, #059669)',
      color: '#ffffff',
      border: '1px solid rgba(255, 255, 255, 0.2)',
    },
    searchSection: {
      background: 'rgba(15, 23, 42, 0.7)',
      padding: '20px',
      borderRadius: '12px',
      marginBottom: '20px',
      border: '1px solid rgba(99, 102, 241, 0.2)',
    },
    searchBox: {
      marginBottom: '16px',
      position: 'relative',
    },
    searchLabel: {
      display: 'block',
      marginBottom: '8px',
      fontWeight: '700',
      color: '#94a3b8',
      fontSize: '12px',
      letterSpacing: '1px',
      textTransform: 'uppercase',
    },
    searchInput: {
      width: '100%',
      padding: '12px 14px',
      background: '#0f172a',
      color: '#f8fafc',
      border: '1.5px solid #334155',
      borderRadius: '8px',
      fontSize: '14px',
      fontFamily: "'Inter', sans-serif",
      transition: 'all 0.2s ease',
      outline: 'none',
      boxSizing: 'border-box',
    },
    searchLoading: {
      position: 'absolute',
      right: '12px',
      top: '38px',
      color: '#60a5fa',
      fontSize: '13px',
      fontWeight: '600',
    },
    barcodeInput: {
      display: 'flex',
      gap: '10px',
    },
    barcodeField: {
      flex: 1,
      padding: '12px 14px',
      background: '#0f172a',
      color: '#f8fafc',
      border: '1.5px solid #334155',
      borderRadius: '8px',
      fontSize: '14px',
      fontFamily: "'Courier New', monospace",
      outline: 'none',
      transition: 'all 0.2s ease',
      boxSizing: 'border-box',
    },
    barcodeButton: {
      padding: '12px 22px',
      background: 'linear-gradient(135deg, #10b981, #059669)',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontWeight: '700',
      fontSize: '14px',
      boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
      transition: 'all 0.2s ease',
    },
    barcodeButtonDisabled: {
      background: '#475569',
      boxShadow: 'none',
      cursor: 'not-allowed',
      opacity: 0.6,
    },
    searchResults: {
      background: '#1e293b',
      border: '1px solid #334155',
      borderRadius: '10px',
      maxHeight: '300px',
      overflowY: 'auto',
      marginTop: '4px',
      boxShadow: '0 15px 35px rgba(0, 0, 0, 0.7)',
      position: 'absolute',
      top: '100%',
      left: 0,
      right: 0,
      width: '100%',
      zIndex: 1000,
    },
    searchResultItem: {
      padding: '12px 16px',
      borderBottom: '1px solid #334155',
      cursor: 'pointer',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      transition: 'background 0.2s',
    },
    resultInfo: {
      flex: 1,
    },
    resultName: {
      fontWeight: '600',
      color: '#f8fafc',
      fontSize: '14px',
    },
    resultDetails: {
      fontSize: '12px',
      color: '#94a3b8',
      marginTop: '2px',
    },
    resultPrice: {
      fontWeight: '700',
      color: '#34d399',
      fontSize: '16px',
    },
    selectedProducts: {
      marginTop: '24px',
    },
    selectedProductsTitle: {
      marginBottom: '16px',
      color: '#f8fafc',
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      paddingBottom: '10px',
      fontSize: '16px',
      fontWeight: '700',
    },
    noItems: {
      textAlign: 'center',
      color: '#64748b',
      padding: '36px 20px',
      fontStyle: 'normal',
      fontSize: '14px',
      background: 'rgba(15, 23, 42, 0.5)',
      border: '1px dashed #334155',
      borderRadius: '12px',
    },
    selectedItemsList: {
      maxHeight: '400px',
      overflowY: 'auto',
    },
    selectedItem: {
      display: 'grid',
      gridTemplateColumns: '2fr 1fr 120px 90px 36px',
      gap: '10px',
      padding: '12px 14px',
      background: '#0f172a',
      marginBottom: '10px',
      borderRadius: '10px',
      alignItems: 'center',
      border: '1px solid #334155',
      transition: 'all 0.2s ease',
    },
    itemInfo: {
      display: 'flex',
      flexDirection: 'column',
    },
    itemName: {
      fontWeight: '600',
      color: '#f8fafc',
      fontSize: '14px',
    },
    itemModel: {
      fontSize: '11px',
      color: '#94a3b8',
      marginTop: '2px',
    },
    itemPrice: {
      fontWeight: '600',
      color: '#cbd5e1',
      fontSize: '13px',
    },
    itemTotal: {
      fontWeight: '700',
      color: '#34d399',
      fontSize: '14px',
    },
    qtyStepper: {
      display: 'inline-flex',
      alignItems: 'center',
      background: '#1e293b',
      border: '1px solid #334155',
      borderRadius: '8px',
      padding: '2px',
      gap: '2px',
    },
    qtyBtnMinus: {
      width: '26px',
      height: '26px',
      borderRadius: '6px',
      border: 'none',
      background: '#334155',
      color: '#f8fafc',
      fontWeight: '700',
      fontSize: '16px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.15s ease',
    },
    qtyBtnPlus: {
      width: '26px',
      height: '26px',
      borderRadius: '6px',
      border: 'none',
      background: 'linear-gradient(135deg, #10b981, #059669)',
      color: '#ffffff',
      fontWeight: '700',
      fontSize: '16px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 2px 6px rgba(16, 185, 129, 0.4)',
      transition: 'all 0.15s ease',
    },
    qtyValue: {
      minWidth: '30px',
      textAlign: 'center',
      color: '#f8fafc',
      fontFamily: "'Inter', sans-serif",
      fontSize: '14px',
      fontWeight: '700',
      userSelect: 'none',
    },
    removeBtn: {
      background: 'linear-gradient(135deg, #ef4444, #dc2626)',
      color: 'white',
      border: 'none',
      width: '32px',
      height: '32px',
      borderRadius: '50%',
      cursor: 'pointer',
      fontSize: '16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.2s ease',
      boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)',
    },
    billPanel: {
      background: 'white',
      borderRadius: '10px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      position: 'sticky',
      top: '80px',
      height: 'fit-content',
      maxHeight: 'calc(100vh - 95px)',
      overflow: 'auto',
    },
    billContainer: {
      padding: '15px',
    },
    billPaper: {
      background: 'white',
      padding: '15px 12px',
      border: '1px solid #ccc',
      boxShadow: '0 0 10px rgba(0,0,0,0.1)',
      position: 'relative',
      marginBottom: '15px',
      borderRadius: '3px',
      width: '280px',
      margin: '0 auto',
      fontFamily: "'Courier New', monospace",
      fontSize: '11px',
      lineHeight: '1.3',
    },
    billHeader: {
      textAlign: 'center',
      marginBottom: '12px',
      paddingBottom: '8px',
      borderBottom: '1px dashed #333',
    },
    billHeaderH1: {
      fontSize: '16px',
      letterSpacing: '1px',
      marginBottom: '3px',
      color: '#333',
      fontWeight: 'bold',
    },
    billHeaderP: {
      fontSize: '9px',
      color: '#666',
      margin: '1px 0',
      lineHeight: '1.2',
    },
    billInfo: {
      margin: '10px 0',
      padding: '6px 0',
      borderTop: '1px dashed #333',
      borderBottom: '1px dashed #333',
    },
    billInfoRow: {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: '2px',
      fontSize: '10px',
    },
    billNumber: {
      fontWeight: 'bold',
      color: '#007bff',
    },
    customerSection: {
      margin: '10px 0',
      padding: '8px',
      background: '#f9f9f9',
      borderRadius: '2px',
      border: '1px solid #e9ecef',
    },
    customerRow: {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: '4px',
      fontSize: '10px',
    },
    customerLabel: {
      fontWeight: 'bold',
      color: '#555',
    },
    customerValue: {
      color: '#333',
      maxWidth: '180px',
      textAlign: 'right',
    },
    customerTypeBadge: {
      padding: '2px 6px',
      borderRadius: '3px',
      fontSize: '9px',
      fontWeight: 'bold',
      textTransform: 'uppercase',
    },
    internalBadge: {
      background: '#cce5ff',
      color: '#004085',
    },
    externalBadge: {
      background: '#fff3cd',
      color: '#856404',
    },
    customerInput: {
      width: '100%',
      padding: '4px 6px',
      marginBottom: '4px',
      border: '1px solid #ddd',
      borderRadius: '2px',
      fontFamily: "'Courier New', monospace",
      fontSize: '10px',
      transition: 'border-color 0.3s',
    },
    customerTypeSelect: {
      width: '100%',
      padding: '4px',
      marginBottom: '4px',
      border: '1px solid #ddd',
      borderRadius: '2px',
      fontFamily: "'Courier New', monospace",
      fontSize: '10px',
    },
    billItems: {
      margin: '10px 0',
    },
    billItemsHeader: {
      display: 'grid',
      gridTemplateColumns: '2fr 1fr 1fr 1.5fr',
      fontWeight: 'bold',
      padding: '4px 0',
      borderBottom: '1px solid #333',
      fontSize: '10px',
      background: '#f0f0f0',
      paddingLeft: '2px',
    },
    billItem: {
      display: 'grid',
      gridTemplateColumns: '2fr 1fr 1fr 1.5fr',
      padding: '3px 0',
      borderBottom: '1px dotted #ccc',
      fontSize: '9px',
      paddingLeft: '2px',
    },
    billItemEmpty: {
      textAlign: 'center',
      color: '#999',
      padding: '10px',
      fontStyle: 'italic',
      fontSize: '10px',
    },
    billItemName: {
      display: 'flex',
      flexDirection: 'column',
    },
    billItemSmall: {
      fontSize: '7px',
      color: '#666',
    },
    billSummary: {
      margin: '10px 0',
      padding: '8px 0',
      borderTop: '1px solid #333',
    },
    summaryRow: {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: '3px',
      fontSize: '10px',
    },
    summaryRowTotal: {
      fontWeight: 'bold',
      fontSize: '12px',
      borderTop: '1px dashed #333',
      paddingTop: '6px',
      marginTop: '6px',
      color: '#333',
    },
    discountSection: {
      margin: '8px 0',
      padding: '6px',
      background: '#f0f7ff',
      borderRadius: '3px',
      border: '1px solid #b8daff',
    },
    discountHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '5px',
      cursor: 'pointer',
    },
    discountTitle: {
      fontWeight: 'bold',
      color: '#004085',
      fontSize: '11px',
    },
    discountToggle: {
      color: '#007bff',
      fontSize: '12px',
    },
    discountControls: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '5px',
      marginTop: '5px',
    },
    discountInput: {
      padding: '4px',
      border: '1px solid #ddd',
      borderRadius: '3px',
      fontFamily: "'Courier New', monospace",
      fontSize: '10px',
      width: '100%',
    },
    discountTypeSelect: {
      padding: '4px',
      border: '1px solid #ddd',
      borderRadius: '3px',
      fontFamily: "'Courier New', monospace",
      fontSize: '10px',
      width: '100%',
    },
    discountAmount: {
      fontSize: '10px',
      color: '#28a745',
      fontWeight: 'bold',
      marginTop: '3px',
    },
    summaryInput: {
      width: '50px',
      padding: '2px',
      border: '1px solid #ddd',
      borderRadius: '2px',
      textAlign: 'right',
      fontFamily: "'Courier New', monospace",
      fontSize: '9px',
      marginLeft: '3px',
    },
    paymentSection: {
      margin: '10px 0',
      padding: '8px',
      background: '#f0f0f0',
      borderRadius: '2px',
      border: '1px solid #ddd',
      fontSize: '10px',
    },
    paymentRow: {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: '4px',
      alignItems: 'center',
    },
    paymentSelect: {
      padding: '4px',
      width: '100px',
      border: '1px solid #ddd',
      borderRadius: '2px',
      fontFamily: "'Courier New', monospace",
      fontSize: '9px',
    },
    paymentInput: {
      width: '80px',
      padding: '3px',
      border: '1px solid #ddd',
      borderRadius: '2px',
      textAlign: 'right',
      fontFamily: "'Courier New', monospace",
      fontSize: '9px',
    },
    paymentDetails: {
      marginTop: '8px',
      padding: '6px',
      background: 'white',
      borderRadius: '2px',
      border: '1px solid #ccc',
    },
    paymentDetailsInput: {
      width: '100%',
      padding: '4px',
      marginBottom: '4px',
      border: '1px solid #ddd',
      borderRadius: '2px',
      fontFamily: "'Courier New', monospace",
      fontSize: '9px',
    },
    billFooter: {
      textAlign: 'center',
      marginTop: '15px',
      paddingTop: '10px',
      borderTop: '1px dashed #333',
      fontSize: '8px',
    },
    billFooterP: {
      marginBottom: '2px',
      color: '#666',
    },
    actionButtons: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '8px',
      marginTop: '15px',
    },
    whatsappButton: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      padding: '10px',
      marginTop: '10px',
      background: '#25D366',
      color: 'white',
      border: 'none',
      borderRadius: '5px',
      fontWeight: 'bold',
      cursor: 'pointer',
      fontSize: '14px',
      transition: 'background 0.3s',
      textDecoration: 'none',
      width: '100%',
    },
    btn: {
      padding: '10px',
      border: 'none',
      borderRadius: '3px',
      fontWeight: 'bold',
      cursor: 'pointer',
      fontSize: '12px',
      transition: 'all 0.3s',
      fontFamily: "'Courier New', monospace",
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '3px',
    },
    btnDisabled: {
      opacity: 0.5,
      cursor: 'not-allowed',
    },
    btnPrimary: {
      background: '#007bff',
      color: 'white',
    },
    btnSuccess: {
      background: '#28a745',
      color: 'white',
    },
    btnDanger: {
      background: '#dc3545',
      color: 'white',
    },
    btnSecondary: {
      background: '#6c757d',
      color: 'white',
    },
    btnInfo: {
      background: '#17a2b8',
      color: 'white',
    },
    btnWarning: {
      background: '#ffc107',
      color: '#333',
    },
    btnWhatsapp: {
      background: '#25D366',
      color: 'white',
    },
    downloadLink: {
      display: 'none',
    },
    companySelector: {
      marginBottom: '16px',
      padding: '12px 14px',
      background: 'rgba(15, 23, 42, 0.65)',
      border: '1px solid rgba(99, 102, 241, 0.25)',
      borderRadius: '10px',
      cursor: 'pointer',
      color: '#f8fafc',
    },
    companyName: {
      fontWeight: '700',
      color: '#60a5fa',
      fontSize: '14px',
    },
    companyDropdown: {
      marginTop: '8px',
      padding: '6px',
      background: '#1e293b',
      border: '1px solid #334155',
      borderRadius: '8px',
      maxHeight: '200px',
      overflowY: 'auto',
      boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
    },
    companyOption: {
      padding: '8px 12px',
      cursor: 'pointer',
      borderBottom: '1px solid #334155',
      color: '#f8fafc',
      borderRadius: '4px',
      transition: 'background 0.2s',
    },
    companyOptionHover: {
      background: '#334155',
    },
  };

  // Check authentication on mount
  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      try {
        const userData = JSON.parse(user);
        // Set the name for display and the ID for saving
        setCreatedBy(userData.full_name || userData.name || userData.username || 'System');
      } catch (e) {
        setCreatedBy('System');
      }
    } else {
      setIsAuthenticated(false);
      setError('Please login first');
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    }
  }, []);

  // Fetch companies on mount
  useEffect(() => {
    fetchCompanies();
  }, []);

  // Fetch companies from API
  const fetchCompanies = async () => {
    try {
      const response = await api.get('/companies/list');
      if (response.data && response.data.length > 0) {
        setCompanies(response.data);
        // Auto-select first company if available
        const firstCompany = response.data[0];
        setSelectedCompany(firstCompany);
        fetchCompanyDetails(firstCompany.id);
      }
    } catch (err) {
      console.error('Error fetching companies:', err);
      setError('Failed to fetch companies');
    }
  };

  // Fetch company details by ID
  const fetchCompanyDetails = async (companyId) => {
    try {
      const response = await api.get(`/companies/${companyId}`);
      if (response.data) {
        const company = response.data;
        setShopDetails({
          name: company.name || defaultShopDetails.name,
          address: company.address || defaultShopDetails.address,
          city: company.city || defaultShopDetails.city,
          phone: company.phone || '',
          gst: company.gst_number || '',
        });
      }
    } catch (err) {
      console.error('Error fetching company details:', err);
    }
  };

  // Handle company selection
  const handleCompanySelect = async (company) => {
    setSelectedCompany(company);
    setShowCompanySelector(false);
    await fetchCompanyDetails(company.id);
    setSuccess(`Switched to ${company.name}`);
    setTimeout(() => setSuccess(''), 2000);
  };

  // Generate random bill number (4-digit number only, e.g. 0001, 0025, 0123, 9999)
  const generateBillNumber = () => {
    const num = Math.floor(Math.random() * 9999) + 1;
    setBillNumber(String(num).padStart(4, '0'));
  };

  // Update date and time automatically with AM/PM format
  const updateDateTime = () => {
    const now = new Date();
    setCurrentDate(formatDate(now));
    const liveTimeAMPM = formatTime(now);
    setCurrentTime(liveTimeAMPM);
    setOrderTime(liveTimeAMPM);
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    setDueDate(prev => prev || `${year}-${month}-${day}`);
  };

  // Initialize and restore draft bill on mount
  useEffect(() => {
    generateBillNumber();
    updateDateTime();

    const savedDraft = localStorage.getItem('active_draft_bill');
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        if (draft.selectedProducts && Array.isArray(draft.selectedProducts) && draft.selectedProducts.length > 0) {
          setSelectedProducts(draft.selectedProducts);
          if (draft.customerName !== undefined) setCustomerName(draft.customerName);
          if (draft.customerPhone !== undefined) setCustomerPhone(draft.customerPhone);
          if (draft.customerEmail !== undefined) setCustomerEmail(draft.customerEmail);
          if (draft.customerGST !== undefined) setCustomerGST(draft.customerGST);
          if (draft.customerAddress !== undefined) setCustomerAddress(draft.customerAddress);
          if (draft.customerDob !== undefined) setCustomerDob(draft.customerDob);
          if (draft.customerType !== undefined) setCustomerType(draft.customerType);
          if (draft.customerDiscount !== undefined) setCustomerDiscount(draft.customerDiscount);
          if (draft.vehicleName !== undefined) setVehicleName(draft.vehicleName);
          if (draft.vehicleNumber !== undefined) setVehicleNumber(draft.vehicleNumber);
          if (draft.discount !== undefined) setDiscount(draft.discount);
          if (draft.discountType !== undefined) setDiscountType(draft.discountType);
          if (draft.manualDiscount !== undefined) setManualDiscount(draft.manualDiscount);
          if (draft.tax !== undefined) setTax(draft.tax);
          if (draft.taxType !== undefined) setTaxType(draft.taxType);
          if (draft.paidAmount !== undefined) setPaidAmount(draft.paidAmount);
          if (draft.paymentMethod !== undefined) setPaymentMethod(draft.paymentMethod);
          if (draft.advancePaymentMethod !== undefined) setAdvancePaymentMethod(draft.advancePaymentMethod);
          if (draft.advanceAmount !== undefined) setAdvanceAmount(draft.advanceAmount);
          if (draft.balancePaymentMethod !== undefined) setBalancePaymentMethod(draft.balancePaymentMethod);
          if (draft.balanceAmount !== undefined) setBalanceAmount(draft.balanceAmount);
          if (draft.paymentStatus !== undefined) setPaymentStatus(draft.paymentStatus);
          if (draft.cashReceived !== undefined) setCashReceived(draft.cashReceived);
          if (draft.cardNumber !== undefined) setCardNumber(draft.cardNumber);
          if (draft.cardHolderName !== undefined) setCardHolderName(draft.cardHolderName);
          if (draft.upiId !== undefined) setUpiId(draft.upiId);
          if (draft.transactionId !== undefined) setTransactionId(draft.transactionId);
          if (draft.bankName !== undefined) setBankName(draft.bankName);
          if (draft.chequeNumber !== undefined) setChequeNumber(draft.chequeNumber);
          if (draft.billNumber) setBillNumber(draft.billNumber);

          // Lenscraft prescription & specs draft restore
          if (draft.dvReSph !== undefined) setDvReSph(draft.dvReSph);
          if (draft.dvReCyl !== undefined) setDvReCyl(draft.dvReCyl);
          if (draft.dvReAxis !== undefined) setDvReAxis(draft.dvReAxis);
          if (draft.dvLeSph !== undefined) setDvLeSph(draft.dvLeSph);
          if (draft.dvLeCyl !== undefined) setDvLeCyl(draft.dvLeCyl);
          if (draft.dvLeAxis !== undefined) setDvLeAxis(draft.dvLeAxis);

          if (draft.nvReSph !== undefined) setNvReSph(draft.nvReSph);
          if (draft.nvReCyl !== undefined) setNvReCyl(draft.nvReCyl);
          if (draft.nvReAxis !== undefined) setNvReAxis(draft.nvReAxis);
          if (draft.nvLeSph !== undefined) setNvLeSph(draft.nvLeSph);
          if (draft.nvLeCyl !== undefined) setNvLeCyl(draft.nvLeCyl);
          if (draft.nvLeAxis !== undefined) setNvLeAxis(draft.nvLeAxis);

          if (draft.frameDetail !== undefined) setFrameDetail(draft.frameDetail);
          if (draft.rangeDetail !== undefined) setRangeDetail(draft.rangeDetail);
          if (draft.lensesDetail !== undefined) setLensesDetail(draft.lensesDetail);
          if (draft.sizeDetail !== undefined) setSizeDetail(draft.sizeDetail);
          if (draft.shadeDetail !== undefined) setShadeDetail(draft.shadeDetail);
          if (draft.dueDate !== undefined) setDueDate(draft.dueDate);
          if (draft.byCourier !== undefined) setByCourier(draft.byCourier);

          setSuccess('Restored active draft bill!');
          setTimeout(() => setSuccess(''), 2500);
        }
      } catch (err) {
        console.error('Failed to restore draft bill:', err);
      }
    }

    setIsDraftInitialized(true);

    const interval = setInterval(updateDateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  // Save active draft bill to localStorage on state changes
  useEffect(() => {
    if (!isDraftInitialized) return;

    if (selectedProducts.length > 0 || customerPhone || vehicleNumber || (customerName && customerName !== 'Walk-in Customer') || frameDetail || lensesDetail || dvReSph) {
      const draftData = {
        selectedProducts,
        customerName,
        customerPhone,
        customerEmail,
        customerGST,
        customerAddress,
        customerDob,
        customerType,
        customerDiscount,
        vehicleName,
        vehicleNumber,
        discount,
        discountType,
        manualDiscount,
        tax,
        taxType,
        paidAmount,
        paymentMethod,
        advancePaymentMethod,
        advanceAmount,
        balancePaymentMethod,
        balanceAmount,
        paymentStatus,
        cashReceived,
        cardNumber,
        cardHolderName,
        upiId,
        transactionId,
        bankName,
        chequeNumber,
        billNumber,
        dvReSph, dvReCyl, dvReAxis, dvLeSph, dvLeCyl, dvLeAxis,
        nvReSph, nvReCyl, nvReAxis, nvLeSph, nvLeCyl, nvLeAxis,
        frameDetail, rangeDetail, lensesDetail, sizeDetail, shadeDetail,
        dueDate, orderTime, byCourier
      };
      localStorage.setItem('active_draft_bill', JSON.stringify(draftData));
    } else {
      localStorage.removeItem('active_draft_bill');
    }
  }, [
    isDraftInitialized, selectedProducts, customerName, customerPhone, customerEmail,
    customerGST, customerAddress, customerDob, customerType, customerDiscount, vehicleName,
    vehicleNumber, discount, discountType, manualDiscount, tax, taxType,
    paidAmount, paymentMethod, advancePaymentMethod, advanceAmount, balancePaymentMethod, balanceAmount, paymentStatus, cashReceived, cardNumber,
    cardHolderName, upiId, transactionId, bankName, chequeNumber, billNumber,
    dvReSph, dvReCyl, dvReAxis, dvLeSph, dvLeCyl, dvLeAxis,
    nvReSph, nvReCyl, nvReAxis, nvLeSph, nvLeCyl, nvLeAxis,
    frameDetail, rangeDetail, lensesDetail, sizeDetail, shadeDetail,
    dueDate, orderTime, byCourier
  ]);

  // Search products with debounce (triggers immediately after typing 1 letter)
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchQuery.trim().length >= 1) {
        searchProducts();
      } else {
        setSearchResults([]);
      }
    }, 200);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  // Sync paidAmount with advanceAmount and balanceAmount
  useEffect(() => {
    const calculatedPaid = (parseFloat(advanceAmount) || 0) + (parseFloat(balanceAmount) || 0);
    setPaidAmount(calculatedPaid);
  }, [advanceAmount, balanceAmount]);

  // Update payment status when paid amount changes
  useEffect(() => {
    const total = calculateTotal();
    if (paidAmount === 0) {
      setPaymentStatus('pending');
    } else if (paidAmount < total) {
      setPaymentStatus('partial');
    } else if (paidAmount >= total) {
      setPaymentStatus('paid');
    }
  }, [paidAmount, selectedProducts, discount, tax, discountType, taxType]);

  // Set discount based on customer type (only if not manually set)
  useEffect(() => {
    if (!manualDiscount) {
      if (customerType === 'internal') {
        setCustomerDiscount(10); // 10% discount for internal customers
        setDiscount(10);
        setDiscountType('percentage');
      } else {
        setCustomerDiscount(0);
        setDiscount(0);
        setDiscountType('percentage');
      }
    }
  }, [customerType, manualDiscount]);

  // Add print styles to preserve exact Lenscraft Bill layout
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @media print {
        body * {
          visibility: hidden !important;
        }
        
        .no-print, .no-print * {
          display: none !important;
        }
        
        #billPaper, #billPaper * {
          visibility: visible !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        
        #billPaper {
          position: absolute !important;
          left: 0 !important;
          top: 0 !important;
          width: 100% !important;
          max-width: 100% !important;
          margin: 0 !important;
          padding: 20px !important;
          border: 2.5px solid #1b4374 !important;
          box-shadow: none !important;
          background: white !important;
          box-sizing: border-box !important;
        }

        #billPaper input {
          border: none !important;
          outline: none !important;
          background: transparent !important;
          color: #0f172a !important;
        }
        
        @page {
          size: A4 portrait !important;
          margin: 10mm !important;
        }
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Clear payment method specific fields when method changes
  useEffect(() => {
    setShowPaymentDetails(true);
    switch (paymentMethod) {
      case 'cash':
        setCardNumber('');
        setCardHolderName('');
        setUpiId('');
        setTransactionId('');
        setBankName('');
        setChequeNumber('');
        break;
      case 'card':
        setCashReceived(0);
        setUpiId('');
        setTransactionId('');
        setBankName('');
        setChequeNumber('');
        break;
      case 'upi':
        setCashReceived(0);
        setCardNumber('');
        setCardHolderName('');
        setBankName('');
        setChequeNumber('');
        break;
      case 'cheque':
        setCashReceived(0);
        setCardNumber('');
        setCardHolderName('');
        setUpiId('');
        setTransactionId('');
        break;
      default:
        break;
    }
  }, [paymentMethod]);

  // Fetch customer by phone
  const fetchCustomerByPhone = async (phone) => {
    if (phone.length < 10) return;

    setFetchingCustomer(true);
    try {
      const response = await api.get(`/billing/customer/${phone}`);
      if (response.data && response.data.exists) {
        const customer = response.data.customer;
        setCustomerName(customer.name || 'Walk-in Customer');
        setCustomerEmail(customer.email || '');
        setCustomerAddress(customer.address || '');
        setCustomerDob(customer.dob || '');
        setCustomerGST(customer.gst || '');
        setCustomerType(customer.type || 'external');
        setSuccess('Customer found! Details auto-filled.');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      console.error('Error fetching customer:', err);
    } finally {
      setFetchingCustomer(false);
    }
  };

  // Auto-fetch customer when phone reaches 10 digits
  useEffect(() => {
    const cleanPhone = customerPhone.replace(/\D/g, '');
    if (cleanPhone.length === 10) {
      fetchCustomerByPhone(cleanPhone);
    }
  }, [customerPhone]);




  // Search products API call
  const searchProducts = async () => {
    if (!isAuthenticated) return;

    setSearchLoading(true);
    setError('');

    try {
      const response = await api.get(`/billing/search-products?q=${encodeURIComponent(searchQuery)}`);
      setSearchResults(response.data);
    } catch (err) {
      console.error('Search error:', err);
      if (err.response?.status === 401) {
        setError('Session expired. Please login again.');
      } else {
        setError(err.response?.data?.error || 'Failed to search products');
      }
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // Get product by barcode
  const getProductByBarcode = async () => {
    if (!isAuthenticated) return;
    if (!barcode.trim()) return;

    setLoading(true);
    setError('');

    try {
      const response = await api.get(`/billing/product/barcode/${barcode}`);
      addProductToBill(response.data);
      setBarcode('');
    } catch (err) {
      console.error('Barcode error:', err);
      if (err.response?.status === 401) {
        setError('Session expired. Please login again.');
      } else {
        setError(err.response?.data?.error || 'Product not found');
      }
    } finally {
      setLoading(false);
    }
  };

  // Add product to bill
  const addProductToBill = (product) => {
    const existingProduct = selectedProducts.find(p => p.id === product.id);

    if (existingProduct) {
      if (existingProduct.quantity < product.quantity) {
        const updatedProducts = selectedProducts.map(p =>
          p.id === product.id
            ? {
              ...p,
              quantity: p.quantity + 1,
              total: (p.quantity + 1) * p.sellPrice
            }
            : p
        );
        setSelectedProducts(updatedProducts);
        setSuccess(`Added another ${product.name}`);
        setTimeout(() => setSuccess(''), 2000);
      } else {
        setError(`Insufficient stock! Max available: ${product.quantity}`);
        setTimeout(() => setError(''), 3000);
      }
    } else {
      if (product.quantity > 0) {
        setSelectedProducts([
          ...selectedProducts,
          {
            id: product.id,
            name: product.name,
            model: product.model || '',
            sellPrice: product.sellPrice,
            quantity: 1,
            total: product.sellPrice,
            maxQuantity: product.quantity
          }
        ]);
        setSuccess(`${product.name} added to bill`);
        setTimeout(() => setSuccess(''), 2000);
      } else {
        setError('Out of stock!');
        setTimeout(() => setError(''), 3000);
      }
    }

    setSearchQuery('');
    setSearchResults([]);
  };

  // Update quantity - Triggers floating toast notification at bottom-right without shifting page layout
  const updateQuantity = (productId, newQuantity) => {
    const product = selectedProducts.find(p => p.id === productId);

    if (product) {
      newQuantity = parseInt(newQuantity) || 0;

      // Allow quantity to be 0
      if (newQuantity >= 0 && newQuantity <= product.maxQuantity) {
        const updatedProducts = selectedProducts.map(p =>
          p.id === productId
            ? { ...p, quantity: newQuantity, total: newQuantity * p.sellPrice }
            : p
        );
        setSelectedProducts(updatedProducts);

        // Show floating bottom-right toast notification (zero layout shifting!)
        if (newQuantity === 0) {
          setSuccess(`Qty set to 0: ${product.name}`);
        } else {
          setSuccess(`Qty updated: ${newQuantity} × ${product.name}`);
        }
        setTimeout(() => setSuccess(''), 1500);
      } else if (newQuantity > product.maxQuantity) {
        setError(`Max stock reached! (${product.maxQuantity} available)`);
        setTimeout(() => setError(''), 2500);
      }
    }
  };

  // Remove product - Only for complete removal (separate function)
  const removeProduct = (productId) => {
    const product = selectedProducts.find(p => p.id === productId);
    setSelectedProducts(selectedProducts.filter(p => p.id !== productId));
    setSuccess(`${product.name} removed from bill`);
    setTimeout(() => setSuccess(''), 2000);
  };

  // Calculate subtotal (only items with quantity > 0)
  const calculateSubtotal = () => {
    return selectedProducts
      .filter(p => p.quantity > 0)
      .reduce((sum, p) => sum + p.total, 0);
  };

  // Calculate discount amount
  const calculateDiscountAmount = () => {
    const subtotal = calculateSubtotal();
    if (subtotal === 0) return 0;

    if (discountType === 'percentage') {
      return (subtotal * discount) / 100;
    }
    return Math.min(discount, subtotal); // Fixed amount cannot exceed subtotal
  };

  // Calculate tax amount (applied after discount)
  const calculateTaxAmount = () => {
    const subtotal = calculateSubtotal();
    const discountAmount = calculateDiscountAmount();
    const afterDiscount = subtotal - discountAmount;

    if (afterDiscount <= 0) return 0;

    if (taxType === 'percentage') {
      return (afterDiscount * tax) / 100;
    }
    return Math.min(tax, afterDiscount); // Fixed tax cannot exceed after discount amount
  };

  // Calculate total (subtotal - discount + tax)
  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discountAmount = calculateDiscountAmount();
    const taxAmount = calculateTaxAmount();
    return Math.max(0, subtotal - discountAmount + taxAmount);
  };

  // Calculate change
  const calculateChange = () => {
    const total = calculateTotal();
    return Math.max(0, paidAmount - total);
  };

  // Calculate due amount
  const calculateDue = () => {
    const total = calculateTotal();
    return Math.max(0, total - paidAmount);
  };

  // Handle discount change
  const handleDiscountChange = (value) => {
    setManualDiscount(true); // Mark as manually set
    const numValue = parseFloat(value) || 0;
    const subtotal = calculateSubtotal();

    // Validate based on discount type
    if (discountType === 'percentage') {
      if (numValue > 100) {
        setError('Percentage discount cannot exceed 100%');
        setDiscount(100);
      } else if (numValue < 0) {
        setDiscount(0);
      } else {
        setDiscount(numValue);
      }
    } else {
      if (numValue > subtotal) {
        setError('Fixed discount cannot exceed subtotal');
        setDiscount(subtotal);
      } else if (numValue < 0) {
        setDiscount(0);
      } else {
        setDiscount(numValue);
      }
    }

    // Clear error after 3 seconds
    setTimeout(() => setError(''), 3000);
  };

  // Handle discount type change
  const handleDiscountTypeChange = (type) => {
    setManualDiscount(true); // Mark as manually set
    const subtotal = calculateSubtotal();
    setDiscountType(type);

    // Convert discount value when type changes
    if (type === 'percentage') {
      // If switching to percentage, convert fixed amount to percentage
      if (discountType === 'fixed' && subtotal > 0) {
        const percentage = (discount / subtotal) * 100;
        setDiscount(Math.min(100, Math.round(percentage * 100) / 100));
      } else if (discount > 100) {
        setDiscount(100);
      }
    } else {
      // If switching to fixed, convert percentage to fixed amount
      if (discountType === 'percentage' && subtotal > 0) {
        const fixed = (subtotal * discount) / 100;
        setDiscount(Math.min(subtotal, Math.round(fixed * 100) / 100));
      } else if (discount > subtotal) {
        setDiscount(subtotal);
      }
    }
  };

  // Reset discount to customer default
  const resetDiscountToDefault = () => {
    setManualDiscount(false);
    if (customerType === 'internal') {
      setDiscount(10);
      setDiscountType('percentage');
    } else {
      setDiscount(0);
      setDiscountType('percentage');
    }
  };

  // Handle cash payment
  const handleCashPayment = (received) => {
    const amount = parseFloat(received) || 0;
    setCashReceived(amount);
    setPaidAmount(amount);
  };

  // Handle exact payment
  const handleExactPayment = () => {
    const total = calculateTotal();
    setPaidAmount(total);
    if (paymentMethod === 'cash') {
      setCashReceived(total);
    }
  };

  // Save bill to database
  const saveBillToDatabase = async () => {
    const activeProducts = selectedProducts.filter(p => p.quantity > 0);

    if (activeProducts.length === 0) {
      setError('No items with quantity > 0 to save!');
      return null;
    }

    setLoading(true);
    setError('');

    try {
      // Prepare bill data for API
      const billData = {
        customerName: customerName,
        customerPhone: customerPhone,
        customerEmail: customerEmail,
        customerGST: customerGST,
        customerAddress: customerAddress,
        customerDob: customerDob,
        customerType: customerType === 'internal' ? 'internal' : 'regular',
        vehicleName: vehicleName,
        vehicleNumber: vehicleNumber,
        companyId: selectedCompany?.id,
        discount: discount,
        discountType: discountType === 'percentage' ? 'percentage' : 'amount',
        tax: tax,
        taxType: taxType === 'percentage' ? 'percentage' : 'amount',
        paidAmount: (parseFloat(advanceAmount) || 0) + (parseFloat(balanceAmount) || 0),
        paymentMethod: advancePaymentMethod || 'cash',
        advancePaymentMethod: advancePaymentMethod,
        advanceAmount: parseFloat(advanceAmount) || 0,
        balancePaymentMethod: balancePaymentMethod,
        balanceAmount: parseFloat(balanceAmount) || 0,
        createdBy: JSON.parse(localStorage.getItem('user'))?.id,
        createdByName: createdBy, // Using the state variable which now has the correct name
        items: activeProducts.map(p => ({
          productId: p.id,
          quantity: p.quantity
        }))
      };

      console.log('Saving bill:', billData);

      const response = await api.post('/billing/bills', billData);

      if (response.data.success) {
        setSuccess('Bill saved successfully!');
        setSavedBillId(response.data.billId);
        setBillNumber(response.data.billNumber); // Update with actual bill number from backend
        setLastGeneratedBill({
          billNumber: response.data.billNumber,
          customerPhone: customerPhone,
          customerName: customerName
        });
        setShowWhatsApp(true);
        setBillSaved(true);
        localStorage.removeItem('active_draft_bill');

        return {
          billId: response.data.billId,
          billNumber: response.data.billNumber
        };
      } else {
        throw new Error(response.data.error || 'Failed to save bill');
      }
    } catch (err) {
      console.error('Save bill error:', err);
      setError(err.response?.data?.error || err.message || 'Failed to save bill');
      return null;
    } finally {
      setLoading(false);
    }
  };
  // Generate HTML content for bill matching screen layout exactly
  const generateBillHTML = () => {
    const paperEl = billPaperRef.current;
    if (paperEl) {
      const clone = paperEl.cloneNode(true);
      const originalInputs = paperEl.querySelectorAll('input');
      const clonedInputs = clone.querySelectorAll('input');
      originalInputs.forEach((input, index) => {
        if (clonedInputs[index]) {
          clonedInputs[index].setAttribute('value', input.value || '');
        }
      });

      const billContent = clone.outerHTML;

      return `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Lenscraft Invoice - ${billNumber}</title>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              body {
                margin: 0;
                padding: 20px;
                font-family: Arial, Helvetica, sans-serif;
                font-size: 11.5px;
                color: #000;
                background: #fff;
                display: flex;
                justify-content: center;
              }
              #billPaper {
                width: 100% !important;
                max-width: 720px !important;
                margin: 0 auto !important;
                box-shadow: none !important;
                background: #fff !important;
                border: 2.5px solid #1b4374 !important;
                padding: 24px 26px !important;
                font-family: Arial, Helvetica, sans-serif !important;
              }
              input {
                border: none !important;
                outline: none !important;
                background: transparent !important;
                color: #0f172a !important;
                font-family: inherit !important;
              }
              input[type="date"]::-webkit-calendar-picker-indicator,
              input[type="date"]::-webkit-inner-spin-button,
              input[type="date"]::-webkit-clear-button {
                display: none !important;
                -webkit-appearance: none !important;
                opacity: 0 !important;
              }
              @page {
                size: A4 portrait;
                margin: 10mm;
              }
            </style>
          </head>
          <body>
            ${billContent}
          </body>
        </html>
      `;
    }
    return '';
  };

  // Download bill as HTML file
  const downloadBill = () => {
    const activeProducts = selectedProducts.filter(p => p.quantity > 0);
    if (activeProducts.length === 0) {
      setError('No items with quantity > 0 to download!');
      setTimeout(() => setError(''), 3000);
      return;
    }

    const billHTML = generateBillHTML();
    const blob = new Blob([billHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Bill_${billNumber.replace(/[\/\\]/g, '-')}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setSuccess('Bill downloaded successfully!');
    setTimeout(() => setSuccess(''), 3000);
  };

  // Handle payment completion - Save to DB then download
  const handlePaymentComplete = async () => {
    const activeProducts = selectedProducts.filter(p => p.quantity > 0);
    if (activeProducts.length === 0) {
      setError('No items in bill!');
      setTimeout(() => setError(''), 3000);
      return;
    }

    // Capture exact current date and time with AM/PM at moment of payment
    const exactNow = new Date();
    const exactDate = formatDate(exactNow);
    const exactTimeAMPM = formatTime(exactNow);
    setCurrentDate(exactDate);
    setCurrentTime(exactTimeAMPM);
    setOrderTime(exactTimeAMPM);

    // Save to database first
    const savedData = await saveBillToDatabase();

    if (savedData) {
      // Then download the bill
      downloadBill();

      // Clear form and refresh for next new bill cleanly
      const billedNo = savedData.billNumber;
      clearBill(false);
      setSuccess(`✓ Bill #${billedNo} completed! Form refreshed for next bill.`);
      setTimeout(() => setSuccess(''), 3000);
      setTimeout(() => {
        customerNameInputRef.current?.focus();
      }, 100);
    }
  };

  // Handle print - Save to DB then print
  const handlePrint = async () => {
    const activeProducts = selectedProducts.filter(p => p.quantity > 0);
    if (activeProducts.length === 0) {
      setError('No items in bill!');
      setTimeout(() => setError(''), 3000);
      return;
    }

    // Capture exact current date and time with AM/PM at moment of printing
    const exactNow = new Date();
    const exactDate = formatDate(exactNow);
    const exactTimeAMPM = formatTime(exactNow);
    setCurrentDate(exactDate);
    setCurrentTime(exactTimeAMPM);
    setOrderTime(exactTimeAMPM);

    // Save to database first
    const savedData = await saveBillToDatabase();

    if (savedData) {
      // Safely clone DOM node for printing so live React input elements are never mutated directly
      const paperEl = billPaperRef.current;
      let billContent = '';
      if (paperEl) {
        const clone = paperEl.cloneNode(true);
        const originalInputs = paperEl.querySelectorAll('input');
        const clonedInputs = clone.querySelectorAll('input');
        originalInputs.forEach((input, index) => {
          if (clonedInputs[index]) {
            clonedInputs[index].setAttribute('value', input.value || '');
          }
        });
        billContent = clone.outerHTML;
      }

      // Create a new window for printing
      const printWindow = window.open('', '_blank');

      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Lenscraft Invoice - ${billNumber}</title>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>
                * {
                  margin: 0;
                  padding: 0;
                  box-sizing: border-box;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
                
                body {
                  margin: 0;
                  padding: 20px;
                  font-family: Arial, Helvetica, sans-serif;
                  font-size: 11.5px;
                  color: #000;
                  background: #fff;
                  display: flex;
                  justify-content: center;
                }
                
                #billPaper {
                  width: 100% !important;
                  max-width: 720px !important;
                  margin: 0 auto !important;
                  box-shadow: none !important;
                  background: #fff !important;
                  border: 2.5px solid #1b4374 !important;
                  padding: 24px 26px !important;
                  font-family: Arial, Helvetica, sans-serif !important;
                }

                input {
                  border: none !important;
                  outline: none !important;
                  background: transparent !important;
                  color: #0f172a !important;
                  font-family: inherit !important;
                }
                input[type="date"]::-webkit-calendar-picker-indicator,
                input[type="date"]::-webkit-inner-spin-button,
                input[type="date"]::-webkit-clear-button {
                  display: none !important;
                  -webkit-appearance: none !important;
                  opacity: 0 !important;
                }

                @page {
                  size: A4 portrait;
                  margin: 10mm;
                }
              </style>
            </head>
            <body>
              ${billContent}
              <script>
                window.onload = function() {
                  setTimeout(function() {
                    window.print();
                    setTimeout(function() {
                      window.close();
                    }, 500);
                  }, 300);
                };
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
      } else {
        setError('Pop-up blocked! Please allow pop-ups for this site to print.');
        setTimeout(() => setError(''), 3000);
      }

      // Clear form and refresh for next new bill cleanly
      const billedNo = savedData.billNumber;
      clearBill(false);
      setSuccess(`✓ Bill #${billedNo} printed & completed! Form refreshed for next bill.`);
      setTimeout(() => setSuccess(''), 3000);
      setTimeout(() => {
        customerNameInputRef.current?.focus();
      }, 100);
    }
  };

  // Handle WhatsApp share with generated bill link
  const handleWhatsAppShare = async () => {
    if (!customerPhone) {
      setError('Please enter customer phone number to share via WhatsApp');
      setTimeout(() => setError(''), 3000);
      return;
    }

    // Clean phone number (remove non-digits)
    const cleanPhone = customerPhone.replace(/\D/g, '');

    // Check if phone number is valid
    if (cleanPhone.length < 10) {
      setError('Please enter a valid 10-digit phone number');
      setTimeout(() => setError(''), 3000);
      return;
    }

    // Format phone number for WhatsApp (add country code if not present)
    const whatsappNumber = cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone;

    let currentBillNo = billNumber || lastGeneratedBill?.billNumber;

    // If bill is not yet saved to database, save it first so a real bill link can be generated
    if (!billSaved) {
      const activeProducts = selectedProducts.filter(p => p.quantity > 0);
      if (activeProducts.length === 0) {
        setError('No items in bill to generate WhatsApp link!');
        setTimeout(() => setError(''), 3000);
        return;
      }
      const savedData = await saveBillToDatabase();
      if (savedData && savedData.billNumber) {
        currentBillNo = savedData.billNumber;
      } else {
        return;
      }
    }

    // Generate public bill link
    const billLink = `${window.location.origin}/view-bill/${encodeURIComponent(currentBillNo)}`;

    // Message formatted with the link on a separate line
    const message = `Thank you for purchasing, Here is the link of your bill\n${billLink}`;

    // Encode message for URL
    const encodedMessage = encodeURIComponent(message);

    // Open WhatsApp with customer's number
    window.open(`https://wa.me/${whatsappNumber}?text=${encodedMessage}`, '_blank');

    setSuccess('WhatsApp opened with bill link!');
    setTimeout(() => setSuccess(''), 3000);
  };

  // Clear/delete draft bill
  const clearBill = (confirmUser = true) => {
    if (!confirmUser || window.confirm('Are you sure you want to delete this draft bill? All added items and quantities will be removed.')) {
      localStorage.removeItem('active_draft_bill');
      setSelectedProducts([]);
      setCustomerName('Walk-in Customer');
      setCustomerPhone('');
      setCustomerEmail('');
      setCustomerGST('');
      setCustomerAddress('');
      setCustomerDob('');
      setCustomerType('external');
      setCustomerDiscount(0);
      setVehicleName('');
      setVehicleNumber('');
      setDiscount(0);
      setDiscountType('percentage');
      setManualDiscount(false);
      setTax(0);
      setTaxType('percentage');
      setPaidAmount(0);
      setAdvancePaymentMethod('cash');
      setAdvanceAmount(0);
      setBalancePaymentMethod('cash');
      setBalanceAmount(0);
      setCashReceived(0);
      setPaymentMethod('cash');
      setPaymentStatus('pending');
      setCardNumber('');
      setCardHolderName('');
      setUpiId('');
      setTransactionId('');
      setBankName('');
      setChequeNumber('');
      setDvReSph(''); setDvReCyl(''); setDvReAxis('');
      setDvLeSph(''); setDvLeCyl(''); setDvLeAxis('');
      setNvReSph(''); setNvReCyl(''); setNvReAxis('');
      setNvLeSph(''); setNvLeCyl(''); setNvLeAxis('');
      setFrameNo(''); setBrand(''); setFrameDetail(''); setRangeDetail(''); setLensesDetail(''); setSizeDetail(''); setShadeDetail('');
      setDueDate(''); setOrderTime(''); setByCourier('');
      setError('');
      if (confirmUser) {
        setSuccess('Draft bill deleted');
        setTimeout(() => setSuccess(''), 2000);
      }
      setBillSaved(false);
      setShowWhatsApp(false);
      setLastGeneratedBill(null);
      setSavedBillId(null);
      generateBillNumber();
    }
  };

  // Handle new bill
  const handleNewBill = () => {
    clearBill(true);
  };

  // Handle key press for barcode
  const handleBarcodeKeyPress = (e) => {
    if (e.key === 'Enter') {
      getProductByBarcode();
    }
  };

  // Test API connection
  const testAPIConnection = async () => {
    try {
      const response = await api.get('/health');
      console.log('API Health:', response.data);
    } catch (err) {
      console.error('API Health Check Failed:', err);
    }
  };

  // Run API test on mount
  useEffect(() => {
    testAPIConnection();
  }, []);

  // Filter out items with quantity 0 for display in bill summary
  const activeProducts = selectedProducts.filter(p => p.quantity > 0);
  const subtotal = calculateSubtotal();
  const discountAmount = calculateDiscountAmount();
  const taxAmount = calculateTaxAmount();
  const total = calculateTotal();
  const due = calculateDue();
  const change = calculateChange();

  // Dynamic styles that depend on state
  const dynamicStyles = {
    changeAmount: {
      fontWeight: 'bold',
      color: paidAmount >= total ? '#34d399' : '#f87171',
      fontSize: '11px',
    },
    zeroQuantity: {
      opacity: 0.6,
      background: 'rgba(245, 158, 11, 0.15)',
      border: '1px solid rgba(245, 158, 11, 0.4)',
    }
  };

  // Show login required message if not authenticated
  if (!isAuthenticated) {
    return (
      <div style={{ ...baseStyles.container, justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ background: 'white', padding: '40px', borderRadius: '10px', textAlign: 'center' }}>
          <h2>🔒 Authentication Required</h2>
          <p style={{ color: '#dc3545', margin: '20px 0' }}>{error || 'Please login to access billing'}</p>
          <button
            style={{ ...baseStyles.btn, ...baseStyles.btnPrimary, padding: '10px 30px' }}
            onClick={() => window.location.href = '/login'}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Handle phone number input change
  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Only allow digits
    if (value.length <= 10) {
      setCustomerPhone(value);
    }
  };

  return (
    <div style={baseStyles.container}>
      {/* Left Panel - Product Selection */}
      <div style={baseStyles.productPanel} className="no-print">
        <h2 style={baseStyles.productPanelTitle}>🧾 Create New Bill</h2>

        {/* Company Selector */}
        {companies.length > 0 && (
          <div style={baseStyles.companySelector}>
            <div
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              onClick={() => setShowCompanySelector(!showCompanySelector)}
            >
              <span>
                🏢 <span style={baseStyles.companyName}>
                  {selectedCompany ? selectedCompany.name : 'Select Company'}
                </span>
              </span>
              <span style={{ fontSize: '12px' }}>{showCompanySelector ? '▲' : '▼'}</span>
            </div>
            {showCompanySelector && (
              <div style={baseStyles.companyDropdown}>
                {companies.map(company => (
                  <div
                    key={company.id}
                    style={baseStyles.companyOption}
                    onClick={() => handleCompanySelect(company)}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#334155'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    {company.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Floating Toast Notification Container (Prevents page layout shifting) */}
        <div style={baseStyles.toastContainer}>
          {error && (
            <div style={{ ...baseStyles.alert, ...baseStyles.alertError }}>
              ⚠️ {error}
            </div>
          )}
          {success && (
            <div style={{ ...baseStyles.alert, ...baseStyles.alertSuccess }}>
              ✅ {success}
            </div>
          )}
        </div>

        {/* Customer Information Section */}
        <div style={baseStyles.searchSection}>
          <h3 style={{ ...baseStyles.selectedProductsTitle, marginBottom: '14px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '8px', fontSize: '15px' }}>
            👤 Customer Information
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={baseStyles.searchLabel}>Customer Name *:</label>
              <input
                ref={customerNameInputRef}
                type="text"
                style={baseStyles.searchInput}
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Walk-in Customer / Name"
                onFocus={(e) => {
                  e.target.style.borderColor = '#60a5fa';
                  e.target.style.boxShadow = '0 0 0 3px rgba(96, 165, 250, 0.25)';
                  if (e.target.value === 'Walk-in Customer') {
                    e.target.select();
                  }
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#334155';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
            <div>
              <label style={baseStyles.searchLabel}>Mobile / Telephone *:</label>
              <input
                type="text"
                style={baseStyles.searchInput}
                value={customerPhone}
                onChange={handlePhoneChange}
                maxLength="10"
                placeholder="10-digit mobile number"
                onFocus={(e) => {
                  e.target.style.borderColor = '#60a5fa';
                  e.target.style.boxShadow = '0 0 0 3px rgba(96, 165, 250, 0.25)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#334155';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
            <div>
              <label style={baseStyles.searchLabel}>Customer Address:</label>
              <input
                type="text"
                style={baseStyles.searchInput}
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                placeholder="Street, City, Zip"
                onFocus={(e) => {
                  e.target.style.borderColor = '#60a5fa';
                  e.target.style.boxShadow = '0 0 0 3px rgba(96, 165, 250, 0.25)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#334155';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
            <div>
              <label style={baseStyles.searchLabel}>Date of Birth (DOB):</label>
              <input
                type="date"
                style={baseStyles.searchInput}
                value={customerDob}
                onChange={(e) => setCustomerDob(e.target.value)}
                onFocus={(e) => {
                  e.target.style.borderColor = '#60a5fa';
                  e.target.style.boxShadow = '0 0 0 3px rgba(96, 165, 250, 0.25)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#334155';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
          </div>
        </div>

        <div style={baseStyles.searchSection}>
          <div style={baseStyles.searchBox}>
            <label style={baseStyles.searchLabel}>🔍 Search Products:</label>
            <input
              type="text"
              style={baseStyles.searchInput}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Type product name or model..."
              autoComplete="off"
              onFocus={(e) => {
                e.target.style.borderColor = '#60a5fa';
                if (searchQuery.trim().length >= 1) searchProducts();
              }}
              onBlur={(e) => e.target.style.borderColor = '#334155'}
            />
            {searchLoading && <div style={baseStyles.searchLoading}>Searching...</div>}

            {/* Search Dropdown Floating overlay directly under input */}
            {searchQuery.trim().length >= 1 && (
              <div style={baseStyles.searchResults}>
                {searchLoading ? (
                  <div style={{ padding: '14px', textAlign: 'center', color: '#60a5fa', fontSize: '13px' }}>
                    Searching products...
                  </div>
                ) : searchResults.length > 0 ? (
                  searchResults.map(product => (
                    <div
                      key={product.id}
                      style={baseStyles.searchResultItem}
                      onClick={() => addProductToBill(product)}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#334155'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={baseStyles.resultInfo}>
                        <div style={baseStyles.resultName}>{product.name}</div>
                        <div style={baseStyles.resultDetails}>
                          {(product.model ? product.model + ' | ' : '')}Stock: <span style={{ color: product.quantity > 0 ? '#34d399' : '#f87171', fontWeight: 'bold' }}>{product.quantity}</span>
                        </div>
                      </div>
                      <div style={baseStyles.resultPrice}>₹{product.sellPrice}</div>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '14px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                    No products found matching "{searchQuery}"
                  </div>
                )}
              </div>
            )}
          </div>

          <div style={baseStyles.barcodeInput}>
            <input
              type="text"
              style={baseStyles.barcodeField}
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              onKeyPress={handleBarcodeKeyPress}
              placeholder="📱 Scan barcode..."
              onFocus={(e) => e.target.style.borderColor = '#34d399'}
              onBlur={(e) => e.target.style.borderColor = '#334155'}
            />
            <button
              style={{
                ...baseStyles.barcodeButton,
                ...(loading ? baseStyles.barcodeButtonDisabled : {})
              }}
              onClick={getProductByBarcode}
              disabled={loading}
            >
              {loading ? 'Adding...' : 'Add'}
            </button>
          </div>
        </div>

        <div style={baseStyles.selectedProducts}>
          <h3 style={baseStyles.selectedProductsTitle}>
            🛒 Current Bill Items ({activeProducts.length} active / {selectedProducts.length} total)
          </h3>
          <div style={baseStyles.selectedItemsList}>
            {selectedProducts.length === 0 ? (
              <p style={baseStyles.noItems}>No items added yet. Search or scan products to add.</p>
            ) : (
              selectedProducts.map(product => (
                <div
                  key={product.id}
                  style={baseStyles.selectedItem}
                >
                  <div style={baseStyles.itemInfo}>
                    <span style={baseStyles.itemName}>{product.name}</span>
                    <span style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                      {(product.model ? product.model + ' • ' : '')}Stock: {product.maxQuantity}
                    </span>
                  </div>
                  <div style={baseStyles.itemPrice}>₹{product.sellPrice}</div>

                  {/* Clean Modern Quantity Stepper without legacy spinners or badges */}
                  <div style={baseStyles.qtyStepper}>
                    <button
                      type="button"
                      style={baseStyles.qtyBtnMinus}
                      onClick={() => {
                        if (product.quantity <= 1) {
                          removeProduct(product.id);
                        } else {
                          updateQuantity(product.id, product.quantity - 1);
                        }
                      }}
                      title={product.quantity <= 1 ? "Remove item" : "Decrease quantity"}
                    >
                      −
                    </button>
                    <span style={baseStyles.qtyValue}>{product.quantity}</span>
                    <button
                      type="button"
                      style={{
                        ...baseStyles.qtyBtnPlus,
                        opacity: product.quantity >= product.maxQuantity ? 0.4 : 1,
                        cursor: product.quantity >= product.maxQuantity ? 'not-allowed' : 'pointer'
                      }}
                      onClick={() => updateQuantity(product.id, Math.min(product.maxQuantity, product.quantity + 1))}
                      disabled={product.quantity >= product.maxQuantity}
                      title="Increase quantity"
                    >
                      +
                    </button>
                  </div>

                  <div style={baseStyles.itemTotal}>₹{product.total.toFixed(2)}</div>
                  <button
                    type="button"
                    style={baseStyles.removeBtn}
                    onClick={() => removeProduct(product.id)}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'linear-gradient(135deg, #f43f5e, #e11d48)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)'}
                    title="Remove item"
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
          {selectedProducts.length > 0 && (
            <p style={{ fontSize: '11px', color: '#666', marginTop: '10px', textAlign: 'center' }}>
              💡 Set quantity to 0 to keep item in list (will not be billed)
            </p>
          )}
        </div>

        {/* Prescription & Order Specs Section */}
        <div style={{ ...baseStyles.searchSection, marginTop: '20px' }}>
          <h3 style={{ ...baseStyles.selectedProductsTitle, marginBottom: '14px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '8px' }}>
            👓 Order Specifications & Eye Prescription
          </h3>

          {/* Order Meta Inputs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px', marginBottom: '16px' }}>
            <div>
              <label style={baseStyles.searchLabel}>Due Date:</label>
              <input
                type="date"
                style={baseStyles.searchInput}
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <div>
              <label style={baseStyles.searchLabel}>Time:</label>
              <input
                type="text"
                style={baseStyles.searchInput}
                value={orderTime || currentTime}
                onChange={(e) => setOrderTime(e.target.value)}
                placeholder="e.g. 11:35 AM"
              />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={baseStyles.searchLabel}>By Courier:</label>
              <input
                type="text"
                style={baseStyles.searchInput}
                value={byCourier}
                onChange={(e) => setByCourier(e.target.value)}
                placeholder="Courier name / tracking..."
              />
            </div>
          </div>

          {/* Frame & Lens Details - Show ONLY Frame Name and Lens Type */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
            <div>
              <label style={baseStyles.searchLabel}>Frame Name:</label>
              <input
                type="text"
                style={baseStyles.searchInput}
                value={frameNo || frameDetail}
                onChange={(e) => {
                  setFrameNo(e.target.value);
                  setFrameDetail(e.target.value);
                }}
                placeholder="Frame name / model"
              />
            </div>
            <div>
              <label style={baseStyles.searchLabel}>Lens Type:</label>
              <input
                type="text"
                style={baseStyles.searchInput}
                value={lensesDetail}
                onChange={(e) => setLensesDetail(e.target.value)}
                placeholder="Lens type (e.g. Single Vision, Progressive)"
              />
            </div>
          </div>

          {/* Eye Prescription Table Inputs */}
          <div>
            <label style={{ ...baseStyles.searchLabel, color: '#60a5fa' }}>Eye Prescription Power (D.V. & N.V.):</label>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'center', color: '#f8fafc', background: '#0f172a', borderRadius: '8px', border: '1px solid #334155' }}>
                <thead>
                  <tr style={{ background: '#1e293b' }}>
                    <th style={{ padding: '6px', border: '1px solid #334155' }}>Type</th>
                    <th colSpan="3" style={{ padding: '6px', border: '1px solid #334155', color: '#38bdf8' }}>Right Eye (R.E.)</th>
                    <th colSpan="3" style={{ padding: '6px', border: '1px solid #334155', color: '#a78bfa' }}>Left Eye (L.E.)</th>
                  </tr>
                  <tr style={{ background: '#0f172a' }}>
                    <th style={{ padding: '4px', border: '1px solid #334155' }}></th>
                    <th style={{ padding: '4px', border: '1px solid #334155' }}>SPH</th>
                    <th style={{ padding: '4px', border: '1px solid #334155' }}>CYL</th>
                    <th style={{ padding: '4px', border: '1px solid #334155' }}>AXIS</th>
                    <th style={{ padding: '4px', border: '1px solid #334155' }}>SPH</th>
                    <th style={{ padding: '4px', border: '1px solid #334155' }}>CYL</th>
                    <th style={{ padding: '4px', border: '1px solid #334155' }}>AXIS</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: '6px', fontWeight: 'bold', border: '1px solid #334155', background: '#1e293b' }}>D.V.</td>
                    <td style={{ padding: '2px', border: '1px solid #334155' }}><input type="text" style={{ width: '100%', background: 'transparent', border: 'none', color: '#fff', textAlign: 'center' }} value={dvReSph} onChange={(e) => setDvReSph(e.target.value)} placeholder="-" /></td>
                    <td style={{ padding: '2px', border: '1px solid #334155' }}><input type="text" style={{ width: '100%', background: 'transparent', border: 'none', color: '#fff', textAlign: 'center' }} value={dvReCyl} onChange={(e) => setDvReCyl(e.target.value)} placeholder="-" /></td>
                    <td style={{ padding: '2px', border: '1px solid #334155' }}><input type="text" style={{ width: '100%', background: 'transparent', border: 'none', color: '#fff', textAlign: 'center' }} value={dvReAxis} onChange={(e) => setDvReAxis(e.target.value)} placeholder="-" /></td>
                    <td style={{ padding: '2px', border: '1px solid #334155' }}><input type="text" style={{ width: '100%', background: 'transparent', border: 'none', color: '#fff', textAlign: 'center' }} value={dvLeSph} onChange={(e) => setDvLeSph(e.target.value)} placeholder="-" /></td>
                    <td style={{ padding: '2px', border: '1px solid #334155' }}><input type="text" style={{ width: '100%', background: 'transparent', border: 'none', color: '#fff', textAlign: 'center' }} value={dvLeCyl} onChange={(e) => setDvLeCyl(e.target.value)} placeholder="-" /></td>
                    <td style={{ padding: '2px', border: '1px solid #334155' }}><input type="text" style={{ width: '100%', background: 'transparent', border: 'none', color: '#fff', textAlign: 'center' }} value={dvLeAxis} onChange={(e) => setDvLeAxis(e.target.value)} placeholder="-" /></td>
                  </tr>
                  <tr>
                    <td style={{ padding: '6px', fontWeight: 'bold', border: '1px solid #334155', background: '#1e293b' }}>N.V.</td>
                    <td style={{ padding: '2px', border: '1px solid #334155' }}><input type="text" style={{ width: '100%', background: 'transparent', border: 'none', color: '#fff', textAlign: 'center' }} value={nvReSph} onChange={(e) => setNvReSph(e.target.value)} placeholder="-" /></td>
                    <td style={{ padding: '2px', border: '1px solid #334155' }}><input type="text" style={{ width: '100%', background: 'transparent', border: 'none', color: '#fff', textAlign: 'center' }} value={nvReCyl} onChange={(e) => setNvReCyl(e.target.value)} placeholder="-" /></td>
                    <td style={{ padding: '2px', border: '1px solid #334155' }}><input type="text" style={{ width: '100%', background: 'transparent', border: 'none', color: '#fff', textAlign: 'center' }} value={nvReAxis} onChange={(e) => setNvReAxis(e.target.value)} placeholder="-" /></td>
                    <td style={{ padding: '2px', border: '1px solid #334155' }}><input type="text" style={{ width: '100%', background: 'transparent', border: 'none', color: '#fff', textAlign: 'center' }} value={nvLeSph} onChange={(e) => setNvLeSph(e.target.value)} placeholder="-" /></td>
                    <td style={{ padding: '2px', border: '1px solid #334155' }}><input type="text" style={{ width: '100%', background: 'transparent', border: 'none', color: '#fff', textAlign: 'center' }} value={nvLeCyl} onChange={(e) => setNvLeCyl(e.target.value)} placeholder="-" /></td>
                    <td style={{ padding: '2px', border: '1px solid #334155' }}><input type="text" style={{ width: '100%', background: 'transparent', border: 'none', color: '#fff', textAlign: 'center' }} value={nvLeAxis} onChange={(e) => setNvLeAxis(e.target.value)} placeholder="-" /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Payment Details Section (Advance Payment & Balance Amount) */}
        <div style={{ ...baseStyles.searchSection, marginTop: '20px' }}>
          <h3 style={{ ...baseStyles.selectedProductsTitle, marginBottom: '14px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '8px', fontSize: '15px' }}>
            💳 Payment Details
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Advance Payment Group */}
            <div style={{ background: '#0f172a', padding: '14px', borderRadius: '8px', border: '1px solid #334155' }}>
              <h4 style={{ color: '#38bdf8', fontSize: '13px', margin: '0 0 10px 0', fontWeight: 'bold' }}>
                💵 Advance Payment
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={baseStyles.searchLabel}>Payment Method:</label>
                  <select
                    style={{ ...baseStyles.searchInput, cursor: 'pointer' }}
                    value={advancePaymentMethod}
                    onChange={(e) => setAdvancePaymentMethod(e.target.value)}
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="upi">UPI</option>
                    <option value="cheque">Cheque</option>
                    <option value="bank_transfer">Bank Transfer</option>
                  </select>
                </div>
                <div>
                  <label style={baseStyles.searchLabel}>Advance Amount (₹):</label>
                  <input
                    type="number"
                    style={baseStyles.searchInput}
                    value={advanceAmount}
                    onChange={(e) => setAdvanceAmount(parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            {/* Balance Amount Group */}
            <div style={{ background: '#0f172a', padding: '14px', borderRadius: '8px', border: '1px solid #334155' }}>
              <h4 style={{ color: '#f43f5e', fontSize: '13px', margin: '0 0 10px 0', fontWeight: 'bold' }}>
                💰 Balance Amount
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={baseStyles.searchLabel}>Payment Method:</label>
                  <select
                    style={{ ...baseStyles.searchInput, cursor: 'pointer' }}
                    value={balancePaymentMethod}
                    onChange={(e) => setBalancePaymentMethod(e.target.value)}
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="upi">UPI</option>
                    <option value="cheque">Cheque</option>
                    <option value="bank_transfer">Bank Transfer</option>
                  </select>
                </div>
                <div>
                  <label style={baseStyles.searchLabel}>Balance Amount (₹):</label>
                  <input
                    type="number"
                    style={baseStyles.searchInput}
                    value={balanceAmount}
                    onChange={(e) => setBalanceAmount(parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Lenscraft Order Form Bill Preview */}
      <div style={baseStyles.billPanel} className="no-print">
        <div style={baseStyles.billContainer}>
          <div
            style={{
              background: '#ffffff',
              color: '#0f172a',
              padding: '24px 26px',
              fontFamily: 'Arial, Helvetica, sans-serif',
              fontSize: '11.5px',
              border: '2.5px solid #1b4374',
              borderRadius: '6px',
              boxShadow: '0 15px 40px rgba(0,0,0,0.15)',
              width: '100%',
              maxWidth: '720px',
              boxSizing: 'border-box'
            }}
            id="billPaper"
            ref={billPaperRef}
          >
            {/* Header Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '12px', marginBottom: '10px' }}>
              {/* Left Side: Logo & Clinic Details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', maxWidth: '360px' }}>
                <div style={{ marginBottom: '4px' }}>
                  <img src="/lenscraft-logo.png" alt="Company Logo" style={{ height: '56px', maxWidth: '240px', width: 'auto', display: 'block', objectFit: 'contain' }} />
                </div>
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#1b4374', marginTop: '2px', lineHeight: '1.3' }}>
                  Computerised Eye Testing &amp; Contact Lens Clinic
                </div>
                <div style={{ fontSize: '10.5px', color: '#334155', lineHeight: '1.4' }}>
                  #10, Baker Street, Broadway, Chennai - 600001.<br />
                  <span style={{ fontWeight: 'bold' }}>Mobile: 9944340471</span>
                </div>
              </div>

              {/* Right Side: Customer Name, Mobile No, ORDER FORM NO Box */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px', width: '310px' }}>
                {/* Customer Name Line */}
                <div style={{ fontSize: '12.5px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #cbd5e1', paddingBottom: '3px' }}>
                  <span style={{ fontWeight: 'bold', minWidth: '85px', color: '#1b4374' }}>Name</span>
                  <span style={{ fontWeight: 'bold', color: '#1b4374', margin: '0 4px' }}>:</span>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Customer Name"
                    style={{
                      border: 'none',
                      background: 'transparent',
                      width: '100%',
                      fontSize: '13px',
                      fontWeight: 'bold',
                      outline: 'none',
                      color: '#0f172a',
                      fontFamily: 'inherit',
                      textAlign: 'left',
                      paddingLeft: '6px'
                    }}
                  />
                </div>

                {/* Customer Mobile No Line */}
                <div style={{ fontSize: '12.5px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #cbd5e1', paddingBottom: '3px' }}>
                  <span style={{ fontWeight: 'bold', minWidth: '85px', color: '#1b4374' }}>Mobile No</span>
                  <span style={{ fontWeight: 'bold', color: '#1b4374', margin: '0 4px' }}>:</span>
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={handlePhoneChange}
                    placeholder="Mobile Number"
                    maxLength="10"
                    style={{
                      border: 'none',
                      background: 'transparent',
                      width: '100%',
                      fontSize: '13px',
                      fontWeight: 'bold',
                      outline: 'none',
                      color: '#0f172a',
                      fontFamily: 'inherit',
                      textAlign: 'left',
                      paddingLeft: '6px'
                    }}
                  />
                </div>

                {/* Customer Address Line */}
                <div style={{ fontSize: '12.5px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #cbd5e1', paddingBottom: '3px' }}>
                  <span style={{ fontWeight: 'bold', minWidth: '85px', color: '#1b4374' }}>Address</span>
                  <span style={{ fontWeight: 'bold', color: '#1b4374', margin: '0 4px' }}>:</span>
                  <input
                    type="text"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    placeholder="Address"
                    style={{
                      border: 'none',
                      background: 'transparent',
                      width: '100%',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      outline: 'none',
                      color: '#0f172a',
                      fontFamily: 'inherit',
                      textAlign: 'left',
                      paddingLeft: '6px'
                    }}
                  />
                </div>

                {/* Customer DOB Line */}
                <div style={{ fontSize: '12.5px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #cbd5e1', paddingBottom: '3px' }}>
                  <span style={{ fontWeight: 'bold', minWidth: '85px', color: '#1b4374' }}>DOB</span>
                  <span style={{ fontWeight: 'bold', color: '#1b4374', margin: '0 4px' }}>:</span>
                  <input
                    type="date"
                    value={customerDob}
                    onChange={(e) => setCustomerDob(e.target.value)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      width: '100%',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      outline: 'none',
                      color: '#0f172a',
                      fontFamily: 'inherit',
                      textAlign: 'left',
                      paddingLeft: '6px'
                    }}
                  />
                </div>

                {/* Invoice No Line */}
                <div style={{ fontSize: '12.5px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #cbd5e1', paddingBottom: '3px' }}>
                  <span style={{ fontWeight: 'bold', minWidth: '85px', color: '#1b4374' }}>Invoice No</span>
                  <span style={{ fontWeight: 'bold', color: '#1b4374', margin: '0 4px' }}>:</span>
                  <div style={{ width: '100%', textAlign: 'left', paddingLeft: '6px', fontSize: '13px', fontWeight: '800', color: '#1b4374', fontFamily: "'Courier New', monospace", letterSpacing: '0.5px' }}>
                    {billNumber || '0007'}
                  </div>
                </div>
              </div>
            </div>

            {/* Double Horizontal Divider Line */}
            <div style={{ borderTop: '2px solid #1b4374', borderBottom: '1px solid #1b4374', height: '2px', marginBottom: '12px' }}></div>

            {/* Sub-Header Meta Bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1.5px solid #1b4374', borderRadius: '4px', padding: '6px 12px', fontSize: '11px', marginBottom: '14px', background: '#e8f2fc', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}>
                <strong style={{ color: '#1b4374', whiteSpace: 'nowrap' }}>Order Date :</strong> <span style={{ fontWeight: 'bold', color: '#0f172a' }}>{currentDate}</span>
              </div>
              <div style={{ width: '1px', height: '18px', background: '#94a3b8' }}></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}>
                <strong style={{ color: '#1b4374', whiteSpace: 'nowrap' }}>Due Date :</strong>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  style={{ border: 'none', borderBottom: '1px dashed #1b4374', background: 'transparent', fontSize: '11px', outline: 'none', width: '125px', color: '#0f172a', fontWeight: 'bold', fontFamily: 'inherit', cursor: 'pointer' }}
                />
              </div>
              <div style={{ width: '1px', height: '18px', background: '#94a3b8' }}></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}>
                <strong style={{ color: '#1b4374', whiteSpace: 'nowrap' }}>Time :</strong>
                <input
                  type="text"
                  value={orderTime || currentTime}
                  onChange={(e) => setOrderTime(e.target.value)}
                  placeholder="11:35 AM"
                  style={{ border: 'none', borderBottom: '1px dashed #1b4374', background: 'transparent', fontSize: '11px', outline: 'none', width: '85px', color: '#0f172a', fontWeight: 'bold', fontFamily: 'inherit' }}
                />
              </div>
              <div style={{ width: '1px', height: '18px', background: '#94a3b8' }}></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}>
                <strong style={{ color: '#1b4374', whiteSpace: 'nowrap' }}>By Courier :</strong>
                <input
                  type="text"
                  value={byCourier}
                  onChange={(e) => setByCourier(e.target.value)}
                  placeholder="No"
                  style={{ border: 'none', borderBottom: '1px dashed #1b4374', background: 'transparent', fontSize: '11px', outline: 'none', width: '50px', color: '#0f172a', fontWeight: 'bold', fontFamily: 'inherit' }}
                />
              </div>
            </div>

            {/* Main 2-Column Section */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '14px', marginBottom: '12px' }}>
              {/* Left Column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Frame Details Card - Display ONLY Frame Name & Lens Type */}
                <div style={{ border: '1.5px solid #1b4374', borderRadius: '4px', overflow: 'hidden', background: '#fff' }}>
                  <div style={{ background: '#1b4374', color: '#ffffff', fontWeight: 'bold', fontSize: '11.5px', padding: '6px 12px' }}>
                    Frame Details
                  </div>
                  <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px dotted #cbd5e1', paddingBottom: '3px' }}>
                      <span style={{ fontWeight: 'bold', color: '#1b4374', width: '95px' }}>Frame Name</span>
                      <span style={{ fontWeight: 'bold', color: '#1b4374', margin: '0 4px' }}>:</span>
                      <input
                        type="text"
                        value={frameNo || frameDetail}
                        onChange={(e) => {
                          setFrameNo(e.target.value);
                          setFrameDetail(e.target.value);
                        }}
                        placeholder="Frame Name"
                        style={{ border: 'none', background: 'transparent', fontSize: '11px', outline: 'none', width: '100%', color: '#0f172a' }}
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', paddingBottom: '2px' }}>
                      <span style={{ fontWeight: 'bold', color: '#1b4374', width: '95px' }}>Lens Type</span>
                      <span style={{ fontWeight: 'bold', color: '#1b4374', margin: '0 4px' }}>:</span>
                      <input
                        type="text"
                        value={lensesDetail}
                        onChange={(e) => setLensesDetail(e.target.value)}
                        placeholder="Lens Type"
                        style={{ border: 'none', background: 'transparent', fontSize: '11px', outline: 'none', width: '100%', color: '#0f172a' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Eye Prescription Table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid #1b4374', borderRadius: '4px', textAlign: 'center', fontSize: '11px', overflow: 'hidden' }}>
                  <thead>
                    <tr>
                      <th style={{ border: '1px solid #1b4374', width: '18%', padding: '6px', background: '#e8f2fc' }}></th>
                      <th colSpan="3" style={{ border: '1px solid #1b4374', fontWeight: 'bold', padding: '6px', fontSize: '11.5px', background: '#1b4374', color: '#ffffff' }}>R.E.</th>
                      <th colSpan="3" style={{ border: '1px solid #1b4374', fontWeight: 'bold', padding: '6px', fontSize: '11.5px', background: '#1b4374', color: '#ffffff' }}>L.E.</th>
                    </tr>
                    <tr style={{ background: '#e8f2fc', color: '#1b4374' }}>
                      <th style={{ border: '1px solid #1b4374', padding: '4px' }}></th>
                      <th style={{ border: '1px solid #1b4374', padding: '4px', fontWeight: 'bold' }}>SPH</th>
                      <th style={{ border: '1px solid #1b4374', padding: '4px', fontWeight: 'bold' }}>CYL</th>
                      <th style={{ border: '1px solid #1b4374', padding: '4px', fontWeight: 'bold' }}>AXIS</th>
                      <th style={{ border: '1px solid #1b4374', padding: '4px', fontWeight: 'bold' }}>SPH</th>
                      <th style={{ border: '1px solid #1b4374', padding: '4px', fontWeight: 'bold' }}>CYL</th>
                      <th style={{ border: '1px solid #1b4374', padding: '4px', fontWeight: 'bold' }}>AXIS</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ border: '1px solid #1b4374', fontWeight: 'bold', background: '#e8f2fc', color: '#1b4374', padding: '6px' }}>D.V.</td>
                      <td style={{ border: '1px solid #1b4374', padding: '2px' }}><input type="text" style={{ width: '100%', border: 'none', background: 'transparent', textAlign: 'center', fontSize: '11px', fontWeight: 'bold', outline: 'none' }} value={dvReSph} onChange={(e) => setDvReSph(e.target.value)} placeholder="-" /></td>
                      <td style={{ border: '1px solid #1b4374', padding: '2px' }}><input type="text" style={{ width: '100%', border: 'none', background: 'transparent', textAlign: 'center', fontSize: '11px', fontWeight: 'bold', outline: 'none' }} value={dvReCyl} onChange={(e) => setDvReCyl(e.target.value)} placeholder="-" /></td>
                      <td style={{ border: '1px solid #1b4374', padding: '2px' }}><input type="text" style={{ width: '100%', border: 'none', background: 'transparent', textAlign: 'center', fontSize: '11px', fontWeight: 'bold', outline: 'none' }} value={dvReAxis} onChange={(e) => setDvReAxis(e.target.value)} placeholder="-" /></td>
                      <td style={{ border: '1px solid #1b4374', padding: '2px' }}><input type="text" style={{ width: '100%', border: 'none', background: 'transparent', textAlign: 'center', fontSize: '11px', fontWeight: 'bold', outline: 'none' }} value={dvLeSph} onChange={(e) => setDvLeSph(e.target.value)} placeholder="-" /></td>
                      <td style={{ border: '1px solid #1b4374', padding: '2px' }}><input type="text" style={{ width: '100%', border: 'none', background: 'transparent', textAlign: 'center', fontSize: '11px', fontWeight: 'bold', outline: 'none' }} value={dvLeCyl} onChange={(e) => setDvLeCyl(e.target.value)} placeholder="-" /></td>
                      <td style={{ border: '1px solid #1b4374', padding: '2px' }}><input type="text" style={{ width: '100%', border: 'none', background: 'transparent', textAlign: 'center', fontSize: '11px', fontWeight: 'bold', outline: 'none' }} value={dvLeAxis} onChange={(e) => setDvLeAxis(e.target.value)} placeholder="-" /></td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #1b4374', fontWeight: 'bold', background: '#e8f2fc', color: '#1b4374', padding: '6px' }}>N.V.</td>
                      <td style={{ border: '1px solid #1b4374', padding: '2px' }}><input type="text" style={{ width: '100%', border: 'none', background: 'transparent', textAlign: 'center', fontSize: '11px', fontWeight: 'bold', outline: 'none' }} value={nvReSph} onChange={(e) => setNvReSph(e.target.value)} placeholder="-" /></td>
                      <td style={{ border: '1px solid #1b4374', padding: '2px' }}><input type="text" style={{ width: '100%', border: 'none', background: 'transparent', textAlign: 'center', fontSize: '11px', fontWeight: 'bold', outline: 'none' }} value={nvReCyl} onChange={(e) => setNvReCyl(e.target.value)} placeholder="-" /></td>
                      <td style={{ border: '1px solid #1b4374', padding: '2px' }}><input type="text" style={{ width: '100%', border: 'none', background: 'transparent', textAlign: 'center', fontSize: '11px', fontWeight: 'bold', outline: 'none' }} value={nvReAxis} onChange={(e) => setNvReAxis(e.target.value)} placeholder="-" /></td>
                      <td style={{ border: '1px solid #1b4374', padding: '2px' }}><input type="text" style={{ width: '100%', border: 'none', background: 'transparent', textAlign: 'center', fontSize: '11px', fontWeight: 'bold', outline: 'none' }} value={nvLeSph} onChange={(e) => setNvLeSph(e.target.value)} placeholder="-" /></td>
                      <td style={{ border: '1px solid #1b4374', padding: '2px' }}><input type="text" style={{ width: '100%', border: 'none', background: 'transparent', textAlign: 'center', fontSize: '11px', fontWeight: 'bold', outline: 'none' }} value={nvLeCyl} onChange={(e) => setNvLeCyl(e.target.value)} placeholder="-" /></td>
                      <td style={{ border: '1px solid #1b4374', padding: '2px' }}><input type="text" style={{ width: '100%', border: 'none', background: 'transparent', textAlign: 'center', fontSize: '11px', fontWeight: 'bold', outline: 'none' }} value={nvLeAxis} onChange={(e) => setNvLeAxis(e.target.value)} placeholder="-" /></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Right Column: Amount Table */}
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid #1b4374', borderRadius: '4px', fontSize: '11.5px', background: '#fff', overflow: 'hidden' }}>
                  <thead>
                    <tr style={{ background: '#1b4374', color: '#ffffff' }}>
                      <th style={{ border: '1px solid #1b4374', padding: '8px 12px', textAlign: 'left', fontWeight: 'bold' }}>DESCRIPTION</th>
                      <th style={{ border: '1px solid #1b4374', padding: '8px 12px', textAlign: 'right', fontWeight: 'bold', width: '38%' }}>AMOUNT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeProducts.length > 0 ? (
                      activeProducts.map((p, idx) => (
                        <tr key={idx}>
                          <td style={{ border: '1px solid #1b4374', padding: '6px 10px', color: '#0f172a' }}>
                            {p.name + (p.model ? ' (' + p.model + ')' : '') + (p.quantity > 1 ? ' x' + p.quantity : '')}
                          </td>
                          <td style={{ border: '1px solid #1b4374', padding: '6px 10px', textAlign: 'right', fontWeight: 'bold', color: '#0f172a' }}>
                            ₹{p.total.toFixed(2)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td style={{ border: '1px solid #1b4374', padding: '8px 10px', color: '#475569' }}>Lenses / Frame</td>
                        <td style={{ border: '1px solid #1b4374', padding: '8px 10px', textAlign: 'right', color: '#475569' }}>-</td>
                      </tr>
                    )}

                    {/* Pad empty rows so height matches left column */}
                    {Array.from({ length: Math.max(0, 3 - activeProducts.length) }).map((_, i) => (
                      <tr key={'empty-' + i}>
                        <td style={{ border: '1px solid #1b4374', padding: '8px' }}>&nbsp;</td>
                        <td style={{ border: '1px solid #1b4374', padding: '8px' }}>&nbsp;</td>
                      </tr>
                    ))}

                    <tr style={{ background: '#e8f2fc' }}>
                      <td style={{ border: '1px solid #1b4374', padding: '8px 12px', fontWeight: 'bold', textAlign: 'right', fontSize: '12px', color: '#1b4374' }}>TOTAL</td>
                      <td style={{ border: '1px solid #1b4374', padding: '8px 12px', textAlign: 'right', fontWeight: 'bold', fontSize: '13px', color: '#1b4374' }}>₹{total.toFixed(2)}</td>
                    </tr>
                    <tr style={{ background: '#e8f2fc' }}>
                      <td style={{ border: '1px solid #1b4374', padding: '6px 12px', fontWeight: 'bold', textAlign: 'right', color: '#1b4374' }}>
                        Adv. Recd. ({(advancePaymentMethod || 'cash').toUpperCase().replace('_', ' ')})
                      </td>
                      <td style={{ border: '1px solid #1b4374', padding: '4px 8px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '2px' }}>
                          <span style={{ fontWeight: 'bold', color: '#1b4374' }}>₹</span>
                          <input
                            type="number"
                            value={advanceAmount}
                            onChange={(e) => setAdvanceAmount(parseFloat(e.target.value) || 0)}
                            min="0"
                            step="0.01"
                            style={{
                              border: 'none',
                              background: 'transparent',
                              width: '75px',
                              padding: '2px 4px',
                              textAlign: 'right',
                              fontSize: '12px',
                              fontWeight: 'bold',
                              outline: 'none',
                              color: '#1b4374'
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                    <tr style={{ background: '#e8f2fc' }}>
                      <td style={{ border: '1px solid #1b4374', padding: '6px 12px', fontWeight: 'bold', textAlign: 'right', color: '#1b4374' }}>
                        Balance Amt. ({(balancePaymentMethod || 'cash').toUpperCase().replace('_', ' ')})
                      </td>
                      <td style={{ border: '1px solid #1b4374', padding: '4px 8px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '2px' }}>
                          <span style={{ fontWeight: 'bold', color: '#1b4374' }}>₹</span>
                          <input
                            type="number"
                            value={balanceAmount}
                            onChange={(e) => setBalanceAmount(parseFloat(e.target.value) || 0)}
                            min="0"
                            step="0.01"
                            style={{
                              border: 'none',
                              background: 'transparent',
                              width: '75px',
                              padding: '2px 4px',
                              textAlign: 'right',
                              fontSize: '12px',
                              fontWeight: 'bold',
                              outline: 'none',
                              color: '#1b4374'
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                    {due > 0 && (
                      <tr style={{ background: '#fef2f2' }}>
                        <td style={{ border: '1px solid #1b4374', padding: '6px 12px', fontWeight: 'bold', textAlign: 'right', color: '#b91c1c' }}>Remaining Due</td>
                        <td style={{ border: '1px solid #1b4374', padding: '6px 12px', textAlign: 'right', fontWeight: 'bold', fontSize: '13px', color: '#b91c1c' }}>₹{due.toFixed(2)}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* NOTES Card - Horizontally across full bottom width */}
            <div style={{ border: '1.5px solid #1b4374', borderRadius: '4px', overflow: 'hidden', background: '#fff', width: '100%', marginTop: '12px' }}>
              <div style={{ background: '#1b4374', color: '#ffffff', fontWeight: 'bold', fontSize: '11.5px', padding: '6px 12px' }}>
                NOTES :
              </div>
              <div style={{ padding: '8px 14px', fontSize: '10px', lineHeight: '1.55', background: '#f0f7ff', color: '#1e293b' }}>
                <div>1. No Guarantee.</div>
                <div>2. Rimless Glasses, Lenses no warranty.</div>
                <div>3. For all frames only service is eligible on the nature of complaints.</div>
                <div>4. Order once taken will not be cancelled on any circumstances.</div>
                <div>5. Spectacles must be collected within 15 days from the date of order.</div>
                <div>6. Subsequently No claim after that if the job is untraceable.</div>
                <div>7. The Company will try its best to execute order within delivery date, but under no circumstances order can be cancelled if its delayed due to unforeseen circumstances.</div>
                <div>8. All CR reslenses are scratch resistant only, not scratch proof.</div>
              </div>
            </div>
          </div>

          <div style={{ ...baseStyles.actionButtons, gridTemplateColumns: 'repeat(3, 1fr)' }} className="no-print">
            <button
              style={{
                ...baseStyles.btn,
                ...baseStyles.btnPrimary,
                ...(loading || activeProducts.length === 0 ? baseStyles.btnDisabled : {})
              }}
              onClick={handlePrint}
              disabled={loading || activeProducts.length === 0}
            >
              {loading ? '⏳ Saving...' : '🖨️ Print'}
            </button>
            <button
              style={{
                ...baseStyles.btn,
                ...baseStyles.btnSuccess,
                ...(loading || activeProducts.length === 0 ? baseStyles.btnDisabled : {})
              }}
              onClick={handlePaymentComplete}
              disabled={loading || activeProducts.length === 0}
            >
              {loading ? '⏳ Saving...' : '💰 Pay & Download'}
            </button>
            <button
              style={{
                ...baseStyles.btn,
                ...baseStyles.btnWhatsapp,
                ...(loading || activeProducts.length === 0 ? baseStyles.btnDisabled : {})
              }}
              onClick={handleWhatsAppShare}
              disabled={loading || activeProducts.length === 0}
              title="Share bill link via WhatsApp"
            >
              📱 WhatsApp
            </button>
            <button
              style={{
                ...baseStyles.btn,
                ...baseStyles.btnInfo,
                ...(loading ? baseStyles.btnDisabled : {})
              }}
              onClick={handleNewBill}
              disabled={loading}
              title="Start a fresh bill"
            >
              🆕 New Bill
            </button>
            <button
              style={{
                ...baseStyles.btn,
                ...baseStyles.btnDanger,
                gridColumn: 'span 2',
                ...(loading ? baseStyles.btnDisabled : {})
              }}
              onClick={() => clearBill(true)}
              disabled={loading}
              title="Delete current draft bill"
            >
              🗑️ Delete Draft Bill
            </button>
          </div>

          {/* WhatsApp Share Button - Always visible when bill is saved */}
          {showWhatsApp && lastGeneratedBill && (
            <button
              style={baseStyles.whatsappButton}
              onClick={handleWhatsAppShare}
              onMouseEnter={(e) => e.currentTarget.style.background = '#128C7E'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#25D366'}
            >
              <span>📱</span>
              Share Bill on WhatsApp to {customerPhone || 'Customer'}
            </button>
          )}

          {billSaved && (
            <p style={{ fontSize: '10px', color: '#28a745', textAlign: 'center', marginTop: '5px' }}>
              ✓ Bill saved to database
            </p>
          )}
        </div>
      </div>

      {/* Hidden download link */}
      <a ref={downloadLinkRef} style={baseStyles.downloadLink}></a>
    </div>
  );
};

export default Bill;