# app/models/billing.py
from app import db
from datetime import datetime

class Bill(db.Model):
    __tablename__ = "bills"

    id = db.Column(db.Integer, primary_key=True)
    bill_number = db.Column(db.String(50), unique=True, nullable=False)
    
    # Customer Information
    customer_name = db.Column(db.String(100), nullable=False, default='Walk-in Customer')
    customer_phone = db.Column(db.String(20))
    customer_email = db.Column(db.String(100))
    customer_gst = db.Column(db.String(50))
    customer_address = db.Column(db.String(200))
    customer_dob = db.Column(db.String(50), nullable=True)
    customer_type = db.Column(db.String(50), default='regular')  # regular, wholesale, vip, corporate, internal
    
    # Vehicle Information
    vehicle_name = db.Column(db.String(100))
    vehicle_number = db.Column(db.String(50))
    
    # Lenscraft Optical Specification & Prescription Details
    frame_name = db.Column(db.String(100), nullable=True)
    lens_type = db.Column(db.String(100), nullable=True)
    due_date = db.Column(db.String(50), nullable=True)
    order_time = db.Column(db.String(50), nullable=True)
    by_courier = db.Column(db.String(50), nullable=True)
    
    # Eye Prescription Power
    dv_re_sph = db.Column(db.String(20), nullable=True)
    dv_re_cyl = db.Column(db.String(20), nullable=True)
    dv_re_axis = db.Column(db.String(20), nullable=True)
    dv_le_sph = db.Column(db.String(20), nullable=True)
    dv_le_cyl = db.Column(db.String(20), nullable=True)
    dv_le_axis = db.Column(db.String(20), nullable=True)
    
    nv_re_sph = db.Column(db.String(20), nullable=True)
    nv_re_cyl = db.Column(db.String(20), nullable=True)
    nv_re_axis = db.Column(db.String(20), nullable=True)
    nv_le_sph = db.Column(db.String(20), nullable=True)
    nv_le_cyl = db.Column(db.String(20), nullable=True)
    nv_le_axis = db.Column(db.String(20), nullable=True)
    
    # Company Information (from selected company at time of billing)
    company_id = db.Column(db.Integer, nullable=True)  # Reference to company table
    company_name = db.Column(db.String(200), nullable=True)
    company_logo = db.Column(db.String(500), nullable=True)  # Store logo path or URL
    company_address = db.Column(db.String(500), nullable=True)
    company_city = db.Column(db.String(100), nullable=True)
    company_phone = db.Column(db.String(50), nullable=True)
    company_email = db.Column(db.String(100), nullable=True)
    company_gst = db.Column(db.String(50), nullable=True)
    company_alternate_phone = db.Column(db.String(50), nullable=True)
    company_bank_name = db.Column(db.String(100), nullable=True)
    company_bank_account = db.Column(db.String(50), nullable=True)
    company_bank_ifsc = db.Column(db.String(50), nullable=True)
    company_bank_branch = db.Column(db.String(100), nullable=True)
    company_upi_id = db.Column(db.String(100), nullable=True)
    
    # Bill Summary
    subtotal = db.Column(db.Float, default=0)
    discount = db.Column(db.Float, default=0)
    discount_type = db.Column(db.String(20), default='amount')  # 'amount' or 'percentage'
    tax = db.Column(db.Float, default=0)
    tax_type = db.Column(db.String(20), default='percentage')  # 'amount' or 'percentage'
    total = db.Column(db.Float, default=0)
    
    # Payment Information
    paid_amount = db.Column(db.Float, default=0)
    change_amount = db.Column(db.Float, default=0)
    payment_method = db.Column(db.String(50), default='cash')  # cash, card, upi, credit
    payment_status = db.Column(db.String(20), default='pending')  # paid, partial, pending
    
    # Advance & Balance Payment details
    advance_payment_method = db.Column(db.String(50), default='cash')
    advance_amount = db.Column(db.Float, default=0)
    balance_payment_method = db.Column(db.String(50), default='cash')
    balance_amount = db.Column(db.Float, default=0)

    # Product Collection / Delivery Status (not_collected, collected)
    collection_status = db.Column(db.String(50), default='not_collected')
    
    # Payment details (snapshot at time of billing)
    payment_card_number = db.Column(db.String(20), nullable=True)
    payment_card_holder = db.Column(db.String(100), nullable=True)
    payment_upi_id = db.Column(db.String(100), nullable=True)
    payment_transaction_id = db.Column(db.String(100), nullable=True)
    payment_bank_name = db.Column(db.String(100), nullable=True)
    payment_cheque_number = db.Column(db.String(50), nullable=True)
    cash_received = db.Column(db.Float, default=0)
    
    # Metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = db.Column(db.Integer, nullable=True)  # User ID who created the bill
    created_by_name = db.Column(db.String(100), nullable=True)  # User name for display
    
    # Relationships
    items = db.relationship('BillItem', backref='bill', lazy=True, cascade='all, delete-orphan')
    
    def calculate_totals(self):
        """Calculate all bill totals"""
        self.subtotal = sum(item.total for item in self.items)
        
        # Apply discount
        if self.discount_type == 'percentage':
            discount_amount = (self.subtotal * self.discount) / 100
        else:
            discount_amount = self.discount
        
        # Apply tax
        if self.tax_type == 'percentage':
            tax_amount = ((self.subtotal - discount_amount) * self.tax) / 100
        else:
            tax_amount = self.tax
        
        self.total = self.subtotal - discount_amount + tax_amount
        # Update payment status
        actual_paid = self.paid_amount if (self.paid_amount is not None and self.paid_amount > 0) else (self.advance_amount or 0.0)
        if self.balance_amount is not None and self.balance_amount == 0.0 and actual_paid >= self.total:
            self.payment_status = 'paid'
        elif self.balance_amount is not None and self.balance_amount > 0:
            self.payment_status = 'partial' if actual_paid > 0 else 'pending'
        elif actual_paid >= self.total and self.total > 0:
            self.payment_status = 'paid'
        else:
            self.payment_status = 'paid' if (self.total - actual_paid) <= 0 else ('partial' if actual_paid > 0 else 'pending')

    def to_dict(self):
        """Convert bill to dictionary for API responses"""
        actual_paid = self.paid_amount if (self.paid_amount is not None and self.paid_amount > 0) else (self.advance_amount or 0.0)
        if self.balance_amount is not None and self.balance_amount == 0.0 and actual_paid >= self.total:
            actual_balance = 0.0
            actual_status = 'paid'
        elif self.balance_amount is not None and self.balance_amount > 0:
            actual_balance = self.balance_amount
            actual_status = 'partial' if actual_paid > 0 else (self.payment_status or 'pending')
        elif actual_paid >= self.total and self.total > 0:
            actual_balance = 0.0
            actual_status = 'paid'
        else:
            actual_balance = max(0.0, self.total - actual_paid)
            actual_status = 'paid' if actual_balance <= 0 else ('partial' if actual_paid > 0 else (self.payment_status or 'pending'))

        return {
            'id': self.id,
            'billNumber': self.bill_number,
            'bill_number': self.bill_number,
            'customerName': self.customer_name,
            'customer_name': self.customer_name,
            'customerPhone': self.customer_phone,
            'customer_phone': self.customer_phone,
            'customerEmail': self.customer_email,
            'customer_email': self.customer_email,
            'customerGST': self.customer_gst,
            'customer_gst': self.customer_gst,
            'customerAddress': self.customer_address or '',
            'customer_address': self.customer_address or '',
            'customerDob': self.customer_dob or '',
            'customer_dob': self.customer_dob or '',
            'customerType': self.customer_type or 'regular',
            'customer_type': self.customer_type or 'regular',
            'customer': {
                'name': self.customer_name,
                'phone': self.customer_phone,
                'email': self.customer_email,
                'gst': self.customer_gst,
                'address': self.customer_address or '',
                'dob': self.customer_dob or '',
                'type': self.customer_type or 'regular'
            },
            'companyId': self.company_id,
            'company_id': self.company_id,
            'companyName': self.company_name,
            'company_name': self.company_name,
            'companyPhone': self.company_phone,
            'company_phone': self.company_phone,
            'companyGST': self.company_gst,
            'company_gst': self.company_gst,
            'company': {
                'id': self.company_id,
                'name': self.company_name,
                'address': self.company_address,
                'city': self.company_city,
                'phone': self.company_phone,
                'email': self.company_email,
                'gst': self.company_gst,
                'alternatePhone': self.company_alternate_phone,
                'bankName': self.company_bank_name,
                'bankAccount': self.company_bank_account,
                'bankIfsc': self.company_bank_ifsc,
                'bankBranch': self.company_bank_branch,
                'upiId': self.company_upi_id
            },
            'vehicle': {
                'name': self.vehicle_name,
                'number': self.vehicle_number
            },
            'vehicleName': self.vehicle_name,
            'vehicle_name': self.vehicle_name,
            'vehicleNumber': self.vehicle_number,
            'vehicle_number': self.vehicle_number,
            'frameName': self.frame_name or '-',
            'lensType': self.lens_type or '-',
            'dueDate': self.due_date or '',
            'orderTime': self.order_time or '',
            'byCourier': self.by_courier or 'No',
            'dvReSph': self.dv_re_sph or '-',
            'dvReCyl': self.dv_re_cyl or '-',
            'dvReAxis': self.dv_re_axis or '-',
            'dvLeSph': self.dv_le_sph or '-',
            'dvLeCyl': self.dv_le_cyl or '-',
            'dvLeAxis': self.dv_le_axis or '-',
            'nvReSph': self.nv_re_sph or '-',
            'nvReCyl': self.nv_re_cyl or '-',
            'nvReAxis': self.nv_re_axis or '-',
            'nvLeSph': self.nv_le_sph or '-',
            'nvLeCyl': self.nv_le_cyl or '-',
            'nvLeAxis': self.nv_le_axis or '-',
            'frame_name': self.frame_name or '-',
            'lens_type': self.lens_type or '-',
            'due_date': self.due_date or '',
            'order_time': self.order_time or '',
            'by_courier': self.by_courier or 'No',
            'dv_re_sph': self.dv_re_sph or '-',
            'dv_re_cyl': self.dv_re_cyl or '-',
            'dv_re_axis': self.dv_re_axis or '-',
            'dv_le_sph': self.dv_le_sph or '-',
            'dv_le_cyl': self.dv_le_cyl or '-',
            'dv_le_axis': self.dv_le_axis or '-',
            'nv_re_sph': self.nv_re_sph or '-',
            'nv_re_cyl': self.nv_re_cyl or '-',
            'nv_re_axis': self.nv_re_axis or '-',
            'nv_le_sph': self.nv_le_sph or '-',
            'nv_le_cyl': self.nv_le_cyl or '-',
            'nv_le_axis': self.nv_le_axis or '-',
            'total': round(self.total, 2),
            'paidAmount': round(actual_paid, 2),
            'paid_amount': round(actual_paid, 2),
            'advanceAmount': round(self.advance_amount, 2) if self.advance_amount is not None else round(actual_paid, 2),
            'advance_amount': round(self.advance_amount, 2) if self.advance_amount is not None else round(actual_paid, 2),
            'balanceAmount': round(actual_balance, 2),
            'balance_amount': round(actual_balance, 2),
            'paymentMethod': self.payment_method or 'cash',
            'payment_method': self.payment_method or 'cash',
            'advancePaymentMethod': self.advance_payment_method or self.payment_method or 'cash',
            'advance_payment_method': self.advance_payment_method or self.payment_method or 'cash',
            'balancePaymentMethod': self.balance_payment_method or 'cash',
            'balance_payment_method': self.balance_payment_method or 'cash',
            'paymentStatus': actual_status,
            'payment_status': actual_status,
            'summary': {
                'subtotal': round(self.subtotal, 2),
                'discount': round(self.discount, 2),
                'discountType': self.discount_type,
                'tax': round(self.tax, 2),
                'taxType': self.tax_type,
                'total': round(self.total, 2)
            },
            'payment': {
                'paidAmount': round(actual_paid, 2),
                'changeAmount': round(self.change_amount, 2),
                'method': self.payment_method or 'cash',
                'status': actual_status,
                'advancePaymentMethod': self.advance_payment_method or 'cash',
                'advanceAmount': round(self.advance_amount, 2) if self.advance_amount is not None else 0,
                'balancePaymentMethod': self.balance_payment_method or 'cash',
                'balanceAmount': round(actual_balance, 2),
                'cardNumber': self.payment_card_number,
                'cardHolder': self.payment_card_holder,
                'upiId': self.payment_upi_id,
                'transactionId': self.payment_transaction_id,
                'bankName': self.payment_bank_name,
                'chequeNumber': self.payment_cheque_number,
                'cashReceived': round(self.cash_received, 2) if self.cash_received else 0
            },
            'collectionStatus': self.collection_status or 'not_collected',
            'collection_status': self.collection_status or 'not_collected',
            'items': [item.to_dict() for item in self.items],
            'createdAt': (self.created_at.isoformat() + 'Z') if self.created_at else None,
            'updatedAt': (self.updated_at.isoformat() + 'Z') if self.updated_at else None,
            'createdBy': self.created_by,
            'createdByName': self.created_by_name
        }


