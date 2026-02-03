from datetime import datetime
from decimal import Decimal
from sqlalchemy import String, Text, DateTime, func, ForeignKey, Numeric, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from ..database import Base


class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(primary_key=True)
    city_name: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    city_name_lv: Mapped[str] = mapped_column(String(100))  # Latvian name
    coat_of_arms_image: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text)
    description_lv: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    variants: Mapped[list["TShirtVariant"]] = relationship(back_populates="product")
    wishlist_items: Mapped[list["WishlistItem"]] = relationship(back_populates="product")
    reviews: Mapped[list["Review"]] = relationship(back_populates="product")


class TShirtVariant(Base):
    __tablename__ = "tshirt_variants"

    id: Mapped[int] = mapped_column(primary_key=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"))
    color: Mapped[str] = mapped_column(String(50))
    size: Mapped[str] = mapped_column(String(10))
    price: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    stock: Mapped[int] = mapped_column(Integer, default=100)
    sku: Mapped[str] = mapped_column(String(50), unique=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    product: Mapped["Product"] = relationship(back_populates="variants")
    order_items: Mapped[list["OrderItem"]] = relationship(back_populates="variant")
    cart_items: Mapped[list["CartItem"]] = relationship(back_populates="variant")


from .order import OrderItem
from .cart import CartItem
from .wishlist import WishlistItem
from .review import Review
