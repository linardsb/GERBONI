"""Demo data seed: customers, orders, reviews. Idempotent-ish; safe to re-run but will add more."""
import asyncio
import random
from datetime import datetime, timedelta, timezone
from decimal import Decimal

from passlib.context import CryptContext
from sqlalchemy import select

from .database import async_session_maker
from .models import Order, OrderItem, Product, Review, TShirtVariant, User, UserRole
from .models.campaign import CampaignStatus, NewsletterCampaign
from .models.newsletter import NewsletterSubscription
from .models.order import OrderStatus

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

CUSTOMERS = [
    ("anna.berzina@example.lv", "Anna Bērziņa", "Brīvības iela 12", "Rīga", "LV-1010"),
    ("janis.kalnins@example.lv", "Jānis Kalniņš", "Lāčplēša iela 45", "Rīga", "LV-1011"),
    ("liga.ozola@example.lv", "Līga Ozola", "Krišjāņa Barona iela 3", "Daugavpils", "LV-5401"),
    ("peteris.zarins@example.lv", "Pēteris Zariņš", "Jūras iela 7", "Liepāja", "LV-3401"),
    ("ilze.liepa@example.lv", "Ilze Liepa", "Rīgas iela 22", "Jelgava", "LV-3001"),
    ("martins.vitols@example.lv", "Mārtiņš Vītols", "Skolas iela 14", "Ventspils", "LV-3601"),
    ("agnese.kalnina@example.lv", "Agnese Kalniņa", "Stacijas iela 9", "Rēzekne", "LV-4601"),
    ("kristaps.silins@example.lv", "Kristaps Siliņš", "Parka iela 5", "Jūrmala", "LV-2015"),
    ("zane.priede@example.lv", "Zane Priede", "Ozolu iela 18", "Valmiera", "LV-4201"),
    ("andris.kruze@example.lv", "Andris Krūze", "Meža iela 33", "Ogre", "LV-5001"),
    ("inga.berga@example.lv", "Inga Berga", "Kalnu iela 8", "Jēkabpils", "LV-5201"),
    ("toms.ozolins@example.lv", "Toms Ozoliņš", "Dārza iela 11", "Rīga", "LV-1012"),
]

REVIEW_TEMPLATES = [
    (5, "Excellent quality!", "Lovely t-shirt, the print is sharp and the fabric is soft. Highly recommended."),
    (5, "Lieliska kvalitāte!", "Skaists krekls, labs materiāls. Iesaku."),
    (4, "Great shirt", "Good fit and nice design. Took a couple weeks to ship."),
    (5, "Beautiful design", "The coat of arms looks amazing. Quality is top-notch."),
    (4, "Liked it", "Comfortable cotton, true to size."),
    (5, "Perfect gift", "Bought as a present, the recipient loved it."),
    (3, "OK", "Decent shirt, color was slightly different than expected."),
    (5, "Patīk!", "Ļoti patika, atbilst aprakstam un izmēram."),
    (4, "Nice quality", "Good shirt, will buy again."),
]


