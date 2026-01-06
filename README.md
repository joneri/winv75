MODE=development

# Server
PORT=3001
MONGO_URI=mongodb://localhost:27017/winv75
V85_VARIANTS_PER_MODE=3

# Elo seeding (ST points)
ELO_SEED_BASE=10
ELO_SEED_ALPHA=40
ELO_SEED_MIN=1000
ELO_SEED_MAX=1400

# Class weighting
ELO_CLASS_MIN=0.3
ELO_CLASS_MAX=1.4
ELO_CLASS_REF=35000
ELO_K_CLASS_MULTIPLIER=1.1

# Class ELO rating (longer horizon)
RATING_DECAY_DAYS=365

# Form ELO rating (short horizon)
FORM_RATING_DECAY_DAYS=90

# AI ranking weights
AI_RANK_ELO_DIVISOR=100           # Ökad divisor minskar Class Elo-påverkan
AI_RANK_W_FORM=1.0               # Behåll vikt för separat formkurva
AI_RANK_BONUS_SHOE=0.6           # Skobyte bonus höjd från 0.5
AI_RANK_BONUS_FAVORITE_TRACK=0.85 # Favoritbana bonus höjd från 0.75
AI_RANK_BONUS_FAVORITE_SPAR=0.6   # Hästens favoritspår höjd från 0.5
AI_RANK_FORM_ELO_DIVISOR=40       # Form Elo divisor sänkt från 45 (ger större vikt)
AI_RANK_BONUS_BARFOTA_RUNTOM=0.7  # Barfota runt om bonus höjd från 0.6
AI_RANK_BONUS_TRACK_FAVORITE_SPAR=0.5 # Banans favoritspår sänkt från 0.6
AI_RANK_HANDICAP_DIVISOR=40      # Oförändrad
AI_RANK_DEBUG=true             # Inaktivera debug-loggning för optimerad drift
AI_RANK_W_PUBLIC=1.0           # Vikt för V85-spelprocent i composite
AI_RANK_PUBLIC_BASELINE=0.2    # Procentandel där publicTerm går mot 0 (20 %)
AI_RANK_PUBLIC_DIVISOR=0.2     # Hur mycket en procentandel över baseline påverkar (lägre = större effekt)
AI_RANK_PUBLIC_FAV_THRESHOLD=0.45 # Publikfavorit-gräns för pluspoäng och highlight

# Tiering (A/B/C) for spelförslag
AI_RANK_TIER_BY=formElo           # formElo | composite
AI_RANK_TIER_A_WITHIN=5           # A: inom X FormElo-poäng från ledaren
AI_RANK_TIER_B_WITHIN=15          # B: inom Y FormElo-poäng (C = resten)
# If tiering by composite instead
# AI_RANK_TIER_A_WITHIN_COMPOSITE=0.25   # A: inom X kompositpoäng
# AI_RANK_TIER_B_WITHIN_COMPOSITE=0.75   # B: inom Y kompositpoäng

# Raceday AI caching & cron
AI_RACEDAY_CACHE_TTL_MINUTES=120
AI_RACEDAY_CRON=15 6 * * *
AI_RACEDAY_DAYS_AHEAD=3
