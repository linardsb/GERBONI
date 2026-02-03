"""
Seed script to populate the database with initial product data.
Run with: python -m app.seed
"""
import asyncio
from decimal import Decimal
from sqlalchemy import select

from .database import async_session_maker, init_db
from .models import Product, TShirtVariant

# Latvian cities with their coats of arms
CITIES = [
    {
        "city_name": "Riga",
        "city_name_lv": "Rīga",
        "coat_of_arms_image": "riga.svg",
        "description": "The capital of Latvia features a coat of arms with two towers, a lion's head, and crossed keys - symbols of the city's Hanseatic heritage.",
        "description_lv": "Latvijas galvaspilsētas ģerbonī attēloti divi torņi, lauvas galva un sakrustoti atslēgas - Hanzas mantojuma simboli.",
    },
    {
        "city_name": "Daugavpils",
        "city_name_lv": "Daugavpils",
        "coat_of_arms_image": "daugavpils.svg",
        "description": "Latvia's second-largest city displays a griffin in its coat of arms, representing strength and vigilance.",
        "description_lv": "Latvijas otrajā lielākajā pilsētā ģerbonī attēlots grifs, kas simbolizē spēku un modrību.",
    },
    {
        "city_name": "Jelgava",
        "city_name_lv": "Jelgava",
        "coat_of_arms_image": "jelgava.svg",
        "description": "The historic capital of Courland features a moose head, reflecting the region's rich wildlife heritage.",
        "description_lv": "Kurzemes vēsturiskās galvaspilsētas ģerbonī attēlota alņa galva, atspoguļojot reģiona bagāto savvaļas mantojumu.",
    },
    {
        "city_name": "Jekabpils",
        "city_name_lv": "Jēkabpils",
        "coat_of_arms_image": "jekabpils.svg",
        "description": "This Daugava river city features a stag in its coat of arms, symbolizing nobility and the surrounding forests.",
        "description_lv": "Šīs Daugavas pilsētas ģerbonī attēlots briedis, kas simbolizē cēlumu un apkārtējos mežus.",
    },
    {
        "city_name": "Jurmala",
        "city_name_lv": "Jūrmala",
        "coat_of_arms_image": "jurmala.svg",
        "description": "The famous resort city displays a mermaid, representing its connection to the Baltic Sea and beaches.",
        "description_lv": "Slavenajā kūrortpilsētā ģerbonī attēlota nāra, kas simbolizē saikni ar Baltijas jūru un pludmalēm.",
    },
    {
        "city_name": "Liepaja",
        "city_name_lv": "Liepāja",
        "coat_of_arms_image": "liepaja.svg",
        "description": "This port city features a lion, representing courage and the city's maritime trading history.",
        "description_lv": "Šīs ostas pilsētas ģerbonī attēlots lauva, kas simbolizē drosmi un pilsētas jūras tirdzniecības vēsturi.",
    },
    {
        "city_name": "Ogre",
        "city_name_lv": "Ogre",
        "coat_of_arms_image": "ogre.svg",
        "description": "Named after the Ogre River, the city's coat of arms features an oak tree, symbolizing strength and longevity.",
        "description_lv": "Pilsēta nosaukta Ogres upes vārdā, ģerbonī attēlots ozols, kas simbolizē spēku un ilgmūžību.",
    },
    {
        "city_name": "Rezekne",
        "city_name_lv": "Rēzekne",
        "coat_of_arms_image": "rezekne.svg",
        "description": "The heart of Latgale features a griffin, representing the proud heritage of eastern Latvia.",
        "description_lv": "Latgales sirdī ģerbonī attēlots grifs, kas simbolizē lepno Austrumlatvijas mantojumu.",
    },
    {
        "city_name": "Valmiera",
        "city_name_lv": "Valmiera",
        "coat_of_arms_image": "valmiera.svg",
        "description": "This Vidzeme city displays a wolf's head, reflecting the wild forests that once surrounded the settlement.",
        "description_lv": "Šīs Vidzemes pilsētas ģerbonī attēlota vilka galva, atspoguļojot savvaļas mežus, kas reiz apņēma apmetni.",
    },
    {
        "city_name": "Ventspils",
        "city_name_lv": "Ventspils",
        "coat_of_arms_image": "ventspils.svg",
        "description": "This ice-free port city features a bull or horn, symbolizing trade and maritime prosperity.",
        "description_lv": "Šīs neaizsalstošās ostas pilsētas ģerbonī attēlots vērsis vai rags, kas simbolizē tirdzniecību un jūras labklājību.",
    },
]

# T-shirt options
COLORS = ["Black", "White", "Navy", "Gray", "Red", "Green"]
SIZES = ["XS", "S", "M", "L", "XL", "XXL"]

# Base price - varies slightly by size
SIZE_PRICES = {
    "XS": Decimal("24.99"),
    "S": Decimal("24.99"),
    "M": Decimal("24.99"),
    "L": Decimal("26.99"),
    "XL": Decimal("26.99"),
    "XXL": Decimal("28.99"),
}


async def seed_database():
    await init_db()

    async with async_session_maker() as db:
        # Check if already seeded
        result = await db.execute(select(Product).limit(1))
        if result.scalar_one_or_none():
            print("Database already seeded. Skipping...")
            return

        print("Seeding database...")

        for city_data in CITIES:
            # Create product
            product = Product(**city_data)
            db.add(product)
            await db.flush()

            # Create variants for each color/size combination
            for color in COLORS:
                for size in SIZES:
                    sku = f"{city_data['city_name'][:3].upper()}-{color[:3].upper()}-{size}"
                    variant = TShirtVariant(
                        product_id=product.id,
                        color=color,
                        size=size,
                        price=SIZE_PRICES[size],
                        stock=100,
                        sku=sku,
                    )
                    db.add(variant)

            print(f"  Added {city_data['city_name']} with {len(COLORS) * len(SIZES)} variants")

        await db.commit()
        print(f"Seeded {len(CITIES)} products with {len(CITIES) * len(COLORS) * len(SIZES)} total variants")


if __name__ == "__main__":
    asyncio.run(seed_database())
