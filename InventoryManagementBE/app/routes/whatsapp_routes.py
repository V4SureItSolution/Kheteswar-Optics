import os
import re
import base64
import requests
from flask import Blueprint, request, jsonify, current_app, send_from_directory

whatsapp_bp = Blueprint('whatsapp_bp', __name__)

@whatsapp_bp.route('/send-whatsapp-bill', methods=['POST', 'OPTIONS'])
def send_whatsapp_bill():
    if request.method == 'OPTIONS':
        return jsonify({'status': 'ok'}), 200

    data = request.get_json() or {}
    phone = data.get('phone', '')
    bill_number = data.get('billNumber', 'INVOICE')
    pdf_base64 = data.get('pdfBase64', '')
    message = data.get('message', 'Thank you for your purchase! Please find your bill attached. We appreciate your business.')

    # 1. Validate Customer Phone Number
    clean_phone = re.sub(r'\D', '', str(phone))
    if len(clean_phone) < 10:
        return jsonify({
            'success': False,
            'message': 'Customer mobile number is not available for this bill.'
        }), 400

    formatted_phone = '91' + clean_phone if len(clean_phone) == 10 else clean_phone

    # 2. Check PDF data
    if not pdf_base64:
        return jsonify({
            'success': False,
            'message': 'Unable to generate the bill PDF. Please try again.'
        }), 400

    # 3. Save PDF file locally to uploads folder
    try:
        uploads_dir = current_app.config.get('UPLOAD_FOLDER', os.path.join(os.getcwd(), 'uploads'))
        bills_dir = os.path.join(uploads_dir, 'whatsapp_bills')
        os.makedirs(bills_dir, exist_ok=True)

        clean_bill_no = re.sub(r'[^\w\-]', '_', str(bill_number))
        filename = f"Bill_{clean_bill_no}.pdf"
        filepath = os.path.join(bills_dir, filename)

        # Remove header prefix if present (e.g. data:application/pdf;base64,)
        base64_data = pdf_base64
        if ',' in base64_data:
            base64_data = base64_data.split(',')[1]

        pdf_bytes = base64.b64decode(base64_data)
        with open(filepath, 'wb') as f:
            f.write(pdf_bytes)

    except Exception as e:
        current_app.logger.error(f"Error saving WhatsApp PDF: {e}")
        return jsonify({
            'success': False,
            'message': 'Unable to generate the bill PDF. Please try again.'
        }), 500

    # 4. Check WhatsApp credentials
    token = current_app.config.get('WHATSAPP_API_TOKEN', '') or os.environ.get('WHATSAPP_API_TOKEN', '')
    phone_number_id = current_app.config.get('WHATSAPP_PHONE_NUMBER_ID', '') or os.environ.get('WHATSAPP_PHONE_NUMBER_ID', '')
    api_url = current_app.config.get('WHATSAPP_API_URL', '') or os.environ.get('WHATSAPP_API_URL', '')
    provider = (current_app.config.get('WHATSAPP_PROVIDER', '') or os.environ.get('WHATSAPP_PROVIDER', 'meta')).lower()

    if not token and not api_url:
        # Credential missing error handling as specified in requirement 8
        return jsonify({
            'success': False,
            'configured': False,
            'message': 'WhatsApp integration is not configured. Please set WHATSAPP_API_TOKEN or WHATSAPP_API_URL in backend settings.'
        }), 400

    # 5. Send via WhatsApp API integration
    try:
        if provider == 'meta' and phone_number_id and token:
            # Meta WhatsApp Cloud API
            media_url = f"https://graph.facebook.com/v18.0/{phone_number_id}/media"
            headers = {"Authorization": f"Bearer {token}"}
            
            with open(filepath, 'rb') as pdf_file:
                files = {
                    'file': (filename, pdf_file, 'application/pdf'),
                    'messaging_product': (None, 'whatsapp'),
                    'type': (None, 'application/pdf')
                }
                upload_res = requests.post(media_url, headers=headers, files=files, timeout=30)
            
            if upload_res.status_code not in (200, 201):
                return jsonify({
                    'success': False,
                    'message': 'Unable to send the bill through WhatsApp. Please try again.'
                }), 500

            media_id = upload_res.json().get('id')
            
            # Send message with document attachment
            msg_url = f"https://graph.facebook.com/v18.0/{phone_number_id}/messages"
            payload = {
                "messaging_product": "whatsapp",
                "recipient_type": "individual",
                "to": formatted_phone,
                "type": "document",
                "document": {
                    "id": media_id,
                    "caption": message,
                    "filename": filename
                }
            }
            send_res = requests.post(msg_url, headers=headers, json=payload, timeout=30)
            if send_res.status_code in (200, 201):
                return jsonify({'success': True, 'message': 'Bill sent successfully to WhatsApp.'}), 200
            else:
                return jsonify({'success': False, 'message': 'Unable to send the bill through WhatsApp. Please try again.'}), 500

        elif api_url:
            # Custom Webhook or Gateway Endpoint
            pdf_public_url = request.host_url.rstrip('/') + f"/api/uploads/whatsapp_bills/{filename}"
            payload = {
                "to": formatted_phone,
                "phone": formatted_phone,
                "billNumber": bill_number,
                "filename": filename,
                "caption": message,
                "message": message,
                "pdfUrl": pdf_public_url,
                "pdfBase64": base64_data
            }
            headers = {"Authorization": f"Bearer {token}"} if token else {}
            res = requests.post(api_url, json=payload, headers=headers, timeout=30)
            if res.status_code in (200, 201):
                return jsonify({'success': True, 'message': 'Bill sent successfully to WhatsApp.'}), 200
            else:
                return jsonify({'success': False, 'message': 'Unable to send the bill through WhatsApp. Please try again.'}), 500

        else:
            return jsonify({
                'success': False,
                'configured': False,
                'message': 'WhatsApp API configuration incomplete. Please verify backend credentials.'
            }), 400

    except Exception as err:
        current_app.logger.error(f"WhatsApp API send error: {err}")
        return jsonify({
            'success': False,
            'message': 'Unable to send the bill through WhatsApp. Please try again.'
        }), 500


