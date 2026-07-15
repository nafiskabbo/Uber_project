from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect ,Depends # type: ignore
from fastapi.responses import JSONResponse # type: ignore
from fastapi.middleware.cors import CORSMiddleware # type: ignore

from pydantic import BaseModel, Field, computed_field # type: ignore
from typing import Annotated 
from datetime import datetime
from math import radians, cos, sin, asin, sqrt
import numpy as np
import pandas as pd
import joblib 
import json
import geocoder # type: ignore
from sqlalchemy.orm import Session # type: ignore
app = FastAPI()
from database import init_db, get_db, DriverDB ,CustomerDB ,SessionLocal


# ---- ১. CORS কনফিগারেশন (একবারই যথেষ্ট) ----
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",  # <--- আপনার বর্তমান ফ্রন্টএন্ড পোর্টটি এখানে যোগ করুন
    "http://127.0.0.1:5174",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # সাময়িকভাবে সব অরিজিন ওপেন করে দেওয়া হলো টেস্ট করার জন্য
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

init_db()

# ... আপনার আগের CORS কনফিগারেশন, ML Model Loader এবং User_input ক্লাস আগের মতোই থাকবে ...

# ---- ড্রাইভার রেজিস্ট্রেশন Pydantic মডেল ----
class DriverRegister(BaseModel):
    name: str
    gmail: str
    password: str
    car_name: str
    license_number: str

# ---- ডেটাবেজ ব্যবহার করে রেজিস্ট্রেশন এন্ডপয়েন্ট 🚀 ----
@app.post("/api/driver/register")
def register_driver(driver_data: DriverRegister, db: Session = Depends(get_db)):
    input_gmail = driver_data.gmail.strip().lower()
    
    existing_driver = db.query(DriverDB).filter(DriverDB.gmail == input_gmail).first()
    if existing_driver:
        raise HTTPException(status_code=400, detail="Gmail already registered!")
    
    try:
        new_driver = DriverDB(
            name=driver_data.name.strip(),
            gmail=input_gmail,
            password=driver_data.password, 
            car_name=driver_data.car_name.strip(),
            license_number=driver_data.license_number.strip()
        )
        db.add(new_driver)
        db.commit()
        db.refresh(new_driver)
        return {"success": True, "message": "Driver registered successfully!", "driver_id": new_driver.id}
    
    except Exception as e:
        db.rollback() # কোনো এরর হলে আগের অবস্থায় ফেরত যাবে
        raise HTTPException(status_code=500, detail=f"Database Error: {str(e)}")
    
def create_dummy_customer():
    db = SessionLocal()
    try:
        # জিমেইলটি অলরেডি আছে কি না চেক করা
        user_exists = db.query(CustomerDB).filter(CustomerDB.gmail == "sadit6803@gmail.com").first()
        if not user_exists:
            # না থাকলে আপনার স্ক্রিনশটের জিমেইলটি পাসওয়ার্ড সহ সেভ করে দেওয়া
            dummy_user = CustomerDB(
                name="Sadit Customer",
                gmail="sadit6803@gmail.com",
                password="123456" # আপনার স্ক্রিনশটের পাসওয়ার্ডটি দিন
            )
            db.add(dummy_user)
            db.commit()
            print("✓ Temporary test customer created successfully!")
    finally:
        db.close()

# ফাংশনটি রান করানো
create_dummy_customer()
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---- ২. গ্লোবালি একবার মডেল লোড করা (Fast Performance এর জন্য) ----
try:
    uber_model = joblib.load("uber_model.pkl")
    kmeans_model = joblib.load("kmeans_model.pkl")
    print("✓ Models loaded successfully!")
except Exception as e:
    print(f"❌ Error loading models: {e}")

# ---- ৩. হেল্পার ফাংশন ----
def haver(lat1, lon1, lat2, lon2) -> float:
    lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * asin(sqrt(a))
    r = 6371 # km
    return c * r