class BillItem(db.Model):
    __tablename__ = "bill_items"
    
    id = db.Column(db.Integer, primary_key=True)
    bill_id = db.Column(db.Integer, db.ForeignKey('bills.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id', ondelete='SET NULL'), nullable=True)
    
    # Snapshot of product details at time of billing
    product_name = db.Column(db.String(100), nullable=False)
    product_model = db.Column(db.String(100))
    product_type = db.Column(db.String(100))
    sell_price = db.Column(db.Float, nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    total = db.Column(db.Float, nullable=False)
    
    # Item Status
    item_status = db.Column(db.String(20), nullable=False, default='pending')  # pending, completed, cancelled
    
    # Relationship
    product = db.relationship('Product')
    
    def to_dict(self):
        return {
            'id': self.id,
            'productId': self.product_id,
            'productName': self.product_name,
            'productModel': self.product_model,
            'productType': self.product_type,
            'sellPrice': round(self.sell_price, 2),
            'quantity': self.quantity,
            'total': round(self.total, 2),
            'itemStatus': self.item_status
        }


class Payment(db.Model):
    __tablename__ = "payments"
    
    id = db.Column(db.Integer, primary_key=True)
    bill_id = db.Column(db.Integer, db.ForeignKey('bills.id'), nullable=False)
    payment_id = db.Column(db.String(100), unique=True)
    amount = db.Column(db.Float, nullable=False)
    method = db.Column(db.String(50), nullable=False)
    status = db.Column(db.String(20), default='completed')
    reference = db.Column(db.String(100))
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationship
    bill = db.relationship('Bill', backref='payments')
    
    def to_dict(self):
        return {
            'id': self.id,
            'paymentId': self.payment_id,
            'amount': round(self.amount, 2),
            'method': self.method,
            'status': self.status,
            'reference': self.reference,
            'notes': self.notes,
            'createdAt': self.created_at.isoformat() if self.created_at else None
        }