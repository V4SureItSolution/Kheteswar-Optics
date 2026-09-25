import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  MessageSquare,
  Clock,
  CheckCircle2,
  PhoneCall,
  Search,
  Filter,
  RefreshCw,
  Building2,
  PackageCheck,
  Send,
  Calendar,
  AlertTriangle,
  ChevronRight,
  Sparkles,
  DollarSign,
  Copy,
  ExternalLink,
  X,
  Eye,
  FileText,
  Download,
  Edit2,
  User,
  Check
} from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import { formatDate, formatTime } from '../utils/dateUtils';
import { generateBillPdfDoc, shareBillOnWhatsAppWithPdf, getPublicBillUrl } from '../utils/billPdfGenerator';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  }
});

const WhatsAppReminders = () => {
  // Main states
  const [activeTab, setActiveTab] = useState('pickup'); // 'pickup', 'balance', 'all'
  const [loading, setLoading] = useState(true);
  const [bills, setBills] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all'); // 'all', 'today', 'week', 'month'

  // Modal states
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [customMessage, setCustomMessage] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('pickup_ready');
  const [attachPdf, setAttachPdf] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showItemDetailsModal, setShowItemDetailsModal] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');
  const [completingBillId, setCompletingBillId] = useState(null);
  const [sendingBillId, setSendingBillId] = useState(null);

  // Edit / Sync Customer State
  const [showEditCustomerModal, setShowEditCustomerModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [editFormData, setEditFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    customerAddress: '',
    syncAll: true
  });
  const [savingCustomer, setSavingCustomer] = useState(false);

  // Fetch initial data
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setActionError('');

      // Fetch companies for dropdown
      try {
        const compRes = await api.get('/companies/list');
        if (Array.isArray(compRes.data)) {
          setCompanies(compRes.data);
        }
      } catch (err) {
        console.warn('Could not load company list', err);
      }

      // Fetch all bills with items to calculate pending pickup and pending balance
      const billsRes = await api.get('/billing/bills?per_page=150');
      const allBills = billsRes.data?.bills || billsRes.data || [];

      setBills(allBills);
    } catch (err) {
      console.error('Error fetching data for reminders:', err);
      setActionError('Failed to load orders. Please make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  // Helper to extract customer name reliably
  const getCustomerName = (bill) => {
    if (!bill) return 'Walk-in Customer';
    return (
      bill.customerName ||
      bill.customer?.name ||
      bill.customer_name ||
      'Walk-in Customer'
    );
  };

  // Helper to extract customer phone reliably
  const getCustomerPhone = (bill) => {
    if (!bill) return '';
    return (
      bill.customerPhone ||
      bill.customer?.phone ||
      bill.customer_phone ||
      ''
    );
  };

  // Helper to check if a bill has uncollected / pending items
  const isPendingPickup = (bill) => {
    if (!bill) return false;
    const colStatus = (bill.collectionStatus || bill.collection_status || '').toLowerCase();
    if (colStatus === 'collected' || colStatus === 'delivered' || colStatus === 'completed') {
      return false;
    }
    if (colStatus === 'not_collected') {
      return true;
    }
    if (bill.items && bill.items.length > 0) {
      return bill.items.some(
        (item) => !item.item_status || item.item_status === 'pending' || item.itemStatus === 'pending'
      );
    }
    return true;
  };

  // Helper to check if a bill has pending balance payment
  const isPendingBalance = (bill) => {
    if (!bill) return false;
    const payment = bill.payment || {};
    const balance = parseFloat(
      payment.balanceAmount ??
      bill.balanceAmount ??
      bill.balance_amount ??
      0
    );
    const total = parseFloat(bill.summary?.total ?? bill.total ?? 0);
    const paid = parseFloat(
      payment.paidAmount ??
      bill.paidAmount ??
      bill.paid_amount ??
      payment.advanceAmount ??
      bill.advanceAmount ??
      bill.advance_amount ??
      0
    );
    const status = (payment.status || bill.paymentStatus || bill.payment_status || '').toLowerCase();

    // If marked paid/completed or balance is 0 or paid >= total, it's NOT pending balance
    if (status === 'paid' || status === 'completed') return false;
    if (balance > 0) return true;
    if (total > 0 && total > paid && balance > 0) return true;
    return false;
  };

  // Filter bills based on active tab, search, company, and date
  const filteredBills = useMemo(() => {
    return bills.filter((bill) => {
      // Must have uncollected products to be eligible for WhatsApp reminders
      const pendingPickup = isPendingPickup(bill);
      if (!pendingPickup) return false;

      const pendingBal = isPendingBalance(bill);

      // Tab filter
      if (activeTab === 'pickup' && !pendingPickup) return false;
      if (activeTab === 'balance' && !pendingBal) return false;
      if (activeTab === 'all' && !pendingPickup && !pendingBal) return false;

      // Company filter
      if (selectedCompanyId !== 'all') {
        const billCompanyId = bill.company?.id ?? bill.companyId ?? bill.company_id;
        if (String(billCompanyId) !== String(selectedCompanyId)) return false;
      }

      // Search filter
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const custName = getCustomerName(bill).toLowerCase();
        const custPhone = getCustomerPhone(bill).toLowerCase();
        const billNo = (bill.billNumber || bill.bill_number || '').toLowerCase();
        const compName = (bill.companyName || bill.company?.name || bill.company_name || '').toLowerCase();
        if (
          !custName.includes(term) &&
          !custPhone.includes(term) &&
          !billNo.includes(term) &&
          !compName.includes(term)
        ) {
          return false;
        }
      }

      // Date filter
      if (dateFilter !== 'all' && bill.createdAt) {
        const billDate = new Date(bill.createdAt);
        const now = new Date();
        if (dateFilter === 'today') {
          const isToday = billDate.toDateString() === now.toDateString();
          if (!isToday) return false;
        } else if (dateFilter === 'week') {
          const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          if (billDate < sevenDaysAgo) return false;
        } else if (dateFilter === 'month') {
          const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          if (billDate < thirtyDaysAgo) return false;
        }
      }

      return true;
    });
  }, [bills, activeTab, selectedCompanyId, searchTerm, dateFilter]);

  // Statistics
  const stats = useMemo(() => {
    let pendingPickupCount = 0;
    let pendingBalanceCount = 0;
    let totalBalanceDue = 0;

    bills.forEach((bill) => {
      const isUncollected = isPendingPickup(bill);
      if (isUncollected) {
        pendingPickupCount++;
        if (isPendingBalance(bill)) {
          pendingBalanceCount++;
          const balance = bill.payment?.balanceAmount ?? bill.balanceAmount ?? bill.balance_amount ?? 0;
          totalBalanceDue += Number(balance) || 0;
        }
      }
    });

    return {
      pendingPickupCount,
      pendingBalanceCount,
      totalBalanceDue: Math.round(totalBalanceDue),
      totalActionable: pendingPickupCount
    };
  }, [bills]);

  // Normalize bill data for the PDF generator
  const normalizeBillForPdf = (bill) => {
    const custName = getCustomerName(bill);
    const custPhone = getCustomerPhone(bill);
    const custEmail = bill.customerEmail || bill.customer?.email || bill.customer_email || '';
    const custAddress = bill.customerAddress || bill.customer?.address || bill.customer_address || '';
    const custDob = bill.customerDob || bill.customer?.dob || bill.customer_dob || bill.dob || '';

    return {
      id: bill.id,
      billNumber: bill.billNumber || bill.bill_number || `ID-${bill.id}`,
      customerName: custName,
      customerPhone: custPhone,
      customerEmail: custEmail,
      customerAddress: custAddress,
      customerDob: custDob,
      billDate: bill.createdAt ? new Date(bill.createdAt).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB'),
      date: bill.createdAt ? new Date(bill.createdAt).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB'),
      dueDate: bill.dueDate || bill.due_date || '',
      orderTime: bill.orderTime || bill.time || (bill.createdAt ? formatTime(bill.createdAt) : ''),
      byCourier: bill.byCourier || bill.by_courier || bill.courier || 'No',
      frameName: bill.frameName || bill.frame_name || bill.frameNo || bill.frame_no || bill.frameDetail || '',
      lensType: bill.lensType || bill.lens_type || bill.lensesDetail || bill.lenses_detail || '',
      dvReSph: bill.dvReSph ?? bill.dv_re_sph ?? '',
      dvReCyl: bill.dvReCyl ?? bill.dv_re_cyl ?? '',
      dvReAxis: bill.dvReAxis ?? bill.dv_re_axis ?? '',
      dvLeSph: bill.dvLeSph ?? bill.dv_le_sph ?? '',
      dvLeCyl: bill.dvLeCyl ?? bill.dv_le_cyl ?? '',
      dvLeAxis: bill.dvLeAxis ?? bill.dv_le_axis ?? '',
      nvReSph: bill.nvReSph ?? bill.nv_re_sph ?? '',
      nvReCyl: bill.nvReCyl ?? bill.nv_re_cyl ?? '',
      nvReAxis: bill.nvReAxis ?? bill.nv_re_axis ?? '',
      nvLeSph: bill.nvLeSph ?? bill.nv_le_sph ?? '',
      nvLeCyl: bill.nvLeCyl ?? bill.nv_le_cyl ?? '',
      nvLeAxis: bill.nvLeAxis ?? bill.nv_le_axis ?? '',
      total: parseFloat(bill.summary?.total ?? bill.total ?? 0),
      advanceAmount: parseFloat(bill.payment?.advanceAmount ?? bill.advanceAmount ?? bill.payment?.paidAmount ?? bill.paidAmount ?? bill.paid_amount ?? 0),
      balanceAmount: parseFloat(bill.payment?.balanceAmount ?? bill.balanceAmount ?? bill.balance_amount ?? 0),
      paymentMethod: bill.payment?.method || bill.paymentMethod || bill.payment_method || 'cash',
      advancePaymentMethod: bill.advancePaymentMethod || bill.advance_payment_method || bill.payment?.advancePaymentMethod || 'cash',
      balancePaymentMethod: bill.balancePaymentMethod || bill.balance_payment_method || bill.payment?.balancePaymentMethod || 'cash',
      items: (bill.items || []).map((item) => ({
        productName: item.product_name || item.productName || 'Product',
        productModel: item.product_model || item.productModel || '-',
        productType: item.product_type || item.productType || '-',
        quantity: item.quantity || 1,
        sellPrice: item.sell_price || item.sellPrice || 0,
        total: item.total || 0,
        itemStatus: item.item_status || item.itemStatus || 'pending'
      }))
    };
  };

  // Format phone number to WhatsApp international format (e.g. 91XXXXXXXXXX)
  const formatWhatsAppNumber = (phone) => {
    if (!phone) return '';
    const clean = String(phone).replace(/\D/g, '');
    if (clean.length === 10) return `91${clean}`;
    return clean;
  };

  // Generate reminder message text based on template
  const generateMessage = (bill, templateKey) => {
    if (!bill) return '';
    const custName = getCustomerName(bill);
    const billNo = bill.billNumber || bill.bill_number || 'N/A';
    const compName = bill.companyName || bill.company?.name || bill.company_name || 'KHETESWAR OPTICS';
    const compPhone = bill.companyPhone || bill.company?.phone || bill.company_phone || '7708560890';
    const total = bill.summary?.total ?? bill.total ?? 0;
    const balance = bill.payment?.balanceAmount ?? bill.balanceAmount ?? bill.balance_amount ?? 0;

    // List item names
    const itemsList = (bill.items || [])
      .map((item) => `• ${item.product_name || item.productName || 'Product'} (Qty: ${item.quantity || 1})`)
      .join('\n');

    const billUrl = getPublicBillUrl(billNo);

    const balNum = parseFloat(balance) || 0;
    const balanceText = balNum > 0 ? `₹${balNum}` : '₹0 (Paid in full)';

    switch (templateKey) {
      case 'pickup_ready':
        return `Hello *${custName}*! 👋\n\nGreat news! Your order *(Bill No: #${billNo})* is ready for pickup at *${compName}*.\n\n📦 *Items:*\n${itemsList || '• Your ordered items'}\n\n💰 *Total Amount:* ₹${total}\n💳 *Balance Due:* ${balanceText}\n\n🔗 *View Official Invoice:*\n${billUrl}\n\nKindly visit our store during working hours to collect your order.\nIf you have any questions, reply here or call ${compPhone}.\n\nThank you for choosing *${compName}*! ✨`;

      case 'pickup_reminder':
        return `Hello *${custName}*! 👋\n\nThis is a friendly reminder regarding your pending order collection *(Bill No: #${billNo})* at *${compName}*.\n\nYour items are safely packed and waiting for you:\n${itemsList || '• Your ordered items'}\n\n💳 *Balance Due on Pickup:* ${balanceText}\n\n🔗 *View Official Invoice:*\n${billUrl}\n\nPlease visit our store at your convenience to collect your items.\n\n— *${compName}*`;

      case 'final_notice':
        return `Dear *${custName}*,\n\nUrgent notice regarding your uncollected order *(Bill No: #${billNo})* at *${compName}*.\n\nYour ordered items have been ready for a while. Please arrange to collect your order within the next 3 days.\n\n💳 *Balance Amount:* ${balanceText}\n\n🔗 *View Official Invoice:*\n${billUrl}\n\nFor queries, contact us at ${compPhone}.\nThank you,\n*${compName}*`;

      case 'balance_only':
        return `Hello *${custName}*! 👋\n\nThis is a gentle reminder regarding your invoice *(Bill No: #${billNo})* with *${compName}*.\n\n📊 *Total Bill:* ₹${total}\n💳 *Pending Balance:* ${balanceText}\n\n🔗 *View Official Invoice:*\n${billUrl}\n\nKindly clear the remaining balance at your earliest convenience. Thank you for your business! 🙏\n\n— *${compName}*`;

      default:
        return `Hello *${custName}*, greeting from *${compName}*. This is regarding your order #${billNo}.\n\n🔗 View Invoice: ${billUrl}\n\nThank you!`;
    }
  };

  // Main Action: Send WhatsApp Bill + PDF + Reminder (Opens WhatsApp Web with chat and bill)
  const handleSendWhatsAppBillWithPdf = async (bill, template = 'pickup_ready') => {
    const phone = getCustomerPhone(bill);
    if (!phone) {
      alert('Customer mobile number is not available for this bill. You can add or sync customer phone number by clicking the edit icon.');
      handleOpenEditCustomer(bill);
      return;
    }

    try {
      setSendingBillId(bill.id);
      setActionSuccess('');
      setActionError('');

      const normalizedBill = normalizeBillForPdf(bill);

      // Trigger the official WhatsApp + PDF workflow from billPdfGenerator
      await shareBillOnWhatsAppWithPdf(normalizedBill, (status) => {
        if (status?.type === 'success') {
          setActionSuccess(status.message || `WhatsApp Web chat opened for ${normalizedBill.customerName}!`);
        }
      });
    } catch (err) {
      console.error('WhatsApp share error:', err);
      setActionError(err.message || 'Failed to open WhatsApp');
    } finally {
      setSendingBillId(null);
    }
  };

  // Download PDF only (when explicitly requested by user clicking download)
  const handleDownloadPdf = (bill) => {
    try {
      const normalizedBill = normalizeBillForPdf(bill);
      const doc = generateBillPdfDoc(normalizedBill);
      const fileName = `Kheteswar_Optics_Bill_${normalizedBill.billNumber}.pdf`;
      doc.save(fileName);
      setActionSuccess(`Downloaded ${fileName} successfully!`);
    } catch (err) {
      console.error('PDF error:', err);
      setActionError('Failed to generate PDF');
    }
  };

  // Open Custom Message Modal
  const handleOpenCustomModal = (bill) => {
    setSelectedOrder(bill);
    const defaultTemplate = isPendingPickup(bill) ? 'pickup_ready' : 'balance_only';
    setSelectedTemplate(defaultTemplate);
    setCustomMessage(generateMessage(bill, defaultTemplate));
    setAttachPdf(true);
    setShowModal(true);
  };

  // Change Template in Modal
  const handleTemplateChange = (templateKey) => {
    setSelectedTemplate(templateKey);
    setCustomMessage(generateMessage(selectedOrder, templateKey));
  };

  // Send from Modal
  const handleSendFromModal = async () => {
    if (!selectedOrder) return;
    const phone = getCustomerPhone(selectedOrder);
    if (!phone) {
      alert('Customer phone number is missing. Please edit the customer details to add a phone number.');
      handleOpenEditCustomer(selectedOrder);
      return;
    }

    const whatsappNumber = formatWhatsAppNumber(phone);
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent || '');

    // Open WhatsApp URL with formatted text & direct bill link
    const encodedText = encodeURIComponent(customMessage);
    const whatsappUrl = isMobile
      ? `https://api.whatsapp.com/send?phone=${whatsappNumber}&text=${encodedText}`
      : `https://web.whatsapp.com/send?phone=${whatsappNumber}&text=${encodedText}`;

    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    setShowModal(false);
    setActionSuccess(`📱 WhatsApp Web chat opened for ${getCustomerName(selectedOrder)}!`);
  };

  // Open Edit Customer Modal
  const handleOpenEditCustomer = (bill, e) => {
    if (e) e.stopPropagation();
    const custName = getCustomerName(bill);
    const custPhone = getCustomerPhone(bill);
    const custEmail = bill.customerEmail || bill.customer?.email || bill.customer_email || '';
    const custAddress = bill.customerAddress || bill.customer?.address || bill.customer_address || '';

    setEditingCustomer(bill);
    setEditFormData({
      customerName: custName === 'Walk-in Customer' ? '' : custName,
      customerPhone: custPhone,
      customerEmail: custEmail,
      customerAddress: custAddress,
      syncAll: true
    });
    setShowEditCustomerModal(true);
  };

  // Save / Sync Customer Information
  const handleSaveCustomerDetails = async (e) => {
    if (e) e.preventDefault();
    if (!editingCustomer) return;

    const trimmedName = editFormData.customerName.trim() || 'Walk-in Customer';
    const trimmedPhone = editFormData.customerPhone.trim();

    try {
      setSavingCustomer(true);
      setActionError('');
      setActionSuccess('');

      const res = await api.put(`/billing/bills/${editingCustomer.id}/customer`, {
        customerName: trimmedName,
        customerPhone: trimmedPhone,
        customerEmail: editFormData.customerEmail.trim(),
        customerAddress: editFormData.customerAddress.trim(),
        syncAll: editFormData.syncAll
      });

      if (res.data?.success) {
        setActionSuccess(`✓ Customer synced: ${trimmedName} (${trimmedPhone || 'No Phone'})`);

        // Update local state for all matching bills if syncAll, or just this bill
        setBills((prevBills) =>
          prevBills.map((b) => {
            const isTarget = b.id === editingCustomer.id;
            const isMatch = editFormData.syncAll && (
              (editingCustomer.customerPhone && (b.customerPhone === editingCustomer.customerPhone || b.customer?.phone === editingCustomer.customerPhone)) ||
              (editingCustomer.customerName && b.customerName === editingCustomer.customerName)
            );

            if (isTarget || isMatch) {
              return {
                ...b,
                customerName: trimmedName,
                customer_name: trimmedName,
                customerPhone: trimmedPhone,
                customer_phone: trimmedPhone,
                customerEmail: editFormData.customerEmail.trim(),
                customer_email: editFormData.customerEmail.trim(),
                customerAddress: editFormData.customerAddress.trim(),
                customer_address: editFormData.customerAddress.trim(),
                customer: {
                  ...(b.customer || {}),
                  name: trimmedName,
                  phone: trimmedPhone,
                  email: editFormData.customerEmail.trim(),
                  address: editFormData.customerAddress.trim()
                }
              };
            }
            return b;
          })
        );

        // Update selectedOrder if it was being previewed
        if (selectedOrder && selectedOrder.id === editingCustomer.id) {
          const updatedSelected = {
            ...selectedOrder,
            customerName: trimmedName,
            customer_name: trimmedName,
            customerPhone: trimmedPhone,
            customer_phone: trimmedPhone,
            customerEmail: editFormData.customerEmail.trim(),
            customer_email: editFormData.customerEmail.trim(),
            customerAddress: editFormData.customerAddress.trim(),
            customer_address: editFormData.customerAddress.trim(),
            customer: {
              ...(selectedOrder.customer || {}),
              name: trimmedName,
              phone: trimmedPhone,
              email: editFormData.customerEmail.trim(),
              address: editFormData.customerAddress.trim()
            }
          };
          setSelectedOrder(updatedSelected);
          setCustomMessage(generateMessage(updatedSelected, selectedTemplate));
        }

        setShowEditCustomerModal(false);
      }
    } catch (err) {
      console.error('Error updating customer details:', err);
      setActionError(err.response?.data?.error || 'Failed to update customer details');
    } finally {
      setSavingCustomer(false);
    }
  };

  // Mark all items in an order as completed / collected
  const handleMarkAsCollected = async (billId) => {
    try {
      setCompletingBillId(billId);
      setActionSuccess('');
      setActionError('');

      const res = await api.post(`/billing/bills/${billId}/complete-all`);
      if (res.data?.success) {
        setActionSuccess(`Order #${billId} successfully marked as collected!`);

        // Update state locally
        setBills((prevBills) =>
          prevBills.map((b) => {
            if (b.id === billId) {
              const updatedItems = (b.items || []).map((item) => ({
                ...item,
                item_status: 'completed',
                itemStatus: 'completed'
              }));
              return { ...b, items: updatedItems };
            }
            return b;
          })
        );
      }
    } catch (err) {
      console.error('Error completing bill items:', err);
      setActionError(err.response?.data?.error || 'Failed to update item collection status');
    } finally {
      setCompletingBillId(null);
    }
  };

  return (
    <div style={styles.container}>
      {/* Top Banner & Header */}
      <div style={styles.header}>
        <div style={styles.titleSection}>
          <div style={styles.iconCircle}>
            <FaWhatsapp size={28} color="#25D366" />
          </div>
          <div>
            <h1 style={styles.title}>WhatsApp Bill & Collection Reminders</h1>
            <p style={styles.subtitle}>
              Synced customer names and mobile numbers. Open WhatsApp Web directly with pre-filled message and attached bill PDF.
            </p>
          </div>
        </div>

        <button
          onClick={fetchInitialData}
          disabled={loading}
          style={styles.refreshBtn}
          title="Refresh orders"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Orders</span>
        </button>
      </div>

      {/* Action Notifications */}
      {actionSuccess && (
        <div style={styles.alertSuccess}>
          <CheckCircle2 size={18} color="#10B981" />
          <span>{actionSuccess}</span>
          <button onClick={() => setActionSuccess('')} style={styles.closeAlert}>
            <X size={14} />
          </button>
        </div>
      )}

      {actionError && (
        <div style={styles.alertError}>
          <AlertTriangle size={18} color="#EF4444" />
          <span>{actionError}</span>
          <button onClick={() => setActionError('')} style={styles.closeAlert}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* KPI Stats Cards */}
      <div style={styles.statsGrid}>
        <div
          style={{
            ...styles.statCard,
            borderColor: activeTab === 'pickup' ? '#25D366' : 'rgba(255,255,255,0.08)'
          }}
          onClick={() => setActiveTab('pickup')}
        >
          <div style={styles.statTop}>
            <span style={styles.statLabel}>Pending Collection</span>
            <div style={{ ...styles.statIconBadge, backgroundColor: 'rgba(37, 211, 102, 0.15)' }}>
              <PackageCheck size={18} color="#25D366" />
            </div>
          </div>
          <div style={styles.statValue}>{stats.pendingPickupCount}</div>
          <span style={styles.statSubtext}>Orders waiting for customer pickup</span>
        </div>

        <div
          style={{
            ...styles.statCard,
            borderColor: activeTab === 'balance' ? '#F59E0B' : 'rgba(255,255,255,0.08)'
          }}
          onClick={() => setActiveTab('balance')}
        >
          <div style={styles.statTop}>
            <span style={styles.statLabel}>Pending Balance</span>
            <div style={{ ...styles.statIconBadge, backgroundColor: 'rgba(245, 158, 11, 0.15)' }}>
              <DollarSign size={18} color="#F59E0B" />
            </div>
          </div>
          <div style={styles.statValue}>₹{stats.totalBalanceDue.toLocaleString('en-IN')}</div>
          <span style={styles.statSubtext}>{stats.pendingBalanceCount} orders with balance dues</span>
        </div>

        <div
          style={{
            ...styles.statCard,
            borderColor: activeTab === 'all' ? '#3B82F6' : 'rgba(255,255,255,0.08)'
          }}
          onClick={() => setActiveTab('all')}
        >
          <div style={styles.statTop}>
            <span style={styles.statLabel}>Total Actionable</span>
            <div style={{ ...styles.statIconBadge, backgroundColor: 'rgba(59, 130, 246, 0.15)' }}>
              <Clock size={18} color="#3B82F6" />
            </div>
          </div>
          <div style={styles.statValue}>{stats.totalActionable}</div>
          <span style={styles.statSubtext}>Total customers to notify</span>
        </div>
      </div>

      {/* Tabs & Search Filter Bar */}
      <div style={styles.controlsCard}>
        {/* Navigation Tabs */}
        <div style={styles.tabsWrapper}>
          <button
            style={activeTab === 'pickup' ? styles.tabActive : styles.tabInactive}
            onClick={() => setActiveTab('pickup')}
          >
            <PackageCheck size={16} />
            <span>Uncollected Orders ({stats.pendingPickupCount})</span>
          </button>

          <button
            style={activeTab === 'balance' ? styles.tabActive : styles.tabInactive}
            onClick={() => setActiveTab('balance')}
          >
            <DollarSign size={16} />
            <span>Pending Balance ({stats.pendingBalanceCount})</span>
          </button>

          <button
            style={activeTab === 'all' ? styles.tabActive : styles.tabInactive}
            onClick={() => setActiveTab('all')}
          >
            <Clock size={16} />
            <span>All Pending ({stats.totalActionable})</span>
          </button>
        </div>

        {/* Filters: Search, Company, Date */}
        <div style={styles.filterRow}>
          {/* Search Box */}
          <div style={styles.searchBox}>
            <Search size={16} color="#94A3B8" />
            <input
              type="text"
              placeholder="Search by customer name, phone number, or bill #..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={styles.searchInput}
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} style={styles.clearSearchBtn}>
                <X size={14} />
              </button>
            )}
          </div>

          {/* Company Filter Dropdown */}
          {companies.length > 0 && (
            <div style={styles.dropdownWrapper}>
              <Building2 size={16} color="#94A3B8" />
              <select
                value={selectedCompanyId}
                onChange={(e) => setSelectedCompanyId(e.target.value)}
                style={styles.selectInput}
              >
                <option value="all">All Companies / Branches</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Date Filter */}
          <div style={styles.dropdownWrapper}>
            <Calendar size={16} color="#94A3B8" />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              style={styles.selectInput}
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Past 7 Days</option>
              <option value="month">Past 30 Days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders List / Table */}
      <div style={styles.tableCard}>
        {loading ? (
          <div style={styles.loadingContainer}>
            <RefreshCw size={32} color="#25D366" className="animate-spin" />
            <span style={styles.loadingText}>Fetching uncollected customer orders...</span>
          </div>
        ) : filteredBills.length === 0 ? (
          <div style={styles.emptyState}>
            <CheckCircle2 size={48} color="#10B981" />
            <h3 style={styles.emptyTitle}>All Caught Up!</h3>
            <p style={styles.emptyText}>
              {searchTerm || selectedCompanyId !== 'all' || dateFilter !== 'all'
                ? 'No matching orders found with current filters.'
                : 'No pending collections or balance reminders at this time.'}
            </p>
          </div>
        ) : (
          <div style={styles.tableResponsive}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.thRow}>
                  <th style={styles.th}>Bill # & Date</th>
                  <th style={styles.th}>Customer Name & Phone</th>
                  <th style={styles.th}>Products & Status</th>
                  <th style={styles.th}>Payment & Balance</th>
                  <th style={styles.th}>Branch</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>WhatsApp Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBills.map((bill) => {
                  const billNo = bill.billNumber || bill.bill_number || `ID-${bill.id}`;
                  const custName = getCustomerName(bill);
                  const custPhone = getCustomerPhone(bill);
                  const total = bill.summary?.total ?? bill.total ?? 0;
                  const balance = bill.payment?.balanceAmount ?? bill.balanceAmount ?? bill.balance_amount ?? 0;
                  const compName = bill.companyName || bill.company?.name || bill.company_name || 'Main Branch';
                  const hasPendingItems = isPendingPickup(bill);
                  const isSending = sendingBillId === bill.id;
                  const dateStr = bill.createdAt ? new Date(bill.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  }) : 'N/A';

                  return (
                    <tr key={bill.id} style={styles.tr}>
                      {/* Bill # & Date */}
                      <td style={styles.td}>
                        <div style={styles.billNoBadge}>#{billNo}</div>
                        <div style={styles.dateLabel}>{dateStr}</div>
                      </td>

                      {/* Customer Info (Name & Phone) */}
                      <td style={styles.td}>
                        <div style={styles.custNameRow}>
                          <span style={styles.custName}>{custName}</span>
                          <button
                            onClick={(e) => handleOpenEditCustomer(bill, e)}
                            style={styles.editCustInlineBtn}
                            title="Edit / Sync Customer Details"
                          >
                            <Edit2 size={12} />
                          </button>
                        </div>
                        {custPhone ? (
                          <div style={styles.phoneRow}>
                            <PhoneCall size={12} color="#38BDF8" />
                            <a href={`tel:${custPhone}`} style={styles.phoneLink}>
                              {custPhone}
                            </a>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => handleOpenEditCustomer(bill, e)}
                            style={styles.addPhoneBtn}
                          >
                            + Add Phone Number
                          </button>
                        )}
                      </td>

                      {/* Products / Items Status */}
                      <td style={styles.td}>
                        <div style={styles.itemsSummary}>
                          {hasPendingItems ? (
                            <span style={styles.badgePendingPickup}>
                              <Clock size={12} />
                              <span>Waiting Collection</span>
                            </span>
                          ) : (
                            <span style={styles.badgeReady}>
                              <CheckCircle2 size={12} />
                              <span>Collected</span>
                            </span>
                          )}

                          <button
                            onClick={() => {
                              setSelectedOrder(bill);
                              setShowItemDetailsModal(true);
                            }}
                            style={styles.viewItemsBtn}
                          >
                            <Eye size={12} />
                            <span>{(bill.items || []).length} Item(s)</span>
                          </button>
                        </div>
                      </td>

                      {/* Financials */}
                      <td style={styles.td}>
                        <div style={styles.priceRow}>
                          <span style={styles.priceLabel}>Total:</span>
                          <span style={styles.priceVal}>₹{total}</span>
                        </div>
                        {balance > 0 ? (
                          <div style={styles.balanceRow}>
                            <span style={styles.balanceLabel}>Due:</span>
                            <span style={styles.balanceVal}>₹{balance}</span>
                          </div>
                        ) : (
                          <div style={styles.paidInFull}>Paid in full</div>
                        )}
                      </td>

                      {/* Branch / Company */}
                      <td style={styles.td}>
                        <div style={styles.branchName}>{compName}</div>
                      </td>

                      {/* Actions */}
                      <td style={{ ...styles.td, textAlign: 'right' }}>
                        <div style={styles.actionButtons}>
                          {/* Send Bill PDF + WhatsApp Reminder (Direct Web Open) */}
                          <button
                            onClick={() => handleSendWhatsAppBillWithPdf(bill, hasPendingItems ? 'pickup_ready' : 'balance_only')}
                            disabled={isSending}
                            style={{
                              ...styles.whatsappBtn,
                              opacity: custPhone ? 1 : 0.8
                            }}
                            title={custPhone ? 'Open WhatsApp chat with Bill PDF & Reminder' : 'Click to add phone number & send'}
                          >
                            <FaWhatsapp size={16} />
                            <span>{isSending ? 'Opening...' : custPhone ? 'Send Bill PDF' : 'Add Phone & Send'}</span>
                          </button>

                          {/* Download PDF button */}
                          <button
                            onClick={() => handleDownloadPdf(bill)}
                            style={styles.iconBtn}
                            title="Download Bill PDF"
                          >
                            <Download size={14} />
                          </button>

                          {/* Custom Message Modal */}
                          <button
                            onClick={() => handleOpenCustomModal(bill)}
                            style={styles.iconBtn}
                            title="Customize message before sending"
                          >
                            <MessageSquare size={14} />
                          </button>

                          {/* Mark as Collected Button */}
                          {hasPendingItems && (
                            <button
                              onClick={() => handleMarkAsCollected(bill.id)}
                              disabled={completingBillId === bill.id}
                              style={styles.completeBtn}
                              title="Mark order items as collected"
                            >
                              <PackageCheck size={14} />
                              <span>{completingBillId === bill.id ? 'Saving...' : 'Mark Done'}</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: Custom Message Preview & Templates */}
      {showModal && selectedOrder && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={styles.modalTitleRow}>
                <FaWhatsapp size={20} color="#25D366" />
                <h3 style={styles.modalTitle}>
                  Send WhatsApp Bill & Reminder — {getCustomerName(selectedOrder)}
                </h3>
              </div>
              <button onClick={() => setShowModal(false)} style={styles.modalCloseBtn}>
                <X size={18} />
              </button>
            </div>

            <div style={styles.modalBody}>
              {/* Template Selector Chips */}
              <div style={styles.templateSection}>
                <label style={styles.sectionLabel}>Quick Message Template:</label>
                <div style={styles.chipRow}>
                  <button
                    style={selectedTemplate === 'pickup_ready' ? styles.chipActive : styles.chip}
                    onClick={() => handleTemplateChange('pickup_ready')}
                  >
                    📦 Ready for Pickup
                  </button>
                  <button
                    style={selectedTemplate === 'pickup_reminder' ? styles.chipActive : styles.chip}
                    onClick={() => handleTemplateChange('pickup_reminder')}
                  >
                    🔔 Follow-up Reminder
                  </button>
                  <button
                    style={selectedTemplate === 'final_notice' ? styles.chipActive : styles.chip}
                    onClick={() => handleTemplateChange('final_notice')}
                  >
                    ⚠️ Final Notice
                  </button>
                  <button
                    style={selectedTemplate === 'balance_only' ? styles.chipActive : styles.chip}
                    onClick={() => handleTemplateChange('balance_only')}
                  >
                    💳 Balance Due Reminder
                  </button>
                </div>
              </div>

              {/* Editable Text Area */}
              <div style={styles.textareaSection}>
                <label style={styles.sectionLabel}>WhatsApp Message:</label>
                <textarea
                  rows={7}
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  style={styles.textarea}
                  placeholder="Type or customize your WhatsApp message..."
                />
              </div>

              {/* PDF Attachment Toggle */}
              <div style={styles.pdfToggleRow}>
                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={attachPdf}
                    onChange={(e) => setAttachPdf(e.target.checked)}
                    style={{ cursor: 'pointer', accentColor: '#25D366' }}
                  />
                  <span>Attach Official Bill PDF (Downloads invoice to drag into chat)</span>
                </label>
              </div>

              {/* Customer Phone Confirmation & Quick Edit */}
              <div style={styles.phoneConfirmation}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>Recipient WhatsApp:</span>
                  <strong style={{ color: getCustomerPhone(selectedOrder) ? '#38BDF8' : '#EF4444' }}>
                    {getCustomerPhone(selectedOrder) || 'Missing Phone Number'}
                  </strong>
                </div>
                <button
                  type="button"
                  onClick={(e) => handleOpenEditCustomer(selectedOrder, e)}
                  style={styles.editPhoneBtnInModal}
                >
                  <Edit2 size={12} />
                  <span>{getCustomerPhone(selectedOrder) ? 'Edit Phone' : 'Add Phone'}</span>
                </button>
              </div>
            </div>

            <div style={styles.modalFooter}>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(customMessage);
                  alert('Message copied to clipboard!');
                }}
                style={styles.copyBtn}
              >
                <Copy size={14} />
                <span>Copy Text</span>
              </button>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setShowModal(false)} style={styles.cancelBtn}>
                  Cancel
                </button>
                <button onClick={handleSendFromModal} style={styles.sendWhatsAppModalBtn}>
                  <FaWhatsapp size={16} />
                  <span>Open WhatsApp Web Chat</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: View Item Details */}
      {showItemDetailsModal && selectedOrder && (
        <div style={styles.modalOverlay} onClick={() => setShowItemDetailsModal(false)}>
          <div style={{ ...styles.modalContent, maxWidth: '550px' }} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={styles.modalTitleRow}>
                <PackageCheck size={20} color="#3B82F6" />
                <h3 style={styles.modalTitle}>
                  Items in Bill #{selectedOrder.billNumber || selectedOrder.bill_number}
                </h3>
              </div>
              <button onClick={() => setShowItemDetailsModal(false)} style={styles.modalCloseBtn}>
                <X size={18} />
              </button>
            </div>

            <div style={styles.modalBody}>
              <div style={styles.itemsListContainer}>
                {(selectedOrder.items || []).map((item, idx) => {
                  const isPending = !item.item_status || item.item_status === 'pending' || item.itemStatus === 'pending';
                  return (
                    <div key={idx} style={styles.itemDetailRow}>
                      <div style={{ flex: 1 }}>
                        <div style={styles.itemDetailName}>
                          {item.product_name || item.productName || 'Product'}
                        </div>
                        <div style={styles.itemDetailSub}>
                          Model: {item.product_model || item.productModel || 'N/A'} | Qty: {item.quantity || 1}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={styles.itemPrice}>₹{item.total || item.sell_price || 0}</div>
                        {isPending ? (
                          <span style={styles.badgePendingPickupSmall}>Pending Collection</span>
                        ) : (
                          <span style={styles.badgeReadySmall}>Collected</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={styles.modalFooter}>
              <button onClick={() => setShowItemDetailsModal(false)} style={styles.cancelBtn}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Edit & Sync Customer Details */}
      {showEditCustomerModal && editingCustomer && (
        <div style={styles.modalOverlay} onClick={() => setShowEditCustomerModal(false)}>
          <div style={{ ...styles.modalContent, maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleSaveCustomerDetails}>
              <div style={styles.modalHeader}>
                <div style={styles.modalTitleRow}>
                  <User size={20} color="#38BDF8" />
                  <h3 style={styles.modalTitle}>
                    Edit & Sync Customer Details — Bill #{editingCustomer.billNumber || editingCustomer.bill_number}
                  </h3>
                </div>
                <button type="button" onClick={() => setShowEditCustomerModal(false)} style={styles.modalCloseBtn}>
                  <X size={18} />
                </button>
              </div>

              <div style={styles.modalBody}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Customer Name *:</label>
                  <input
                    type="text"
                    required
                    value={editFormData.customerName}
                    onChange={(e) => setEditFormData({ ...editFormData, customerName: e.target.value })}
                    placeholder="Customer Name"
                    style={styles.formInput}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Mobile Number (10 digits for WhatsApp):</label>
                  <input
                    type="text"
                    maxLength="10"
                    value={editFormData.customerPhone}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setEditFormData({ ...editFormData, customerPhone: digits });
                    }}
                    placeholder="9876543210"
                    style={styles.formInput}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Email Address (Optional):</label>
                  <input
                    type="email"
                    value={editFormData.customerEmail}
                    onChange={(e) => setEditFormData({ ...editFormData, customerEmail: e.target.value })}
                    placeholder="customer@example.com"
                    style={styles.formInput}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Address (Optional):</label>
                  <input
                    type="text"
                    value={editFormData.customerAddress}
                    onChange={(e) => setEditFormData({ ...editFormData, customerAddress: e.target.value })}
                    placeholder="Street, Area, City"
                    style={styles.formInput}
                  />
                </div>

                <div style={styles.syncCheckboxRow}>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={editFormData.syncAll}
                      onChange={(e) => setEditFormData({ ...editFormData, syncAll: e.target.checked })}
                      style={{ cursor: 'pointer', accentColor: '#38BDF8' }}
                    />
                    <span>Sync updated details across all other bills for this customer</span>
                  </label>
                </div>
              </div>

              <div style={styles.modalFooter}>
                <button
                  type="button"
                  onClick={() => setShowEditCustomerModal(false)}
                  style={styles.cancelBtn}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCustomer}
                  style={styles.saveCustBtn}
                >
                  <Check size={16} />
                  <span>{savingCustomer ? 'Saving & Syncing...' : 'Save & Sync Details'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Clean, rich, dark theme styling
const styles = {
  container: {
    padding: '28px',
    backgroundColor: '#0f172a',
    minHeight: '100vh',
    color: '#F8FAFC',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '16px'
  },
  titleSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  },
  iconCircle: {
    width: '54px',
    height: '54px',
    borderRadius: '14px',
    backgroundColor: 'rgba(37, 211, 102, 0.12)',
    border: '1px solid rgba(37, 211, 102, 0.25)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  title: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#F8FAFC',
    margin: 0
  },
  subtitle: {
    fontSize: '13px',
    color: '#94A3B8',
    margin: '4px 0 0'
  },
  refreshBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#1E293B',
    color: '#E2E8F0',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '10px',
    padding: '10px 16px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  alertSuccess: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    color: '#34D399',
    borderRadius: '10px',
    padding: '12px 16px',
    marginBottom: '20px',
    fontSize: '14px'
  },
  alertError: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    color: '#F87171',
    borderRadius: '10px',
    padding: '12px 16px',
    marginBottom: '20px',
    fontSize: '14px'
  },
  closeAlert: {
    marginLeft: 'auto',
    background: 'none',
    border: 'none',
    color: 'inherit',
    cursor: 'pointer'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '16px',
    marginBottom: '24px'
  },
  statCard: {
    backgroundColor: '#1E293B',
    borderRadius: '14px',
    padding: '18px 20px',
    border: '1px solid rgba(255,255,255,0.08)',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  statTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px'
  },
  statLabel: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#94A3B8'
  },
  statIconBadge: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  statValue: {
    fontSize: '26px',
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: '4px'
  },
  statSubtext: {
    fontSize: '12px',
    color: '#64748B'
  },
  controlsCard: {
    backgroundColor: '#1E293B',
    borderRadius: '14px',
    padding: '16px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    marginBottom: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px'
  },
  tabsWrapper: {
    display: 'flex',
    gap: '8px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    paddingBottom: '12px',
    overflowX: 'auto'
  },
  tabActive: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#25D366',
    color: '#0F172A',
    border: 'none',
    borderRadius: '8px',
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  tabInactive: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: 'transparent',
    color: '#94A3B8',
    border: 'none',
    borderRadius: '8px',
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  filterRow: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
    alignItems: 'center'
  },
  searchBox: {
    flex: '1',
    minWidth: '260px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: '#0F172A',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    padding: '8px 14px'
  },
  searchInput: {
    background: 'none',
    border: 'none',
    color: '#F8FAFC',
    outline: 'none',
    fontSize: '13px',
    width: '100%'
  },
  clearSearchBtn: {
    background: 'none',
    border: 'none',
    color: '#94A3B8',
    cursor: 'pointer',
    padding: 0
  },
  dropdownWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#0F172A',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    padding: '8px 12px'
  },
  selectInput: {
    background: 'none',
    border: 'none',
    color: '#F8FAFC',
    outline: 'none',
    fontSize: '13px',
    cursor: 'pointer'
  },
  tableCard: {
    backgroundColor: '#1E293B',
    borderRadius: '14px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    overflow: 'hidden'
  },
  tableResponsive: {
    width: '100%',
    overflowX: 'auto'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left'
  },
  thRow: {
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
  },
  th: {
    padding: '14px 18px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  },
  tr: {
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    transition: 'background-color 0.15s ease'
  },
  td: {
    padding: '14px 18px',
    fontSize: '13px',
    color: '#E2E8F0',
    verticalAlign: 'middle'
  },
  billNoBadge: {
    fontWeight: '700',
    color: '#38BDF8',
    fontSize: '14px'
  },
  dateLabel: {
    fontSize: '11px',
    color: '#64748B',
    marginTop: '2px'
  },
  custNameRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  custName: {
    fontWeight: '600',
    color: '#F8FAFC',
    fontSize: '14px'
  },
  editCustInlineBtn: {
    background: 'rgba(255, 255, 255, 0.06)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: '#94A3B8',
    borderRadius: '6px',
    padding: '3px 6px',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.15s ease'
  },
  phoneRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginTop: '4px'
  },
  phoneLink: {
    fontSize: '12px',
    color: '#94A3B8',
    textDecoration: 'none'
  },
  addPhoneBtn: {
    background: 'none',
    border: 'none',
    color: '#F87171',
    fontSize: '11px',
    cursor: 'pointer',
    padding: 0,
    marginTop: '4px',
    textAlign: 'left',
    fontStyle: 'italic',
    textDecoration: 'underline'
  },
  itemsSummary: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    alignItems: 'flex-start'
  },
  badgePendingPickup: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    color: '#FBBF24',
    fontSize: '11px',
    fontWeight: '600',
    padding: '3px 8px',
    borderRadius: '6px'
  },
  badgeReady: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    color: '#34D399',
    fontSize: '11px',
    fontWeight: '600',
    padding: '3px 8px',
    borderRadius: '6px'
  },
  viewItemsBtn: {
    background: 'none',
    border: 'none',
    color: '#38BDF8',
    fontSize: '11px',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: 0,
    marginTop: '2px'
  },
  priceRow: {
    fontSize: '12px',
    color: '#94A3B8'
  },
  priceLabel: {
    marginRight: '4px'
  },
  priceVal: {
    color: '#F8FAFC',
    fontWeight: '500'
  },
  balanceRow: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#F87171',
    marginTop: '2px'
  },
  balanceLabel: {
    marginRight: '4px'
  },
  balanceVal: {
    color: '#EF4444'
  },
  paidInFull: {
    fontSize: '11px',
    color: '#10B981',
    fontWeight: '600',
    marginTop: '2px'
  },
  branchName: {
    fontSize: '12px',
    color: '#CBD5E1'
  },
  actionButtons: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'flex-end',
    alignItems: 'center'
  },
  whatsappBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#25D366',
    color: '#0F172A',
    border: 'none',
    borderRadius: '8px',
    padding: '7px 12px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.15s ease'
  },
  iconBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#334155',
    color: '#E2E8F0',
    border: 'none',
    borderRadius: '8px',
    padding: '8px',
    cursor: 'pointer'
  },
  completeBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    color: '#60A5FA',
    border: '1px solid rgba(59, 130, 246, 0.3)',
    borderRadius: '8px',
    padding: '6px 10px',
    fontSize: '11px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px',
    gap: '14px'
  },
  loadingText: {
    fontSize: '14px',
    color: '#94A3B8'
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px',
    gap: '12px'
  },
  emptyTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#F8FAFC',
    margin: 0
  },
  emptyText: {
    fontSize: '13px',
    color: '#64748B',
    margin: 0
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '20px'
  },
  modalContent: {
    backgroundColor: '#1E293B',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '620px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    backgroundColor: '#0F172A'
  },
  modalTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  modalTitle: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#F8FAFC',
    margin: 0
  },
  modalCloseBtn: {
    background: 'none',
    border: 'none',
    color: '#94A3B8',
    cursor: 'pointer'
  },
  modalBody: {
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  templateSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  sectionLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: '0.04em'
  },
  chipRow: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap'
  },
  chip: {
    backgroundColor: '#0F172A',
    color: '#CBD5E1',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '8px',
    padding: '6px 12px',
    fontSize: '12px',
    cursor: 'pointer'
  },
  chipActive: {
    backgroundColor: '#25D366',
    color: '#0F172A',
    border: '1px solid #25D366',
    borderRadius: '8px',
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  textareaSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  textarea: {
    backgroundColor: '#0F172A',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '10px',
    padding: '12px',
    color: '#F8FAFC',
    fontSize: '13px',
    lineHeight: '1.5',
    outline: 'none',
    resize: 'vertical',
    fontFamily: 'inherit'
  },
  pdfToggleRow: {
    backgroundColor: '#0F172A',
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid rgba(255, 255, 255, 0.05)'
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12px',
    color: '#CBD5E1',
    cursor: 'pointer'
  },
  phoneConfirmation: {
    fontSize: '13px',
    color: '#94A3B8',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid rgba(255, 255, 255, 0.05)'
  },
  editPhoneBtnInModal: {
    background: 'rgba(56, 189, 248, 0.15)',
    border: '1px solid rgba(56, 189, 248, 0.3)',
    color: '#38BDF8',
    borderRadius: '6px',
    padding: '4px 8px',
    fontSize: '11px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px'
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 20px',
    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
    backgroundColor: '#0F172A'
  },
  copyBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: 'transparent',
    color: '#94A3B8',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    padding: '8px 12px',
    fontSize: '12px',
    cursor: 'pointer'
  },
  cancelBtn: {
    backgroundColor: 'transparent',
    color: '#94A3B8',
    border: 'none',
    padding: '8px 14px',
    fontSize: '13px',
    cursor: 'pointer'
  },
  sendWhatsAppModalBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#25D366',
    color: '#0F172A',
    border: 'none',
    borderRadius: '8px',
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  itemsListContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  itemDetailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    padding: '12px 14px',
    borderRadius: '10px',
    border: '1px solid rgba(255, 255, 255, 0.05)'
  },
  itemDetailName: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#F8FAFC'
  },
  itemDetailSub: {
    fontSize: '11px',
    color: '#64748B',
    marginTop: '2px'
  },
  itemPrice: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#F8FAFC'
  },
  badgePendingPickupSmall: {
    fontSize: '10px',
    fontWeight: '600',
    color: '#FBBF24',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    padding: '2px 6px',
    borderRadius: '4px',
    display: 'inline-block',
    marginTop: '2px'
  },
  badgeReadySmall: {
    fontSize: '10px',
    fontWeight: '600',
    color: '#34D399',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    padding: '2px 6px',
    borderRadius: '4px',
    display: 'inline-block',
    marginTop: '2px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  formLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#94A3B8'
  },
  formInput: {
    backgroundColor: '#0F172A',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '8px',
    padding: '10px 12px',
    color: '#F8FAFC',
    fontSize: '13px',
    outline: 'none',
    fontFamily: 'inherit'
  },
  syncCheckboxRow: {
    backgroundColor: '#0F172A',
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid rgba(255, 255, 255, 0.05)'
  },
  saveCustBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#0284C7',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer'
  }
};

export default WhatsAppReminders;