async def seed_demo():
    print("Seeding demo data...")

    async with async_session_maker() as db:
        # 1) Customers
        existing = await db.execute(select(User.email).where(User.email.in_([c[0] for c in CUSTOMERS])))
        have = {e for (e,) in existing.all()}
        users_by_email: dict[str, User] = {}
        for email, name, addr, city, postal in CUSTOMERS:
            if email in have:
                u = (await db.execute(select(User).where(User.email == email))).scalar_one()
            else:
                u = User(
                    email=email,
                    password_hash=pwd_context.hash("demo1234"),
                    role=UserRole.CUSTOMER.value,
                    is_active=True,
                )
                db.add(u)
                await db.flush()
            users_by_email[email] = u
        await db.commit()
        print(f"  Customers ready: {len(users_by_email)}")

        # 2) Pick variants
        variants_q = await db.execute(select(TShirtVariant).limit(200))
        variants = variants_q.scalars().all()
        products_q = await db.execute(select(Product))
        products = {p.id: p for p in products_q.scalars().all()}
        if not variants:
            print("  No variants in DB — skipping orders.")
            return

        # 3) Orders — 35 across statuses, last 60 days
        statuses_weighted = (
            [OrderStatus.DELIVERED] * 12
            + [OrderStatus.SHIPPED] * 6
            + [OrderStatus.PROCESSING] * 5
            + [OrderStatus.PAID] * 5
            + [OrderStatus.PENDING] * 4
            + [OrderStatus.CANCELLED] * 2
            + [OrderStatus.REFUNDED] * 1
        )
        now = datetime.now(timezone.utc)
        countries = ["Latvia", "Latvia", "Latvia", "Estonia", "Lithuania"]
        order_count = 0
        order_items_count = 0
        for i in range(35):
            email, name, addr, city, postal = random.choice(CUSTOMERS)
            user = users_by_email[email]
            status = random.choice(statuses_weighted)

            # 1–3 line items
            picks = random.sample(variants, k=random.randint(1, 3))
            items: list[OrderItem] = []
            subtotal = Decimal("0")
            for v in picks:
                qty = random.randint(1, 2)
                items.append(OrderItem(variant_id=v.id, quantity=qty, price=v.price))
                subtotal += v.price * qty

            shipping = Decimal("0") if subtotal >= Decimal("50") else Decimal("4.99")
            total = subtotal + shipping

            created = now - timedelta(days=random.randint(0, 60), hours=random.randint(0, 23))
            country = random.choice(countries)
            order = Order(
                user_id=user.id,
                status=status.value,
                subtotal=subtotal,
                discount_amount=Decimal("0"),
                total=total,
                shipping_name=name,
                shipping_address=addr,
                shipping_city=city,
                shipping_postal_code=postal,
                shipping_country=country,
                tracking_number=f"LV{random.randint(100000000, 999999999)}EE" if status in (OrderStatus.SHIPPED, OrderStatus.DELIVERED) else None,
                created_at=created,
                updated_at=created + timedelta(days=random.randint(0, 5)),
            )
            db.add(order)
            await db.flush()
            for it in items:
                it.order_id = order.id
                db.add(it)
                order_items_count += 1
            order_count += 1
        await db.commit()
        print(f"  Orders: {order_count} ({order_items_count} line items)")

        # 4) Reviews on delivered orders (unique per (user, product))
        existing_reviews = await db.execute(select(Review.user_id, Review.product_id))
        review_keys = {(uid, pid) for (uid, pid) in existing_reviews.all()}
        delivered_q = await db.execute(
            select(Order).where(Order.status == OrderStatus.DELIVERED.value)
        )
        delivered_orders = delivered_q.scalars().all()
        review_count = 0
        for o in delivered_orders:
            items_q = await db.execute(select(OrderItem).where(OrderItem.order_id == o.id))
            for item in items_q.scalars().all():
                variant_q = await db.execute(select(TShirtVariant).where(TShirtVariant.id == item.variant_id))
                v = variant_q.scalar_one()
                key = (o.user_id, v.product_id)
                if key in review_keys:
                    continue
                if random.random() < 0.6:
                    review_keys.add(key)
                    rating, title, content = random.choice(REVIEW_TEMPLATES)
                    db.add(Review(
                        product_id=v.product_id,
                        user_id=o.user_id,
                        order_id=o.id,
                        rating=rating,
                        title=title,
                        content=content,
                        is_verified_purchase=True,
                        is_approved=True,
                        created_at=o.updated_at + timedelta(days=random.randint(1, 14)),
                    ))
                    review_count += 1
        await db.commit()
        print(f"  Reviews: {review_count}")

        # 5) Newsletter subscribers
        existing_subs = await db.execute(select(NewsletterSubscription.email))
        sub_have = {e for (e,) in existing_subs.all()}
        extra_subs = [
            ("daiga.kalniete@example.lv", "footer"),
            ("rihards.berzins@example.lv", "popup"),
            ("vita.ozola@example.lv", "popup"),
            ("edgars.priede@example.lv", "footer"),
            ("baiba.silina@example.lv", "checkout"),
            ("kristine.liepa@example.lv", "popup"),
            ("artis.kalnins@example.lv", "footer"),
            ("inese.zarina@example.lv", "popup"),
        ]
        sub_added = 0
        for email, source in extra_subs + [(c[0], "checkout") for c in CUSTOMERS]:
            if email in sub_have:
                continue
            sub_have.add(email)
            db.add(NewsletterSubscription(email=email, is_active=True, source=source))
            sub_added += 1
        await db.commit()
        print(f"  Newsletter subscribers added: {sub_added}")

        # 5b) Newsletter campaigns
        existing_campaigns = await db.execute(select(NewsletterCampaign.title))
        camp_have = {t for (t,) in existing_campaigns.all()}
        admin = (await db.execute(select(User).where(User.role == UserRole.SUPER_ADMIN.value))).scalars().first()
        product_ids_sample = [str(p.id) for p in list(products.values())[:3]]
        product_ids_json = "[" + ",".join(product_ids_sample) + "]"
        active_sub_count_q = await db.execute(select(NewsletterSubscription).where(NewsletterSubscription.is_active == True))
        active_sub_count = len(active_sub_count_q.scalars().all())

        campaigns_to_seed = [
            {
                "title": "Spring Collection 2026",
                "subject": "🌸 Pavasara kolekcija ir klāt!",
                "intro_text": "Sveiki! Mēs ar prieku paziņojam par mūsu pavasara kolekcijas izlaišanu. Atklājiet jaunās krāsas un Latvijas pilsētu ģerboņus uz mūsu kvalitatīvajiem T-krekliem.",
                "status": CampaignStatus.SENT,
                "days_ago": 21,
            },
            {
                "title": "Liepāja Limited Edition",
                "subject": "Liepājas lauva — limitētā sērija",
                "intro_text": "Tikai īsu brīdi pieejams Liepājas ģerboņa T-krekls īpašā tumši zilā krāsā. Ierobežots daudzums — nepalaid garām!",
                "status": CampaignStatus.SENT,
                "days_ago": 14,
            },
            {
                "title": "Summer Sale Announcement",
                "subject": "☀️ Vasaras izpārdošana — līdz 30% atlaide",
                "intro_text": "Visa kolekcija ar atlaidēm līdz 30%! Ideāls laiks iegādāties Latvijas pilsētu T-kreklu sev vai dāvanai.",
                "status": CampaignStatus.SENT,
                "days_ago": 7,
            },
            {
                "title": "New Daugavpils design",
                "subject": "Daugavpils grifs jaunā izpildījumā",
                "intro_text": "Mēs esam atjaunojuši Daugavpils ģerboņa dizainu. Iepazīstieties ar svaigāko versiju mūsu veikalā.",
                "status": CampaignStatus.DRAFT,
                "days_ago": 2,
            },
            {
                "title": "Latvian Independence Day 2026",
                "subject": "18. novembra svinēšana ar GĒRBOŅI",
                "intro_text": "Latvijas Republikas dibināšanas dienai par godu — īpašā kolekcija un brīva piegāde pasūtījumiem virs €40.",
                "status": CampaignStatus.DRAFT,
                "days_ago": 1,
            },
        ]
        camp_added = 0
        for c in campaigns_to_seed:
            if c["title"] in camp_have:
                continue
            created = now - timedelta(days=c["days_ago"])
            sent_at = created + timedelta(hours=random.randint(1, 8)) if c["status"] == CampaignStatus.SENT else None
            recipients = active_sub_count if c["status"] == CampaignStatus.SENT else 0
            sent_ok = recipients
            db.add(NewsletterCampaign(
                title=c["title"],
                subject=c["subject"],
                intro_text=c["intro_text"],
                featured_product_ids=product_ids_json,
                status=c["status"].value,
                recipient_count=recipients,
                sent_count=sent_ok,
                failed_count=0,
                created_by=admin.id,
                created_at=created,
                sent_at=sent_at,
            ))
            camp_added += 1
        await db.commit()
        print(f"  Newsletter campaigns added: {camp_added}")

        # 6) Drop stock on a few variants so "low stock" alert triggers
        low_picks = random.sample(variants, k=8)
        for v in low_picks:
            v.stock = random.randint(2, 9)
        await db.commit()
        print(f"  Low-stock variants set: {len(low_picks)}")

    print("Done.")


if __name__ == "__main__":
    asyncio.run(seed_demo())