# ---- ৪. Pydantic ডাটা মডেল ----
class User_input(BaseModel):
    pickup_datetime : Annotated[str, Field(..., description="give the date and time", example="2016-03-14 17:24:55")]
    pickup_longitude : Annotated[float, Field(..., description="choose the pickup longitude from the map", example=-73.982155)]
    pickup_latitude : Annotated[float, Field(..., description="choose the pickup latitude from the map", example=40.767937)]
    dropoff_longitude : Annotated[float, Field(..., description="choose the dropoff longitude from the map", example=-73.982155)]
    dropoff_latitude : Annotated[float, Field(..., description="choose the dropoff latitude from the map", example=40.767937)]

    @computed_field
    def pickup_date(self) -> int:
        dt = datetime.strptime(self.pickup_datetime, "%Y-%m-%d %H:%M:%S")
        return dt.day
    
    @computed_field
    def pickup_month(self) -> int:
        dt = datetime.strptime(self.pickup_datetime, "%Y-%m-%d %H:%M:%S")
        return dt.month

    @computed_field
    def pickup_minute_sin(self) -> float:
        dt = datetime.strptime(self.pickup_datetime, "%Y-%m-%d %H:%M:%S")
        return float(np.sin(2 * np.pi * dt.minute/60))

    @computed_field
    def pickup_minute_cos(self) -> float:
        dt = datetime.strptime(self.pickup_datetime, "%Y-%m-%d %H:%M:%S")
        return float(np.cos(2 * np.pi * dt.minute / 60))

    @computed_field
    def pickup_hour_sin(self) -> float:
        dt = datetime.strptime(self.pickup_datetime, "%Y-%m-%d %H:%M:%S")
        return float(np.sin(2 * np.pi * dt.hour / 24))
 
    @computed_field
    def pickup_hour_cos(self) -> float:
        dt = datetime.strptime(self.pickup_datetime, "%Y-%m-%d %H:%M:%S")
        return float(np.cos(2 * np.pi * dt.hour / 24))
    
    @computed_field
    def pickup_dayofweek(self) -> int:
        dt = datetime.strptime(self.pickup_datetime, "%Y-%m-%d %H:%M:%S")
        week_day = dt.strftime("%A")
        days = {"Saturday": 0, "Sunday": 1, "Monday": 2, "Tuesday": 3, "Wednesday": 4, "Thursday": 5, "Thusday": 5}
        return days.get(week_day, 6)

    @computed_field
    def trip_distance(self) -> float:
        return haver(self.pickup_latitude, self.pickup_longitude, self.dropoff_latitude, self.dropoff_longitude)
    
    @computed_field
    def manhattan_distance(self) -> float:
        a = haver(self.pickup_latitude, self.pickup_longitude, self.pickup_latitude, self.dropoff_longitude)
        b = haver(self.pickup_latitude, self.pickup_longitude, self.dropoff_latitude, self.pickup_longitude)
        return a + b
    
    @computed_field
    def pickup_cluster(self) -> int:
        # গ্লোবাল kmeans_model অবজেক্ট ব্যবহার করা হয়েছে
        pickup_coords = [[self.pickup_latitude, self.pickup_longitude]]
        return int(kmeans_model.predict(pickup_coords)[0])
    
    @computed_field
    def dropoff_cluster(self) -> int:
        # গ্লোবাল kmeans_model অবজেক্ট ব্যবহার করা হয়েছে
        dropoff_coords = [[self.dropoff_latitude, self.dropoff_longitude]] 
        return int(kmeans_model.predict(dropoff_coords)[0])

# ---- ৫. HTTP এন্ডপয়েন্টস ----

@app.post("/predict")
def prediction(data: User_input):
    try:    
        input_df = pd.DataFrame([{
            "pickup_date" : data.pickup_date,
            "pickup_month" : data.pickup_month,
            "pickup_dayofweek" : data.pickup_dayofweek,
            "trip_distance" : data.trip_distance,
            "manhattan_distance" : data.manhattan_distance,
            "pickup_cluster" : data.pickup_cluster,
            "dropoff_cluster" : data.dropoff_cluster,
            "pickup_hour_sin" : data.pickup_hour_sin,
            "pickup_hour_cos" : data.pickup_hour_cos,
            "pickup_minute_sin" : data.pickup_minute_sin,
            "pickup_minute_cos" : data.pickup_minute_cos
        }])
        
        # গ্লোবাল uber_model ব্যবহার করে প্রেডিকশন
        y_pred = uber_model.predict(input_df)[0]
        final_time = float(np.expm1(y_pred)) # Target log1p হলে এটি ঠিক আছে
        
        return JSONResponse(status_code=200, content={'predict': final_time})
    except Exception as e:
        print(f"Prediction Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/location")
