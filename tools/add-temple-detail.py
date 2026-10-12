#!/usr/bin/env python3
"""Add the Temple's known features and the excavated approaches to the 3D
Jerusalem model (data/jerusalem3d.json), and the Tyropoeon Valley to the
plan (data/jerusalem.json). Safe to run again: earlier additions are replaced.

The model is generalized (see the file's _note): the Temple platform is drawn
as a rectangle, so these features are placed on the model's own walls, at
their reported positions along them. Sources:
  - Josephus, Jewish War 5.184-227 and Antiquities 15.410-420 (porticoes,
    the warning barrier, the courts and gates)
  - Mishnah Middot 1-2 (the Huldah Gates, the Court of Women, the Nicanor Gate)
  - B. Mazar's and later excavations along the southern and western walls
    (southern steps, Robinson's Arch)
  - Regev et al., PLOS One 2020, on Wilson's Arch: a bridge about 7.5 m wide
    from about 20 BC-AD 20, doubled in width about AD 30-60 (the arch seen today);
    the model shows the narrower bridge
  - The stepped street from the Pool of Siloam: about 600 m long, 8 m wide;
    a coin of AD 30/31 under the pavement means it was finished no earlier
    than then (Szanton et al., 2019)
Heights are in metres above the model's ground; the platform is 6 m.
"""
import json, math
from shapely.geometry import Polygon, LineString, mapping, shape, box
from shapely.ops import unary_union
from shapely import affinity

LAT0 = 31.777
KX = 111320 * math.cos(math.radians(LAT0))   # metres per degree of longitude
KY = 110574                                   # metres per degree of latitude


def to_m(g):
    return affinity.affine_transform(g, [KX, 0, 0, KY, 0, 0])


def to_deg(g):
    return affinity.affine_transform(g, [1 / KX, 0, 0, 1 / KY, 0, 0])


def rect(lng1, lat1, lng2, lat2):
    return box(min(lng1, lng2), min(lat1, lat2), max(lng1, lng2), max(lat1, lat2))


def feat(kind, geom, height, base=0, name=None, **extra):
    p = {'kind': kind, 'height': height, 'base': base, 'added': 'temple-detail'}
    if name:
        p['name'] = name
    p.update(extra)
    return {'type': 'Feature', 'properties': p, 'geometry': mapping(geom)}


def oriented(origin, u, along, out):
    """A rectangle beside a wall: origin and u (unit vector along the wall,
    in metres), from along[0] to along[1] metres along it and out[0] to out[1]
    metres away from it (to the right of u)."""
    n = (u[1], -u[0])
    ox, oy = origin[0] * KX, origin[1] * KY
    pts = []
    for a, o in ((along[0], out[0]), (along[1], out[0]), (along[1], out[1]), (along[0], out[1])):
        pts.append(((ox + a * u[0] + o * n[0]) / KX, (oy + a * u[1] + o * n[1]) / KY))
    return Polygon(pts)


def unit(p, q):
    dx, dy = (q[0] - p[0]) * KX, (q[1] - p[1]) * KY
    l = math.hypot(dx, dy)
    return (dx / l, dy / l), l


def point(origin, u, along, out):
    n = (u[1], -u[0])
    return ((origin[0] * KX + along * u[0] + out * n[0]) / KX, (origin[1] * KY + along * u[1] + out * n[1]) / KY)


