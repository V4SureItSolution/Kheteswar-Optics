import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDate, formatTime, formatDateTime, parseDateTime } from '../utils/dateUtils';
import { shareBillOnWhatsAppWithPdf, generateBillPdfDoc } from '../utils/billPdfGenerator';
import {
  Search,
  Eye,
  Printer,
  Trash2,
  RefreshCw,
  X,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  DollarSign,
  Smartphone,
  FileText,
  FileSpreadsheet,
  FileJson,
  Filter,
  Download,
  Calendar,
  User,
  Phone,
  Mail,
  MapPin,
  Hash,
  Tag,
  Package,
  IndianRupee,
  Receipt,
  Copy,
  CheckCircle,
  AlertCircle,
  Clock,
  Home,
  Briefcase,
  Users,
  TrendingUp,
  Wallet,
  Banknote,
  Landmark,
  MessageCircle,
  Building2,
  Store,
  Globe
} from 'lucide-react';

// Crown icon component for VIP customers
const Crown = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={props.size || 24}
    height={props.size || 24}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M2 4l3 12h14l3-12-6 3-4-6-4 3-6-3z" />
  </svg>
);

const VisitBillPage = () => {
  const [bills, setBills] = useState([]);
  const [filteredBills, setFilteredBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedBill, setSelectedBill] = useState(null);
  const [showBillModal, setShowBillModal] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [copiedBillNo, setCopiedBillNo] = useState(null);
  const [whatsappStatus, setWhatsappStatus] = useState({});

  // Company/Shop Details from Backend
  const [companyDetails, setCompanyDetails] = useState({
    name: "KHETESWAR OPTICS",
    address: "128, Baker Street, Broadway",
    city: "Chennai - 600001",
    phone: "7708560890",
    email: "",
    gst: "",
    logo: null,
    logoUrl: null
  });

  const [selectedCompanyId, setSelectedCompanyId] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [showCompanySelector, setShowCompanySelector] = useState(false);
  const [loadingCompany, setLoadingCompany] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState('all');
  const [filterCustomerType, setFilterCustomerType] = useState('all');
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  });
  const [sortBy, setSortBy] = useState('newest');

  const API_BASE_URL = 'http://localhost:5000/api';

  // Create axios instance with credentials
  const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  // Payment method icons and colors
  const paymentMethodMap = {
    cash: { icon: <DollarSign size={14} />, color: '#059669', label: 'Cash' },
    card: { icon: <CreditCard size={14} />, color: '#3b82f6', label: 'Card' },
    upi: { icon: <Smartphone size={14} />, color: '#8b5cf6', label: 'UPI' },
    cheque: { icon: <FileText size={14} />, color: '#f59e0b', label: 'Cheque' },
    mixed: { icon: <Filter size={14} />, color: '#6b7280', label: 'Mixed' }
  };

  // Customer type icons and colors
  const customerTypeMap = {
    internal: { icon: <Briefcase size={14} />, color: '#3b82f6', label: 'Internal' },
    external: { icon: <Users size={14} />, color: '#f59e0b', label: 'External' },
    regular: { icon: <User size={14} />, color: '#6b7280', label: 'Regular' },
    wholesale: { icon: <TrendingUp size={14} />, color: '#8b5cf6', label: 'Wholesale' },
    vip: { icon: <Crown size={14} />, color: '#d97706', label: 'VIP' },
    corporate: { icon: <Briefcase size={14} />, color: '#2563eb', label: 'Corporate' }
  };

  // Fetch companies and bills on mount
  useEffect(() => {
    fetchCompanies();
    fetchBills();
  }, []);

  // Reload bills if selected company changes
  useEffect(() => {
    if (selectedCompanyId) {
      fetchBills();
    }
  }, [selectedCompanyId]);

  // Apply filters whenever filter criteria change
  useEffect(() => {
    applyFilters();
  }, [bills, searchTerm, filterPaymentMethod, filterCustomerType, dateRange, sortBy]);

  // Auto-hide message after 3 seconds
  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => {
        setMessage({ type: "", text: "" });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const showMessage = (type, text) => {
    setMessage({ type, text });
  };

  // Fetch companies from backend
  const fetchCompanies = async () => {
    setLoadingCompany(true);
    try {
      const response = await api.get('/companies/list');
      console.log('Companies response:', response.data);

      if (response.data && response.data.length > 0) {
        setCompanies(response.data);
        // Auto-select first company
        const firstCompany = response.data[0];
        setSelectedCompanyId(firstCompany.id);
        await fetchCompanyDetails(firstCompany.id);
      } else {
        // Use default company details
        setCompanyDetails({
          name: "KHETESWAR OPTICS",
          address: "128, Baker Street, Broadway",
          city: "Chennai - 600001",
          phone: "7708560890",
          email: "",
          gst: "",
          logo: null,
          logoUrl: null
        });
      }
    } catch (err) {
      console.error('Error fetching companies:', err);
      showMessage("error", "❌ Failed to fetch company details");
      // Use default company details
      setCompanyDetails({
        name: "KHETESWAR OPTICS",
        address: "128, Baker Street, Broadway",
        city: "Chennai - 600001",
        phone: "7708560890",
        email: "",
        gst: "",
        logo: null,
        logoUrl: null
      });
    } finally {
      setLoadingCompany(false);
    }
  };

  // Fetch company details by ID
  const fetchCompanyDetails = async (companyId) => {
    try {
      const response = await api.get(`/companies/${companyId}`);
      console.log('Company details:', response.data);

      const company = response.data;
      setCompanyDetails({
        name: company.name || "KHETESWAR OPTICS",
        address: company.address || "128, Baker Street, Broadway",
        city: company.city || "Chennai - 600001",
        phone: company.phone || "7708560890",
        email: company.email || "",
        gst: company.gst_number || company.gst || "",
        logo: company.logo || null,
        logoUrl: company.logo_url || null
      });
    } catch (err) {
      console.error('Error fetching company details:', err);
      // Keep existing company details if fetch fails
    }
  };

  // Handle company selection
  const handleCompanySelect = async (company) => {
    setSelectedCompanyId(company.id);
    setShowCompanySelector(false);
    await fetchCompanyDetails(company.id);
    showMessage("success", `✅ Switched to ${company.name}`);
    fetchBills(); // Refresh bills for the selected company
  };

  const fetchBills = async () => {
    setLoading(true);
    setError('');

    try {
      // Build query string to request all bills and filter by selected company if set
      let queryParams = `?per_page=500`;
      if (selectedCompanyId) {
        queryParams += `&company_id=${selectedCompanyId}`;
      }

      // Try different possible endpoints
      const endpoints = [
        `${API_BASE_URL}/billing/bills${queryParams}`,
        `${API_BASE_URL}/bills${queryParams}`,
        `${API_BASE_URL}/visit-bills${queryParams}`,
        `${API_BASE_URL}/billing/visit-bills${queryParams}`
      ];

      let response = null;
      let success = false;

      for (const endpoint of endpoints) {
        try {
          console.log('Trying endpoint:', endpoint);
          response = await api.get(endpoint);
          if (response.data) {
            success = true;
            console.log('Success with endpoint:', endpoint);
            break;
          }
        } catch (err) {
          console.log(`Endpoint ${endpoint} failed:`, err.message);
        }
      }

      if (!success || !response) {
        throw new Error('Could not fetch bills from any endpoint');
      }

      console.log('API Response:', response.data);

      // Extract bills data from response
      let billsData = [];

      if (Array.isArray(response.data)) {
        billsData = response.data;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        billsData = response.data.data;
      } else if (response.data.bills && Array.isArray(response.data.bills)) {
        billsData = response.data.bills;
      } else if (response.data.results && Array.isArray(response.data.results)) {
        billsData = response.data.results;
      } else if (typeof response.data === 'object') {
        // Try to find any array property
        for (const key in response.data) {
          if (Array.isArray(response.data[key])) {
            billsData = response.data[key];
            break;
          }
        }
      }

      if (billsData.length === 0) {
        console.log('No bills data found in response');
        setBills([]);
        setFilteredBills([]);
        showMessage("info", "ℹ️ No bills found");
        setLoading(false);
        return;
      }

      // Process bills to ensure all fields are properly mapped
      const processedBills = billsData.map(bill => {
        // Handle discount - it could be amount or percentage
        let discountValue = parseFloat(bill.discount || bill.discount_amount || 0);
        let discountType = bill.discountType || bill.discount_type || 'amount';
        let subtotal = parseFloat(bill.subtotal || bill.sub_total || 0);

        // Calculate actual discount amount
        let discountAmount = discountValue;
        if (discountType === 'percentage' && subtotal > 0) {
          discountAmount = (subtotal * discountValue) / 100;
        }

        return {
          id: bill.id || bill._id || Math.random().toString(),
          billNumber: bill.billNumber || bill.bill_number || bill.billNo || bill.invoiceNo || `BILL-${Date.now()}`,
          customerName: bill.customerName || bill.customer_name || bill.customer?.name || 'Walk-in Customer',
          customerPhone: bill.customerPhone || bill.customer_phone || bill.customer?.phone || '',
          customerEmail: bill.customerEmail || bill.customer_email || bill.customer?.email || '',
          customerGst: bill.customerGst || bill.customer_gst || bill.customer?.gst || '',
          customerAddress: bill.customerAddress || bill.customer_address || bill.customer?.address || '',
          customerDob: bill.customerDob || bill.customer_dob || bill.customer?.dob || bill.dob || 'dd-mm-yyyy',
          customerType: bill.customerType || bill.customer_type || bill.customer?.type || 'external',
          frameName: bill.frameName || bill.frame_name || bill.frameNo || bill.frame_no || '-',
          lensType: bill.lensType || bill.lens_type || bill.lensesDetail || bill.lenses_detail || '-',
          dueDate: bill.dueDate || bill.due_date || (bill.createdAt ? formatDate(bill.createdAt) : '-'),
          byCourier: bill.byCourier || bill.by_courier || bill.courier || 'No',
          dvReSph: bill.dvReSph || bill.dv_re_sph || '-',
          dvReCyl: bill.dvReCyl || bill.dv_re_cyl || '-',
          dvReAxis: bill.dvReAxis || bill.dv_re_axis || '-',
          dvLeSph: bill.dvLeSph || bill.dv_le_sph || '-',
          dvLeCyl: bill.dvLeCyl || bill.dv_le_cyl || '-',
          dvLeAxis: bill.dvLeAxis || bill.dv_le_axis || '-',
          nvReSph: bill.nvReSph || bill.nv_re_sph || '-',
          nvReCyl: bill.nvReCyl || bill.nv_re_cyl || '-',
          nvReAxis: bill.nvReAxis || bill.nv_re_axis || '-',
          nvLeSph: bill.nvLeSph || bill.nv_le_sph || '-',
          nvLeCyl: bill.nvLeCyl || bill.nv_le_cyl || '-',
          nvLeAxis: bill.nvLeAxis || bill.nv_le_axis || '-',
          subtotal: subtotal,
          discountValue: discountValue,
          discountAmount: discountAmount,
          discountType: discountType,
          tax: parseFloat(bill.tax || bill.taxAmount || 0),
          taxType: bill.taxType || bill.tax_type || 'percentage',
          total: parseFloat(bill.total || bill.grandTotal || bill.amount || 0),
          paidAmount: parseFloat(bill.paidAmount || bill.paid_amount || bill.paid || 0),
          advanceAmount: parseFloat(bill.advanceAmount || bill.advance_amount || bill.paidAmount || bill.paid_amount || 0),
          advancePaymentMethod: bill.advancePaymentMethod || bill.advance_payment_method || bill.paymentMethod || 'cash',
          balanceAmount: parseFloat(bill.balanceAmount || bill.balance_amount || (Math.max(0, (parseFloat(bill.total || bill.grandTotal || bill.amount || 0) - parseFloat(bill.advanceAmount || bill.advance_amount || bill.paidAmount || bill.paid_amount || 0))))),
          balancePaymentMethod: bill.balancePaymentMethod || bill.balance_payment_method || 'cash',
          changeAmount: parseFloat(bill.changeAmount || bill.change_amount || bill.change || 0),
          paymentMethod: bill.paymentMethod || bill.payment_method || bill.payment?.method || 'cash',
          createdAt: bill.createdAt || bill.created_at || bill.date || new Date().toISOString(),
          updatedAt: bill.updatedAt || bill.updated_at,
          createdBy: bill.createdBy || bill.created_by,
          items: Array.isArray(bill.items) ? bill.items.map(item => {
            const qty = parseInt(item.quantity || item.qty || 1);
            const rate = parseFloat(item.sellPrice || item.sell_price || item.price || 0);
            const itemTot = parseFloat(item.total || item.subtotal || (qty * rate) || 0);
            return {
              id: item.id || item._id,
              productId: item.productId || item.product_id || item.product,
              productName: item.productName || item.product_name || item.name || 'Unknown',
              productModel: item.productModel || item.product_model || item.model || '',
              productType: item.productType || item.product_type || item.type || '',
              sellPrice: rate,
              quantity: qty,
              total: itemTot,
            };
          }) : [],
          payments: Array.isArray(bill.payments) ? bill.payments.map(payment => ({
            id: payment.id || payment._id,
            paymentId: payment.paymentId || payment.payment_id,
            amount: parseFloat(payment.amount || 0),
            method: payment.method || 'cash',
            status: payment.status || 'completed',
            reference: payment.reference || '',
            notes: payment.notes || '',
            createdAt: payment.createdAt || payment.created_at
          })) : [],
          raw: bill
        };
      });

      // Calculate item count and due amount for each bill
      processedBills.forEach(bill => {
        bill.itemCount = bill.itemCount || (bill.items ? bill.items.length : 0);
        bill.dueAmount = bill.total - bill.paidAmount;
      });

      // Display all bills in the reports
      const displayBills = processedBills;

      console.log('Processed Bills:', displayBills);

      setBills(displayBills);
      setFilteredBills(displayBills);

      showMessage("success", `✅ Loaded ${displayBills.length} bills successfully!`);
    } catch (err) {
      console.error('Error fetching bills:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load bills. Please try again.');
      showMessage("error", "❌ Failed to load bills");
    } finally {
      setLoading(false);
    }
  };

  const fetchBillDetails = async (billId) => {
    try {
      setLoading(true);

      // First check if we already have the bill in state
      const existingBill = bills.find(b => b.id === billId);
      if (existingBill && existingBill.items && existingBill.items.length > 0) {
        console.log('Using existing bill data');
        setSelectedBill(existingBill);
        setShowBillModal(true);
        setLoading(false);
        return;
      }

      // Try different endpoints for single bill
      const endpoints = [
        `${API_BASE_URL}/billing/bills/${billId}`,
        `${API_BASE_URL}/bills/${billId}`,
        `${API_BASE_URL}/visit-bills/${billId}`,
        `${API_BASE_URL}/billing/visit-bills/${billId}`
      ];

      let response = null;
      let success = false;

      for (const endpoint of endpoints) {
        try {
          console.log('Trying details endpoint:', endpoint);
          response = await api.get(endpoint);
          if (response.data) {
            success = true;
            console.log('Success with details endpoint:', endpoint);
            break;
          }
        } catch (err) {
          console.log(`Endpoint ${endpoint} failed:`, err.message);
        }
      }

      if (!success || !response) {
        // If API fails, use the existing bill data
        const billFromList = bills.find(b => b.id === billId);
        if (billFromList) {
          console.log('Using bill from list as fallback');
          setSelectedBill(billFromList);
          setShowBillModal(true);
          setLoading(false);
          return;
        }
        throw new Error('Could not fetch bill details');
      }

      console.log('Bill Details Response:', response.data);

      // Process the bill data
      const billData = response.data;

      // Handle discount - it could be amount or percentage
      let discountValue = parseFloat(billData.discount || billData.discount_amount || 0);
      let discountType = billData.discountType || billData.discount_type || 'amount';
      let subtotal = parseFloat(billData.subtotal || billData.sub_total || 0);

      // Calculate actual discount amount
      let discountAmount = discountValue;
      if (discountType === 'percentage' && subtotal > 0) {
        discountAmount = (subtotal * discountValue) / 100;
      }

      const processedBill = {
        id: billData.id || billData._id || billId,
        billNumber: billData.billNumber || billData.bill_number || billData.billNo || 'N/A',
        customerName: billData.customerName || billData.customer_name || billData.customer?.name || 'Walk-in Customer',
        customerPhone: billData.customerPhone || billData.customer_phone || billData.customer?.phone || '',
        customerEmail: billData.customerEmail || billData.customer_email || billData.customer?.email || '',
        customerGst: billData.customerGst || billData.customer_gst || billData.customer?.gst || '',
        customerAddress: billData.customerAddress || billData.customer_address || billData.customer?.address || '',
        customerDob: billData.customerDob || billData.customer_dob || billData.customer?.dob || billData.dob || 'dd-mm-yyyy',
        customerType: billData.customerType || billData.customer_type || billData.customer?.type || 'external',
        frameName: billData.frameName || billData.frame_name || billData.frameNo || billData.frame_no || '-',
        lensType: billData.lensType || billData.lens_type || billData.lensesDetail || billData.lenses_detail || '-',
        dueDate: billData.dueDate || billData.due_date || (billData.createdAt ? formatDate(billData.createdAt) : '-'),
        byCourier: billData.byCourier || billData.by_courier || billData.courier || 'No',
        dvReSph: billData.dvReSph || billData.dv_re_sph || '-',
        dvReCyl: billData.dvReCyl || billData.dv_re_cyl || '-',
        dvReAxis: billData.dvReAxis || billData.dv_re_axis || '-',
        dvLeSph: billData.dvLeSph || billData.dv_le_sph || '-',
        dvLeCyl: billData.dvLeCyl || billData.dv_le_cyl || '-',
        dvLeAxis: billData.dvLeAxis || billData.dv_le_axis || '-',
        nvReSph: billData.nvReSph || billData.nv_re_sph || '-',
        nvReCyl: billData.nvReCyl || billData.nv_re_cyl || '-',
        nvReAxis: billData.nvReAxis || billData.nv_re_axis || '-',
        nvLeSph: billData.nvLeSph || billData.nv_le_sph || '-',
        nvLeCyl: billData.nvLeCyl || billData.nv_le_cyl || '-',
        nvLeAxis: billData.nvLeAxis || billData.nv_le_axis || '-',
        subtotal: subtotal,
        discountValue: discountValue,
        discountAmount: discountAmount,
        discountType: discountType,
        tax: parseFloat(billData.tax || billData.taxAmount || 0),
        taxType: billData.taxType || billData.tax_type || 'percentage',
        total: parseFloat(billData.total || billData.grandTotal || billData.amount || 0),
        paidAmount: parseFloat(billData.paidAmount || billData.paid_amount || billData.paid || 0),
        advanceAmount: parseFloat(billData.advanceAmount || billData.advance_amount || billData.paidAmount || billData.paid_amount || 0),
        advancePaymentMethod: billData.advancePaymentMethod || billData.advance_payment_method || billData.paymentMethod || 'cash',
        balanceAmount: parseFloat(billData.balanceAmount || billData.balance_amount || (Math.max(0, (parseFloat(billData.total || billData.grandTotal || billData.amount || 0) - parseFloat(billData.advanceAmount || billData.advance_amount || billData.paidAmount || billData.paid_amount || 0))))),
        balancePaymentMethod: billData.balancePaymentMethod || billData.balance_payment_method || 'cash',
        changeAmount: parseFloat(billData.changeAmount || billData.change_amount || billData.change || 0),
        paymentMethod: billData.paymentMethod || billData.payment_method || billData.payment?.method || 'cash',
        createdAt: billData.createdAt || billData.created_at || billData.date || new Date().toISOString(),
        updatedAt: billData.updatedAt || billData.updated_at,
        createdBy: billData.createdBy || billData.created_by,
        items: Array.isArray(billData.items) ? billData.items.map(item => {
          const qty = parseInt(item.quantity || item.qty || 1);
          const rate = parseFloat(item.sellPrice || item.sell_price || item.price || 0);
          const itemTot = parseFloat(item.total || item.subtotal || (qty * rate) || 0);
          return {
            id: item.id || item._id,
            productId: item.productId || item.product_id || item.product,
            productName: item.productName || item.product_name || item.name || 'Unknown',
            productModel: item.productModel || item.product_model || item.model || '',
            productType: item.productType || item.product_type || item.type || '',
            sellPrice: rate,
            quantity: qty,
            total: itemTot,
          };
        }) : [],
        payments: Array.isArray(billData.payments) ? billData.payments.map(payment => ({
          id: payment.id || payment._id,
          paymentId: payment.paymentId || payment.payment_id,
          amount: parseFloat(payment.amount || 0),
          method: payment.method || 'cash',
          status: payment.status || 'completed',
          reference: payment.reference || '',
          notes: payment.notes || '',
          createdAt: payment.createdAt || payment.created_at
        })) : [],
        raw: billData
      };

      // Calculate item count and due amount
      processedBill.itemCount = processedBill.items.length;
      processedBill.dueAmount = processedBill.total - processedBill.paidAmount;

      console.log('Processed Bill Details:', processedBill);

      setSelectedBill(processedBill);
      setShowBillModal(true);
    } catch (err) {
      console.error('Error fetching bill details:', err);

      // Try to use the bill from the list as fallback
      const billFromList = bills.find(b => b.id === billId);
      if (billFromList) {
        console.log('Using bill from list as fallback after error');
        setSelectedBill(billFromList);
        setShowBillModal(true);
      } else {
        showMessage("error", "❌ Failed to load bill details");
      }
    } finally {
      setLoading(false);
    }
  };

  // WhatsApp share function with PDF attachment and exact message
  const handleWhatsAppShare = async (bill) => {
    if (!bill.customerPhone) {
      showMessage("error", "❌ No phone number available for this customer");
      return;
    }

    setWhatsappStatus(prev => ({ ...prev, [bill.id]: 'sending' }));

    const cleanPhone = bill.customerPhone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      showMessage("error", "❌ Please enter a valid 10-digit phone number");
      setWhatsappStatus(prev => ({ ...prev, [bill.id]: 'error' }));
      setTimeout(() => {
        setWhatsappStatus(prev => ({ ...prev, [bill.id]: null }));
      }, 2000);
      return;
    }

    try {
      await shareBillOnWhatsAppWithPdf(bill, (status) => {
        if (status.type === 'success') {
          showMessage("success", status.message);
        }
      });
      setWhatsappStatus(prev => ({ ...prev, [bill.id]: 'sent' }));
    } catch (err) {
      console.error('WhatsApp share error:', err);
      showMessage("error", `❌ ${err.message || 'Failed to share bill on WhatsApp'}`);
      setWhatsappStatus(prev => ({ ...prev, [bill.id]: 'error' }));
    } finally {
      setTimeout(() => {
        setWhatsappStatus(prev => ({ ...prev, [bill.id]: null }));
      }, 3000);
    }
  };

  // Handle Bill Deletion
  const handleDeleteBill = async (billId, billNumber) => {
    const confirmMessage = `Are you sure you want to delete Bill #${billNumber || billId}?\n\nThis will permanently remove the bill and restore inventory stock. This action cannot be undone.`;
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      const response = await api.delete(`/billing/bills/${billId}`);
      if (response.data?.success || response.status === 200) {
        showMessage("success", `✅ Bill #${billNumber || billId} deleted successfully!`);
        
        // Remove from local states
        setBills(prevBills => prevBills.filter(b => b.id !== billId));
        setFilteredBills(prevFiltered => prevFiltered.filter(b => b.id !== billId));
        
        // Close modal if deleted from inside the modal
        if (showBillModal && selectedBill?.id === billId) {
          setShowBillModal(false);
          setSelectedBill(null);
        }
      } else {
        throw new Error(response.data?.error || 'Failed to delete bill');
      }
    } catch (err) {
      console.error('Error deleting bill:', err);
      showMessage("error", `❌ ${err.response?.data?.error || err.message || 'Failed to delete bill'}`);
    }
  };

  const applyFilters = () => {
    let filtered = [...bills];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(bill =>
        (bill.billNumber?.toLowerCase().includes(term)) ||
        (bill.customerName?.toLowerCase().includes(term)) ||
        (bill.customerPhone?.toLowerCase().includes(term)) ||
        (bill.customerEmail?.toLowerCase().includes(term)) ||
        (bill.customerGst?.toLowerCase().includes(term))
      );
    }

    // Payment method filter
    if (filterPaymentMethod !== 'all') {
      filtered = filtered.filter(bill =>
        bill.paymentMethod?.toLowerCase() === filterPaymentMethod.toLowerCase()
      );
    }

    // Customer type filter
    if (filterCustomerType !== 'all') {
      filtered = filtered.filter(bill =>
        bill.customerType?.toLowerCase() === filterCustomerType.toLowerCase()
      );
    }

    // Date range filter
    if (dateRange.start && dateRange.end) {
      const start = new Date(dateRange.start);
      start.setHours(0, 0, 0, 0);
      const end = new Date(dateRange.end);
      end.setHours(23, 59, 59, 999);

      filtered = filtered.filter(bill => {
        const billDate = parseDateTime(bill.createdAt);
        return billDate >= start && billDate <= end;
      });
    }

    // Sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return parseDateTime(b.createdAt) - parseDateTime(a.createdAt);
        case 'oldest':
          return parseDateTime(a.createdAt) - parseDateTime(b.createdAt);
        case 'highest':
          return (b.total || 0) - (a.total || 0);
        case 'lowest':
          return (a.total || 0) - (b.total || 0);
        default:
          return 0;
      }
    });

    setFilteredBills(filtered);
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setFilterPaymentMethod('all');
    setFilterCustomerType('all');
    setDateRange({ start: '', end: '' });
    setSortBy('newest');
    setFilteredBills(bills);
    setCurrentPage(1);
    showMessage("info", "🔍 Filters cleared");
  };

  const handleExportExcel = () => {
    try {
      const exportData = filteredBills.map(bill => ({
        'Bill Number': bill.billNumber || '',
        'Date': formatDate(bill.createdAt),
        'Time': formatTime(bill.createdAt),
        'Customer Name': bill.customerName || 'Walk-in Customer',
        'Customer Phone': bill.customerPhone || '',
        'Customer Email': bill.customerEmail || '',
        'Customer Type': (bill.customerType || 'external').toUpperCase(),
        'Items Count': bill.itemCount || 0,
        'Subtotal (₹)': (bill.subtotal || 0).toFixed(2),
        'Discount Value': bill.discountType === 'percentage' ? `${bill.discountValue}%` : `₹${bill.discountValue.toFixed(2)}`,
        'Discount Amount (₹)': (bill.discountAmount || 0).toFixed(2),
        'Discount Type': bill.discountType || 'amount',
        'Tax (₹)': (bill.tax || 0).toFixed(2),
        'Total (₹)': (bill.total || 0).toFixed(2),
        'Paid (₹)': (bill.paidAmount || 0).toFixed(2),
        'Change (₹)': (bill.changeAmount || 0).toFixed(2),
        'Due (₹)': ((bill.total || 0) - (bill.paidAmount || 0)).toFixed(2),
        'Payment Method': (bill.paymentMethod || 'cash').toUpperCase()
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Bills");

      const wscols = [
        { wch: 18 }, { wch: 12 }, { wch: 10 }, { wch: 25 }, { wch: 15 },
        { wch: 25 }, { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 15 },
        { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 12 },
        { wch: 12 }, { wch: 12 }, { wch: 15 }
      ];
      worksheet['!cols'] = wscols;

      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });

      const file = new Blob([excelBuffer], {
        type: "application/octet-stream",
      });

      const date = new Date().toISOString().split('T')[0];
      saveAs(file, `Bills_${date}.xlsx`);

      showMessage("success", `✅ Exported ${filteredBills.length} bills to Excel`);
    } catch (err) {
      console.error("Export error:", err);
      showMessage("error", "❌ Failed to export to Excel");
    }
  };

  // Helper for safe autoTable invocation
  const callAutoTable = (doc, options) => {
    if (typeof autoTable === 'function') {
      autoTable(doc, options);
    } else if (typeof doc.autoTable === 'function') {
      doc.autoTable(options);
    } else {
      console.error('autoTable function not found');
    }
  };

  const safeNum = (val) => {
    const num = parseFloat(val);
    return isNaN(num) ? 0 : num;
  };

  const handleExportPDF = () => {
    try {
      // Use LANDSCAPE mode so all 11 columns fit comfortably without truncation
      const doc = new jsPDF('landscape');
      const pageWidth = doc.internal.pageSize.width || 297;
      const pageHeight = doc.internal.pageSize.height || 210;

      // 1. Company Header
      doc.setFontSize(18);
      doc.setTextColor(37, 99, 235); // #2563eb Primary Blue
      doc.setFont('helvetica', 'bold');
      doc.text(companyDetails.name || 'KHETESWAR OPTICS', 14, 18);

      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      const companySub = `${companyDetails.address || ''} | Ph: ${companyDetails.phone || ''} | GST: ${companyDetails.gst || ''}`;
      doc.text(companySub, 14, 24);

      // Blue Divider
      doc.setDrawColor(37, 99, 235);
      doc.setLineWidth(0.8);
      doc.line(14, 28, pageWidth - 14, 28);

      // 2. Title & Date
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text('BILLS & SALES REPORT', 14, 36);

      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(`Generated on: ${formatDateTime(new Date())}`, pageWidth - 14, 36, { align: 'right' });

      // 3. Active Filters Bar
      let currentY = 41;
      const activeFilters = [];
      if (searchTerm) activeFilters.push(`Search: "${searchTerm}"`);
      if (filterPaymentMethod && filterPaymentMethod !== 'all') activeFilters.push(`Method: ${filterPaymentMethod}`);
      if (filterCustomerType && filterCustomerType !== 'all') activeFilters.push(`Customer: ${filterCustomerType}`);
      if (dateRange.start && dateRange.end) activeFilters.push(`Date Range: ${dateRange.start} to ${dateRange.end}`);

      if (activeFilters.length > 0) {
        doc.setFillColor(241, 245, 249);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(14, currentY, pageWidth - 28, 9, 2, 2, 'FD');
        doc.setFontSize(8);
        doc.setTextColor(71, 85, 105);
        doc.text(`Active Filters: ${activeFilters.join('  |  ')}`, 18, currentY + 6);
        currentY += 12;
      } else {
        currentY += 2;
      }

      // 4. Financial KPI Summary Cards (5 columns across landscape page)
      const totalAmount = filteredBills.reduce((sum, bill) => sum + safeNum(bill.total), 0);
      const totalPaid = filteredBills.reduce((sum, bill) => sum + safeNum(bill.paidAmount), 0);
      const totalDue = totalAmount - totalPaid;
      const totalDiscount = filteredBills.reduce((sum, bill) => sum + safeNum(bill.discountAmount), 0);

      const cardGap = 5;
      const totalCards = 5;
      const totalCardWidth = pageWidth - 28 - (cardGap * (totalCards - 1));
      const cardW = totalCardWidth / totalCards;

      const kpis = [
        { label: 'TOTAL BILLS', value: `${filteredBills.length}`, bg: [248, 250, 252], border: [203, 213, 225], text: [30, 41, 59] },
        { label: 'TOTAL SALES', value: `Rs. ${totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, bg: [238, 242, 255], border: [199, 210, 254], text: [67, 56, 202] },
        { label: 'TOTAL DISCOUNT', value: `Rs. ${totalDiscount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, bg: [254, 242, 242], border: [254, 202, 202], text: [153, 27, 27] },
        { label: 'TOTAL RECEIVED', value: `Rs. ${totalPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, bg: [240, 253, 244], border: [187, 247, 208], text: [22, 101, 52] },
        { label: 'TOTAL DUE', value: `Rs. ${totalDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, bg: [255, 251, 235], border: [253, 230, 138], text: [146, 64, 14] },
      ];

      kpis.forEach((kpi, idx) => {
        const xPos = 14 + idx * (cardW + cardGap);
        doc.setFillColor(kpi.bg[0], kpi.bg[1], kpi.bg[2]);
        doc.setDrawColor(kpi.border[0], kpi.border[1], kpi.border[2]);
        doc.setLineWidth(0.4);
        doc.roundedRect(xPos, currentY, cardW, 15, 2, 2, 'FD');

        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text(kpi.label, xPos + 4, currentY + 5.5);

        doc.setFontSize(9.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(kpi.text[0], kpi.text[1], kpi.text[2]);
        doc.text(kpi.value, xPos + 4, currentY + 11.5);
      });

      currentY += 20;

      // 5. Perfectly Aligned & Styled Table
      const tableColumn = [
        'Bill No', 'Date', 'Customer', 'Type', 'Items', 'Subtotal', 'Discount',
        'Total', 'Paid', 'Due', 'Method'
      ];

      const tableRows = filteredBills.map(bill => {
        let discountDisplay = '';
        if (bill.discountType === 'percentage') {
          discountDisplay = `${safeNum(bill.discountValue)}%`;
        } else {
          discountDisplay = `Rs. ${safeNum(bill.discountAmount).toFixed(2)}`;
        }

        return [
          bill.billNumber || '',
          formatDate(bill.createdAt),
          bill.customerName || 'Walk-in Customer',
          (bill.customerType || 'regular').toUpperCase(),
          bill.itemCount || 0,
          `Rs. ${safeNum(bill.subtotal).toFixed(2)}`,
          discountDisplay,
          `Rs. ${safeNum(bill.total).toFixed(2)}`,
          `Rs. ${safeNum(bill.paidAmount).toFixed(2)}`,
          `Rs. ${(safeNum(bill.total) - safeNum(bill.paidAmount)).toFixed(2)}`,
          (bill.paymentMethod || 'cash').toUpperCase()
        ];
      });

      callAutoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: currentY,
        styles: {
          fontSize: 7.5,
          cellPadding: 3,
          font: 'helvetica',
          textColor: [30, 41, 59],
          overflow: 'ellipsize' // Default all cells to single-line ellipsize
        },
        headStyles: {
          fillColor: [30, 64, 175], // Deep Blue #1e40af
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        },
        columnStyles: {
          0: { halign: 'center', cellWidth: 26, overflow: 'linebreak' }, // Bill No (only field allowed to wrap)
          1: { halign: 'center', cellWidth: 22, overflow: 'ellipsize' }, // Date
          2: { halign: 'left', cellWidth: 52, overflow: 'ellipsize' }, // Customer Name
          3: { halign: 'center', cellWidth: 22, overflow: 'ellipsize' }, // Type
          4: { halign: 'center', cellWidth: 14, overflow: 'ellipsize' }, // Items
          5: { halign: 'right', cellWidth: 25, overflow: 'ellipsize' }, // Subtotal
          6: { halign: 'right', cellWidth: 21, overflow: 'ellipsize' }, // Discount
          7: { halign: 'right', cellWidth: 25, overflow: 'ellipsize' }, // Total
          8: { halign: 'right', cellWidth: 22, overflow: 'ellipsize' }, // Paid
          9: { halign: 'right', cellWidth: 20, overflow: 'ellipsize' }, // Due
          10: { halign: 'center', cellWidth: 20, overflow: 'ellipsize' }  // Method
        },
        didDrawPage: (data) => {
          const pageCount = doc.internal.getNumberOfPages();
          doc.setFontSize(8);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(148, 163, 184);
          doc.text(`Page ${data.pageNumber} of ${pageCount}`, pageWidth / 2, pageHeight - 8, { align: 'center' });
          doc.text('Kheteswar Optics Billing System', 14, pageHeight - 8);
        }
      });

      const date = new Date().toISOString().split('T')[0];
      doc.save(`Bills_Report_${date}.pdf`);

      showMessage("success", `✅ Exported ${filteredBills.length} bills to PDF`);
    } catch (err) {
      console.error("PDF export error:", err);
      showMessage("error", "❌ Failed to export to PDF");
    }
  };

  const handlePrintBill = (bill) => {
    try {
      const doc = generateBillPdfDoc(bill);
      const pdfBlob = doc.output('blob');
      const blobUrl = URL.createObjectURL(pdfBlob);
      const printWindow = window.open(blobUrl, '_blank');
      if (printWindow) {
        printWindow.focus();
      } else {
        doc.save(`Kheteswar_Optics_Bill_${bill.billNumber || 'Invoice'}.pdf`);
      }
    } catch (err) {
      console.error("Error generating PDF for print:", err);
      showMessage("error", "❌ Failed to generate print document");
    }
  };

  const handleCopyBillNumber = (billNumber) => {
    navigator.clipboard.writeText(billNumber);
    setCopiedBillNo(billNumber);
    setTimeout(() => setCopiedBillNo(null), 2000);
    showMessage("success", "📋 Bill number copied!");
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentBills = filteredBills.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredBills.length / itemsPerPage);

  const paginate = (pageNumber) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const getPaymentIcon = (method) => {
    return paymentMethodMap[method?.toLowerCase()]?.icon || <DollarSign size={14} />;
  };

  const getPaymentColor = (method) => {
    return paymentMethodMap[method?.toLowerCase()]?.color || '#6b7280';
  };

  const getCustomerTypeIcon = (type) => {
    return customerTypeMap[type?.toLowerCase()]?.icon || <User size={14} />;
  };

  const getCustomerTypeColor = (type) => {
    return customerTypeMap[type?.toLowerCase()]?.color || '#6b7280';
  };

  const formatCurrency = (amount) => {
    return `₹${(parseFloat(amount) || 0).toFixed(2)}`;
  };

  // Dark Theme Styles
  const styles = {
    container: {
      padding: "30px 40px",
      backgroundColor: "#0a0c10",
      minHeight: "100vh",
      color: "#e5e7eb",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    },
    shopHeader: {
      backgroundColor: "#1f2937",
      padding: "20px",
      borderRadius: "8px",
      border: "1px solid #374151",
      marginBottom: "20px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      flexWrap: "wrap",
      gap: "15px",
    },
    shopInfo: {
      display: "flex",
      flexDirection: "column",
      gap: "4px",
      flex: 1,
    },
    shopLogo: {
      width: "60px",
      height: "60px",
      borderRadius: "8px",
      objectFit: "cover",
      marginRight: "15px",
    },
    shopName: {
      fontSize: "24px",
      fontWeight: "600",
      color: "#6366f1",
      margin: 0,
      display: "flex",
      alignItems: "center",
      gap: "8px",
    },
    shopAddress: {
      fontSize: "14px",
      color: "#d1d5db",
      margin: 0,
      display: "flex",
      alignItems: "center",
      gap: "4px",
    },
    shopContact: {
      fontSize: "14px",
      color: "#d1d5db",
      margin: 0,
      display: "flex",
      alignItems: "center",
      gap: "4px",
    },
    companySelector: {
      backgroundColor: "#111827",
      padding: "8px 16px",
      borderRadius: "6px",
      cursor: "pointer",
      border: "1px solid #374151",
      transition: "all 0.2s",
    },
    companyDropdown: {
      position: "absolute",
      top: "100%",
      right: 0,
      backgroundColor: "#1f2937",
      border: "1px solid #374151",
      borderRadius: "6px",
      marginTop: "5px",
      zIndex: 100,
      minWidth: "200px",
      maxHeight: "300px",
      overflowY: "auto",
    },
    companyOption: {
      padding: "10px 15px",
      cursor: "pointer",
      transition: "background 0.2s",
      color: "#e5e7eb",
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "25px",
      flexWrap: "wrap",
      gap: "15px",
    },
    headerTitle: {
      display: "flex",
      alignItems: "center",
      gap: "15px",
    },
    title: {
      fontSize: "28px",
      fontWeight: "600",
      margin: 0,
      color: "#f9fafb",
      display: "flex",
      alignItems: "center",
      gap: "10px",
    },
    refreshButton: {
      background: "none",
      border: "none",
      color: "#9ca3af",
      cursor: "pointer",
      padding: "8px",
      borderRadius: "6px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transition: "all 0.2s",
    },
    buttonGroup: {
      display: "flex",
      gap: "10px",
      flexWrap: "wrap",
    },
    button: {
      display: "flex",
      alignItems: "center",
      gap: "6px",
      padding: "8px 14px",
      borderRadius: "6px",
      backgroundColor: "#1f2937",
      color: "#f9fafb",
      border: "1px solid #374151",
      cursor: "pointer",
      fontSize: "14px",
      fontWeight: "500",
      transition: "all 0.2s",
    },
    primaryButton: {
      backgroundColor: "#6366f1",
      color: "#fff",
      border: "none",
    },
    successButton: {
      backgroundColor: "#059669",
      color: "#fff",
      border: "none",
    },
    infoButton: {
      backgroundColor: "#3b82f6",
      color: "#fff",
      border: "none",
    },
    filterBar: {
      backgroundColor: "#1f2937",
      padding: "20px",
      borderRadius: "8px",
      border: "1px solid #374151",
      marginBottom: "20px",
      display: "grid",
      gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr auto",
      gap: "12px",
      alignItems: "center",
    },
    searchBox: {
      position: "relative",
      width: "100%",
    },
    searchIcon: {
      position: "absolute",
      left: "12px",
      top: "50%",
      transform: "translateY(-50%)",
      color: "#6b7280",
    },
    searchInput: {
      width: "100%",
      padding: "10px 12px 10px 38px",
      backgroundColor: "#111827",
      border: "1px solid #374151",
      color: "#fff",
      borderRadius: "6px",
      fontSize: "13px",
      outline: "none",
      transition: "border-color 0.2s",
      boxSizing: "border-box",
    },
    filterSelect: {
      width: "100%",
      padding: "10px",
      backgroundColor: "#111827",
      border: "1px solid #374151",
      color: "#fff",
      borderRadius: "6px",
      fontSize: "13px",
      outline: "none",
      cursor: "pointer",
      transition: "border-color 0.2s",
      boxSizing: "border-box",
    },
    dateInput: {
      width: "100%",
      padding: "10px",
      backgroundColor: "#111827",
      border: "1px solid #374151",
      color: "#fff",
      borderRadius: "6px",
      fontSize: "13px",
      outline: "none",
      transition: "border-color 0.2s",
      boxSizing: "border-box",
    },
    filterButton: {
      padding: "10px 16px",
      backgroundColor: "#1f2937",
      border: "1px solid #374151",
      color: "#f9fafb",
      borderRadius: "6px",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: "6px",
      fontSize: "13px",
      fontWeight: "500",
      transition: "all 0.2s",
      whiteSpace: "nowrap",
      height: "41px",
    },
    tableContainer: {
      backgroundColor: "#1f2937",
      borderRadius: "8px",
      border: "1px solid #374151",
      overflow: "auto",
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
      minWidth: "1400px",
    },
    th: {
      backgroundColor: "#374151",
      padding: "14px 12px",
      textAlign: "left",
      fontSize: "12px",
      fontWeight: "600",
      color: "#f3f4f6",
      borderBottom: "1px solid #4b5563",
      textTransform: "uppercase",
      letterSpacing: "0.5px",
    },
    td: {
      padding: "14px 12px",
      borderBottom: "1px solid #374151",
      fontSize: "13px",
      color: "#f9fafb",
    },
    paymentBadge: {
      padding: "4px 10px",
      borderRadius: "20px",
      fontSize: "11px",
      fontWeight: "600",
      display: "inline-flex",
      alignItems: "center",
      gap: "4px",
      backgroundColor: "rgba(255,255,255,0.1)",
    },
    customerTypeBadge: {
      padding: "4px 10px",
      borderRadius: "20px",
      fontSize: "11px",
      fontWeight: "600",
      display: "inline-flex",
      alignItems: "center",
      gap: "4px",
    },
    actionButton: {
      padding: "6px 10px",
      margin: "0 2px",
      border: "none",
      borderRadius: "4px",
      cursor: "pointer",
      transition: "all 0.2s",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
    },
    whatsappButton: {
      padding: "6px 10px",
      margin: "0 2px",
      border: "none",
      borderRadius: "4px",
      cursor: "pointer",
      transition: "all 0.2s",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#25D366",
      color: "white",
    },
    message: {
      padding: "12px 20px",
      borderRadius: "6px",
      marginBottom: "20px",
      fontSize: "14px",
      fontWeight: "500",
      whiteSpace: "pre-line",
      display: "flex",
      alignItems: "center",
      gap: "8px",
    },
    successMessage: {
      backgroundColor: "rgba(5, 150, 105, 0.2)",
      color: "#34d399",
      border: "1px solid #059669",
    },
    errorMessage: {
      backgroundColor: "rgba(220, 38, 38, 0.2)",
      color: "#f87171",
      border: "1px solid #dc2626",
    },
    infoMessage: {
      backgroundColor: "rgba(59, 130, 246, 0.2)",
      color: "#60a5fa",
      border: "1px solid #3b82f6",
    },
    loadingSpinner: {
      textAlign: "center",
      padding: "60px",
      color: "#9ca3af",
      fontSize: "16px",
    },
    noData: {
      textAlign: "center",
      padding: "60px",
      color: "#6b7280",
      fontStyle: "italic",
    },
    pagination: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: "20px",
      padding: "10px 0",
    },
    paginationInfo: {
      color: "#9ca3af",
      fontSize: "13px",
    },
    paginationControls: {
      display: "flex",
      gap: "8px",
      alignItems: "center",
    },
    pageButton: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "8px 12px",
      backgroundColor: "#1f2937",
      border: "1px solid #374151",
      color: "#f9fafb",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "13px",
      transition: "all 0.2s",
      minWidth: "38px",
    },
    activePageButton: {
      backgroundColor: "#6366f1",
      borderColor: "#6366f1",
    },
    disabledButton: {
      opacity: 0.5,
      cursor: "not-allowed",
    },
    pageNumbers: {
      display: "flex",
      gap: "4px",
    },
    modal: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.8)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
      backdropFilter: "blur(4px)",
    },
    modalContent: {
      backgroundColor: "#1f2937",
      padding: "30px",
      borderRadius: "12px",
      maxWidth: "700px",
      width: "95%",
      maxHeight: "85vh",
      overflow: "auto",
      position: "relative",
      border: "1px solid #374151",
      boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5)",
    },
    modalClose: {
      position: "absolute",
      top: "15px",
      right: "15px",
      background: "none",
      border: "none",
      color: "#9ca3af",
      cursor: "pointer",
      padding: "4px",
      borderRadius: "4px",
    },
    modalTitle: {
      fontSize: "22px",
      fontWeight: "600",
      color: "#f9fafb",
      marginBottom: "20px",
      display: "flex",
      alignItems: "center",
      gap: "10px",
    },
    modalSection: {
      marginBottom: "20px",
      padding: "15px",
      backgroundColor: "#111827",
      borderRadius: "8px",
      border: "1px solid #374151",
    },
    modalText: {
      color: "#d1d5db",
      fontSize: "14px",
      lineHeight: "1.6",
      marginBottom: "6px",
    },
    modalTable: {
      width: "100%",
      borderCollapse: "collapse",
      marginBottom: "20px",
    },
    modalTh: {
      backgroundColor: "#374151",
      padding: "10px",
      textAlign: "left",
      color: "#f3f4f6",
      fontWeight: "500",
      fontSize: "12px",
    },
    modalTd: {
      padding: "8px",
      borderBottom: "1px solid #374151",
      color: "#f9fafb",
      fontSize: "13px",
    },
    modalFooter: {
      display: "flex",
      gap: "10px",
      marginTop: "20px",
    },
    itemsPerPageSelect: {
      padding: "8px",
      backgroundColor: "#111827",
      border: "1px solid #374151",
      color: "#fff",
      borderRadius: "6px",
      fontSize: "13px",
      marginLeft: "10px",
    },
    copyButton: {
      background: "none",
      border: "none",
      color: "#9ca3af",
      cursor: "pointer",
      padding: "4px",
      marginLeft: "5px",
    },
  };

  if (loading && bills.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingSpinner}>
          <RefreshCw size={30} style={{ animation: 'spin 1s linear infinite', marginBottom: '10px' }} />
          <div>Loading bills...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Shop Header with Company Details */}
      <div style={styles.shopHeader}>
        <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
          {companyDetails.logoUrl && (
            <img
              src={companyDetails.logoUrl}
              alt="Company Logo"
              style={styles.shopLogo}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          )}
          <div style={styles.shopInfo}>
            <h1 style={styles.shopName}>
              <Store size={28} color="#6366f1" />
              {companyDetails.name}
            </h1>
            <p style={styles.shopAddress}>
              <MapPin size={14} color="#9ca3af" />
              {companyDetails.address}, {companyDetails.city}
            </p>
            <p style={styles.shopContact}>
              <Phone size={14} color="#9ca3af" />
              {companyDetails.phone}
              {companyDetails.email && (
                <>
                  <Mail size={14} color="#9ca3af" style={{ marginLeft: '15px' }} />
                  {companyDetails.email}
                </>
              )}
              {companyDetails.gst && (
                <>
                  <Building2 size={14} color="#9ca3af" style={{ marginLeft: '15px' }} />
                  GST: {companyDetails.gst}
                </>
              )}
            </p>
          </div>
        </div>

        {/* Company Selector */}
        {companies.length > 0 && (
          <div style={{ position: 'relative' }}>
            <div
              style={styles.companySelector}
              onClick={() => setShowCompanySelector(!showCompanySelector)}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#1f2937';
                e.currentTarget.style.borderColor = '#6366f1';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#111827';
                e.currentTarget.style.borderColor = '#374151';
              }}
            >
              <Building2 size={16} style={{ marginRight: '8px' }} />
              {companies.find(c => c.id === selectedCompanyId)?.name || 'Select Company'}
              <span style={{ marginLeft: '8px' }}>{showCompanySelector ? '▲' : '▼'}</span>
            </div>

            {showCompanySelector && (
              <div style={styles.companyDropdown}>
                {companies.map(company => (
                  <div
                    key={company.id}
                    style={{
                      ...styles.companyOption,
                      backgroundColor: selectedCompanyId === company.id ? '#374151' : 'transparent'
                    }}
                    onClick={() => handleCompanySelect(company)}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2d3748'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = selectedCompanyId === company.id ? '#374151' : 'transparent'}
                  >
                    <Building2 size={14} style={{ marginRight: '8px', display: 'inline' }} />
                    {company.name}
                    {company.gst_number && (
                      <span style={{ fontSize: '10px', color: '#9ca3af', marginLeft: '8px' }}>
                        GST: {company.gst_number}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Message Display */}
      {message.text && (
        <div style={{
          ...styles.message,
          ...(message.type === "success" ? styles.successMessage :
            message.type === "error" ? styles.errorMessage :
              styles.infoMessage)
        }}>
          {message.type === "success" && <CheckCircle size={18} />}
          {message.type === "error" && <AlertCircle size={18} />}
          {message.type === "info" && <Filter size={18} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerTitle}>
          <h1 style={styles.title}>
            <Receipt size={32} color="#6366f1" />
            Bill Reports
          </h1>
          <button
            style={styles.refreshButton}
            onClick={fetchBills}
            title="Refresh"
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#f9fafb';
              e.currentTarget.style.backgroundColor = '#1f2937';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#9ca3af';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <RefreshCw size={18} />
          </button>
          <select
            style={styles.itemsPerPageSelect}
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
          >
            <option value={10}>10 per page</option>
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
          </select>
        </div>

        <div style={styles.buttonGroup}>
          <button
            style={{ ...styles.button, ...styles.infoButton }}
            onClick={handleExportExcel}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            <FileSpreadsheet size={16} /> Excel
          </button>
          <button
            style={{ ...styles.button, ...styles.successButton }}
            onClick={handleExportPDF}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            <FileJson size={16} /> PDF
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={styles.filterBar}>
        <div style={styles.searchBox}>
          <Search size={16} style={styles.searchIcon} />
          <input
            type="text"
            style={styles.searchInput}
            placeholder="Search bill no, customer name, phone, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          style={styles.filterSelect}
          value={filterPaymentMethod}
          onChange={(e) => setFilterPaymentMethod(e.target.value)}
        >
          <option value="all">All Methods</option>
          <option value="cash">Cash</option>
          <option value="card">Card</option>
          <option value="upi">UPI</option>
          <option value="cheque">Cheque</option>
          <option value="mixed">Mixed</option>
        </select>

        <select
          style={styles.filterSelect}
          value={filterCustomerType}
          onChange={(e) => setFilterCustomerType(e.target.value)}
        >
          <option value="all">All Customers</option>
          <option value="internal">Internal (Staff)</option>
          <option value="external">External</option>
          <option value="regular">Regular</option>
          <option value="wholesale">Wholesale</option>
          <option value="vip">VIP</option>
          <option value="corporate">Corporate</option>
        </select>

        <input
          type="date"
          style={styles.dateInput}
          value={dateRange.start}
          onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
          placeholder="From Date"
        />

        <input
          type="date"
          style={styles.dateInput}
          value={dateRange.end}
          onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
          placeholder="To Date"
        />

        <select
          style={styles.filterSelect}
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="highest">Highest Amount</option>
          <option value="lowest">Lowest Amount</option>
        </select>

        <button
          style={styles.filterButton}
          onClick={resetFilters}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#2d3748';
            e.currentTarget.style.borderColor = '#4b5563';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#1f2937';
            e.currentTarget.style.borderColor = '#374151';
          }}
        >
          <X size={16} /> Clear
        </button>
      </div>

      {/* Bills Table */}
      <div style={styles.tableContainer}>
        {error && <div style={{ padding: '30px', color: '#f87171', textAlign: 'center' }}>{error}</div>}

        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Bill No.</th>
              <th style={styles.th}>Date & Time</th>
              <th style={styles.th}>Customer</th>
              <th style={styles.th}>Type</th>
              <th style={styles.th}>Contact</th>
              <th style={styles.th}>Items</th>
              <th style={styles.th}>Subtotal</th>
              <th style={styles.th}>Discount</th>
              <th style={styles.th}>Tax</th>
              <th style={styles.th}>Total</th>
              <th style={styles.th}>Paid</th>
              <th style={styles.th}>Due</th>
              <th style={styles.th}>Payment</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentBills.length === 0 ? (
              <tr>
                <td colSpan="14" style={styles.noData}>
                  {searchTerm || filterPaymentMethod !== 'all' || filterCustomerType !== 'all' || dateRange.start
                    ? <div>
                      <Filter size={30} style={{ marginBottom: '10px', opacity: 0.5 }} />
                      <div>No BT bills match your filters</div>
                      <button
                        onClick={resetFilters}
                        style={{ ...styles.button, marginTop: '15px', display: 'inline-flex' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#2d3748';
                          e.currentTarget.style.borderColor = '#4b5563';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#1f2937';
                          e.currentTarget.style.borderColor = '#374151';
                        }}
                      >
                        <X size={14} /> Clear Filters
                      </button>
                    </div>
                    : <div>
                      <Receipt size={30} style={{ marginBottom: '10px', opacity: 0.5 }} />
                      <div>No BT bills found</div>
                    </div>}
                </td>
              </tr>
            ) : (
              currentBills.map((bill) => {
                const dueAmount = (bill.total || 0) - (bill.paidAmount || 0);

                // Format discount display
                let discountDisplay = '';
                if (bill.discountType === 'percentage') {
                  discountDisplay = `${bill.discountValue}%`;
                } else {
                  discountDisplay = formatCurrency(bill.discountAmount);
                }

                return (
                  <tr
                    key={bill.id}
                    onClick={() => fetchBillDetails(bill.id)}
                    style={{ cursor: 'pointer', transition: 'background-color 0.2s' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1f2937'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <td style={styles.td}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <strong style={{ color: '#818cf8', cursor: 'pointer' }} title="Click to open bill">
                          {bill.billNumber}
                        </strong>
                        <button
                          style={styles.copyButton}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyBillNumber(bill.billNumber);
                          }}
                          title="Copy bill number"
                          onMouseEnter={(e) => e.currentTarget.style.color = '#f9fafb'}
                          onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}
                        >
                          {copiedBillNo === bill.billNumber ? <CheckCircle size={14} color="#059669" /> : <Copy size={14} />}
                        </button>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <div>{formatDate(bill.createdAt)}</div>
                      <small style={{ color: '#9ca3af', fontSize: '11px' }}>
                        {formatTime(bill.createdAt)}
                      </small>
                    </td>
                    <td style={styles.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <User size={12} color="#9ca3af" />
                        <span>{bill.customerName || 'Walk-in'}</span>
                      </div>
                      {bill.customerEmail && (
                        <small style={{ color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '2px', marginTop: '2px' }}>
                          <Mail size={10} /> {bill.customerEmail}
                        </small>
                      )}
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.customerTypeBadge,
                        backgroundColor: `${getCustomerTypeColor(bill.customerType)}20`,
                        color: getCustomerTypeColor(bill.customerType),
                        border: `1px solid ${getCustomerTypeColor(bill.customerType)}40`
                      }}>
                        {getCustomerTypeIcon(bill.customerType)}
                        <span style={{ textTransform: 'capitalize' }}>{bill.customerType || 'external'}</span>
                      </span>
                    </td>
                    <td style={styles.td}>
                      {bill.customerPhone && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Phone size={10} color="#9ca3af" />
                          <span>{bill.customerPhone}</span>
                        </div>
                      )}
                      {bill.customerGst && (
                        <small style={{ color: '#9ca3af', fontSize: '10px' }}>
                          GST: {bill.customerGst}
                        </small>
                      )}
                    </td>
                    <td style={styles.td}>{bill.itemCount || 0}</td>
                    <td style={styles.td}>{formatCurrency(bill.subtotal)}</td>
                    <td style={styles.td}>
                      <span title={`${bill.discountType === 'percentage' ? 'Percentage' : 'Fixed'} discount`}>
                        {discountDisplay}
                        {bill.discountType === 'percentage' && (
                          <small style={{ color: '#9ca3af', marginLeft: '4px', fontSize: '10px' }}>
                            (₹{bill.discountAmount.toFixed(2)})
                          </small>
                        )}
                      </span>
                    </td>
                    <td style={styles.td}>{formatCurrency(bill.tax)}</td>
                    <td style={styles.td}><strong>{formatCurrency(bill.total)}</strong></td>
                    <td style={styles.td}>{formatCurrency(bill.paidAmount)}</td>
                    <td style={styles.td}>
                      <span style={{
                        color: dueAmount > 0 ? '#f87171' : '#34d399',
                        fontWeight: '600'
                      }}>
                        {formatCurrency(dueAmount)}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <div style={{
                        ...styles.paymentBadge,
                        color: getPaymentColor(bill.paymentMethod),
                        border: `1px solid ${getPaymentColor(bill.paymentMethod)}30`
                      }}>
                        {getPaymentIcon(bill.paymentMethod)}
                        <span style={{ textTransform: 'capitalize' }}>{bill.paymentMethod}</span>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <button
                        style={{ ...styles.actionButton, backgroundColor: '#3b82f6', color: 'white', marginRight: '4px' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          fetchBillDetails(bill.id);
                        }}
                        title="View Details"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#2563eb';
                          e.currentTarget.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#3b82f6';
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        style={{ ...styles.actionButton, backgroundColor: '#059669', color: 'white', marginRight: '4px' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePrintBill(bill);
                        }}
                        title="Print Bill"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#047857';
                          e.currentTarget.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#059669';
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                      >
                        <Printer size={14} />
                      </button>
                      <button
                        style={{
                          ...styles.whatsappButton,
                          opacity: whatsappStatus[bill.id] === 'sending' ? 0.7 : 1,
                          cursor: whatsappStatus[bill.id] === 'sending' ? 'wait' : 'pointer',
                          backgroundColor: whatsappStatus[bill.id] === 'sent' ? '#059669' : '#25D366'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleWhatsAppShare(bill);
                        }}
                        title="Share on WhatsApp"
                        disabled={whatsappStatus[bill.id] === 'sending'}
                        onMouseEnter={(e) => {
                          if (!whatsappStatus[bill.id]) {
                            e.currentTarget.style.backgroundColor = '#128C7E';
                            e.currentTarget.style.transform = 'scale(1.05)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!whatsappStatus[bill.id]) {
                            e.currentTarget.style.backgroundColor = '#25D366';
                            e.currentTarget.style.transform = 'scale(1)';
                          }
                        }}
                      >
                        {whatsappStatus[bill.id] === 'sending' ? (
                          <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />
                        ) : whatsappStatus[bill.id] === 'sent' ? (
                          <CheckCircle size={14} />
                        ) : (
                          <MessageCircle size={14} />
                        )}
                      </button>
                      <button
                        style={{
                          ...styles.actionButton,
                          backgroundColor: '#dc2626',
                          color: 'white',
                          marginLeft: '4px'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteBill(bill.id, bill.billNumber);
                        }}
                        title="Delete Bill"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#b91c1c';
                          e.currentTarget.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#dc2626';
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {filteredBills.length > 0 && (
        <div style={styles.pagination}>
          <div style={styles.paginationInfo}>
            Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredBills.length)} of {filteredBills.length} BT bills
          </div>

          <div style={styles.paginationControls}>
            <button
              onClick={goToPreviousPage}
              disabled={currentPage === 1}
              style={{
                ...styles.pageButton,
                ...(currentPage === 1 ? styles.disabledButton : {})
              }}
              onMouseEnter={(e) => {
                if (currentPage !== 1) {
                  e.currentTarget.style.backgroundColor = '#2d3748';
                  e.currentTarget.style.borderColor = '#4b5563';
                }
              }}
              onMouseLeave={(e) => {
                if (currentPage !== 1) {
                  e.currentTarget.style.backgroundColor = '#1f2937';
                  e.currentTarget.style.borderColor = '#374151';
                }
              }}
            >
              <ChevronLeft size={16} />
            </button>

            <div style={styles.pageNumbers}>
              {[...Array(totalPages)].map((_, index) => {
                const pageNumber = index + 1;
                if (
                  pageNumber === 1 ||
                  pageNumber === totalPages ||
                  (pageNumber >= currentPage - 2 && pageNumber <= currentPage + 2)
                ) {
                  return (
                    <button
                      key={pageNumber}
                      onClick={() => paginate(pageNumber)}
                      style={{
                        ...styles.pageButton,
                        ...(currentPage === pageNumber ? styles.activePageButton : {})
                      }}
                      onMouseEnter={(e) => {
                        if (currentPage !== pageNumber) {
                          e.currentTarget.style.backgroundColor = '#2d3748';
                          e.currentTarget.style.borderColor = '#4b5563';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (currentPage !== pageNumber) {
                          e.currentTarget.style.backgroundColor = '#1f2937';
                          e.currentTarget.style.borderColor = '#374151';
                        }
                      }}
                    >
                      {pageNumber}
                    </button>
                  );
                } else if (
                  pageNumber === currentPage - 3 ||
                  pageNumber === currentPage + 3
                ) {
                  return <span key={pageNumber} style={{ color: '#9ca3af', padding: '0 4px' }}>...</span>;
                }
                return null;
              })}
            </div>

            <button
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
              style={{
                ...styles.pageButton,
                ...(currentPage === totalPages ? styles.disabledButton : {})
              }}
              onMouseEnter={(e) => {
                if (currentPage !== totalPages) {
                  e.currentTarget.style.backgroundColor = '#2d3748';
                  e.currentTarget.style.borderColor = '#4b5563';
                }
              }}
              onMouseLeave={(e) => {
                if (currentPage !== totalPages) {
                  e.currentTarget.style.backgroundColor = '#1f2937';
                  e.currentTarget.style.borderColor = '#374151';
                }
              }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Bill Details Modal - Exactly matching the Lenscraft Order Form / Bill Invoice */}
      {showBillModal && selectedBill && (() => {
        const bNumber = selectedBill.billNumber || selectedBill.bill_number || '0000';
        const customerName = selectedBill.customerName || selectedBill.customer_name || selectedBill.customer?.name || 'Walk-in Customer';
        const customerPhone = selectedBill.customerPhone || selectedBill.customer_phone || selectedBill.customer?.phone || '-';
        const customerAddress = selectedBill.customerAddress || selectedBill.customer_address || selectedBill.customer?.address || '-';
        const customerDob = selectedBill.customerDob || selectedBill.customer_dob || selectedBill.customer?.dob || selectedBill.dob || 'dd-mm-yyyy';

        const orderDate = selectedBill.createdAt ? formatDate(selectedBill.createdAt) : formatDate(new Date());
        const orderTime = selectedBill.createdAt ? formatTime(selectedBill.createdAt) : formatTime(new Date());
        const dueDate = selectedBill.dueDate || selectedBill.due_date || orderDate;
        const byCourier = selectedBill.byCourier || selectedBill.by_courier || selectedBill.courier || 'No';

        const frameName = selectedBill.frameName || selectedBill.frame_name || selectedBill.frameNo || selectedBill.frame_no || '-';
        const lensType = selectedBill.lensType || selectedBill.lens_type || selectedBill.lensesDetail || selectedBill.lenses_detail || '-';

        const dvReSph = selectedBill.dvReSph || selectedBill.dv_re_sph || '-';
        const dvReCyl = selectedBill.dvReCyl || selectedBill.dv_re_cyl || '-';
        const dvReAxis = selectedBill.dvReAxis || selectedBill.dv_re_axis || '-';
        const dvLeSph = selectedBill.dvLeSph || selectedBill.dv_le_sph || '-';
        const dvLeCyl = selectedBill.dvLeCyl || selectedBill.dv_le_cyl || '-';
        const dvLeAxis = selectedBill.dvLeAxis || selectedBill.dv_le_axis || '-';

        const nvReSph = selectedBill.nvReSph || selectedBill.nv_re_sph || '-';
        const nvReCyl = selectedBill.nvReCyl || selectedBill.nv_re_cyl || '-';
        const nvReAxis = selectedBill.nvReAxis || selectedBill.nv_re_axis || '-';
        const nvLeSph = selectedBill.nvLeSph || selectedBill.nv_le_sph || '-';
        const nvLeCyl = selectedBill.nvLeCyl || selectedBill.nv_le_cyl || '-';
        const nvLeAxis = selectedBill.nvLeAxis || selectedBill.nv_le_axis || '-';

        const rawItems = selectedBill.items || selectedBill.products || [];
        const items = Array.isArray(rawItems) ? rawItems.filter(item => item && (
          (parseFloat(item.total || 0) > 0) ||
          (parseFloat(item.sellPrice || item.sell_price || item.price || 0) > 0) ||
          (parseInt(item.quantity || item.qty || 0, 10) > 0) ||
          (item.productName || item.product_name || item.name)
        )) : [];

        const totalAmount = parseFloat(
          selectedBill.total ?? selectedBill.summary?.total ?? selectedBill.grandTotal ?? selectedBill.amount ?? 0
        );
        const advanceRecd = parseFloat(
          selectedBill.advanceAmount ?? selectedBill.advance_amount ?? selectedBill.payment?.advanceAmount ??
          selectedBill.paidAmount ?? selectedBill.paid_amount ?? selectedBill.payment?.paidAmount ?? 0
        );
        let balanceAmt = parseFloat(
          selectedBill.balanceAmount ?? selectedBill.balance_amount ?? selectedBill.payment?.balanceAmount ?? 0
        );
        if (balanceAmt === 0 && totalAmount > advanceRecd) {
          balanceAmt = totalAmount - advanceRecd;
        }
        const advMethod = (selectedBill.advancePaymentMethod || selectedBill.advance_payment_method || selectedBill.paymentMethod || selectedBill.payment_method || selectedBill.payment?.advancePaymentMethod || selectedBill.payment?.method || 'cash').toUpperCase().replace('_', ' ');
        const balMethod = (selectedBill.balancePaymentMethod || selectedBill.balance_payment_method || selectedBill.payment?.balancePaymentMethod || 'cash').toUpperCase().replace('_', ' ');
        const remainingDue = Math.max(0, totalAmount - (advanceRecd + balanceAmt));

        return (
          <div style={styles.modal} onClick={() => setShowBillModal(false)}>
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '10px',
                maxWidth: '840px',
                width: '96%',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
                border: '1px solid #cbd5e1',
                padding: '0',
                position: 'relative'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Control Bar (Sticky top) */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 20px',
                background: '#0f172a',
                color: '#ffffff',
                borderTopLeftRadius: '9px',
                borderTopRightRadius: '9px',
                position: 'sticky',
                top: 0,
                zIndex: 10
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: 'bold' }}>
                  <Receipt size={18} color="#38bdf8" />
                  <span>Invoice Preview - #{bNumber}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 14px',
                      backgroundColor: '#059669',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onClick={() => handlePrintBill(selectedBill)}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#047857'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#059669'}
                  >
                    <Printer size={15} /> Print / PDF
                  </button>
                  <button
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 14px',
                      backgroundColor: '#25D366',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onClick={() => handleWhatsAppShare(selectedBill)}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#128C7E'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#25D366'}
                  >
                    <MessageCircle size={15} /> WhatsApp
                  </button>
                  <button
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      padding: '6px',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    onClick={() => setShowBillModal(false)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#ffffff';
                      e.currentTarget.style.backgroundColor = '#334155';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#94a3b8';
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Exact Paper Card */}
              <div style={{ padding: '24px', backgroundColor: '#ffffff' }}>
                <div style={{
                  border: '2.5px solid #1b4374',
                  borderRadius: '6px',
                  padding: '20px 24px',
                  backgroundColor: '#ffffff',
                  color: '#0f172a',
                  fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
                }}>
                  {/* Header Section */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '12px', marginBottom: '10px' }}>
                    {/* Left Side: Logo & Clinic Details */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', maxWidth: '360px' }}>
                      <div style={{ marginBottom: '4px' }}>
                        <img
                          src="/kheteswar-logo.png"
                          alt="KHETESWAR OPTICS"
                          style={{ height: '56px', maxWidth: '240px', width: 'auto', display: 'block', objectFit: 'contain' }}
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      </div>
                      <div style={{ fontSize: '12.5px', color: '#1e293b', lineHeight: '1.4' }}>
                        <div style={{ fontWeight: '700', fontSize: '15px', color: '#1b4374', marginBottom: '2px' }}>KHETESWAR OPTICS</div>
                        128, Baker Street, Broadway, Chennai - 600001.<br />
                        <span style={{ fontWeight: 'bold' }}>Mobile: 7708560890</span>
                      </div>
                    </div>

                    {/* Right Side: Customer Name, Mobile No, Address, DOB, Invoice No */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px', width: '320px' }}>
                      {/* Customer Name Line */}
                      <div style={{ fontSize: '12.5px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #cbd5e1', paddingBottom: '3px' }}>
                        <span style={{ fontWeight: 'bold', minWidth: '85px', color: '#1b4374' }}>Name</span>
                        <span style={{ fontWeight: 'bold', color: '#1b4374', margin: '0 4px' }}>:</span>
                        <div style={{ width: '100%', fontSize: '13px', fontWeight: 'bold', color: '#0f172a', textAlign: 'left', paddingLeft: '6px' }}>
                          {customerName}
                        </div>
                      </div>

                      {/* Customer Mobile No Line */}
                      <div style={{ fontSize: '12.5px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #cbd5e1', paddingBottom: '3px' }}>
                        <span style={{ fontWeight: 'bold', minWidth: '85px', color: '#1b4374' }}>Mobile No</span>
                        <span style={{ fontWeight: 'bold', color: '#1b4374', margin: '0 4px' }}>:</span>
                        <div style={{ width: '100%', fontSize: '13px', fontWeight: 'bold', color: '#0f172a', textAlign: 'left', paddingLeft: '6px' }}>
                          {customerPhone}
                        </div>
                      </div>

                      {/* Customer Address Line */}
                      <div style={{ fontSize: '12.5px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #cbd5e1', paddingBottom: '3px' }}>
                        <span style={{ fontWeight: 'bold', minWidth: '85px', color: '#1b4374' }}>Address</span>
                        <span style={{ fontWeight: 'bold', color: '#1b4374', margin: '0 4px' }}>:</span>
                        <div style={{ width: '100%', fontSize: '12px', fontWeight: 'bold', color: '#0f172a', textAlign: 'left', paddingLeft: '6px' }}>
                          {customerAddress}
                        </div>
                      </div>

                      {/* Customer DOB Line */}
                      <div style={{ fontSize: '12.5px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #cbd5e1', paddingBottom: '3px' }}>
                        <span style={{ fontWeight: 'bold', minWidth: '85px', color: '#1b4374' }}>DOB</span>
                        <span style={{ fontWeight: 'bold', color: '#1b4374', margin: '0 4px' }}>:</span>
                        <div style={{ width: '100%', fontSize: '12px', fontWeight: 'bold', color: '#0f172a', textAlign: 'left', paddingLeft: '6px' }}>
                          {customerDob}
                        </div>
                      </div>

                      {/* Invoice No Line */}
                      <div style={{ fontSize: '12.5px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #cbd5e1', paddingBottom: '3px' }}>
                        <span style={{ fontWeight: 'bold', minWidth: '85px', color: '#1b4374' }}>Invoice No</span>
                        <span style={{ fontWeight: 'bold', color: '#1b4374', margin: '0 4px' }}>:</span>
                        <div style={{ width: '100%', textAlign: 'left', paddingLeft: '6px', fontSize: '13px', fontWeight: '800', color: '#1b4374', fontFamily: "'Courier New', monospace", letterSpacing: '0.5px' }}>
                          {bNumber}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Double Horizontal Divider Line */}
                  <div style={{ borderTop: '2px solid #1b4374', borderBottom: '1px solid #1b4374', height: '2px', marginBottom: '12px' }}></div>

                  {/* Sub-Header Meta Bar */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1.5px solid #1b4374', borderRadius: '4px', padding: '6px 12px', fontSize: '11px', marginBottom: '14px', background: '#e8f2fc', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}>
                      <strong style={{ color: '#1b4374', whiteSpace: 'nowrap' }}>Order Date :</strong> <span style={{ fontWeight: 'bold', color: '#0f172a' }}>{orderDate}</span>
                    </div>
                    <div style={{ width: '1px', height: '18px', background: '#94a3b8' }}></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}>
                      <strong style={{ color: '#1b4374', whiteSpace: 'nowrap' }}>Due Date :</strong> <span style={{ fontWeight: 'bold', color: '#0f172a' }}>{dueDate}</span>
                    </div>
                    <div style={{ width: '1px', height: '18px', background: '#94a3b8' }}></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}>
                      <strong style={{ color: '#1b4374', whiteSpace: 'nowrap' }}>Time :</strong> <span style={{ fontWeight: 'bold', color: '#0f172a' }}>{orderTime}</span>
                    </div>
                    <div style={{ width: '1px', height: '18px', background: '#94a3b8' }}></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}>
                      <strong style={{ color: '#1b4374', whiteSpace: 'nowrap' }}>By Courier :</strong> <span style={{ fontWeight: 'bold', color: '#0f172a' }}>{byCourier}</span>
                    </div>
                  </div>

                  {/* Main 2-Column Section */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '14px', marginBottom: '12px' }}>
                    {/* Left Column */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {/* Product Details Card */}
                      <div style={{ border: '1.5px solid #1b4374', borderRadius: '4px', overflow: 'hidden', background: '#fff' }}>
                        <div style={{ background: '#1b4374', color: '#ffffff', fontWeight: 'bold', fontSize: '11.5px', padding: '6px 12px' }}>
                          Product Details
                        </div>
                        <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px dotted #cbd5e1', paddingBottom: '3px' }}>
                            <span style={{ fontWeight: 'bold', color: '#1b4374', width: '95px' }}>Frame Name</span>
                            <span style={{ fontWeight: 'bold', color: '#1b4374', margin: '0 4px' }}>:</span>
                            <span style={{ color: '#0f172a', fontWeight: 'bold' }}>{frameName}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', paddingBottom: '2px' }}>
                            <span style={{ fontWeight: 'bold', color: '#1b4374', width: '95px' }}>Lens Type</span>
                            <span style={{ fontWeight: 'bold', color: '#1b4374', margin: '0 4px' }}>:</span>
                            <span style={{ color: '#0f172a', fontWeight: 'bold' }}>{lensType}</span>
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
                            <td style={{ border: '1px solid #1b4374', padding: '6px', fontWeight: 'bold', color: '#0f172a' }}>{dvReSph}</td>
                            <td style={{ border: '1px solid #1b4374', padding: '6px', fontWeight: 'bold', color: '#0f172a' }}>{dvReCyl}</td>
                            <td style={{ border: '1px solid #1b4374', padding: '6px', fontWeight: 'bold', color: '#0f172a' }}>{dvReAxis}</td>
                            <td style={{ border: '1px solid #1b4374', padding: '6px', fontWeight: 'bold', color: '#0f172a' }}>{dvLeSph}</td>
                            <td style={{ border: '1px solid #1b4374', padding: '6px', fontWeight: 'bold', color: '#0f172a' }}>{dvLeCyl}</td>
                            <td style={{ border: '1px solid #1b4374', padding: '6px', fontWeight: 'bold', color: '#0f172a' }}>{dvLeAxis}</td>
                          </tr>
                          <tr>
                            <td style={{ border: '1px solid #1b4374', fontWeight: 'bold', background: '#e8f2fc', color: '#1b4374', padding: '6px' }}>N.V.</td>
                            <td style={{ border: '1px solid #1b4374', padding: '6px', fontWeight: 'bold', color: '#0f172a' }}>{nvReSph}</td>
                            <td style={{ border: '1px solid #1b4374', padding: '6px', fontWeight: 'bold', color: '#0f172a' }}>{nvReCyl}</td>
                            <td style={{ border: '1px solid #1b4374', padding: '6px', fontWeight: 'bold', color: '#0f172a' }}>{nvReAxis}</td>
                            <td style={{ border: '1px solid #1b4374', padding: '6px', fontWeight: 'bold', color: '#0f172a' }}>{nvLeSph}</td>
                            <td style={{ border: '1px solid #1b4374', padding: '6px', fontWeight: 'bold', color: '#0f172a' }}>{nvLeCyl}</td>
                            <td style={{ border: '1px solid #1b4374', padding: '6px', fontWeight: 'bold', color: '#0f172a' }}>{nvLeAxis}</td>
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
                          {items.length > 0 ? (
                            items.map((p, idx) => {
                              const name = p.productName || p.product_name || p.name || p.brand || p.itemName || p.item_name || 'Optical Item';
                              const model = p.productModel || p.product_model || p.model || '';
                              const qty = parseInt(p.quantity || p.qty || 1, 10) || 1;
                              let price = parseFloat(p.sellPrice || p.sell_price || p.price || 0);
                              let itemTot = parseFloat(p.total || p.amount || 0);

                              if (itemTot === 0 && price > 0) {
                                itemTot = qty * price;
                              } else if (price === 0 && itemTot > 0 && qty > 0) {
                                price = itemTot / qty;
                              } else if (itemTot === 0 && price === 0 && items.length === 1 && totalAmount > 0) {
                                itemTot = totalAmount;
                              }

                              return (
                                <tr key={idx} style={{ background: '#ffffff', backgroundColor: '#ffffff' }}>
                                  <td style={{ border: '1px solid #1b4374', padding: '6px 10px', color: '#0f172a', background: '#ffffff', backgroundColor: '#ffffff' }}>
                                    {name + (model ? ' (' + model + ')' : '') + (qty > 1 ? ' x' + qty : '')}
                                  </td>
                                  <td style={{ border: '1px solid #1b4374', padding: '6px 10px', textAlign: 'right', fontWeight: 'bold', color: '#0f172a', background: '#ffffff', backgroundColor: '#ffffff' }}>
                                    ₹{itemTot.toFixed(2)}
                                  </td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr style={{ background: '#ffffff', backgroundColor: '#ffffff' }}>
                              <td style={{ border: '1px solid #1b4374', padding: '8px 10px', color: '#0f172a', background: '#ffffff', backgroundColor: '#ffffff', fontWeight: '500' }}>
                                {(frameName && frameName !== '-') ? `${frameName}${lensType && lensType !== '-' ? ' + ' + lensType : ''}` : 'Lenses / Frame'}
                              </td>
                              <td style={{ border: '1px solid #1b4374', padding: '8px 10px', textAlign: 'right', fontWeight: 'bold', color: '#0f172a', background: '#ffffff', backgroundColor: '#ffffff' }}>
                                ₹{totalAmount.toFixed(2)}
                              </td>
                            </tr>
                          )}

                          {/* Pad empty rows so height matches left column */}
                          {Array.from({ length: Math.max(0, 3 - Math.max(items.length, 1)) }).map((_, i) => (
                            <tr key={'empty-' + i} style={{ background: '#ffffff', backgroundColor: '#ffffff' }}>
                              <td style={{ border: '1px solid #1b4374', padding: '8px', background: '#ffffff', backgroundColor: '#ffffff' }}>&nbsp;</td>
                              <td style={{ border: '1px solid #1b4374', padding: '8px', background: '#ffffff', backgroundColor: '#ffffff' }}>&nbsp;</td>
                            </tr>
                          ))}

                          <tr style={{ background: '#e8f2fc' }}>
                            <td style={{ border: '1px solid #1b4374', padding: '8px 12px', fontWeight: 'bold', textAlign: 'right', fontSize: '12px', color: '#1b4374' }}>TOTAL</td>
                            <td style={{ border: '1px solid #1b4374', padding: '8px 12px', textAlign: 'right', fontWeight: 'bold', fontSize: '13px', color: '#1b4374' }}>₹{totalAmount.toFixed(2)}</td>
                          </tr>
                          <tr style={{ background: '#e8f2fc' }}>
                            <td style={{ border: '1px solid #1b4374', padding: '6px 12px', fontWeight: 'bold', textAlign: 'right', color: '#1b4374' }}>
                              Adv. Recd. ({advMethod})
                            </td>
                            <td style={{ border: '1px solid #1b4374', padding: '6px 10px', textAlign: 'right', fontWeight: 'bold', color: '#1b4374' }}>
                              ₹ {advanceRecd.toFixed(2)}
                            </td>
                          </tr>
                          <tr style={{ background: '#e8f2fc' }}>
                            <td style={{ border: '1px solid #1b4374', padding: '6px 12px', fontWeight: 'bold', textAlign: 'right', color: '#1b4374' }}>
                              Balance Amt. ({balMethod})
                            </td>
                            <td style={{ border: '1px solid #1b4374', padding: '6px 10px', textAlign: 'right', fontWeight: 'bold', color: '#1b4374' }}>
                              ₹ {balanceAmt.toFixed(2)}
                            </td>
                          </tr>
                          {remainingDue > 0 && (
                            <tr style={{ background: '#fef2f2' }}>
                              <td style={{ border: '1px solid #1b4374', padding: '6px 12px', fontWeight: 'bold', textAlign: 'right', color: '#b91c1c' }}>Remaining Due</td>
                              <td style={{ border: '1px solid #1b4374', padding: '6px 12px', textAlign: 'right', fontWeight: 'bold', fontSize: '13px', color: '#b91c1c' }}>₹{remainingDue.toFixed(2)}</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* NOTES Card */}
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
              </div>

              {/* Bottom Footer Actions */}
              <div style={{
                display: 'flex',
                gap: '12px',
                padding: '16px 24px',
                backgroundColor: '#f8fafc',
                borderTop: '1px solid #e2e8f0',
                borderBottomLeftRadius: '9px',
                borderBottomRightRadius: '9px'
              }}>
                <button
                  style={{
                    backgroundColor: '#059669',
                    color: '#ffffff',
                    padding: '10px 20px',
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '600',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onClick={() => handlePrintBill(selectedBill)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#047857';
                    e.currentTarget.style.transform = 'scale(1.01)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#059669';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  <Printer size={16} /> Print Bill
                </button>
                <button
                  style={{
                    backgroundColor: '#25D366',
                    color: '#ffffff',
                    padding: '10px 20px',
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '600',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onClick={() => handleWhatsAppShare(selectedBill)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#128C7E';
                    e.currentTarget.style.transform = 'scale(1.01)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#25D366';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                  disabled={!selectedBill.customerPhone}
                  title={!selectedBill.customerPhone ? "No phone number available" : "Share on WhatsApp"}
                >
                  <MessageCircle size={16} /> WhatsApp
                </button>
                <button
                  style={{
                    backgroundColor: '#dc2626',
                    color: '#ffffff',
                    padding: '10px 20px',
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '600',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onClick={() => handleDeleteBill(selectedBill.id, selectedBill.billNumber)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#b91c1c';
                    e.currentTarget.style.transform = 'scale(1.01)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#dc2626';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                  title="Permanently delete this bill"
                >
                  <Trash2 size={16} /> Delete Bill
                </button>
                <button
                  style={{
                    backgroundColor: '#475569',
                    color: '#ffffff',
                    padding: '10px 20px',
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '600',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onClick={() => setShowBillModal(false)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#334155';
                    e.currentTarget.style.transform = 'scale(1.01)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#475569';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Add keyframe animation for spinner */}
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default VisitBillPage;