#!/usr/bin/env python3
"""Build data/rome.json (Rome's empire at two moments) and data/land-wide.json.

Sources (download first, then pass their folder):
  - Ancient World Mapping Center (AWMC) geodata, ODbL:
      Cultural-Data/political_shading/roman_empire_ce_117_extent/roman_empire_ce_117_extent.geojson
      Cultural-Data/political_shading/herod/herods_kingdom.geojson
    https://github.com/AWMC/geodata
  - Natural Earth 1:50m land, public domain: geojson/ne_50m_land.geojson
    https://github.com/nvkelso/natural-earth-vector

AWMC publishes the empire at AD 117, not under Augustus. This script starts
from the AD 117 extent, removes what was added after Augustus, and marks the
kingdoms that were ruled for Rome by allied kings. The cut lines follow the
rivers and coasts that formed the frontiers, simplified; at the scale the
atlas shows the whole empire (several kilometres per pixel) they are close,
but they are approximate and the atlas says so.

Two moments:
  birth     about 4 BC, end of Herod the Great's reign (Luke 2:1; Matthew 2:1)
  ministry  about AD 28, fifteenth year of Tiberius (Luke 3:1)

Usage: python3 tools/make-rome.py AWMC_DIR NATURAL_EARTH_DIR
"""
import json, sys
from shapely.geometry import shape, mapping, Polygon, box
from shapely.ops import unary_union

awmc, ne = sys.argv[1], sys.argv[2]
P = awmc + '/Cultural-Data/political_shading/'
load = lambda f: unary_union([shape(x['geometry']) for x in json.load(open(f))['features'] if x['geometry']])
extent117 = load(P + 'roman_empire_ce_117_extent/roman_empire_ce_117_extent.geojson').buffer(0)
herod = load(P + 'herod/herods_kingdom.geojson').buffer(0)

# ---- territory added after Augustus (removed) ----
later = unary_union([
    box(-11, 49.8, 2.6, 61),                                         # Britain (AD 43)
    Polygon([(21.3, 44.8), (22.6, 44.65), (23.4, 43.85), (25.0, 43.62), (26.4, 44.05),
             (27.3, 44.12), (28.1, 45.2), (29.8, 45.4), (30.5, 48.5), (21.0, 48.5)]),   # Dacia, north of the Danube (AD 106)
    Polygon([(8.2, 50.4), (8.45, 49.9), (8.55, 49.0), (8.2, 48.95), (7.6, 47.6), (8.6, 47.55),
             (10.8, 48.6), (10.6, 49.3), (9.7, 50.3)]),                                 # Agri Decumates, east of the upper Rhine (Flavian)
    Polygon([(32.6, 31.2), (34.25, 31.32), (35.45, 31.1), (35.55, 31.4), (36.4, 31.45),
             (36.6, 32.4), (37.6, 32.4), (39.5, 30.5), (39.5, 24.0), (32.6, 27.5)]),    # Arabia Petraea and Sinai: Nabataean (AD 106)
    Polygon([(38.35, 42.5), (38.1, 39.9), (38.3, 37.1), (38.55, 36.2), (39.4, 35.6),
             (39.6, 33.6), (38.9, 32.6), (48.0, 30.0), (48.0, 42.5)]),                  # Armenia and Mesopotamia, east of the Euphrates (Trajan)
])
empire = extent117.difference(later).buffer(0)

# ---- kingdoms ruled for Rome by allied kings ----
mauretania = box(-10, 27, 6.4, 37.2)                                 # Juba II; province AD 40
thrace = Polygon([(23.9, 40.85), (24.0, 41.65), (24.6, 42.45), (26.4, 42.85), (27.9, 42.8),
                  (28.2, 41.9), (29.2, 41.25), (28.0, 40.9), (26.5, 40.55), (25.6, 40.85)])  # Odrysian kings; province AD 46
cappadocia = Polygon([(33.5, 37.4), (34.0, 39.9), (36.1, 40.15), (38.2, 40.0), (38.35, 38.4),
                      (37.6, 38.15), (36.3, 37.65), (34.6, 37.35)])                  # Archelaus of Cappadocia; province AD 17