def location():
    g = geocoder.ip('me')
    # সেফটি চেক: যদি জিওকোডার লোকেশন না পায় তবে যেন ক্র্যাশ না করে
    lat = g.latlng[0] if g.latlng else 24.3745
    lng = g.latlng[1] if g.latlng else 88.6042
    return {
        "success": True,
        "data": {
            "lat": lat,
            "log": lng
        }
    }

# ---- ৬. WebSocket ওয়ান-টু-ওয়ান চ্যাট ----
connected_clint = {}



# main.py এর এন্ডপয়েন্ট সেকশনে এটি যুক্ত করুন

# ---- ১. ওয়েবসকেট কানেকশন ম্যানেজার ক্লাস ----
class ConnectionManager:
    def __init__(self):
        # সমস্ত অনলাইন অ্যাক্টিভ কানেকশন 'user_name': WebSocket আকারে এখানে থাকবে
        self.active_connections: dict[str, WebSocket] = {}

    async def connect(self, user_name: str, websocket: WebSocket):
        # ইউজারকে রেজিস্টার করা
        self.active_connections[user_name] = websocket
        print(f"⚡ WebSocket Registered Successfully: {user_name}")

    def disconnect(self, user_name: str):
        if user_name in self.active_connections:
            del self.active_connections[user_name]
            print(f"🛑 WebSocket Disconnected: {user_name}")

    async def send_personal_message(self, message: dict):
        target = message.get("target")
        sender = message.get("sender")
        text = message.get("text") or message.get("msg")

        # টার্গেট ইউজার অনলাইনে থাকলে মেসেজ পুশ হবে
        if target in self.active_connections:
            await self.active_connections[target].send_json({
                "sender": sender,
                "msg": text
            })
            return True # মেসেজ সফলভাবে গেছে
        return False # টার্গেট অফলাইন

# গ্লোবাল ম্যানেজার অবজেক্ট
manager = ConnectionManager()


# ---- ২. চ্যাটের জন্য মূল WebSocket এন্ডপয়েন্ট ----
@app.websocket("/ws/chat")
async def websocket_endpoint(websocket: WebSocket):
    # হ্যান্ডশেক এক্সেপ্ট করে কানেকশন ওপেন করা (শুধু একবার)
    await websocket.accept()
    
    current_user = None
    try:
        while True:
            data = await websocket.receive_json()
            action = data.get("action")
            sender = data.get("sender")
            
            # 🎯 ফিক্স ১: প্রথম রেজিস্ট্রেশন মেসেজটি হ্যান্ডেল করা
            if action == "register" and sender:
                current_user = sender
                await manager.connect(current_user, websocket)
                # ক্লায়েন্টকে সফল কানেকশনের কনফার্মেশন পাঠানো
                await websocket.send_json({"sender": "System", "msg": "Connected to Server!"})
                continue # লুপের শুরুতে ফেরত যাও, মেসেজ ফরওয়ার্ড করার দরকার নেই
            
            # 🎯 ফিক্স ২: মেসেজ ফরওয়ার্ডিং লজিক
            target_user = data.get("target")
            if target_user:
                # ম্যানেজারের মাধ্যমে ডাইনামিকালি মেসেজ পাঠানো ট্রাই করা
                is_sent = await manager.send_personal_message(data)
                
                # যদি টার্গেট ইউজার অনলাইনে না থাকে, তবে প্রেরককে নোটিশ দাও
                if not is_sent:
                    await websocket.send_json({
                        "sender": "System", 
                        "msg": f"❌ {target_user} বর্তমানে অফলাইন আছেন।"
                    })

    except WebSocketDisconnect:
        if current_user:
            manager.disconnect(current_user)
    except Exception as e:
        print(f"❌ WebSocket Error: {e}")
        if current_user:
            manager.disconnect(current_user)


