from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from .database import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    price = Column(Float)
    platform = Column(String, index=True)
    product_url = Column(String, unique=True, index=True)
    image_url = Column(String)
    group_id = Column(String, index=True)
    is_lowest_price = Column(Boolean, default=False)
    scraped_at = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    history = relationship("PriceHistory", back_populates="product", cascade="all, delete-orphan")

class PriceHistory(Base):
    __tablename__ = "price_history"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), index=True)
    platform = Column(String)
    price = Column(Float)
    recorded_at = Column(DateTime(timezone=True), server_default=func.now())

    product = relationship("Product", back_populates="history")

class PriceAlert(Base):
    __tablename__ = "price_alerts"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), index=True)
    target_price = Column(Float)
    is_triggered = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    product = relationship("Product")
