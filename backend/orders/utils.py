from decimal import Decimal, ROUND_HALF_UP
from datetime import datetime

# ─── Zone definitions ────────────────────────────────────────────────
# Dukan's warehouse is assumed to be in central Lahore (Mall Road area).
# Zones radiate outward; each has a base fee and a per-km-equivalent surcharge.

ZONE_CONFIG = {
    # Zone 1 — Core Lahore (< ~3 km from centre)
    "core": {
        "base_fee": Decimal("40.00"),
        "eta_food": "20-30 mins",
        "eta_standard": "45-60 mins",
    },
    # Zone 2 — Greater Lahore (3-7 km)
    "inner": {
        "base_fee": Decimal("70.00"),
        "eta_food": "30-45 mins",
        "eta_standard": "1-2 hours",
    },
    # Zone 3 — Ring-road fringe (7-12 km)
    "middle": {
        "base_fee": Decimal("100.00"),
        "eta_food": "45-60 mins",
        "eta_standard": "2-3 hours",
    },
    # Zone 4 — Outer Lahore (12-20 km)
    "outer": {
        "base_fee": Decimal("150.00"),
        "eta_food": "60-90 mins",
        "eta_standard": "3-5 hours",
    },
    # Zone 5 — Far outskirts / semi-rural
    "remote": {
        "base_fee": Decimal("220.00"),
        "eta_food": "Not available",
        "eta_standard": "1-2 days",
    },
}

# Map every area to a zone.  Keys are lowercase.
AREA_ZONE_MAP = {
    # ── Zone: core ──
    "mall road": "core", "anarkali": "core", "ichhra": "core", "mozang": "core",
    "mozang chungi": "core", "data darbar": "core", "qartaba chowk": "core",
    "garden town": "core", "shadman": "core", "muslim town": "core",
    "nisbat road": "core", "lower mall": "core", "empress road": "core",

    # ── Zone: inner ──
    "gulberg": "inner", "gulberg iii": "inner", "gulberg 3": "inner",
    "liberty market": "inner", "liberty": "inner", "model town": "inner",
    "faisal town": "inner", "township": "inner", "samanabad": "inner",
    "green town": "inner", "wapda town": "inner", "wapda town phase 1": "inner",
    "iqbal town": "inner", "allama iqbal town": "inner", "cavalry ground": "inner",
    "gulshan-e-ravi": "inner", "gulshan e ravi": "inner", "ferozepur road": "inner",
    "chauburji": "inner",

    # ── Zone: middle ──
    "johar town": "middle", "dha phase 1": "middle", "dha 1": "middle",
    "dha phase 2": "middle", "dha 2": "middle", "dha phase 3": "middle", "dha 3": "middle",
    "askari": "middle", "askari 10": "middle", "askari 11": "middle",
    "nishtar colony": "middle", "kot lakhpat": "middle",
    "thokar niaz baig": "middle", "thokar": "middle", "walton": "middle",
    "harbanspura": "middle",

    # ── Zone: outer ──
    "dha phase 5": "outer", "dha 5": "outer", "dha phase 6": "outer", "dha 6": "outer",
    "dha phase 7": "outer", "dha 7": "outer", "dha phase 8": "outer", "dha 8": "outer",
    "bahria town": "outer", "valencia town": "outer", "valencia": "outer",
    "sabzazar": "outer",

    # ── Zone: remote ──
    "raiwind road": "remote", "barki road": "remote", "shahdara": "remote",
    "baghbanpura": "remote", "manga mandi": "remote", "ferozewala": "remote",
}

# ─── Category-based surcharges ───────────────────────────────────────
# Some product categories are heavier / bulkier / need special handling.
CATEGORY_SURCHARGE = {
    "electronics": Decimal("30.00"),
    "furniture": Decimal("80.00"),
    "appliances": Decimal("50.00"),
    "beverages": Decimal("15.00"),     # heavy liquids
}