commagene = Polygon([(37.2, 37.35), (37.6, 38.15), (38.35, 38.4), (38.45, 37.1), (37.85, 36.95)])  # province AD 17
pontus = Polygon([(36.1, 40.15), (36.3, 41.6), (39.0, 41.25), (40.6, 41.1), (40.4, 40.0), (38.2, 40.0)])  # Polemon's Pontus, Armenia Minor
lycia = Polygon([(28.9, 36.55), (29.25, 37.05), (30.2, 37.05), (30.75, 36.75), (30.5, 36.1), (29.2, 36.1)])  # Lycian League; province AD 43

# Herod's sons after 4 BC (the atlas's own territory outlines, js/scenes.js ZONES)
antipas = unary_union([
    Polygon([(35.12, 32.62), (35.30, 32.56), (35.48, 32.56), (35.56, 32.62), (35.58, 32.70), (35.60, 32.80), (35.618, 32.893), (35.622, 32.93), (35.615, 33.00), (35.58, 33.10), (35.40, 33.12), (35.22, 33.08), (35.17, 32.95), (35.15, 32.80)]),
    Polygon([(35.55, 32.36), (35.70, 32.30), (35.78, 32.05), (35.80, 31.85), (35.75, 31.60), (35.68, 31.42), (35.57, 31.42), (35.55, 31.60), (35.53, 31.80), (35.55, 32.10)]),
])
philip = Polygon([(35.618, 32.893), (35.622, 32.93), (35.615, 33.00), (35.58, 33.10), (35.62, 33.30), (35.80, 33.38), (36.10, 33.32), (36.60, 33.10), (36.75, 32.75), (36.30, 32.62), (35.95, 32.72), (35.70, 32.78), (35.64, 32.82), (35.63, 32.89)])

def part(geom, region):
    return geom.intersection(region).buffer(0)

def clean(g, tol=0.03):
    g = g.buffer(0).simplify(tol, preserve_topology=True)
    keep = [p for p in (g.geoms if hasattr(g, 'geoms') else [g]) if p.area > 0.002]
    return unary_union(keep)

feats = []
def add(era, kind, name, geom):
    g = clean(geom)
    if not g.is_empty:
        feats.append({'type': 'Feature', 'properties': {'era': era, 'kind': kind, 'name': name}, 'geometry': mapping(g)})

# About 4 BC
clients_birth = {
    'Mauretania': part(empire, mauretania), 'Thrace': part(empire, thrace),
    'Cappadocia': part(empire, cappadocia), 'Commagene': part(empire, commagene),
    'Pontus and Lesser Armenia': part(empire, pontus), 'Lycia': part(empire, lycia),
    'Herod’s kingdom': herod,
}
add('birth', 'province', 'Roman provinces', empire.difference(unary_union(list(clients_birth.values()))))
for n, g in clients_birth.items(): add('birth', 'client', n, g)

# About AD 28
herodsons = unary_union([antipas, philip]).intersection(herod.buffer(0.15))
clients_ministry = {
    'Mauretania': part(empire, mauretania), 'Thrace': part(empire, thrace),
    'Pontus and Lesser Armenia': part(empire, pontus), 'Lycia': part(empire, lycia),
    'Herod Antipas': antipas, 'Philip': philip,
}
add('ministry', 'province', 'Roman provinces', unary_union([empire, herod]).difference(unary_union(list(clients_ministry.values()))))
for n, g in clients_ministry.items(): add('ministry', 'client', n, g)

json.dump({'type': 'FeatureCollection', 'features': feats}, open('data/rome.json', 'w'), separators=(',', ':'))

# A plain land outline for the views that show the whole empire.
land = load(ne + '/geojson/ne_50m_land.geojson').intersection(box(-14, 17, 50, 60))
land = clean(land, 0.02)
json.dump({'type': 'FeatureCollection', 'features': [{'type': 'Feature', 'properties': {}, 'geometry': mapping(land)}]},
          open('data/land-wide.json', 'w'), separators=(',', ':'))
print('rome.json', len(feats), 'features;', 'land-wide.json written')
