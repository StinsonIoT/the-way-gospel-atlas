// The Way — scene data.
// Every place carries a certainty type. Routes are schematic arcs between
// endpoints the text names; they never follow modern roads. Narrative links
// mark movement the text implies but does not describe.

window.WAY = (function () {
  // ---------- Light: one palette per moment of the story ----------
  const PALETTES = {
    night:   { sea: '#0F1A1C', land: '#1B2624', coast: '#3E504B', lake: '#132226', river: '#2E4A4B', txt: '#F1E9DA', muted: '#A9B2AA', accent: '#E0A458', trad: '#A9C3DA', card: 'dark' },
    day:     { sea: '#C9D8D3', land: '#E9DFCB', coast: '#8FA8A0', lake: '#BCD1CC', river: '#88AAB0', txt: '#1C2A25', muted: '#4C5A54', accent: '#9A4E2A', trad: '#2F4F6B', card: 'light' },
    dusk:    { sea: '#283338', land: '#2E302B', coast: '#45514E', lake: '#1E2A2D', river: '#3E5556', txt: '#F1E9DA', muted: '#C9C3B2', accent: '#E0A458', trad: '#A9C3DA', card: 'dusk' },
    evening: { sea: '#283338', land: '#2B2A25', coast: '#45514E', lake: '#1E2A2D', river: '#4D5654', txt: '#F1E9DA', muted: '#C9C3B2', accent: '#E0A458', trad: '#A9C3DA', card: 'dusk' },
    night2:  { sea: '#141B1E', land: '#1A2124', coast: '#2F3D3B', lake: '#141B1E', river: '#3E5257', txt: '#EAE6DC', muted: '#B9C0BE', accent: '#E0A458', trad: '#A9C3DA', card: 'dark' },
    deep:    { sea: '#0B1012', land: '#0E1416', coast: '#26363A', lake: '#0B1012', river: '#26363A', txt: '#EAE6DC', muted: '#A3ADAE', accent: '#E0A458', trad: '#A9C3DA', card: 'dark' },
    predawn: { sea: '#232B30', land: '#2A3238', coast: '#4E5E66', lake: '#232B30', river: '#4E5E66', txt: '#E6E4DE', muted: '#9AA3A6', accent: '#D9A070', trad: '#A9C3DA', card: 'slate' },
    noon:    { sea: '#D3DFDA', land: '#EFE6D2', coast: '#A9BFB8', lake: '#D3DFDA', river: '#B5C6C0', txt: '#1C2A25', muted: '#4C5A54', accent: '#9A4E2A', trad: '#2F4F6B', card: 'light' },
    dark:    { sea: '#110F0D', land: '#15120F', coast: '#2A251F', lake: '#110F0D', river: '#2A251F', txt: '#E9E1D2', muted: '#A39886', accent: '#D98E5E', trad: '#6E7F8C', card: 'ember' },
    dawn:    { sea: '#D3DFDA', land: '#F3EADA', coast: '#A9BFB8', lake: '#D3DFDA', river: '#A9BFB8', txt: '#1C2A25', muted: '#4C5A54', accent: '#B4532A', trad: '#2F4F6B', card: 'dawn' },
    bright:  { sea: '#D3DFDA', land: '#F1E8D6', coast: '#A9BFB8', lake: '#D3DFDA', river: '#A9C3C6', txt: '#1C2A25', muted: '#4C5A54', accent: '#B4532A', trad: '#2F4F6B', card: 'dawn' }
  };

  // ---------- Places ----------
  // type: named (the text names the town; dot is an approximate locator)
  //       trad (identified by later tradition, not the text)
  //       proposal (a later proposal)
  //       area / region / water (map labels only)
  const PLACES = {
    nazareth:   { lng: 35.3035, lat: 32.6996, label: 'Nazareth', type: 'named', side: 'left' },
    capernaum:  { lng: 35.5751, lat: 32.8807, label: 'Capernaum', type: 'named', side: 'left' },
    jerusalem:  { lng: 35.2345, lat: 31.7767, label: 'Jerusalem', type: 'named', side: 'left' },
    bethlehem:  { lng: 35.2007, lat: 31.7054, label: 'Bethlehem', type: 'named', side: 'left' },
    star:       { lng: 35.2007, lat: 31.7054, label: 'Bethlehem', type: 'star', side: 'right' },
    jericho:    { lng: 35.4440, lat: 31.8570, label: 'Jericho', type: 'named', side: 'right' },
    bethany:    { lng: 35.2614, lat: 31.7713, label: 'Bethany', type: 'named', side: 'right' },
    baptism:    { lng: 35.5497, lat: 31.8389, label: 'Baptism site', note: 'traditional', type: 'trad', side: 'right' },
    cenacle:    { lng: 35.2290, lat: 31.7718, label: 'Upper room', note: 'traditional', type: 'trad', side: 'right' },
    gethsemane: { lng: 35.2397, lat: 31.7794, label: 'Gethsemane', note: 'traditional', type: 'trad', side: 'right' },
    sepulchre:  { lng: 35.2296, lat: 31.7784, label: 'Holy Sepulchre', note: 'traditional', type: 'trad', side: 'right' },
    gardentomb: { lng: 35.2302, lat: 31.7838, label: 'Garden Tomb', note: 'later proposal', type: 'proposal', side: 'right' },
    galilee:    { lng: 35.24, lat: 32.97, label: 'Galilee', type: 'region' },
    samaria:    { lng: 35.20, lat: 32.26, label: 'Samaria', type: 'region' },
    judea:      { lng: 35.02, lat: 31.55, label: 'Judea', type: 'region' },
    wildlabel:  { lng: 35.33, lat: 31.70, label: 'Wilderness', type: 'area' },
    olives:     { lng: 35.2428, lat: 31.7754, label: 'Mount of Olives', type: 'area' },
    templelbl:  { lng: 35.2352, lat: 31.7784, label: 'Temple courts', type: 'area' },
    kidron:     { lng: 35.2376, lat: 31.7745, label: 'Kidron Valley', type: 'water' },
    sog:        { lng: 35.59, lat: 32.80, label: 'Sea of Galilee', type: 'water' },
    deadsea:    { lng: 35.50, lat: 31.50, label: 'Dead Sea', type: 'water' },
    ring1:      { lng: 35.2345, lat: 31.62, label: 'in Jerusalem', type: 'ring' },
    ring2:      { lng: 35.2345, lat: 32.42, label: 'in all Judea and Samaria', type: 'ring' },
    ring3:      { lng: 35.2345, lat: 34.45, label: 'and to the ends of the earth', type: 'ring' }
  };

  // ---------- Geographic areas (drawn as dashed regions) ----------
  // r in metres. These mark "the area is named; the exact site is unknown".
  const AREAS = {
    wilderness: { lng: 35.33, lat: 31.70, r: 9000 },
    citysites:  { lng: 35.2310, lat: 31.7745, r: 650 },
    nearcity:   { lng: 35.2299, lat: 31.7811, r: 420 },
    ring1:      { lng: 35.2345, lat: 31.7767, r: 9000, ring: true },
    ring2:      { lng: 35.2345, lat: 31.7767, r: 72000, ring: true },
    ring3:      { lng: 35.2345, lat: 31.7767, r: 330000, ring: true }
  };

  // ---------- Routes ----------
  // kind 'route': schematic recorded movement (dashed, accent colour).
  // kind 'link': narrative connection, travel not described (grey dots).
  // Bezier control points only shape a smooth arc; they are not waypoints.
  const ROUTES = {
    'naz-beth': { kind: 'route', bez: [[35.3035, 32.6996], [35.42, 32.30], [35.35, 31.95], [35.2007, 31.7054]] },
    'jer-bny':  { kind: 'route', bez: [[35.4440, 31.8570], [35.39, 31.83], [35.32, 31.79], [35.2614, 31.7713]] },
    'entry':    { kind: 'route', bez: [[35.2605, 31.7716], [35.2530, 31.7770], [35.2450, 31.7800], [35.2392, 31.7791]] },
    'olivet':   { kind: 'route', bez: [[35.2290, 31.7718], [35.2335, 31.7726], [35.2378, 31.7758], [35.2395, 31.7790]] },
    'arrest':   { kind: 'link', bez: [[35.2360, 31.7784], [35.2372, 31.7788], [35.2382, 31.7791], [35.2393, 31.7793]] },
    'led':      { kind: 'link', bez: [[35.2393, 31.7790], [35.2375, 31.7778], [35.2360, 31.7768], [35.2342, 31.7760]] },
    'ledout':   { kind: 'link', bez: [[35.2306, 31.7752], [35.2304, 31.7760], [35.2302, 31.7768], [35.2300, 31.7778]] }
  };

  // ---------- Steps (one per screen of scroll) ----------
  // view: [[west, south], [east, north]] the camera fits on screen.
  // show: places/areas/routes visible; plan: 0..1 strength of the
  // historical Jerusalem layer; temple: highlight the temple courts.
  const STEPS = [
    { id: 'title', ch: 'The Way', pal: 'night', view: [[34.75, 31.15], [35.85, 33.15]], plan: 0,
      show: ['star', 'galilee', 'samaria', 'judea', 'sog', 'deadsea'], kind: 'title' },

    { id: 'land', ch: 'The land', pal: 'day', view: [[34.95, 31.62], [35.72, 32.95]], plan: 0,
      show: ['nazareth', 'capernaum', 'jerusalem', 'bethlehem', 'galilee', 'samaria', 'judea', 'sog', 'deadsea'],
      kicker: 'The land', title: 'Galilee to Judea, <em>on foot.</em>',
      text: 'Most of the story unfolds between the Sea of Galilee and Jerusalem, about 100 km apart in a straight line.' },

    { id: 'marks', ch: 'How to read the map', pal: 'day', view: [[35.08, 31.62], [35.70, 31.93]], plan: 0,
      show: ['jericho', 'bethlehem', 'jerusalem', 'baptism', 'wilderness', 'wildlabel', 'deadsea'],
      kicker: 'Before you begin', title: 'Every mark says <em>how sure</em> we are.', kind: 'legend' },

    { id: 's01', ch: 'I · Origins', pal: 'day', view: [[34.95, 31.62], [35.65, 32.78]], plan: 0,
      show: ['nazareth', 'bethlehem', 'jerusalem', 'naz-beth', 'galilee', 'samaria', 'sog', 'deadsea'],
      kicker: 'Nazareth → Bethlehem', ref: ['Luke 2:1–7', 'luke', 2],
      title: 'The journey to <em>Bethlehem.</em>',
      text: 'Joseph travels there with Mary, and she gives birth to her firstborn son. Luke names no road, so the line is schematic.',
      chips: ['named', 'route'] },

    { id: 'hw', ch: 'VI · Holy Week', pal: 'dusk', view: [[35.14, 31.73], [35.49, 31.88]], plan: 0,
      show: ['jericho', 'bethany', 'jerusalem', 'jer-bny', 'wildlabel', 'deadsea'],
      kicker: 'VI · Holy Week', title: 'Holy <em>Week.</em>', kind: 'chapter',
      text: 'From Jericho the road goes up toward Bethany and Jerusalem. Mark gives six of his sixteen chapters to these last days.',
      markers: [['Six days before the Passover', 'John 12:1'], ['The next day', 'John 12:12'], ['Two days before the Passover', 'Mark 14:1'], ['First day of Unleavened Bread', 'Mark 14:12'], ['The day of Preparation', 'Mark 15:42'], ['First day of the week', 'Mark 16:2']] },

    { id: 'anoint', ch: 'VI · Holy Week', pal: 'dusk', view: [[35.24, 31.765], [35.272, 31.78]], plan: 0.4,
      show: ['bethany', 'olives'],
      kicker: 'Six days before the Passover', ref: ['John 12:1–8', 'john', 12],
      title: 'Anointed <em>at Bethany.</em>',
      text: 'At a dinner, Mary anoints Jesus’ feet with costly perfume. Judas objects; Jesus connects her act with His burial.',
      chips: ['named'] },

    { id: 'entry', ch: 'VI · Holy Week', pal: 'day', view: [[35.228, 31.766], [35.274, 31.786]], plan: 1,
      show: ['bethany', 'olives', 'templelbl', 'kidron', 'entry'],
      kicker: 'Mount of Olives → Jerusalem', ref: ['Luke 19:28–44', 'luke', 19],
      title: 'The king <em>enters Jerusalem.</em>',
      text: 'Jesus rides a colt down toward the city as the crowd praises God. When He sees the city, He weeps over it. No gate or road is named.',
      chips: ['route', 'recon'] },

    { id: 'temple', ch: 'VI · Holy Week', pal: 'day', view: [[35.2322, 31.7748], [35.2382, 31.7816]], plan: 1, temple: 1,
      show: ['templelbl', 'kidron'],
      kicker: 'The next day · temple courts', ref: ['Mark 11:15–18', 'mark', 11],
      title: 'A house <em>of prayer.</em>',
      text: 'Jesus overturns the money changers’ tables and teaches that the temple is to be a house of prayer for all nations.',
      chips: ['recon'] },

    { id: 'upper', ch: 'VI · Holy Week', pal: 'evening', view: [[35.2262, 31.7690], [35.2418, 31.7812]], plan: 1,
      show: ['cenacle', 'templelbl', 'kidron', 'olives'],
      kicker: 'Unleavened Bread · evening', ref: ['Mark 14:12–26', 'mark', 14],
      title: 'Bread and <em>the cup.</em>',
      text: 'In a furnished upper room, Jesus shares the Passover meal with the Twelve and gives them bread and the cup.',
      chips: ['trad'] },

    { id: 'kidron', ch: 'VI · Holy Week', pal: 'night2', view: [[35.2262, 31.7690], [35.2455, 31.7815]], plan: 1,
      show: ['cenacle', 'gethsemane', 'kidron', 'olives', 'templelbl', 'olivet'],
      kicker: 'That night', ref: ['Mark 14:26 · John 18:1', 'john', 18],
      title: 'Out to the <em>Mount of Olives.</em>',
      text: 'After a hymn they go out. John says they cross the Kidron Valley to a garden. The path is drawn, not mapped.',
      chips: ['route', 'trad'] },

    { id: 'pray', ch: 'VI · Holy Week', pal: 'deep', view: [[35.2378, 31.7781], [35.2412, 31.7806]], plan: 1,
      show: ['gethsemane'], kind: 'verse',
      kicker: 'Gethsemane · He prays',
      verse: '“Abba, Father,” He said, “all things are possible for You. Take this cup from Me. Yet not what I will, but what You will.”',
      ref: ['Mark 14:36 · BSB', 'mark', 14] },

    { id: 'arrest', ch: 'VI · Holy Week', pal: 'deep', view: [[35.2340, 31.7772], [35.2420, 31.7808]], plan: 1, torch: 1,
      show: ['gethsemane', 'arrest', 'kidron'],
      kicker: 'That night · Gethsemane', ref: ['Mark 14:43–50', 'mark', 14],
      title: 'Judas <em>arrives.</em>',
      text: 'Judas comes with an armed crowd. Jesus is arrested, and the disciples flee. John adds lanterns, torches and Jesus’ refusal of the sword.',
      chips: ['link', 'trad'] },

    { id: 'trials', ch: 'VI · Holy Week', pal: 'predawn', view: [[35.2255, 31.7680], [35.2450, 31.7815]], plan: 1,
      show: ['gethsemane', 'citysites', 'led'],
      kicker: 'Night into early morning', ref: ['Four Gospels', 'mark', 15],
      title: 'Before the <em>authorities.</em>', kind: 'list',
      items: [['Annas', 'John 18:13'], ['Caiaphas and the council', 'Mark 14:53'], ['Pilate, early morning', 'Mark 15:1'], ['Herod, then Pilate again', 'Luke 23:7–11']],
      text: 'The sites are debated, so the atlas lists the steps and does not place them on streets.' },

    { id: 'golgotha', ch: 'VI · Holy Week', pal: 'noon', view: [[35.2262, 31.7742], [35.2345, 31.7858]], plan: 1,
      show: ['sepulchre', 'gardentomb', 'nearcity', 'ledout'],
      kicker: 'Day of Preparation · third hour', ref: ['Mark 15:20–25', 'mark', 15],
      title: 'The Place <em>of the Skull.</em>',
      text: 'Jesus is led out to Golgotha. Mark names Simon of Cyrene carrying the cross; John says Jesus went out carrying it. The Via Dolorosa is a later devotional route and is not drawn.',
      chips: ['trad', 'link'] },

    { id: 'finished', ch: 'VI · Holy Week', pal: 'dark', view: [[35.2262, 31.7742], [35.2345, 31.7858]], plan: 0.5,
      show: ['sepulchre', 'gardentomb', 'nearcity'], kind: 'verse',
      kicker: 'Sixth to ninth hour · darkness',
      verse: 'When Jesus had received the sour wine, He said, “It is finished.” And bowing His head, He yielded up His spirit.',
      ref: ['John 19:30 · BSB', 'john', 19],
      after: 'Darkness covers the land from the sixth hour to the ninth (Mark 15:33).' },

    { id: 'burial', ch: 'VI · Holy Week', pal: 'evening', view: [[35.2262, 31.7742], [35.2345, 31.7858]], plan: 1,
      show: ['sepulchre', 'gardentomb', 'nearcity'],
      kicker: 'Day of Preparation · evening', ref: ['John 19:38–42', 'john', 19],
      title: 'Laid <em>in a tomb.</em>',
      text: 'Joseph of Arimathea and Nicodemus lay Jesus’ body in a new tomb in a garden near the place of crucifixion. Two traditional sites are shown; the atlas chooses neither.',
      chips: ['trad'] },

    { id: 'risen', ch: 'VII · Resurrection', pal: 'dawn', view: [[35.2262, 31.7742], [35.2345, 31.7858]], plan: 1,
      show: ['sepulchre', 'gardentomb', 'nearcity'],
      kicker: 'First day of the week · early', ref: ['Luke 24:1–8', 'luke', 24],
      title: 'He is not here; <em>He has risen!</em>',
      text: 'Women come to the tomb at dawn and find it open. In John’s account, Jesus calls Mary Magdalene by name.',
      chips: ['trad'] },

    { id: 'close', ch: 'VIII · Ascension', pal: 'bright', view: [[31.9, 28.7], [38.6, 34.9]], plan: 0,
      show: ['ring1', 'ring2', 'ring3'], kind: 'close',
      kicker: 'VIII · Ascension · Acts 1:8', ref: ['Acts 1:1–14', 'acts', 1],
      title: 'You will be <em>My witnesses.</em>',
      verse: '“But you will receive power when the Holy Spirit comes upon you, and you will be My witnesses in Jerusalem, and in all Judea and Samaria, and to the ends of the earth.”' }
  ];

  const CHIPS = {
    named: 'Named town',
    route: 'Schematic route',
    link: 'Narrative link',
    recon: 'Simplified reconstruction',
    trad: 'Traditional site',
    region: 'Exact site unknown'
  };

  return { PALETTES, PLACES, AREAS, ROUTES, STEPS, CHIPS };
})();
