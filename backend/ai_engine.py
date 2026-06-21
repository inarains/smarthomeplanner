import math


# ---------------------------------------------------------------------------
# Architectural colour palette sent to frontend
# ---------------------------------------------------------------------------
ROOM_COLORS = {
    "Living Room":    "#dbeafe",
    "Open Kitchen":   "#fef3c7",
    "Closed Kitchen": "#fef3c7",
    "Dining Room":    "#fce7f3",
    "Entrance Hall":  "#e0e7ff",
    "Corridor":       "#f1f5f9",
    "Staircase":      "#e2e8f0",
    "Bedroom":        "#ede9fe",
    "Bathroom":       "#ccfbf1",
    "Powder Room":    "#ccfbf1",
    "Parking":        "#e5e7eb",
    "Garden":         "#dcfce7",
    "Balcony":        "#cffafe",
    "Utility Room":   "#fef9c3",
}


def _color(room_type: str) -> str:
    for key, c in ROOM_COLORS.items():
        if key.lower() in room_type.lower():
            return c
    return "#f8fafc"


# ---------------------------------------------------------------------------
# Main floor-plan generator
# ---------------------------------------------------------------------------
def generate_heuristic_floor_plan(
    length, width, budget, floors, bedrooms, bathrooms,
    kitchen_open, parking, garden
):
    """
    Each floor gets its OWN coordinate grid starting from (0, 0).
    The frontend filters rooms by floor number and renders them independently.

    Floor 1 layout:
    ┌──────────────────────────────────────┐
    │  PARKING (if any)                    │
    ├───────────┬──────┬───────────────────┤
    │           │Entr. │                   │
    │  Living   │Hall  │  Kitchen          │
    │  Room     ├──────┤                   │
    │           │      │  Utility Room     │
    │  Dining   │Corr. │  Powder Room      │
    │  Room     │      │                   │
    ├───────────┴──────┴───────────────────┤
    │  GARDEN (if any)                     │
    └──────────────────────────────────────┘

    Upper floor layout:
    ┌───────────┬──────┬───────────────────┐
    │           │Stair │                   │
    │ Bedroom 1 │case  │  Bedroom 2        │
    │           ├──────┤                   │
    │           │      │                   │
    │ Bedroom 3 │Corr. │  Bathroom 1       │
    │           │      │  Bathroom 2       │
    ├───────────┴──────┴───────────────────┤
    │  BALCONY                             │
    └──────────────────────────────────────┘
    """

    rooms = []

    # Normalise plot to a reasonable rendering grid (20–50 units)
    grid_w = max(24, min(50, length))
    grid_h = max(20, min(40, width))

    # Real area multiplier so displayed "sq ft" matches actual plot
    area_mult = (length * width) / (grid_w * grid_h)

    def add(name, x, y, w, h, floor):
        rooms.append({
            "type": name,
            "area": round(w * h * area_mult),
            "x": round(x, 1), "y": round(y, 1),
            "w": round(w, 1), "h": round(h, 1),
            "floor": floor,
            "color": _color(name),
        })

    # Core building spine dimensions
    corr_w = max(2, min(4, grid_w * 0.08))
    wing_l = round((grid_w - corr_w) / 2, 1)
    wing_r = wing_l
    corr_x = wing_l

    # ================================================================
    #  FLOOR 1 — Ground Floor
    # ================================================================
    y = 0

    # --- Parking strip at top ---
    if parking > 0:
        park_w = min(parking * 10, grid_w)
        park_h = 5
        add("Parking", 0, y, park_w, park_h, 1)
        y += park_h + 0.5

    # --- Main building zone ---
    bld_y = y
    garden_h = 0
    if garden:
        garden_h = max(4, min(8, grid_h * 0.12))

    # Available building height (subtract what's above + garden below)
    bld_h = grid_h - bld_y - garden_h - (0.5 if garden else 0)
    bld_h = max(14, bld_h)

    # Entrance hall
    ent_h = max(3, min(5, bld_h * 0.2))
    add("Entrance Hall", corr_x, bld_y, corr_w, ent_h, 1)

    # Corridor (rest of depth)
    add("Corridor", corr_x, bld_y + ent_h, corr_w, bld_h - ent_h, 1)

    if floors == 1:
        # ----- Single-storey: public top half, private bottom half -----
        public_h = round(bld_h * 0.5, 1)
        private_h = bld_h - public_h

        # Left wing — Living Room (full public height)
        add("Living Room", 0, bld_y, wing_l, public_h, 1)

        # Right wing — Kitchen + Utility
        k_type = "Open Kitchen" if kitchen_open else "Closed Kitchen"
        k_h = round(public_h * 0.6, 1)
        add(k_type, corr_x + corr_w, bld_y, wing_r, k_h, 1)
        add("Utility Room", corr_x + corr_w, bld_y + k_h, wing_r, public_h - k_h, 1)

        # Private zone — bedrooms and bathrooms in left/right wings
        priv_y = bld_y + public_h
        left_y = priv_y
        right_y = priv_y
        max_y = priv_y + private_h

        # Calculate heights so rooms fill the space
        total_left = math.ceil(bedrooms / 2) + math.ceil(bathrooms / 2)
        total_right = bedrooms - math.ceil(bedrooms / 2) + bathrooms - math.ceil(bathrooms / 2)
        left_count = max(1, math.ceil(bedrooms / 2) + (1 if bathrooms > 0 else 0))
        right_count = max(1, bedrooms - math.ceil(bedrooms / 2) + max(0, bathrooms - 1))

        left_room_h = round(private_h / left_count, 1) if left_count else private_h
        right_room_h = round(private_h / right_count, 1) if right_count else private_h

        for i in range(bedrooms):
            if i % 2 == 0:
                h = min(left_room_h, max_y - left_y)
                if h > 2:
                    add(f"Bedroom {i+1}", 0, left_y, wing_l, h, 1)
                    left_y += h
            else:
                h = min(right_room_h, max_y - right_y)
                if h > 2:
                    add(f"Bedroom {i+1}", corr_x + corr_w, right_y, wing_r, h, 1)
                    right_y += h

        for i in range(bathrooms):
            if i % 2 == 0:
                h = min(left_room_h, max_y - left_y)
                if h > 2:
                    add(f"Bathroom {i+1}", 0, left_y, wing_l, h, 1)
                    left_y += h
            else:
                h = min(right_room_h, max_y - right_y)
                if h > 2:
                    add(f"Bathroom {i+1}", corr_x + corr_w, right_y, wing_r, h, 1)
                    right_y += h

    else:
        # ----- Multi-storey: floor 1 is fully public -----
        liv_h = round(bld_h * 0.55, 1)
        add("Living Room", 0, bld_y, wing_l, liv_h, 1)
        add("Dining Room", 0, bld_y + liv_h, wing_l, bld_h - liv_h, 1)

        k_type = "Open Kitchen" if kitchen_open else "Closed Kitchen"
        k_h = round(bld_h * 0.45, 1)
        u_h = round(bld_h * 0.25, 1)
        p_h = bld_h - k_h - u_h
        add(k_type, corr_x + corr_w, bld_y, wing_r, k_h, 1)
        add("Utility Room", corr_x + corr_w, bld_y + k_h, wing_r, u_h, 1)
        add("Powder Room", corr_x + corr_w, bld_y + k_h + u_h, wing_r, p_h, 1)

    # --- Garden strip at bottom ---
    if garden:
        add("Garden", 0, bld_y + bld_h + 0.5, grid_w, garden_h, 1)

    # ================================================================
    #  FLOORS 2+ — Private Floors (each starts at y=0)
    # ================================================================
    if floors > 1:
        beds_placed = 0
        baths_placed = 0

        for f in range(2, floors + 1):
            remaining_f = max(1, floors - f + 1)
            beds_this = math.ceil((bedrooms - beds_placed) / remaining_f)
            baths_this = math.ceil((bathrooms - baths_placed) / remaining_f)

            # Upper floor starts at y=0 with same width as building
            uf_h = bld_h  # same building depth

            # Staircase landing
            stair_h = max(3, min(5, uf_h * 0.18))
            add("Staircase", corr_x, 0, corr_w, stair_h, f)

            # Corridor below staircase
            add("Corridor", corr_x, stair_h, corr_w, uf_h - stair_h, f)

            # Distribute bedrooms + bathrooms into left/right wings
            left_y = 0.0
            right_y = 0.0

            # Calculate room heights to fill the floor evenly
            left_beds = math.ceil(beds_this / 2)
            right_beds = beds_this - left_beds
            left_baths = math.ceil(baths_this / 2)
            right_baths = baths_this - left_baths

            left_total = left_beds + left_baths
            right_total = right_beds + right_baths

            left_h = round(uf_h / max(1, left_total), 1)
            right_h = round(uf_h / max(1, right_total), 1)

            # Left wing
            for _ in range(left_beds):
                if beds_placed >= bedrooms:
                    break
                h = min(left_h, uf_h - left_y)
                if h > 2:
                    add(f"Bedroom {beds_placed+1}", 0, left_y, wing_l, h, f)
                    left_y += h
                beds_placed += 1

            for _ in range(left_baths):
                if baths_placed >= bathrooms:
                    break
                h = min(left_h, uf_h - left_y)
                if h > 2:
                    add(f"Bathroom {baths_placed+1}", 0, left_y, wing_l, h, f)
                    left_y += h
                baths_placed += 1

            # Right wing
            for _ in range(right_beds):
                if beds_placed >= bedrooms:
                    break
                h = min(right_h, uf_h - right_y)
                if h > 2:
                    add(f"Bedroom {beds_placed+1}", corr_x + corr_w, right_y, wing_r, h, f)
                    right_y += h
                beds_placed += 1

            for _ in range(right_baths):
                if baths_placed >= bathrooms:
                    break
                h = min(right_h, uf_h - right_y)
                if h > 2:
                    add(f"Bathroom {baths_placed+1}", corr_x + corr_w, right_y, wing_r, h, f)
                    right_y += h
                baths_placed += 1

            # Balcony at the bottom of each upper floor
            balc_h = max(2, min(3, uf_h * 0.08))
            add("Balcony", 0, uf_h, grid_w, balc_h, f)

    return {"rooms": rooms, "floors": floors}


