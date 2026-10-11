// The Way — place profiles, shown in the Places tab and when a map label is
// tapped. Keys match the place ids in scenes.js (aliases share one profile).
// then: the place in Jesus' day. today: what is there now. sure: how certain
// the identification is. Keep each to a few plain sentences.
window.WAY_INFO = {
  nazareth: {
    then: 'A small farming village in the hills of lower Galilee, probably a few hundred people, with houses, cisterns and rock-cut storage caves. It is not mentioned in the Old Testament or by Josephus.',
    today: 'The largest Arab city in Israel. The Basilica of the Annunciation (completed 1969) stands over earlier churches and a cave venerated as Mary’s home.',
    sure: 'The town is certain. Sites within it are traditional.'
  },
  bethlehem: {
    then: 'A small town in the hill country of Judah, about 9 km south of Jerusalem, remembered as the hometown of David (1 Samuel 16–17).',
    today: 'A Palestinian city in the West Bank. The Church of the Nativity stands over a cave that Christians honored as the birthplace by the second century.',
    sure: 'The town is certain. The cave is an early tradition.'
  },
  capernaum: {
    then: 'A fishing and farming village on the north-west shore of the Sea of Galilee, near the border with Philip’s territory. Matthew calls it Jesus’ “own town” (Matthew 9:1).',
    today: 'Excavated ruins at Tell Hum: basalt houses, the white synagogue of the fourth or fifth century, and a modern church raised above the house venerated as Peter’s.',
    sure: 'The site is certain.'
  },
  jerusalem: {
    then: 'The capital of Judea and the home of the temple, which Herod the Great rebuilt on a vast scale. At the festivals, pilgrims crowded its streets.',
    today: 'The walls of the Old City date from the Ottoman sultan Suleiman in the sixteenth century. The Western Wall is part of Herod’s retaining wall around the temple platform.',
    sure: 'Certain.'
  },
  bethany: {
    then: 'A village on the eastern slope of the Mount of Olives, “a little less than two miles” from Jerusalem (John 11:18), home of Mary, Martha and Lazarus.',
    today: 'The town of al-Eizariya, whose Arabic name preserves Lazarus. A tomb venerated as his, and churches nearby, keep the tradition.',
    sure: 'The village is securely identified; the tomb is traditional.'
  },
  jericho: {
    then: 'An oasis near the Jordan, about 250 m below sea level, famous for date palms and balsam. New Testament Jericho lay beside Herod’s winter palaces, south of the Old Testament mound.',
    today: 'The modern town of Jericho in the West Bank, with excavations at Tulul Abu el-Alayiq (Herod’s palaces) and Tell es-Sultan (ancient Jericho).',
    sure: 'The area is certain; the dot marks New Testament Jericho.'
  },
  nain: {
    then: 'A village on the slope of the Hill of Moreh, looking over the Jezreel Valley, south-east of Nazareth.',
    today: 'The Arab village of Nein, with a small nineteenth-century Franciscan church recalling the widow’s son.',
    sure: 'The name and location have stayed in continuous use.'
  },
  bethsaida: {
    then: 'A fishing village near where the Jordan enters the Sea of Galilee, home of Philip, Andrew and Peter (John 1:44). Philip the tetrarch raised it to a city and renamed it Julias.',
    today: 'Two sites compete: et-Tell, a mound about 2 km from today’s shore, and el-Araj, on the shore, where recent excavations found Roman-period remains and a Byzantine church.',
    sure: 'Debated.'
  },
  cphilippi: {
    then: 'A town at the springs of the Jordan below Mount Hermon, beside a cave shrine to the god Pan. Philip rebuilt it as his capital and named it for Caesar.',
    today: 'The Banias nature reserve: the spring, the cave and rock-cut niches of the shrine, and remains of the Roman town.',
    sure: 'Certain.'
  },
  tyre: {
    then: 'A great Phoenician port on the Mediterranean coast, outside Jewish territory.',
    today: 'The city of Sur in southern Lebanon, with extensive Roman remains.',
    sure: 'Certain.'
  },
  sidon: {
    then: 'An ancient Phoenician port north of Tyre.',
    today: 'The city of Saida in Lebanon.',
    sure: 'Certain.'
  },
  cana1: {
    then: 'A village north-east of Nazareth.',
    today: 'The Arab town of Kafr Kanna. Its churches commemorate the wedding, and it is the Cana most pilgrims visit today.',
    sure: 'A later tradition. The older pilgrim site is Khirbet Qana.'
  },
  cana2: {
    then: 'A Jewish village on a hill above the Beit Netofa Valley, about 13 km north of Nazareth.',
    today: 'An unoccupied ruin. Excavations found the early Roman village and a cave complex that Byzantine and Crusader pilgrims venerated as Cana.',
    sure: 'Traditional in earlier centuries; many archaeologists now favor it.'
  },
  baptism: {
    then: 'John baptized in the Jordan, at “Bethany beyond the Jordan” (John 1:28).',
    today: 'Two shrines face each other across the river: Qasr al-Yahud on the west bank and Al-Maghtas in Jordan, a UNESCO World Heritage Site.',
    sure: 'Traditional. John names Bethany beyond the Jordan, but its exact location is unknown.'
  },
  nativity: {
    then: 'The Gospels say only that Jesus was born in Bethlehem and laid in a manger.',
    today: 'One of the oldest churches still in use, first built under Constantine in the fourth century and rebuilt under Justinian in the sixth. The grotto beneath is the traditional birthplace.',
    sure: 'Traditional, recorded by the second century.'
  },
  jacobswell: {
    then: 'A deep well near Sychar, at the foot of Mount Gerizim, linked with the patriarch Jacob (John 4:5–6, 11).',
    today: 'Inside a Greek Orthodox monastery church at the edge of Nablus in the West Bank. The well can still be visited.',
    sure: 'Traditional, honored since at least the fourth century.'
  },
  beatitudes: {
    then: 'Matthew says only that Jesus “went up on the mountain” (Matthew 5:1), somewhere in Galilee.',
    today: 'A hill above the north-west shore near Tabgha, crowned by an Italian Catholic church of 1938, cared for by Franciscan sisters. Earlier Byzantine chapels stood lower down the slope.',
    sure: 'A later tradition.'
  },
  ephraim: {
    then: 'A town “near the wilderness” where Jesus withdrew with His disciples (John 11:54).',
    today: 'Often identified with et-Taiyibeh, a village in the hills north-east of Jerusalem.',
    sure: 'Uncertain.'
  },
  cenacle: {
    then: 'Mark describes “a large upper room, furnished and ready” in the city (Mark 14:15).',
    today: 'A medieval Gothic room on Mount Zion, above the traditional Tomb of David. Christian tradition of a church on this hill goes back to the fourth century.',
    sure: 'Traditional. The text does not locate the house.'
  },
  gethsemane: {
    then: 'A place called Gethsemane, “oil press”, across the Kidron Valley (Mark 14:32; John 18:1).',
    today: 'The Church of All Nations (1924), built over the remains of a Byzantine church, with an olive garden of very old trees.',
    sure: 'Traditional, and close to what the Gospels describe.'
  },
  sepulchre: {
    then: 'John says the tomb was in a garden near the place of crucifixion, close to the city (John 19:20, 41–42).',
    today: 'Built under Constantine and dedicated in 335, destroyed in 1009 and rebuilt. It is shared today by several Christian communities.',
    sure: 'Traditional since the fourth century; most archaeologists place it outside the walls of Jesus’ day.'
  },
  gardentomb: {
    then: 'A rock-cut tomb north of the city.',
    today: 'A garden north of Damascus Gate, cared for by a British charity and visited by many Protestant pilgrims. It was proposed as the tomb of Jesus in the nineteenth century.',
    sure: 'A later proposal. Most archaeologists date the tomb centuries before Jesus.'
  },
  praetH: {
    then: 'Herod’s palace on the western hill, guarded by three great towers. Many scholars think Pilate stayed here during the festivals.',
    today: 'The base of one of the towers survives in the Citadel, or “Tower of David”, by Jaffa Gate.',
    sure: 'The palace site is certain; its use as Pilate’s praetorium is debated.'
  },
  antonia: {
    then: 'Herod’s fortress at the north-west corner of the temple platform, named for Mark Antony. Its Roman garrison watched the temple courts (Acts 21:31–37).',
    today: 'Almost nothing survives above ground. The Via Dolorosa traditionally begins here.',
    sure: 'The location is known; its use as Pilate’s praetorium is debated.'
  },
  bethesda: {
    then: 'A pool near the Sheep Gate, north of the temple, with five covered colonnades (John 5:2).',
    today: 'Excavated pools in the grounds of the Crusader Church of St Anne, inside the Old City.',
    sure: 'Widely accepted.'
  },
  siloam: {
    then: 'A pool at the south end of the city, fed by the spring of Gihon through Hezekiah’s tunnel.',
    today: 'The steps of a large pool from Jesus’ time were uncovered in 2004 in the City of David.',
    sure: 'Widely accepted.'
  },
  peterhouse: {
    then: 'Mark names “the home of Simon and Andrew” in Capernaum (Mark 1:29).',
    today: 'A first-century house whose main room was later plastered and used for gatherings, enclosed in the fifth century by an octagonal church. A modern church stands above it on pillars.',
    sure: 'Traditional, with early evidence of Christian veneration.'
  },
  capsyn: {
    then: 'Jesus taught in the synagogue at Capernaum, which Luke says a centurion had built (Mark 1:21; Luke 7:5).',
    today: 'A white limestone synagogue of the fourth or fifth century stands on basalt foundations. Its excavators argued that the floor beneath is first-century.',
    sure: 'The site is certain; the first-century date of the earlier floor is debated.'
  },
  einkarem: {
    then: 'Luke names only “a town in the hill country of Judah” (Luke 1:39).',
    today: 'A former village, now a neighborhood on the south-western edge of Jerusalem, with the Church of the Visitation and the Church of St John the Baptist.',
    sure: 'A later tradition.'
  },
  machaerus: {
    then: 'Herod’s hilltop fortress east of the Dead Sea, in Perea. Josephus says John the Baptist was imprisoned and executed there.',
    today: 'Excavated ruins near the village of Mukawir in Jordan, including the palace courtyard.',
    sure: 'The fortress is certain; its link with John comes from Josephus.'
  },
  tabor: {
    then: 'A dome-shaped mountain rising alone from the Jezreel Valley.',
    today: 'The Franciscan Basilica of the Transfiguration (1924) and a Greek Orthodox monastery stand on the summit.',
    sure: 'An early tradition; the Gospels do not name the mountain.'
  },
  hermon: {
    then: 'The highest mountain in the region, often snow-capped, rising above Caesarea Philippi.',
    today: 'A massif on the Lebanon–Syria border, whose southern slopes lie in the Israeli-controlled Golan Heights.',
    sure: 'Suggested by some because of its nearness to Caesarea Philippi (Mark 8:27; 9:2).'
  },
  templelbl: {
    then: 'Herod began rebuilding the temple around 20 BC, and work went on for decades (John 2:20). Its courts were the busiest place in the city.',
    today: 'The Romans destroyed the temple in AD 70. The platform remains, today’s Temple Mount or Haram al-Sharif.',
    sure: 'The platform is certain; the buildings shown are a reconstruction.'
  },
  olives: {
    then: 'A ridge east of the city across the Kidron Valley, higher than the temple mount, with Bethphage and Bethany on its far side. Its slopes held olive groves and tombs.',
    today: 'Churches, a large Jewish cemetery and a famous view over the Old City.',
    sure: 'Certain.'
  },
  kidron: {
    then: 'The valley between the city and the Mount of Olives, crossed on the way to Gethsemane (John 18:1).',
    today: 'Still the valley below the eastern wall of the Old City, with ancient tomb monuments.',
    sure: 'Certain.'
  },
  sog: {
    then: 'A freshwater lake about 21 km long, lined with fishing towns. The Gospels also call it the Sea of Tiberias (John 6:1) and the Lake of Gennesaret (Luke 5:1).',
    today: 'Lake Kinneret, about 210 m below sea level, Israel’s largest freshwater lake.',
    sure: 'Certain.'
  },
  jordanlbl: {
    then: 'The river flows from the springs below Mount Hermon through the Sea of Galilee to the Dead Sea.',
    today: 'Much reduced by modern water use, its lower course forms Jordan’s border with Israel and the West Bank.',
    sure: 'Certain.'
  },
  deadsea: {
    then: 'A salt lake at the south end of the Jordan Valley.',
    today: 'The lowest point on land, now more than 430 m below sea level and shrinking.',
    sure: 'Certain.'
  },
  gerizim: {
    then: 'The Samaritans’ holy mountain above Shechem. Their temple on it had been destroyed by the Jewish ruler John Hyrcanus over a century earlier.',
    today: 'Samaritans still live on the mountain and celebrate Passover on its summit.',
    sure: 'Certain.'
  },
  ebal: {
    then: 'The mountain facing Gerizim across the pass of Shechem (Deuteronomy 27).',
    today: 'Above the city of Nablus in the West Bank.',
    sure: 'Certain.'
  },
  wildlabel: {
    then: 'The Judean wilderness: dry, rugged hills falling east from Jerusalem to the Dead Sea and the Jordan Valley.',
    today: 'Largely unchanged, crossed by deep ravines and dotted with ancient monasteries.',
    sure: 'The region is certain; the place of the temptation is not named.'
  },
  galilee: {
    then: 'The fertile, hilly north, ruled by Herod Antipas. Most of Jesus’ ministry took place among its villages and around its lake.',
    today: 'Northern Israel.',
    sure: 'A region; its borders are approximate.'
  },
  samaria: {
    then: 'The hill country between Galilee and Judea, home of the Samaritans and governed with Judea by the Roman prefect.',
    today: 'The northern West Bank.',
    sure: 'A region; its borders are approximate.'
  },
  judea: {
    then: 'The southern hill country around Jerusalem, under a Roman prefect from AD 6. Pontius Pilate governed it from AD 26 to 36.',
    today: 'Divided between Israel and the West Bank.',
    sure: 'A region; its borders are approximate.'
  },
  perea: {
    then: 'The land east of the Jordan, ruled with Galilee by Herod Antipas. Jesus taught there on His way to Jerusalem (Mark 10:1).',
    today: 'Part of Jordan.',
    sure: 'A region; its borders are approximate.'
  },
  decapolis: {
    then: 'A group of Greek-speaking cities, almost all east of the Jordan, such as Gerasa, Gadara and Scythopolis (the one city west of the river), with temples, theaters and largely Gentile populations.',
    today: 'Spread across northern Jordan, southern Syria and Israel; Jerash (Gerasa) and Beit She’an (Scythopolis) have impressive ruins.',
    sure: 'A loose group of cities, not one territory; whether they formed a formal league is debated.'
  },
  phoenicia: {
    then: 'The coastal land of Tyre and Sidon, Gentile and Phoenician, part of the Roman province of Syria.',
    today: 'Southern Lebanon.',
    sure: 'A region.'
  },
  egypt: {
    then: 'A Roman province with large Jewish communities, especially in Alexandria, and a traditional refuge from danger in Judea.',
    today: 'Egypt. Coptic tradition marks many places on the Holy Family’s route; Matthew names none.',
    sure: 'Matthew names the country, not a town.'
  },
  syria: {
    then: 'The large Roman province to the north, whose governor oversaw the wider region. Luke links the census with Quirinius, governor of Syria (Luke 2:2).',
    today: 'Covered most of today’s Syria and Lebanon, with parts of southern Turkey, northern Israel and Jordan.',
    sure: 'A province.'
  }
};
