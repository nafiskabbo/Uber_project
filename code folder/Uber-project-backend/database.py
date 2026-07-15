# Uber-project-backend/database.py

from sqlalchemy import create_engine, Column, Integer, String # type: ignore
from sqlalchemy.ext.declarative import declarative_base # type: ignore
from sqlalchemy.orm import sessionmaker # type: ignore

# ---- ১. ডেটাবেজ ইউআরএল কনফিগারেশন (SQLite) ----
# এটি আপনার প্রজেক্ট ফোল্ডারে স্বয়ংক্রিয়ভাবে 'uber_bargain.db' ফাইল তৈরি করবে
DATABASE_URL = "sqlite:///./uber_bargain.db"

# engine এবং sessionmaker তৈরি করা হচ্ছে
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


# ---- ২. ড্রাইভার টেবিল মডেল (Driver Database Model) ----
class DriverDB(Base):
    __tablename__ = "drivers"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    gmail = Column(String, unique=True, index=True)
    password = Column(String)
    car_name = Column(String)
    license_number = Column(String)
    # license_image = Column(String) # আপনার রিকোয়েস্ট অনুযায়ী ইমেজ পার্টটি কমেন্ট আউট রইলো


# ---- ৩. কাস্টমার টেবিল মডেল (Customer Database Model) ----
class CustomerDB(Base):
    __tablename__ = "customers"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    gmail = Column(String, unique=True, index=True)
    password = Column(String)


# ---- ৪. টেবিল ইনিশিয়ালাইজেশন ফাংশন ----
# main.py চালু হওয়ার সময় এটি কল হয়ে টেবিল না থাকলে অটোমেটিক তৈরি করে নেবে
def init_db():
    Base.metadata.create_all(bind=engine)


# ---- ৫. ডেটাবেজ সেশন হেল্পার (FastAPI Dependency Injection) ----
# এটি এপিআই এন্ডপয়েন্টে প্রতিবার ডেটাবেজ কানেকশন ওপেন ও ক্লোজ করার কাজ নিরাপদভাবে সম্পন্ন করে
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()