# ─── Thresholds & multipliers ────────────────────────────────────────
FREE_DELIVERY_THRESHOLD = Decimal("2500.00")   # free delivery over Rs 2500
HEAVY_ORDER_ITEMS_THRESHOLD = 5                # surcharge if > 5 distinct items
HEAVY_ORDER_SURCHARGE = Decimal("25.00")
PEAK_HOUR_MULTIPLIER = Decimal("1.20")         # 20% surge 11 AM – 2 PM and 6 – 9 PM
NIGHT_SURCHARGE = Decimal("50.00")             # flat surcharge 9 PM – 6 AM
MIN_DELIVERY_FEE = Decimal("35.00")            # never below Rs 35
MAX_DELIVERY_FEE = Decimal("400.00")           # cap at Rs 400


def _resolve_zone(shipping_address: str) -> str:
    """Match an address string to the best zone, defaulting to 'middle'."""
    addr = shipping_address.lower().strip()
    # Try longest match first so "dha phase 1" beats "dha 1"
    for area in sorted(AREA_ZONE_MAP.keys(), key=len, reverse=True):
        if area in addr:
            return AREA_ZONE_MAP[area]
    return "middle"  # sensible default for unknown Lahore addresses


def _is_peak_hour() -> bool:
    """Check if current Pakistan Standard Time falls in peak delivery windows."""
    # Pakistan is UTC+5 — but on the server we just use local time
    hour = datetime.now().hour
    return (11 <= hour <= 13) or (18 <= hour <= 20)


def _is_night() -> bool:
    hour = datetime.now().hour
    return hour >= 21 or hour < 6


def calculate_delivery_info(shipping_address: str, products, quantity_map: dict = None) -> tuple:
    """
    Calculate a realistic delivery fee and ETA for an order on a per-item basis.

    Algorithm:
    1. Resolve customer shipping zone and product origin zone.
    2. If zones match (local delivery), fee is Rs 0.
    3. Otherwise, use higher of customer zone base fee or product base fee.
    4. Apply category, time-of-day surcharges.
    5. Return total aggregated fee and a dictionary of individual item ETAs/fees.
    """
    if quantity_map is None:
        quantity_map = {}

    shipping_zone = _resolve_zone(shipping_address)
    shipping_zone_cfg = ZONE_CONFIG[shipping_zone]

    if not products:
        return Decimal("150.00"), {}

    total_fee = Decimal("0.00")
    item_deliveries = {}
    
    is_night = _is_night()
    is_peak = _is_peak_hour()

    for product in products:
        # 1. Determine product origin zone (store area)
        store_area = product.store.area if product.store and product.store.area else "mall road"
        product_zone = _resolve_zone(store_area)
        
        # 2. Check for free local delivery (same zone)
        if product_zone == shipping_zone:
            item_fee = Decimal("0.00")
        else:
            # 3. Base fee: higher of customer zone fee or product's base fee override
            item_fee = max(shipping_zone_cfg["base_fee"], product.base_delivery_fee)
            
            # 4. Category surcharge
            cat_slug = product.category.slug.lower() if product.category else ""
            if cat_slug in CATEGORY_SURCHARGE:
                item_fee += CATEGORY_SURCHARGE[cat_slug]
                
            # 5. Time-of-day multipliers
            if is_night:
                item_fee += NIGHT_SURCHARGE
            elif is_peak:
                item_fee = (item_fee * PEAK_HOUR_MULTIPLIER).quantize(Decimal("1"), rounding=ROUND_HALF_UP)
                
            # 6. Clamp between MIN and MAX
            if item_fee > Decimal("0.00"):
                item_fee = max(item_fee, MIN_DELIVERY_FEE)
                item_fee = min(item_fee, MAX_DELIVERY_FEE)
                
            item_fee = item_fee.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        # 7. Determine ETA
        dte = product.delivery_time_estimate.lower()
        if "min" in dte or "hour" in dte:
            eta = shipping_zone_cfg["eta_food"]
        else:
            eta = shipping_zone_cfg["eta_standard"]

        item_deliveries[str(product.id)] = {
            "fee": str(item_fee),
            "eta": eta
        }
        total_fee += item_fee

    return total_fee, item_deliveries