# ---------------------------------------------------------------------------
# Scoring & Recommendations
# ---------------------------------------------------------------------------
def calculate_scores_and_recommendations(layout_data, budget, style):
    rooms = layout_data.get("rooms", [])
    num_floors = layout_data.get("floors", 1)
    room_types = [r["type"] for r in rooms]

    has_garden   = any("Garden"   in t for t in room_types)
    has_balcony  = any("Balcony"  in t for t in room_types)
    has_utility  = any("Utility"  in t for t in room_types)
    has_open_k   = any("Open Kitchen" in t for t in room_types)
    has_parking  = any("Parking"  in t for t in room_types)
    num_beds     = sum(1 for t in room_types if "Bedroom" in t)
    num_baths    = sum(1 for t in room_types if "Bathroom" in t)

    # --- Space utilisation ---
    space = 70
    space += 8 if has_open_k else 0
    space += 5 if has_utility else 0
    space += 3 * min(num_floors, 3)
    if num_baths >= num_beds:
        space += 5
    if style in ("Modern", "Minimalist"):
        space += 5

    # --- Ventilation ---
    vent = 65
    vent += 15 if has_garden else 0
    vent += 10 if has_balcony else 0
    vent += 5  if has_open_k else 0
    vent += 3  if num_floors >= 2 else 0

    # --- Sustainability ---
    sust = 60
    sust += 15 if has_garden else 0
    sust += 5  if has_utility else 0
    if budget > 200000:
        sust += 15
    elif budget > 100000:
        sust += 8
    if style == "Modern":
        sust += 5

    # --- Smart home readiness ---
    smart = 50
    if budget > 250000:
        smart = 95
    elif budget > 150000:
        smart = 85
    elif budget > 100000:
        smart = 72
    elif budget > 50000:
        smart = 60
    if style == "Luxury":
        smart = min(100, smart + 10)
    if num_floors >= 2:
        smart += 3

    # --- Energy efficiency ---
    energy = (vent + sust) // 2

    # Clamp all to 100
    space  = min(100, space)
    vent   = min(100, vent)
    sust   = min(100, sust)
    smart  = min(100, smart)
    energy = min(100, energy)

    # --- Recommendations ---
    recs = []
    recs.append({"type": "Smart Light",     "location": "Living Room & Bedrooms",     "reason": "Automated circadian lighting reduces energy use and improves sleep quality."})
    recs.append({"type": "Smart Thermostat", "location": "Central Corridor (per floor)", "reason": "Zone-based HVAC control cuts energy bills by up to 25%."})
    recs.append({"type": "Security Camera",  "location": "Entrance Hall & Parking",    "reason": "AI-powered surveillance monitors entry points 24/7."})

    if num_baths >= 1:
        recs.append({"type": "Motion Sensor", "location": "Bathrooms & Corridors", "reason": "Auto-on/off lighting for nighttime safety and convenience."})
    if has_parking:
        recs.append({"type": "EV Charger", "location": "Parking", "reason": "Future-proof your parking with Level 2 EV charging capability."})
    if budget > 120000:
        recs.append({"type": "Solar Panels", "location": "Roof", "reason": "Offset 40-70% of electricity costs with rooftop solar."})
        recs.append({"type": "Smart Blinds", "location": "Living Room & Bedrooms", "reason": "Automated blinds optimise natural light and thermal insulation."})
    if budget > 200000:
        recs.append({"type": "Home Battery", "location": "Utility Room", "reason": "Store excess solar energy for nighttime use and outage resilience."})
    if has_garden:
        recs.append({"type": "Smart Irrigation", "location": "Garden", "reason": "Weather-aware watering reduces water usage by 50%."})
    if num_floors >= 2:
        recs.append({"type": "Intercom System", "location": "Each Floor", "reason": "Whole-home audio/video intercom for multi-storey convenience."})

    return {
        "energy_score":               energy,
        "sustainability_score":       sust,
        "space_utilization_score":    space,
        "ventilation_score":          vent,
        "smart_home_readiness_score": smart,
        "recommendations":           recs,
    }
