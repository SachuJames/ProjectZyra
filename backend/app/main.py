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

from .database import engine, Base, get_db
from . import models
from pydantic import BaseModel
from .scrapers import scrape_all

RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")
if RESEND_API_KEY:
    resend.api_key = RESEND_API_KEY

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

@app.post("/track")
async def track_price(req: TrackRequest, db: Session = Depends(get_db)):
    alert = models.PriceAlert(
        email=req.email,
        product_id=req.product_id,
        target_price=req.target_price
    )
    db.add(alert)
    db.commit()
    return {"status": "success", "alert_id": alert.id}

@app.post("/scrape")
async def perform_scrape(req: ScrapeRequest, db: Session = Depends(get_db)):
    raw_results = await scrape_all(req.query)
    results = normalize_results(raw_results)
    
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
async def search_products(q: str, db: Session = Depends(get_db)):
    cache_key = f"search:{q.lower()}"
    
    if redis_client:
        cached = await redis_client.get(cache_key)
        if cached:
            return json.loads(cached)
            
    raw_results = await scrape_all(q)
    results = normalize_results(raw_results)
    
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