@whatsapp_bp.route('/save-whatsapp-pdf', methods=['POST', 'OPTIONS'])
def save_whatsapp_pdf():
    if request.method == 'OPTIONS':
        return jsonify({'status': 'ok'}), 200

    data = request.get_json() or {}
    bill_number = data.get('billNumber', 'INVOICE')
    pdf_base64 = data.get('pdfBase64', '')

    if not pdf_base64:
        return jsonify({'success': False, 'message': 'No PDF data provided'}), 400

    try:
        uploads_dir = current_app.config.get('UPLOAD_FOLDER', os.path.join(os.getcwd(), 'uploads'))
        bills_dir = os.path.join(uploads_dir, 'whatsapp_bills')
        os.makedirs(bills_dir, exist_ok=True)

        clean_bill_no = re.sub(r'[^\w\-]', '_', str(bill_number))
        filename = f"Bill_{clean_bill_no}.pdf"
        filepath = os.path.join(bills_dir, filename)

        base64_data = pdf_base64
        if ',' in base64_data:
            base64_data = base64_data.split(',')[1]

        pdf_bytes = base64.b64decode(base64_data)
        with open(filepath, 'wb') as f:
            f.write(pdf_bytes)

        host_url = request.host_url.rstrip('/')
        pdf_url = f"{host_url}/api/uploads/whatsapp_bills/{filename}"

        return jsonify({
            'success': True,
            'filename': filename,
            'pdfUrl': pdf_url
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error saving PDF for WhatsApp: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@whatsapp_bp.route('/uploads/whatsapp_bills/<filename>', methods=['GET'])
def get_whatsapp_bill_file(filename):
    uploads_dir = current_app.config.get('UPLOAD_FOLDER', os.path.join(os.getcwd(), 'uploads'))
    bills_dir = os.path.join(uploads_dir, 'whatsapp_bills')
    return send_from_directory(bills_dir, filename, mimetype='application/pdf')