# ---- ৩. একটিভ ড্রাইভারদের ডাটাবেজ ও অনলাইন ট্র্যাকিং রাউট ----
@app.get("/api/active-drivers")
def get_active_drivers(db: Session = Depends(get_db)):
    driver_list = []
    
    # 🚀 ফিক্স ৩: 'connected_clint' এর বদলে সরাসরি ম্যানেজারের অনলাইন ইউজার লিস্ট রিড করা
    online_names = list(manager.active_connections.keys())
    
    try:
        # ডেটাবেজ থেকে শুধুমাত্র সেই ড্রাইভারদের তথ্য আনা যারা বর্তমানে WebSocket-এ অনলাইনে আছে
        active_db_drivers = db.query(DriverDB).filter(
            DriverDB.name.in_(online_names)
        ).all()
        
        for driver in active_db_drivers:
            driver_list.append({
                "id": driver.id,
                "name": driver.name,
                "gmail": driver.gmail,
                "car_name": driver.car_name,    
                "license_number": driver.license_number,
                "lat": 24.3745,
                "lng": 88.6042
            })
            
    except Exception as e:
        print(f"Database Query Error in active-drivers: {e}")
        pass
    
    # ফলব্যাক লজিক: যদি ডেটাবেজে কোনো ম্যাচিং লাইভ ড্রাইভার না থাকে, টেস্টিংয়ের জন্য ডামি ডাটা পাঠানো
    if not driver_list:
        print("💡 No live matching driver in DB, loading testing fallback...")
        return {
            "drivers": [
                {
                    "id": 1,
                    "name": "nabil", 
                    "car_name": "Toyota Premio",
                    "license_number": "DHAKA-METRO-1234",
                    "lat": 24.3745,
                    "lng": 88.6042
                }
            ]
        }
    
    return {"drivers": driver_list}
# main.py এর এন্ডপয়েন্ট সেকশনে যোগ করুন

class DriverLogin(BaseModel):
    gmail: str
    password: str

@app.post("/api/driver/login")
def login_driver(login_data: DriverLogin, db: Session = Depends(get_db)):
    # ডেটাবেজে এই জিমেইলের কোনো ড্রাইভার আছে কি না চেক করা
    driver = db.query(DriverDB).filter(DriverDB.gmail == login_data.gmail).first()
    
    if not driver:
        raise HTTPException(status_code=400, detail="এই জিমেইলটি নিবন্ধিত নয়!")
        
    # পাসওয়ার্ড চেক করা (সিম্পল ম্যাচিং)
    if driver.password != login_data.password:
        raise HTTPException(status_code=400, detail="ভুল পাসওয়ার্ড! আবার চেষ্টা করুন।")
        
    # লগইন সফল হলে ড্রাইভারের নাম এবং রোল রিটার্ন করা
    return {
        "success": True, 
        "message": "लগইন সফল হয়েছে!", 
        "name": driver.name,
        "role": "Driver"
    }



class CustomerLogin(BaseModel):
    gmail: str
    password: str

@app.post("/api/customer/login")
def login_customer(login_data: CustomerLogin, db: Session = Depends(get_db)):
    # ডেটাবেজে কাস্টমার চেক করা
    customer = db.query(CustomerDB).filter(CustomerDB.gmail == login_data.gmail).first()
    
    if not customer:
        raise HTTPException(status_code=400, detail="এই জিমেইল দিয়ে কোনো কাস্টমার অ্যাকাউন্ট পাওয়া যায়নি!")
        
    if customer.password != login_data.password:
        raise HTTPException(status_code=400, detail="ভুল পাসওয়ার্ড!")
        
    return {
        "success": True, 
        "message": "কাস্টমার লগইন সফল!", 
        "name": customer.name,
        "role": "Customer"
    }

class CustomerRegister(BaseModel):
    name: str
    gmail: str
    password: str

@app.post("/api/customer/register")
def register_customer(customer_data: CustomerRegister, db: Session = Depends(get_db)):
    # জিমেইল অলরেডি আছে কি না চেক
    existing_customer = db.query(CustomerDB).filter(CustomerDB.gmail == customer_data.gmail).first()
    if existing_customer:
        raise HTTPException(status_code=400, detail="এই জিমেইলটি দিয়ে অলরেডি অ্যাকাউন্ট তৈরি করা আছে!")
    
    # ডেটাবেজে নতুন কাস্টমার যুক্ত করা
    new_customer = CustomerDB(
        name=customer_data.name,
        gmail=customer_data.gmail,
        password=customer_data.password
    )
    db.add(new_customer)
    db.commit()
    db.refresh(new_customer)
    
    return {"success": True, "message": "Customer registered successfully!"}


@app.get("/api/get-value")
def fallback_value():
    return {"message": {"lat": 24.3745, "lng": 88.6042}}