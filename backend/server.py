from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
import jwt
import io
import csv

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT and Password Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "fleetflow-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 hours

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

app = FastAPI()
api_router = APIRouter(prefix="/api")

# ============ AUTH UTILITIES ============
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication")
        
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ============ MODELS ============
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str = "Manager"  # Manager, Dispatcher, Safety Officer, Financial Analyst

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    name: str
    role: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class Vehicle(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    model: str
    license_plate: str
    vehicle_type: str  # Truck, Van, Bike
    max_capacity: float  # in kg
    odometer: float = 0.0
    status: str = "Ready"  # Ready, On Trip, In Shop, Retired
    out_of_service: bool = False
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class VehicleCreate(BaseModel):
    name: str
    model: str
    license_plate: str
    vehicle_type: str
    max_capacity: float
    odometer: float = 0.0

class Driver(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    license_number: str
    license_expiry: str
    phone: str
    status: str = "Off Duty"  # On Duty, Off Duty, Suspended
    safety_score: float = 100.0
    trip_completion_rate: float = 0.0
    total_trips: int = 0
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class DriverCreate(BaseModel):
    name: str
    license_number: str
    license_expiry: str
    phone: str

class Trip(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    origin: str
    destination: str
    cargo_weight: float
    cargo_description: str = ""
    vehicle_id: str
    driver_id: str
    status: str = "Draft"  # Draft, Dispatched, In Progress, Completed, Cancelled
    distance: float = 0.0
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    completed_at: Optional[str] = None

class TripCreate(BaseModel):
    origin: str
    destination: str
    cargo_weight: float
    cargo_description: str = ""
    vehicle_id: str
    driver_id: str
    distance: float = 0.0

class MaintenanceLog(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    vehicle_id: str
    service_date: str
    service_type: str  # Oil Change, Tire Replacement, Engine Repair, etc.
    cost: float
    notes: str = ""
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class MaintenanceLogCreate(BaseModel):
    vehicle_id: str
    service_date: str
    service_type: str
    cost: float
    notes: str = ""

class FuelLog(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    vehicle_id: str
    liters: float
    cost: float
    date: str
    odometer_reading: float
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class FuelLogCreate(BaseModel):
    vehicle_id: str
    liters: float
    cost: float
    date: str
    odometer_reading: float

class ExpenseLog(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    vehicle_id: str
    expense_type: str
    amount: float
    date: str
    notes: str = ""
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class ExpenseLogCreate(BaseModel):
    vehicle_id: str
    expense_type: str
    amount: float
    date: str
    notes: str = ""

# ============ AUTH ROUTES ============
@api_router.post("/auth/register")
async def register(user_data: UserRegister):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    hashed_password = get_password_hash(user_data.password)
    user = User(
        email=user_data.email,
        name=user_data.name,
        role=user_data.role
    )
    user_dict = user.model_dump()
    user_dict["password"] = hashed_password
    
    await db.users.insert_one(user_dict)
    
    # Create token
    access_token = create_access_token(data={"sub": user.id, "email": user.email})
    
    return {
        "token": access_token,
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role
        }
    }

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    access_token = create_access_token(data={"sub": user["id"], "email": user["email"]})
    
    return {
        "token": access_token,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "role": user["role"]
        }
    }

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "id": current_user["id"],
        "email": current_user["email"],
        "name": current_user["name"],
        "role": current_user["role"]
    }

# ============ DASHBOARD ROUTES ============
@api_router.get("/dashboard/stats")
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    # Count vehicles by status
    total_vehicles = await db.vehicles.count_documents({"out_of_service": False})
    active_fleet = await db.vehicles.count_documents({"status": "On Trip"})
    maintenance_alerts = await db.vehicles.count_documents({"status": "In Shop"})
    ready_vehicles = await db.vehicles.count_documents({"status": "Ready"})
    
    # Trips
    pending_cargo = await db.trips.count_documents({"status": "Draft"})
    active_trips = await db.trips.count_documents({"status": {"$in": ["Dispatched", "In Progress"]}})
    completed_trips = await db.trips.count_documents({"status": "Completed"})
    
    # Drivers
    active_drivers = await db.drivers.count_documents({"status": "On Duty"})
    
    # Utilization rate
    utilization_rate = (active_fleet / total_vehicles * 100) if total_vehicles > 0 else 0
    
    return {
        "total_vehicles": total_vehicles,
        "active_fleet": active_fleet,
        "maintenance_alerts": maintenance_alerts,
        "ready_vehicles": ready_vehicles,
        "utilization_rate": round(utilization_rate, 1),
        "pending_cargo": pending_cargo,
        "active_trips": active_trips,
        "completed_trips": completed_trips,
        "active_drivers": active_drivers
    }

# ============ VEHICLE ROUTES ============
@api_router.post("/vehicles", response_model=Vehicle)
async def create_vehicle(vehicle_data: VehicleCreate, current_user: dict = Depends(get_current_user)):
    # Check if license plate exists
    existing = await db.vehicles.find_one({"license_plate": vehicle_data.license_plate})
    if existing:
        raise HTTPException(status_code=400, detail="License plate already exists")
    
    vehicle = Vehicle(**vehicle_data.model_dump())
    await db.vehicles.insert_one(vehicle.model_dump())
    return vehicle

@api_router.get("/vehicles", response_model=List[Vehicle])
async def get_vehicles(current_user: dict = Depends(get_current_user)):
    vehicles = await db.vehicles.find({}, {"_id": 0}).to_list(1000)
    return vehicles

@api_router.get("/vehicles/{vehicle_id}", response_model=Vehicle)
async def get_vehicle(vehicle_id: str, current_user: dict = Depends(get_current_user)):
    vehicle = await db.vehicles.find_one({"id": vehicle_id}, {"_id": 0})
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return vehicle

@api_router.put("/vehicles/{vehicle_id}", response_model=Vehicle)
async def update_vehicle(vehicle_id: str, vehicle_data: VehicleCreate, current_user: dict = Depends(get_current_user)):
    vehicle = await db.vehicles.find_one({"id": vehicle_id})
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    update_data = vehicle_data.model_dump()
    await db.vehicles.update_one({"id": vehicle_id}, {"$set": update_data})
    
    updated = await db.vehicles.find_one({"id": vehicle_id}, {"_id": 0})
    return updated

@api_router.patch("/vehicles/{vehicle_id}/status")
async def update_vehicle_status(vehicle_id: str, status_data: dict, current_user: dict = Depends(get_current_user)):
    vehicle = await db.vehicles.find_one({"id": vehicle_id})
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    await db.vehicles.update_one({"id": vehicle_id}, {"$set": status_data})
    return {"message": "Status updated"}

@api_router.delete("/vehicles/{vehicle_id}")
async def delete_vehicle(vehicle_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.vehicles.delete_one({"id": vehicle_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return {"message": "Vehicle deleted"}

# ============ DRIVER ROUTES ============
@api_router.post("/drivers", response_model=Driver)
async def create_driver(driver_data: DriverCreate, current_user: dict = Depends(get_current_user)):
    driver = Driver(**driver_data.model_dump())
    await db.drivers.insert_one(driver.model_dump())
    return driver

@api_router.get("/drivers", response_model=List[Driver])
async def get_drivers(current_user: dict = Depends(get_current_user)):
    drivers = await db.drivers.find({}, {"_id": 0}).to_list(1000)
    return drivers

@api_router.get("/drivers/{driver_id}", response_model=Driver)
async def get_driver(driver_id: str, current_user: dict = Depends(get_current_user)):
    driver = await db.drivers.find_one({"id": driver_id}, {"_id": 0})
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    return driver

@api_router.put("/drivers/{driver_id}", response_model=Driver)
async def update_driver(driver_id: str, driver_data: DriverCreate, current_user: dict = Depends(get_current_user)):
    driver = await db.drivers.find_one({"id": driver_id})
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    
    update_data = driver_data.model_dump()
    await db.drivers.update_one({"id": driver_id}, {"$set": update_data})
    
    updated = await db.drivers.find_one({"id": driver_id}, {"_id": 0})
    return updated

@api_router.patch("/drivers/{driver_id}/status")
async def update_driver_status(driver_id: str, status_data: dict, current_user: dict = Depends(get_current_user)):
    driver = await db.drivers.find_one({"id": driver_id})
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    
    await db.drivers.update_one({"id": driver_id}, {"$set": status_data})
    return {"message": "Status updated"}

@api_router.delete("/drivers/{driver_id}")
async def delete_driver(driver_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.drivers.delete_one({"id": driver_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Driver not found")
    return {"message": "Driver deleted"}

# ============ TRIP ROUTES ============
@api_router.post("/trips", response_model=Trip)
async def create_trip(trip_data: TripCreate, current_user: dict = Depends(get_current_user)):
    # Validate vehicle exists and is available
    vehicle = await db.vehicles.find_one({"id": trip_data.vehicle_id})
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    if vehicle["status"] not in ["Ready"]:
        raise HTTPException(status_code=400, detail="Vehicle is not available")
    if vehicle["out_of_service"]:
        raise HTTPException(status_code=400, detail="Vehicle is out of service")
    
    # Validate cargo weight
    if trip_data.cargo_weight > vehicle["max_capacity"]:
        raise HTTPException(
            status_code=400, 
            detail=f"Cargo weight ({trip_data.cargo_weight} kg) exceeds vehicle capacity ({vehicle['max_capacity']} kg)"
        )
    
    # Validate driver exists and is available
    driver = await db.drivers.find_one({"id": trip_data.driver_id})
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    if driver["status"] == "Suspended":
        raise HTTPException(status_code=400, detail="Driver is suspended")
    
    # Check license expiry
    expiry_date = datetime.fromisoformat(driver["license_expiry"])
    if expiry_date < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Driver's license has expired")
    
    trip = Trip(**trip_data.model_dump())
    await db.trips.insert_one(trip.model_dump())
    
    return trip

@api_router.get("/trips", response_model=List[Trip])
async def get_trips(current_user: dict = Depends(get_current_user)):
    trips = await db.trips.find({}, {"_id": 0}).to_list(1000)
    return trips

@api_router.get("/trips/{trip_id}", response_model=Trip)
async def get_trip(trip_id: str, current_user: dict = Depends(get_current_user)):
    trip = await db.trips.find_one({"id": trip_id}, {"_id": 0})
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    return trip

@api_router.patch("/trips/{trip_id}/dispatch")
async def dispatch_trip(trip_id: str, current_user: dict = Depends(get_current_user)):
    trip = await db.trips.find_one({"id": trip_id})
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    
    # Update trip status
    await db.trips.update_one({"id": trip_id}, {"$set": {"status": "Dispatched"}})
    
    # Update vehicle status
    await db.vehicles.update_one({"id": trip["vehicle_id"]}, {"$set": {"status": "On Trip"}})
    
    # Update driver status
    await db.drivers.update_one({"id": trip["driver_id"]}, {"$set": {"status": "On Duty"}})
    
    return {"message": "Trip dispatched"}

@api_router.patch("/trips/{trip_id}/complete")
async def complete_trip(trip_id: str, current_user: dict = Depends(get_current_user)):
    trip = await db.trips.find_one({"id": trip_id})
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    
    # Update trip status
    await db.trips.update_one(
        {"id": trip_id}, 
        {"$set": {
            "status": "Completed",
            "completed_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Update vehicle status back to Ready
    await db.vehicles.update_one({"id": trip["vehicle_id"]}, {"$set": {"status": "Ready"}})
    
    # Update driver stats
    driver = await db.drivers.find_one({"id": trip["driver_id"]})
    total_trips = driver.get("total_trips", 0) + 1
    completion_rate = 100.0  # Simplified - in real app, track completed vs total
    
    await db.drivers.update_one(
        {"id": trip["driver_id"]}, 
        {"$set": {
            "status": "Off Duty",
            "total_trips": total_trips,
            "trip_completion_rate": completion_rate
        }}
    )
    
    return {"message": "Trip completed"}

@api_router.patch("/trips/{trip_id}/cancel")
async def cancel_trip(trip_id: str, current_user: dict = Depends(get_current_user)):
    trip = await db.trips.find_one({"id": trip_id})
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    
    await db.trips.update_one({"id": trip_id}, {"$set": {"status": "Cancelled"}})
    
    # Reset vehicle and driver status if trip was dispatched
    if trip["status"] == "Dispatched":
        await db.vehicles.update_one({"id": trip["vehicle_id"]}, {"$set": {"status": "Ready"}})
        await db.drivers.update_one({"id": trip["driver_id"]}, {"$set": {"status": "Off Duty"}})
    
    return {"message": "Trip cancelled"}

@api_router.delete("/trips/{trip_id}")
async def delete_trip(trip_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.trips.delete_one({"id": trip_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Trip not found")
    return {"message": "Trip deleted"}

# ============ MAINTENANCE ROUTES ============
@api_router.post("/maintenance", response_model=MaintenanceLog)
async def create_maintenance_log(log_data: MaintenanceLogCreate, current_user: dict = Depends(get_current_user)):
    vehicle = await db.vehicles.find_one({"id": log_data.vehicle_id})
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    log = MaintenanceLog(**log_data.model_dump())
    await db.maintenance_logs.insert_one(log.model_dump())
    
    # Update vehicle status to In Shop
    await db.vehicles.update_one({"id": log_data.vehicle_id}, {"$set": {"status": "In Shop"}})
    
    return log

@api_router.get("/maintenance", response_model=List[MaintenanceLog])
async def get_maintenance_logs(current_user: dict = Depends(get_current_user)):
    logs = await db.maintenance_logs.find({}, {"_id": 0}).to_list(1000)
    return logs

@api_router.delete("/maintenance/{log_id}")
async def delete_maintenance_log(log_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.maintenance_logs.delete_one({"id": log_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Maintenance log not found")
    return {"message": "Maintenance log deleted"}

# ============ FUEL LOG ROUTES ============
@api_router.post("/fuel-logs", response_model=FuelLog)
async def create_fuel_log(log_data: FuelLogCreate, current_user: dict = Depends(get_current_user)):
    vehicle = await db.vehicles.find_one({"id": log_data.vehicle_id})
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    log = FuelLog(**log_data.model_dump())
    await db.fuel_logs.insert_one(log.model_dump())
    
    return log

@api_router.get("/fuel-logs", response_model=List[FuelLog])
async def get_fuel_logs(current_user: dict = Depends(get_current_user)):
    logs = await db.fuel_logs.find({}, {"_id": 0}).to_list(1000)
    return logs

@api_router.delete("/fuel-logs/{log_id}")
async def delete_fuel_log(log_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.fuel_logs.delete_one({"id": log_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Fuel log not found")
    return {"message": "Fuel log deleted"}

# ============ EXPENSE LOG ROUTES ============
@api_router.post("/expense-logs", response_model=ExpenseLog)
async def create_expense_log(log_data: ExpenseLogCreate, current_user: dict = Depends(get_current_user)):
    vehicle = await db.vehicles.find_one({"id": log_data.vehicle_id})
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    log = ExpenseLog(**log_data.model_dump())
    await db.expense_logs.insert_one(log.model_dump())
    
    return log

@api_router.get("/expense-logs", response_model=List[ExpenseLog])
async def get_expense_logs(current_user: dict = Depends(get_current_user)):
    logs = await db.expense_logs.find({}, {"_id": 0}).to_list(1000)
    return logs

@api_router.delete("/expense-logs/{log_id}")
async def delete_expense_log(log_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.expense_logs.delete_one({"id": log_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Expense log not found")
    return {"message": "Expense log deleted"}

# ============ ANALYTICS ROUTES ============
@api_router.get("/analytics/vehicle-costs")
async def get_vehicle_costs(current_user: dict = Depends(get_current_user)):
    vehicles = await db.vehicles.find({}, {"_id": 0}).to_list(1000)
    
    result = []
    for vehicle in vehicles:
        # Get maintenance costs
        maintenance_logs = await db.maintenance_logs.find({"vehicle_id": vehicle["id"]}, {"_id": 0}).to_list(1000)
        maintenance_cost = sum(log["cost"] for log in maintenance_logs)
        
        # Get fuel costs
        fuel_logs = await db.fuel_logs.find({"vehicle_id": vehicle["id"]}, {"_id": 0}).to_list(1000)
        fuel_cost = sum(log["cost"] for log in fuel_logs)
        total_liters = sum(log["liters"] for log in fuel_logs)
        
        # Get other expenses
        expense_logs = await db.expense_logs.find({"vehicle_id": vehicle["id"]}, {"_id": 0}).to_list(1000)
        other_expenses = sum(log["amount"] for log in expense_logs)
        
        total_cost = maintenance_cost + fuel_cost + other_expenses
        
        # Calculate fuel efficiency (simplified)
        trips = await db.trips.find({"vehicle_id": vehicle["id"], "status": "Completed"}, {"_id": 0}).to_list(1000)
        total_distance = sum(trip.get("distance", 0) for trip in trips)
        fuel_efficiency = (total_distance / total_liters) if total_liters > 0 else 0
        
        result.append({
            "vehicle_id": vehicle["id"],
            "vehicle_name": vehicle["name"],
            "license_plate": vehicle["license_plate"],
            "maintenance_cost": round(maintenance_cost, 2),
            "fuel_cost": round(fuel_cost, 2),
            "other_expenses": round(other_expenses, 2),
            "total_cost": round(total_cost, 2),
            "total_distance": round(total_distance, 2),
            "fuel_efficiency": round(fuel_efficiency, 2),
            "total_trips": len(trips)
        })
    
    return result

@api_router.get("/analytics/fuel-trends")
async def get_fuel_trends(current_user: dict = Depends(get_current_user)):
    fuel_logs = await db.fuel_logs.find({}, {"_id": 0}).sort("date", 1).to_list(1000)
    
    # Group by date
    date_groups = {}
    for log in fuel_logs:
        date = log["date"][:10]  # Get YYYY-MM-DD
        if date not in date_groups:
            date_groups[date] = {"total_liters": 0, "total_cost": 0}
        date_groups[date]["total_liters"] += log["liters"]
        date_groups[date]["total_cost"] += log["cost"]
    
    result = [
        {
            "date": date,
            "total_liters": round(data["total_liters"], 2),
            "total_cost": round(data["total_cost"], 2),
            "avg_price_per_liter": round(data["total_cost"] / data["total_liters"], 2) if data["total_liters"] > 0 else 0
        }
        for date, data in sorted(date_groups.items())
    ]
    
    return result

@api_router.get("/reports/export")
async def export_report(report_type: str, current_user: dict = Depends(get_current_user)):
    output = io.StringIO()
    writer = csv.writer(output)
    
    if report_type == "vehicles":
        vehicles = await db.vehicles.find({}, {"_id": 0}).to_list(1000)
        writer.writerow(["ID", "Name", "Model", "License Plate", "Type", "Max Capacity", "Odometer", "Status"])
        for v in vehicles:
            writer.writerow([v["id"], v["name"], v["model"], v["license_plate"], v["vehicle_type"], v["max_capacity"], v["odometer"], v["status"]])
    
    elif report_type == "drivers":
        drivers = await db.drivers.find({}, {"_id": 0}).to_list(1000)
        writer.writerow(["ID", "Name", "License Number", "License Expiry", "Phone", "Status", "Safety Score", "Completion Rate", "Total Trips"])
        for d in drivers:
            writer.writerow([d["id"], d["name"], d["license_number"], d["license_expiry"], d["phone"], d["status"], d["safety_score"], d["trip_completion_rate"], d["total_trips"]])
    
    elif report_type == "trips":
        trips = await db.trips.find({}, {"_id": 0}).to_list(1000)
        writer.writerow(["ID", "Origin", "Destination", "Cargo Weight", "Vehicle ID", "Driver ID", "Status", "Distance", "Created At"])
        for t in trips:
            writer.writerow([t["id"], t["origin"], t["destination"], t["cargo_weight"], t["vehicle_id"], t["driver_id"], t["status"], t.get("distance", 0), t["created_at"]])
    
    elif report_type == "costs":
        costs = await get_vehicle_costs(current_user)
        writer.writerow(["Vehicle ID", "Vehicle Name", "License Plate", "Maintenance Cost", "Fuel Cost", "Other Expenses", "Total Cost", "Total Distance", "Fuel Efficiency", "Total Trips"])
        for c in costs:
            writer.writerow([c["vehicle_id"], c["vehicle_name"], c["license_plate"], c["maintenance_cost"], c["fuel_cost"], c["other_expenses"], c["total_cost"], c["total_distance"], c["fuel_efficiency"], c["total_trips"]])
    
    else:
        raise HTTPException(status_code=400, detail="Invalid report type")
    
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={report_type}_report.csv"}
    )

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()