🚛 FleetFlow
Modular Fleet & Logistics Management System

FleetFlow is a rule-based fleet lifecycle management platform designed to replace manual logbooks with a centralized digital command center.

It enables real-time dispatch validation, driver compliance monitoring, maintenance tracking, and operational cost analytics for logistics operations.

🎯 Problem Statement
Traditional fleet operations face:
Vehicle overloading due to lack of validation
Expired driver license assignments
Manual maintenance tracking
Poor financial visibility
Delayed operational decisions
FleetFlow solves these challenges through structured workflows, real-time validation, and centralized data management.

👥 Target Users
Fleet Managers – Monitor fleet health and utilization
Dispatchers – Assign trips and validate cargo
Safety Officers – Track driver compliance
Financial Analysts – Monitor fuel costs and ROI

⚙️ Core Features
🔐 Authentication System
Secure login functionality
Role-based access (Manager, Dispatcher, Safety Officer, Analyst)
📊 Command Center Dashboard
Active Fleet (Vehicles On Trip)
Vehicles In Shop
Utilization Rate
Pending Trips
Fuel Efficiency visualization
ROI analytics

🚚 Vehicle Registry
Add / Edit / Delete vehicles
Unique license plate validation
Capacity & odometer tracking
Status control:
🟢 Available
🔵 On Trip
🟠 In Shop

Assign available vehicle & driver
Prevents trip creation if:
Cargo weight exceeds vehicle capacity
Driver license is expired
Driver is not on duty
Vehicle is unavailable
Trip lifecycle:
Draft → Dispatched → Completed → Cancelled
Automatic vehicle & driver status updates

🔧 Maintenance & Service Logs
Log maintenance activities
Automatically updates vehicle status to "In Shop"
Removes vehicle from dispatch pool

⛽ Fuel & Expense Logging
Record fuel logs (liters, cost, date)
Track maintenance cost
Automatic operational cost calculation

👨‍✈ Driver Performance
License expiry tracking
Driver status management
Trip completion tracking
Safety score monitoring
📈 Operational Analytics
Fuel Efficiency (km/L)
Vehicle ROI:
ROI = (Revenue − (Fuel + Maintenance)) / Acquisition Cost

Real-time KPI updates

🏗 System Architecture
FleetFlow follows a structured architecture:
1️⃣ Frontend
React
HTML
Tailwind CSS
JavaScript
Handles:
UI rendering
Forms
Validation feedback
Dashboard visualization
2️⃣ Backend
Python (Flask / FastAPI / Django )
Handles:
Business logic enforcement
Data validation
Status updates
Analytics calculations
API endpoints

3️⃣ Database
Relational database structure linking:
Vehicles
Drivers
Trips
Maintenance Logs
Fuel Logs
Expenses
Ensures referential integrity and accurate calculations.

🧠 Business Logic Enforcement
FleetFlow guarantees:
100% prevention of overloaded trips
0 expired license assignments
Automatic vehicle/driver state transitions
Accurate operational cost calculation
Real-time fleet visibility
All validations are enforced at backend level 

🛠 Tech Stack
Frontend
React
HTML
Tailwind CSS
JavaScript
Backend
Python
REST API architecture

Database
MongoDB 

🚀 Installation & Setup
1️⃣ Clone the Repository
git clone https://github.com/niravbarot18/FleetFlow.git
cd FleetFlow

2️⃣ Backend Setup (Python)
Create virtual environment:
python -m venv venv
Activate environment:
Windows
venv\Scripts\activate

Mac/Linux
source venv/bin/activate

Install dependencies:
pip install -r requirements.txt

Run backend server:
python app.py

3️⃣ Frontend Setup
Go to frontend directory:
cd frontend

Install dependencies:
npm install
Run development server:

npm.cmd start

📊 Success Metrics
Zero overloaded dispatches
Zero expired license assignments
Real-time operational tracking
Accurate ROI & cost calculation
Improved fleet utilization

🔮 Future Enhancements
GPS Live Tracking
Predictive Maintenance
AI-based Route Optimization
Mobile App Integration
