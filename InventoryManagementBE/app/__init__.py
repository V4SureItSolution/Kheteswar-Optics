from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from config import Config

# Initialize extensions
db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()


def create_app():
    app = Flask(__name__)
    print("Creating Flask App...")
    app.config.from_object(Config)

    # Initialize database
    db.init_app(app)
    migrate.init_app(app, db)
    
    # Auto-migrate table columns if missing
    def auto_migrate_columns():
        with app.app_context():
            try:
                from sqlalchemy import inspect, text
                inspector = inspect(db.engine)
                table_migrations = {
                    'bills': {
                        'customer_dob': 'VARCHAR(50) NULL',
                        'advance_payment_method': "VARCHAR(50) DEFAULT 'cash'",
                        'advance_amount': 'FLOAT DEFAULT 0',
                        'balance_payment_method': "VARCHAR(50) DEFAULT 'cash'",
                        'balance_amount': 'FLOAT DEFAULT 0'
                    },
                    'products': {
                        'model': 'VARCHAR(100) NULL',
                        'type': 'VARCHAR(100) NULL',
                        'watts': 'FLOAT NULL'
                    },
                    'items': {
                        'model': 'VARCHAR(100) NULL',
                        'type': 'VARCHAR(50) NULL',
                        'watts': 'FLOAT DEFAULT 0'
                    },
                    'bill_items': {
                        'product_model': 'VARCHAR(100) NULL',
                        'product_type': 'VARCHAR(100) NULL'
                    }
                }
                with db.engine.connect() as conn:
                    for table, cols in table_migrations.items():
                        if table in inspector.get_table_names():
                            existing_cols = [c['name'] for c in inspector.get_columns(table)]
                            for col_name, col_def in cols.items():
                                if col_name not in existing_cols:
                                    conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {col_name} {col_def}"))
                                    conn.commit()
            except Exception as e:
                print(f"Auto migration error: {e}")

    try:
        auto_migrate_columns()
    except Exception as e:
        print(f"Db migration check exception: {e}")
    
    # Initialize JWT
    jwt.init_app(app)

    # Enable CORS
    CORS(
        app,
        supports_credentials=True,
        resources={r"/*": {"origins": "*"}},
    )

    # Import models so Flask-Migrate detects them
    from app import models

    # Register Blueprints
    from app.routes.login_routes import login_bp
    from app.routes.product_routes import product_bp
    from app.routes.billing_routes import billing_bp
    from app.routes.supplier_routes import supplier_bp
    from app.routes.quotation_routes import quotation_bp
    from app.routes.invoice_routes import invoice_bp
    from app.routes.service_routes import service_bp
    from app.routes.usertype_routes import user_type_bp
    from app.routes.employee_routes import employee_bp
    from app.routes.attendance_routes import attendance_bp
    from app.routes.current_company_routes import company_bp
    from app.routes.enquiry_routes import enquiry_bp
    from app.routes.discount_routes import discount_bp
    from app.routes.permissions_routes import permissions_bp
    from app.routes.payment_routes import payment_tracking_bp
    from app.routes.Check_permissions_routes import check_permissions_bp
    from app.routes.restore_permissions_routes import restore_permissions_bp
    from app.routes.salary_routes import salary_bp

    app.register_blueprint(login_bp, url_prefix="/api")
    app.register_blueprint(product_bp, url_prefix="/api")
    app.register_blueprint(billing_bp, url_prefix="/api")
    app.register_blueprint(supplier_bp)
    app.register_blueprint(quotation_bp, url_prefix='/api')
    app.register_blueprint(invoice_bp, url_prefix='/api')
    app.register_blueprint(service_bp)
    app.register_blueprint(user_type_bp)
    app.register_blueprint(employee_bp, url_prefix="/api")
    app.register_blueprint(attendance_bp, url_prefix="/api/attendance")
    app.register_blueprint(company_bp)
    app.register_blueprint(enquiry_bp, url_prefix="/api") 
    app.register_blueprint(discount_bp)
    app.register_blueprint(permissions_bp)
    app.register_blueprint(payment_tracking_bp)
    app.register_blueprint(check_permissions_bp)
    app.register_blueprint(restore_permissions_bp)
    app.register_blueprint(salary_bp, url_prefix="/api")

    # Health Check Route
    @app.route('/api/health', methods=['GET'])
    def health_check():
        return {
            "status": "healthy",
            "message": "API is working"
        }, 200

    return app