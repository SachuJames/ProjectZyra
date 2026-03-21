from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import redis.asyncio as redis
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
import os
import json
import resend
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy.orm import sessionmaker
from sqlalchemy import func, desc
import google.generativeai as genai

from .database import engine, Base, get_db
from . import models
from pydantic import BaseModel
from .scrapers import scrape_all
from typing import Optional, List
from datetime import timedelta
from .auth import get_password_hash, verify_password, create_access_token, get_current_user, get_current_user_optional, ACCESS_TOKEN_EXPIRE_MINUTES
import httpx

class UserCreate(BaseModel):
    email: str
    password: str
    full_name: str

class UserLogin(BaseModel):
    email: str
    password: str

class GoogleLogin(BaseModel):
    token: str

class Token(BaseModel):
    access_token: str
    token_type: str

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    is_google_auth: bool

RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")
if RESEND_API_KEY:
    resend.api_key = RESEND_API_KEY

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
from .normalizer import normalize_results

app = FastAPI(title="PriceRadar API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

models.Base.metadata.create_all(bind=engine)

DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://priceradar_user:priceradar_pass@db:5432/priceradar")
REDIS_URL = os.environ.get("REDIS_URL", "redis://redis:6379/0")

# Redis connection
redis_client = None
scheduler = AsyncIOScheduler()

async def check_price_drops():
    db = SessionLocal()
    try:
        alerts = db.query(models.PriceAlert).filter(models.PriceAlert.is_triggered == False).all()
        tracked_product_ids = set([a.product_id for a in alerts])
        
        for pid in tracked_product_ids:
            product = db.query(models.Product).filter(models.Product.id == pid).first()
            if not product: continue
            
            raw_results = await scrape_all(product.title)
            new_price = None
            for res in raw_results:
                if res["product_url"] == product.product_url:
                    new_price = res["price"]
                    break
            
            if new_price and new_price != product.price:
                product.price = new_price
                db.add(models.PriceHistory(product_id=product.id, platform=product.platform, price=new_price))
                db.commit()
            
            curr_price = new_price or product.price
            
            for alert in alerts:
                if alert.product_id == pid and curr_price <= alert.target_price:
                    if RESEND_API_KEY:
                        try:
                            resend.Emails.send({
                                "from": "onboarding@resend.dev",
                                "to": alert.email,
                                "subject": f"Price Drop Alert: {product.title}",
                                "html": f"<p>Great news! The price for <strong>{product.title}</strong> has dropped to ₹{curr_price}.</p><p><a href='{product.product_url}'>Buy it here</a></p>"
                            })
                        except Exception as e:
                            print("Email error:", e)
                    alert.is_triggered = True
                    db.commit()
    except Exception as e:
        print("Scheduler Error:", e)
    finally:
        db.close()

@app.on_event("startup")
async def startup_event():
    global redis_client
    redis_client = redis.from_url(REDIS_URL, encoding="utf-8", decode_responses=True)
    scheduler.add_job(check_price_drops, 'interval', hours=1)
    scheduler.start()

@app.on_event("shutdown")
async def shutdown_event():
    global redis_client
    if redis_client:
        await redis_client.close()
    scheduler.shutdown()

@app.get("/")
async def root():
    return {"message": "Welcome to PriceRadar API"}

@app.get("/health")
async def health_check():
    # Check DB
    db_status = "ok"
    try:
        engine = create_engine(DATABASE_URL)
        with engine.connect() as conn:
            pass
    except Exception as e:
        db_status = str(e)

    # Check Redis
    redis_status = "ok"
    try:
        if redis_client:
            await redis_client.ping()
        else:
            redis_status = "disconnected"
    except Exception as e:
        redis_status = str(e)

    return {
        "status": "ok" if db_status == "ok" and redis_status == "ok" else "error",
        "database": db_status,
        "redis": redis_status
    }

class ScrapeRequest(BaseModel):
    query: str

class TrackRequest(BaseModel):
    email: str
    product_id: int
    target_price: float

@app.post("/auth/register", response_model=Token)
async def register(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user.password)
    new_user = models.User(
        email=user.email,
        password_hash=hashed_password,
        full_name=user.full_name
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": new_user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/auth/login", response_model=Token)
async def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if not db_user or not db_user.password_hash:
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    if not verify_password(user.password, db_user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
        
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": db_user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/auth/google", response_model=Token)
async def google_login(req: GoogleLogin, db: Session = Depends(get_db)):
    async with httpx.AsyncClient() as client:
        response = await client.get(f"https://oauth2.googleapis.com/tokeninfo?id_token={req.token}")
        if response.status_code != 200:
            raise HTTPException(status_code=400, detail="Invalid Google token")
        user_info = response.json()
        
    email = user_info.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Email not provided by Google")
        
    db_user = db.query(models.User).filter(models.User.email == email).first()
    if not db_user:
        db_user = models.User(
            email=email,
            full_name=user_info.get("name", email.split('@')[0]),
            is_google_auth=True
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": db_user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/auth/me", response_model=UserResponse)
async def get_me(user: models.User = Depends(get_current_user)):
    return user

@app.get("/dashboard/alerts")
async def get_dashboard_alerts(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    alerts = db.query(models.PriceAlert).filter(models.PriceAlert.user_id == user.id).all()
    result = []
    for alert in alerts:
        product = db.query(models.Product).filter(models.Product.id == alert.product_id).first()
        if product:
            result.append({
                "id": alert.id,
                "product_name": product.title,
                "product_url": product.product_url,
                "image_url": product.image_url,
                "target_price": alert.target_price,
                "current_price": product.price,
                "status": "Triggered" if alert.is_triggered else "Active",
                "created_at": alert.created_at
            })
    return result

@app.get("/dashboard/history")
async def get_dashboard_history(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    alerts = db.query(models.PriceAlert).filter(models.PriceAlert.user_id == user.id).all()
    product_ids = set([a.product_id for a in alerts])
    products = db.query(models.Product).filter(models.Product.id.in_(product_ids)).all()
    
    result = []
    for p in products:
        history = db.query(models.PriceHistory).filter(models.PriceHistory.product_id == p.id).all()
        lowest_price = min([h.price for h in history]) if history else p.price
        highest_price = max([h.price for h in history]) if history else p.price
        
        status = "Normal"
        if p.price <= lowest_price * 1.05:
            status = "Good Time to Buy"
        elif highest_price > 0 and p.price >= highest_price * 0.95:
            status = "Wait"
            
        result.append({
            "id": p.id,
            "title": p.title,
            "current_price": p.price,
            "target_price": next((a.target_price for a in alerts if a.product_id == p.id), None),
            "image_url": p.image_url,
            "product_url": p.product_url,
            "buy_status": status
        })
    return result

@app.get("/dashboard/searches")
async def get_dashboard_searches(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    searches = db.query(models.UserSearch).filter(models.UserSearch.user_id == user.id).order_by(models.UserSearch.created_at.desc()).limit(10).all()
    return [{"id": s.id, "query": s.query, "created_at": s.created_at} for s in searches]

@app.post("/track")
async def track_price(req: TrackRequest, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    alert = models.PriceAlert(
        email=user.email,
        user_id=user.id,
        product_id=req.product_id,
        target_price=req.target_price
    )
    db.add(alert)
    db.commit()
    return {"status": "success", "alert_id": alert.id}

@app.post("/scrape")
async def perform_scrape(req: ScrapeRequest, db: Session = Depends(get_db)):
    raw_results = await scrape_all(req.query)
    results = normalize_results(raw_results, req.query)
    
    for res in results:
        existing = db.query(models.Product).filter(models.Product.product_url == res["product_url"]).first()
        if not existing:
            productList = models.Product(**res)
            db.add(productList)
            db.flush()
            db.add(models.PriceHistory(product_id=productList.id, platform=productList.platform, price=productList.price))
        else:
            existing.price = res["price"]
            existing.title = res["title"]
            existing.image_url = res["image_url"]
            existing.group_id = res["group_id"]
            existing.is_lowest_price = res["is_lowest_price"]
            db.add(models.PriceHistory(product_id=existing.id, platform=existing.platform, price=existing.price))

    db.commit()
    return {"status": "success", "scraped": len(results)}

@app.get("/search")
async def search_products(q: str, db: Session = Depends(get_db), user: Optional[models.User] = Depends(get_current_user_optional)):
    if user:
        search_log = models.UserSearch(user_id=user.id, query=q)
        db.add(search_log)
        db.commit()

    cache_key = f"search:{q.lower()}"
    
    if redis_client:
        cached = await redis_client.get(cache_key)
        if cached:
            return json.loads(cached)
            
    raw_results = await scrape_all(q)
    results = normalize_results(raw_results, q)
    
    saved_products = []
    for res in results:
        existing = db.query(models.Product).filter(models.Product.product_url == res["product_url"]).first()
        if not existing:
            product = models.Product(**res)
            db.add(product)
            db.flush()
            db.add(models.PriceHistory(product_id=product.id, platform=product.platform, price=product.price))
            saved_products.append(product)
        else:
            existing.price = res["price"]
            existing.title = res["title"]
            existing.image_url = res["image_url"]
            existing.group_id = res["group_id"]
            existing.is_lowest_price = res["is_lowest_price"]
            db.add(models.PriceHistory(product_id=existing.id, platform=existing.platform, price=existing.price))
            saved_products.append(existing)
            
    db.commit()
    
    # insert search log
    search_log = models.SearchLog(query=q.lower(), result_count=len(saved_products))
    db.add(search_log)
    db.commit()
    
    output = []
    for p in saved_products:
        db.refresh(p)
        output.append({
            "id": p.id,
            "title": p.title,
            "price": p.price,
            "platform": p.platform,
            "product_url": p.product_url,
            "image_url": p.image_url,
            "group_id": p.group_id,
            "is_lowest_price": p.is_lowest_price,
            "scraped_at": p.scraped_at.isoformat() if p.scraped_at else None
        })
        
    output.sort(key=lambda x: x["price"])
    
    if redis_client:
        await redis_client.setex(cache_key, 900, json.dumps(output))
        
    return output

@app.get("/product/{product_id}")
async def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return {
        "id": product.id,
        "title": product.title,
        "price": product.price,
        "platform": product.platform,
        "product_url": product.product_url,
        "image_url": product.image_url,
        "group_id": product.group_id,
        "is_lowest_price": product.is_lowest_price,
        "scraped_at": product.scraped_at.isoformat() if product.scraped_at else None
    }

@app.get("/product/{product_id}/history")
async def get_product_history(product_id: int, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
        
    history = db.query(models.PriceHistory).filter(models.PriceHistory.product_id == product_id).order_by(models.PriceHistory.recorded_at.asc()).all()
    
    return [
        {
            "id": h.id,
            "product_id": h.product_id,
            "platform": h.platform,
            "price": h.price,
            "recorded_at": h.recorded_at.isoformat() if h.recorded_at else None
        } for h in history
    ]

@app.get("/admin/stats")
async def get_admin_stats(db: Session = Depends(get_db)):
    total_products = db.query(models.Product).count()
    total_unique_searches = db.query(func.count(func.distinct(models.SearchLog.query))).scalar()
    total_alerts = db.query(models.PriceAlert).count()
    total_users = db.query(func.count(func.distinct(models.PriceAlert.email))).scalar()

    platform_counts = db.query(models.Product.platform, func.count(models.Product.id)).group_by(models.Product.platform).all()
    platform_breakdown = {p[0]: p[1] for p in platform_counts}

    return {
        "total_products": total_products,
        "total_unique_searches": total_unique_searches or 0,
        "total_alerts": total_alerts,
        "total_users": total_users or 0,
        "platform_breakdown": platform_breakdown
    }

@app.get("/admin/top-searches")
async def get_top_searches(db: Session = Depends(get_db)):
    top = db.query(models.SearchLog.query, func.count(models.SearchLog.id).label('count')).group_by(models.SearchLog.query).order_by(desc('count')).limit(10).all()
    return [{"query": t[0], "count": t[1]} for t in top]

@app.get("/admin/platform-breakdown")
async def get_platform_breakdown(db: Session = Depends(get_db)):
    platform_counts = db.query(models.Product.platform, func.count(models.Product.id)).group_by(models.Product.platform).all()
    return [{"name": p[0], "value": p[1]} for p in platform_counts]

@app.get("/admin/recent-alerts")
async def get_recent_alerts(db: Session = Depends(get_db)):
    alerts = db.query(models.PriceAlert).order_by(desc(models.PriceAlert.created_at)).limit(20).all()
    result = []
    for a in alerts:
        product = db.query(models.Product).filter(models.Product.id == a.product_id).first()
        result.append({
            "id": a.id,
            "email": a.email,
            "product_name": product.title if product else "Unknown Product",
            "target_price": a.target_price,
            "status": "Triggered" if a.is_triggered else "Active",
            "created_at": a.created_at.isoformat() if a.created_at else None
        })
    return result

@app.get("/admin/search-history")
async def get_search_history(db: Session = Depends(get_db)):
    history = db.query(models.SearchLog).order_by(desc(models.SearchLog.searched_at)).limit(50).all()
    return [{
        "id": h.id,
        "query": h.query,
        "result_count": h.result_count,
        "searched_at": h.searched_at.isoformat() if h.searched_at else None
    } for h in history]

@app.get("/product/{product_id}/summary")
async def get_product_summary(product_id: int, db: Session = Depends(get_db)):
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="Gemini API Key not configured")
        
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
        
    prompt = f"You are a shopping assistant. Based on this product: {product.title} priced at ₹{product.price} on {product.platform}, give a 3-point analysis: 1) Is this a good product? 2) Is this price reasonable for India? 3) Should the user buy now or wait? Keep each point to 1 sentence. Be direct and helpful."
    
    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(prompt)
        text = response.text
        
        # Parse into up to 3 points
        lines = [line.strip().lstrip("1234567890.-* )") for line in text.strip().split('\\n') if len(line.strip()) > 10]
        points = [p for p in lines if p][:3]
        
        if len(points) < 3:
            import re
            split_points = re.split(r'\\b\\d+[\\)\\.]\\s+', text.strip())
            points = [p.strip().lstrip("-* )") for p in split_points if len(p.strip()) > 5][:3]
            
        return {"summary": points}
    except Exception as e:
        print("Gemini Error:", e)
        raise HTTPException(status_code=500, detail=str(e))