def build(model):
    out = []
    poly = lambda kind, name=None: next(shape(f['geometry']) for f in model
                                         if f['properties'].get('kind') == kind and (name is None or f['properties'].get('name') == name))
    # The model's (generalized) platform corners.
    NW, NE, SE, SW = [tuple(c) for c in poly('platform').exterior.coords[:4]]
    south_u, south_len = unit(SW, SE)      # along the southern wall, west to east
    west_u, west_len = unit(SW, NW)        # along the western wall, south to north

    # Court of Women and the Nicanor Gate, on the edge it shares with the inner court.
    israel = poly('court', 'Court of Israel and the priests')
    women = poly('court', 'Court of Women')
    shared = [c for c in list(israel.exterior.coords)[:-1] if c in list(women.exterior.coords)]
    (ex1, ey1), (ex2, ey2) = sorted(shared, key=lambda c: c[1])[:2]
    mid = ((ex1 + ex2) / 2, (ey1 + ey2) / 2)
    eu, _ = unit((ex1, ey1), (ex2, ey2))
    out.append(feat('gate', oriented(mid, eu, (-9, 9), (-4, 4)), 28, 8, 'Nicanor Gate'))

    # The warning barrier (soreg) around the inner courts: about 1.5 m high,
    # with notices in Greek and Latin forbidding Gentiles to go further.
    inner = to_m(unary_union([israel, women]))
    out.append(feat('barrier', to_deg(inner.buffer(11, join_style=2).difference(inner.buffer(10, join_style=2))), 7.5, 6, 'Warning barrier'))

    # The Huldah Gates in the southern wall (the real wall is 281 m long; the
    # Double Gate is about 43% of the way from the west, the Triple Gate about
    # 70 m east of it), and the broad steps below them, to the south.
    frac = lambda f: f * south_len
    for f, name, w in ((0.43, 'Double Gate', 13), (0.70, 'Triple Gate', 15)):
        a = frac(f)
        out.append(feat('gate', oriented(SW, south_u, (a - w / 2, a + w / 2), (-1, 3)), 5.5, 0, name))
    a = frac(0.43)
    for k, h in enumerate((3, 2, 1)):
        out.append(feat('stair', oriented(SW, south_u, (a - 32, a + 32), (3 + 12 * k, 15 + 12 * k)), h, 0, 'Southern steps' if k == 0 else None))
    a = frac(0.70)
    for k, h in enumerate((2, 1)):
        out.append(feat('stair', oriented(SW, south_u, (a - 18, a + 18), (3 + 11 * k, 14 + 11 * k)), h, 0))

    # Robinson's Arch: about 12 m north of the south-west corner, a span of about
    # 13 m out from the wall carrying a stairway that turned south to the street.
    # (The western wall runs south to north, so "out" to its left is west: negative.)
    out.append(feat('arch', oriented(SW, west_u, (6, 19), (-15, 0)), 6, 4, "Robinson's Arch"))
    for k, h in enumerate((5, 4, 3, 2, 1)):
        a2 = 19 - 10 * k
        out.append(feat('stair', oriented(SW, west_u, (a2 - 10, a2), (-27, -15)), h, 0))
    foot = point(SW, west_u, -31, -21)

    # Wilson's Arch: the bridge west across the Tyropoeon to the Upper City,
    # roughly 150 m north of the south-west corner (approximate).
    out.append(feat('arch', oriented(SW, west_u, (146, 153.5), (-60, 0)), 6, 4, "Wilson's Arch"))

    # The stepped street from the Pool of Siloam up the Tyropoeon to the foot
    # of Robinson's Arch.
    line = LineString([(35.23400, 31.77066), (35.23405, 31.77200), (35.23418, 31.77350), (35.23436, 31.77480), foot])
    out.append(feat('street', to_deg(to_m(line).buffer(4, cap_style=2, join_style=2)), 0.5, 0, 'Stepped street'))
    labels = {'huldah': point(SW, south_u, frac(0.70), -2), 'southsteps': point(SW, south_u, frac(0.43), 22),
              'robinson': point(SW, west_u, 12, -8), 'wilson': point(SW, west_u, 150, -40),
              'nicanor': mid, 'soreg': point(SW, west_u, 0, 0)}
    return out, labels


def main():
    p = 'data/jerusalem3d.json'
    d = json.load(open(p))
    d['features'] = [f for f in d['features'] if f['properties'].get('added') != 'temple-detail']
    # Name the two inner courts that were drawn without names.
    for f in d['features']:
        pr = f['properties']
        if pr.get('kind') == 'court' and not pr.get('name'):
            xs = [c[0] for c in f['geometry']['coordinates'][0]]
            pr['name'] = 'Court of Women' if min(xs) > 35.2357 else 'Court of Israel and the priests'
    model = [f for f in d['features']]
    new, labels = build(model)
    for k, v in labels.items():
        print('  label', k, round(v[0], 5), round(v[1], 5))
    # Clear the illustrative houses from under the new features (2 m margin).
    keep_out = to_deg(to_m(unary_union([shape(f['geometry']) for f in new])).buffer(2))
    before = len(d['features'])
    d['features'] = [f for f in d['features']
                     if not (f['properties'].get('kind') == 'house' and shape(f['geometry']).intersects(keep_out))]
    removed = before - len(d['features'])
    d['features'].extend(new)
    extra = (' Added: the Nicanor Gate, the warning barrier, the Huldah Gates and southern steps, Robinson\'s and'
             ' Wilson\'s Arches and the stepped street, from Josephus, the Mishnah and excavation reports'
             ' (tools/add-temple-detail.py); they sit on the model\'s generalized walls at their reported positions.')
    d['_note'] = d['_note'].split(' Added:')[0] + extra
    json.dump(d, open(p, 'w'), separators=(',', ':'))

    # The Tyropoeon Valley ("valley of the cheesemakers", Josephus), which ran
    # through the city between the Upper City and the Temple Mount; it is
    # largely filled in today. Shaded as a minor valley on the plan.
    q = 'data/jerusalem.json'
    j = json.load(open(q))
    j['features'] = [f for f in j['features'] if f['properties'].get('name') != 'Tyropoeon Valley']
    j['features'].append({'type': 'Feature', 'properties': {'kind': 'valley-minor', 'name': 'Tyropoeon Valley'},
                          'geometry': {'type': 'LineString', 'coordinates': [
                              [35.2302, 31.7815], [35.2324, 31.7795], [35.2337, 31.7777], [35.2341, 31.7760],
                              [35.2341, 31.7740], [35.2340, 31.7720], [35.2341, 31.7700]]}})
    json.dump(j, open(q, 'w'), separators=(',', ':'))
    print(len(new), 'features added;', removed, 'illustrative houses cleared')


if __name__ == '__main__':
    main()
