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

// Good to know: three or four short facts per place, biblical and historical.
// References are to the Berean Standard Bible; outside sources are named.
window.WAY_KNOW = {
  nazareth: [
    'Nathanael asked, “Can anything good come from Nazareth?” (John 1:46), a sign of how obscure it was.',
    'Jesus was known as “Jesus of Nazareth”, and His followers were later called Nazarenes (Acts 24:5).',
    'Mark calls Jesus “the carpenter” (Mark 6:3). The Greek word, tektōn, covers a builder or craftsman in wood or stone.',
    'Sepphoris, the Galilean capital rebuilt by Herod Antipas, lay about 6 km to the north-west. The Gospels never mention it.'
  ],
  bethlehem: [
    'In Hebrew the name means “house of bread”.',
    'Micah foretold a ruler from Bethlehem (Micah 5:2), quoted by the chief priests and scribes in Matthew 2:5–6.',
    'Ruth and Boaz lived here (Ruth 1–4), and Samuel anointed David here (1 Samuel 16).',
    'Luke’s word for the “inn” (Luke 2:7) is the one he uses for the guest room of the Last Supper (Luke 22:11). Many think it means a family guest room.'
  ],
  capernaum: [
    'Peter and Andrew had a home here (Mark 1:29), and Levi’s tax booth was nearby (Mark 2:13–14).',
    'Its tax office probably collected duties on goods crossing between Antipas’s Galilee and Philip’s territory to the east.',
    'Jesus taught about the bread of life in its synagogue (John 6:59).',
    'Despite His miracles there, Jesus warned it for not repenting (Matthew 11:20, 23).'
  ],
  jerusalem: [
    'The Law called Israel’s men to appear before the Lord three times a year: at the Feasts of Unleavened Bread (with Passover), Weeks (Pentecost) and Tabernacles (Deuteronomy 16:16). The city swelled with pilgrims at each.',
    'The Sanhedrin, the Jewish council led by the high priest, met here.',
    'Jesus wept over the city and foretold its fall (Luke 19:41–44). The Romans destroyed it in AD 70.',
    'John mentions three Passovers during Jesus’ ministry (John 2:13; 6:4; 11:55).'
  ],
  bethany: [
    'Jesus stayed here at night during His last week (Mark 11:11; Matthew 21:17).',
    'He was anointed in the home of Simon the Leper in Bethany (Mark 14:3).',
    'Luke places the ascension near Bethany (Luke 24:50).',
    'It is a different place from “Bethany beyond the Jordan”, where John baptized (John 1:28).'
  ],
  jericho: [
    'The road up to Jerusalem climbs about 1,000 m in some 25 km. It is the setting of the Good Samaritan (Luke 10:30).',
    'Herod the Great died at Jericho, Josephus says, probably in 4 BC.',
    'A rich oasis on the pilgrim route, it was home to a wealthy chief tax collector, Zacchaeus (Luke 19:2).',
    'Old Testament Jericho, whose walls fell before Joshua (Joshua 6), is the older mound, Tell es-Sultan. How its ruins fit the account is debated.'
  ],
  nain: [
    'Only Luke tells of the widow’s son raised here (Luke 7:11–17).',
    'A widow who lost her only son lost her support as well. Luke says Jesus “had compassion on her” (Luke 7:13).',
    'Shunem, where Elisha raised a woman’s son (2 Kings 4:8–37), lies on the same hill. The crowd at Nain cries, “A great prophet has appeared among us!” (Luke 7:16).'
  ],
  bethsaida: [
    'Its name probably means “house of fishing”.',
    'Jesus healed a blind man here in two stages (Mark 8:22–26).',
    'Luke sets the feeding of the five thousand near Bethsaida (Luke 9:10).',
    'With Chorazin, it heard Jesus’ warning for not repenting (Matthew 11:21).'
  ],
  cphilippi: [
    'Here Peter confessed Jesus as the Christ (Mark 8:27–29; Matthew 16:13–16).',
    'It was first called Paneas, after the god Pan; the Arabic name Banias keeps that name.',
    'Herod the Great built a temple to Augustus here, according to Josephus.',
    'It lies about 40 km north of the Sea of Galilee, at the edge of Jewish territory.'
  ],
  tyre: [
    'Hiram, king of Tyre, sent cedar and craftsmen for Solomon’s temple (1 Kings 5).',
    'Alexander the Great besieged the island city in 332 BC and built a causeway that joined it to the mainland.',
    'People from Tyre and Sidon came to hear Jesus in Galilee (Mark 3:8).',
    'Tyrian silver coins were the usual money for paying the temple tax.'
  ],
  sidon: [
    'Jezebel was the daughter of a king of the Sidonians (1 Kings 16:31).',
    'Elijah was sent to “the widow of Zarephath in Sidon” (Luke 4:26; 1 Kings 17:9).',
    'Mark says Jesus returned from Tyre “through Sidon” to the Sea of Galilee (Mark 7:31), a long loop north.',
    'Paul’s ship called at Sidon on the voyage to Rome (Acts 27:3).'
  ],
  cana1: [
    'John calls it “Cana in Galilee” (John 2:1). Nathanael came from there (John 21:2).',
    'Jesus’ second sign was spoken at Cana for an official’s son lying sick in Capernaum (John 4:46–54).',
    'Stone vessels were used for purity rites, as in John 2:6; many have been found in Galilee, including pieces of large jars.',
    'Kafr Kanna lies on the road from Nazareth to the lake, which made it convenient for later pilgrims.'
  ],
  cana2: [
    'John calls it “Cana in Galilee” (John 2:1). Nathanael came from there (John 21:2).',
    'Jesus’ second sign was spoken at Cana for an official’s son lying sick in Capernaum (John 4:46–54).',
    'Josephus stayed at “a village of Galilee called Cana”, very likely this site.',
    'Stone vessels were used for purity rites, as in John 2:6; many have been found in Galilee, including pieces of large jars.'
  ],
  baptism: [
    'John preached “a baptism of repentance for the forgiveness of sins” (Mark 1:4).',
    'John also baptized at Aenon near Salim, “because the water was plentiful there” (John 3:23).',
    'Tradition links this stretch of river with Israel’s crossing under Joshua (Joshua 3) and Elijah’s departure (2 Kings 2).'
  ],
  nativity: [
    'About AD 150, Justin Martyr wrote that Jesus was born in a cave near Bethlehem.',
    'The first church was begun under Constantine, about 327, with the support of his mother Helena.',
    'The entrance, the “Door of Humility”, is only about 1.2 m high.',
    'Tradition says Persian invaders spared it in 614 because a mosaic showed the Magi in Persian dress.'
  ],
  jacobswell: [
    'The Samaritan woman says, “the well is deep” (John 4:11). It is about 40 m deep today.',
    'John explains that Jews did not associate with Samaritans (John 4:9).',
    'Joseph’s bones were buried in the plot Jacob had bought nearby (Joshua 24:32; John 4:5).',
    'The woman’s town, Sychar, is often identified with the village of Askar close by.'
  ],
  beatitudes: [
    'Luke has a shorter sermon on “a level place” (Luke 6:17).',
    'Matthew gives eight or nine blessings, depending on how they are counted (Matthew 5:3–12). Luke has four, with four woes (Luke 6:20–26).',
    'Nearby Tabgha has the Church of the Multiplication, with a well-known Byzantine mosaic of loaves and fish.'
  ],
  ephraim: [
    'Jesus withdrew here after the council resolved to put Him to death (John 11:53–54).',
    'It is often identified with Ophrah of Benjamin (Joshua 18:23) and Ephron (2 Chronicles 13:19).',
    'Et-Taiyibeh lies about 20 km north-east of Jerusalem, at the edge of the wilderness above the Jordan Valley.',
    'Today it is a largely Christian village.'
  ],
  cenacle: [
    'Acts says the disciples gathered in an “upper room” after the ascension (Acts 1:13). Whether it was the same room is not said.',
    'Guests reclined at the Passover meal; John describes the beloved disciple “reclining at His side” (John 13:23).',
    'The room was a mosque under the Ottomans, and a prayer niche (mihrab) remains.',
    'The name Mount Zion moved to this western hill in later centuries; first it meant the City of David.'
  ],
  gethsemane: [
    'Luke says Jesus went to the Mount of Olives “as usual” (Luke 22:39), and John that Judas knew the place (John 18:2).',
    'A 2012 study dated some of the olive trees here to the twelfth century; their roots may be older.',
    'A rock before the altar in the Church of All Nations is honored as the place where Jesus prayed.',
    'Nearby, the Grotto of Gethsemane, a cave probably used for an oil press, is another traditional site.'
  ],
  sepulchre: [
    'Excavations under and around the church found an old quarry with first-century tombs. Most archaeologists place it outside the city walls of Jesus’ day.',
    'Hadrian built a pagan temple over the site in the second century, which may have kept its memory alive.',
    'For centuries Muslim families have held the keys and opened the doors each day.',
    'An agreement known as the Status Quo still governs which community uses each part of the church.'
  ],
  gardentomb: [
    'It became widely known after General Charles Gordon promoted it in 1883.',
    'A rock face nearby was thought to look like a skull (“Skull Hill”).',
    'Most archaeologists date the tomb to the Iron Age, around the eighth to seventh century BC.',
    'Its custodians present it as a place to picture the burial and resurrection rather than as a proven site.'
  ],
  praetH: [
    'Herod named the palace towers Hippicus, Phasael and Mariamne, after a friend, his brother and his wife.',
    'Josephus says the governor Florus held court in front of this palace in AD 66, one reason many favor it as the praetorium.',
    'Only Luke records that Pilate sent Jesus to Herod Antipas, who was in Jerusalem at the time (Luke 23:7).',
    'The name “Tower of David” is a later tradition; the tower is Herodian.'
  ],
  antonia: [
    'John names the place of judgment “the Stone Pavement”, in Aramaic “Gabbatha” (John 19:13).',
    'The paving long shown as that Pavement, under the Sisters of Zion convent, is now dated to the time of Hadrian.',
    'Paul was taken into the barracks here after the riot in the temple (Acts 21:34).',
    'It replaced an earlier fortress, the Baris, built by the Hasmonean rulers.'
  ],
  bethesda: [
    'Two large pools were divided by a central wall. Four colonnades around them and one across the middle may explain John’s five (John 5:2).',
    'Some manuscripts add a verse about an angel stirring the water (John 5:4). It is not in the earliest manuscripts.',
    'In Roman times a healing shrine stood beside the pools.',
    'Manuscripts spell the name differently, Bethesda or Bethzatha.'
  ],
  siloam: [
    'John explains that Siloam means “Sent” (John 9:7).',
    'Hezekiah’s tunnel, about 533 m long, was cut around 700 BC (2 Kings 20:20). An inscription in it describes the two crews meeting.',
    'Jesus spoke of eighteen people killed when the tower in Siloam fell (Luke 13:4).',
    'At the Feast of Tabernacles, priests drew water here for a temple ceremony (Mishnah, Sukkah 4:9), widely seen as the background to Jesus’ words in John 7:37–38.'
  ],
  peterhouse: [
    'Mark says the whole town gathered at its door after sunset (Mark 1:32–33).',
    'Pilgrims scratched graffiti on its plaster; the excavators read some as naming Jesus and Peter.',
    'The pilgrim Egeria, in the 380s, is reported to have written that Peter’s house had been made into a church.',
    'Houses here were rough basalt with roofs of beams and earth, easy to open up (Mark 2:4).'
  ],
  capsyn: [
    'Jesus freed a man from an unclean spirit in the synagogue (Mark 1:23–26).',
    'A synagogue was a place to read and teach Scripture on the Sabbath, and a meeting hall for the town.',
    'Its white limestone was brought from elsewhere and stands out against the local black basalt.'
  ],
  einkarem: [
    'The name means “spring of the vineyard”.',
    'Luke says Zechariah was a priest (Luke 1:5) and that news of John’s birth spread through the hill country (Luke 1:65).',
    'A spring in the village is known as Mary’s Spring, linked by tradition with her visit.'
  ],
  machaerus: [
    'Josephus names Machaerus as the place where John the Baptist was killed (Antiquities 18.5.2).',
    'First built by the Hasmonean king Alexander Jannaeus, it was rebuilt by Herod the Great.',
    'It stands about 700 m above sea level, more than 1,100 m above the Dead Sea.',
    'Josephus names Herodias’s daughter Salome; the Gospels do not give her name.'
  ],
  tabor: [
    'At Deborah’s command, Barak gathered Israel’s army on Tabor (Judges 4:6, 12).',
    'It is about 575 m high and rises some 450 m above the plain.',
    'Cyril of Jerusalem in the fourth century named it as the mountain of the transfiguration; a fragment credited to Origen may be earlier.',
    'Josephus says there was a fortified settlement on the summit in his day; some see that as a difficulty for the tradition.'
  ],
  hermon: [
    'At about 2,814 m, it is the highest mountain in the region.',
    'Its snowmelt feeds the springs of the Jordan.',
    'Psalm 133 speaks of “the dew of Hermon” (Psalm 133:3).',
    'The Gospels say only “a high mountain” (Mark 9:2).'
  ],
  templelbl: [
    'Gentiles could enter the outer court. Stone notices warning them not to go further, on pain of death, have been found.',
    'The half-shekel temple tax was usually paid in Tyrian silver, hence the money changers (Mark 11:15).',
    'Solomon’s Colonnade ran along the east side of the courts (John 10:23).',
    'Herod’s platform covers about 14 hectares (35 acres).'
  ],
  olives: [
    'At about 800 m, it rises above the temple mount.',
    'Zechariah foresaw the Lord standing on the Mount of Olives (Zechariah 14:4).',
    'Jesus taught here about the end of the age (Mark 13:3).',
    'Jews have buried their dead on its slopes for thousands of years.'
  ],
  kidron: [
    'David crossed the Kidron fleeing from Absalom (2 Samuel 15:23).',
    'Reforming kings burned idols in the Kidron (1 Kings 15:13; 2 Kings 23:6).',
    '“Absalom’s Pillar” here is a tomb monument from about the first century, much later than Absalom.'
  ],
  sog: [
    'It is about 21 km long, 13 km wide and some 43 m deep at most.',
    'Winds funnel down from the surrounding hills and can raise sudden storms (Mark 4:37).',
    'A first-century fishing boat was found in the mud near Ginosar in 1986.',
    'Magdala, the likely hometown of Mary Magdalene, is usually identified with Taricheae, a Greek name drawn from its salted fish.'
  ],
  jordanlbl: [
    'The name probably means “the one that goes down”, and it falls steadily to the Dead Sea.',
    'Israel crossed into the land at the Jordan near Jericho (Joshua 3).',
    'Naaman was healed after washing in it seven times (2 Kings 5:14).'
  ],
  deadsea: [
    'The Bible calls it the Salt Sea (Genesis 14:3).',
    'Its water is about a third salt, roughly ten times saltier than the ocean.',
    'The Dead Sea Scrolls, the oldest known copies of most of the Hebrew Bible, were found from 1947 near Qumran on its north-west shore.',
    'Herod’s fortress of Masada stands above its western shore.'
  ],
  gerizim: [
    'The Samaritans accept only the five books of Moses as Scripture.',
    'The woman at the well says, “Our fathers worshiped on this mountain” (John 4:20).',
    'Blessings were to be proclaimed from Gerizim and curses from Ebal (Deuteronomy 27:12–13).',
    'Remains of the Samaritan temple precinct have been excavated on the summit.'
  ],
  ebal: [
    'Joshua built an altar on Mount Ebal (Joshua 8:30).',
    'At about 940 m, it is a little higher than Gerizim.',
    'A structure excavated there in the 1980s is identified by some as Joshua’s altar; others disagree.'
  ],
  wildlabel: [
    'John the Baptist preached “in the wilderness of Judea” (Matthew 3:1).',
    'David hid from Saul in this wilderness (1 Samuel 23–24).',
    'Rainfall drops sharply a few kilometers east of Jerusalem, so the land turns to desert within a short walk.',
    'The traditional Mount of Temptation rises above Jericho, with a Greek Orthodox monastery on its cliff.'
  ],
  galilee: [
    'Isaiah spoke of “Galilee of the nations” (Isaiah 9:1), quoted in Matthew 4:15.',
    'Galileans had a recognizable accent; Peter’s gave him away (Matthew 26:73).',
    'Josephus describes it as fertile and crowded with villages.',
    'Herod Antipas ruled first from Sepphoris, then from Tiberias, which he founded about AD 20.'
  ],
  samaria: [
    'Jews and Samaritans disagreed about where God should be worshiped (John 4:20).',
    'Galilean pilgrims often crossed Samaria to reach Jerusalem; once a Samaritan village refused to welcome Jesus (Luke 9:52–53).',
    'Herod rebuilt the old capital, Samaria, and renamed it Sebaste in honor of Augustus.',
    'Jesus made a Samaritan the hero of a parable and the one leper who returned to give thanks (Luke 10:33; 17:16).'
  ],
  judea: [
    'Archelaus ruled Judea after Herod until Rome removed him in AD 6 (Matthew 2:22).',
    'A stone found at Caesarea in 1961 names Pontius Pilate as prefect of Judea.',
    'A revolt that began in AD 66 led to the destruction of Jerusalem in AD 70; the last fortresses fell a few years later.'
  ],
  perea: [
    'The name comes from the Greek word for “beyond”.',
    'Some Jewish travelers between Galilee and Judea went this way, east of the Jordan, rather than through Samaria.',
    'Machaerus, where Josephus says John the Baptist was killed, stood in Perea.'
  ],
  decapolis: [
    'The name means “ten cities”, though ancient lists of them vary.',
    'The herd of pigs (Mark 5:11) marks a Gentile area: Jews did not eat pork.',
    'The healed man proclaimed what Jesus had done “throughout the Decapolis” (Mark 5:20).',
    'Many of these cities counted their years from Pompey’s conquest in 63 BC.'
  ],
  phoenicia: [
    'Mark calls the mother who pleaded for her daughter “a Greek woman of Syrophoenician origin” (Mark 7:26).',
    'The Phoenician alphabet is the ancestor of the Greek and Latin alphabets.',
    'Tyre was famous for purple dye made from murex shells.',
    'The coastal cities depended on the farmland inland for food (Acts 12:20).'
  ],
  egypt: [
    'Matthew links the return from Egypt with Hosea 11:1: “Out of Egypt I called My Son” (Matthew 2:15).',
    'The five books of Moses were first translated into Greek in Alexandria, beginning the Septuagint.',
    'Philo of Alexandria put the Jewish population of Egypt at a million.',
    'The family returned after Herod’s death (Matthew 2:19), so the stay may have been short.'
  ],
  syria: [
    'Its capital, Antioch, was where the disciples were first called Christians (Acts 11:26).',
    'Its governor commanded Roman legions; the prefect of Judea had only auxiliary troops.',
    'Josephus records a census under Quirinius in AD 6; how it relates to Luke’s census is debated.'
  ]
};

// Places added with the Old Testament and Pentecost update.
Object.assign(window.WAY_INFO, {
  chorazin: { then: 'A Jewish town in the basalt hills about 3 km north of Capernaum. Jesus did miracles there, though the Gospels describe none of them (Matthew 11:21).', today: 'Korazim National Park: black basalt ruins of a later town, with a synagogue where a carved stone seat was found.', sure: 'Certain.' },
  magdala: { then: 'A prosperous fishing town on the western shore of the lake, between Capernaum and Tiberias. Mary called Magdalene probably came from here (Luke 8:2).', today: 'Excavations in the 1970s and since 2009 have uncovered a first-century synagogue, streets, ritual baths and fish pools. A carved stone from the synagogue, the Magdala Stone, shows a temple menorah.', sure: 'The site is certain. The Gospels do not name the town; “Magdalene” is usually read as “of Magdala”.' },
  bethphage: { then: 'A village on the Mount of Olives, near Bethany. As they approached Bethphage and Bethany, Jesus sent two disciples into “the village ahead of you” for the colt (Mark 11:1–2).', today: 'A Franciscan church of 1883 on the eastern slope keeps a stone painted in the Crusader period. The Palm Sunday procession starts here.', sure: 'The village is named in the Gospels; the exact site is traditional.' },
  sychar: { then: 'A Samaritan town near Jacob’s well (John 4:5), where the woman told her neighbors about Jesus (John 4:28–30).', today: 'The village of Askar, at the edge of Nablus in the West Bank, is the usual candidate. Some think John means Shechem itself (Tell Balata).', sure: 'Uncertain; Askar is a common identification.' },
  tibcity: { then: 'A new city on the western shore, founded by Herod Antipas about AD 20 and named for the emperor Tiberius. It became his capital.', today: 'The modern city of Tiberias. Ruins of the Roman city, with a theater and a city gate, lie to the south.', sure: 'Certain.' },
  sepphoris: { then: 'The capital of Galilee in Jesus’ youth, about 6 km north-west of Nazareth. Herod Antipas rebuilt it after Roman troops destroyed it in 4 BC.', today: 'Tzippori National Park: a Roman theater, streets and houses, and later mosaics, including a woman’s face called the “Mona Lisa of the Galilee”.', sure: 'The site is certain. The Gospels never mention it.' }
});
Object.assign(window.WAY_KNOW, {
  chorazin: [
    'Jesus said that if the miracles done in Chorazin had been done in Tyre and Sidon, they would have repented long ago (Matthew 11:21; Luke 10:13).',
    'It is named only in these sayings; no visit is described.',
    'A stone seat found in its synagogue is often compared with “Moses’ seat” in Matthew 23:2.'
  ],
  magdala: [
    'Matthew says Jesus went to “the region of Magadan” (Matthew 15:39); some later manuscripts read Magdala.',
    'Jesus taught in synagogues throughout Galilee (Matthew 4:23); Magdala’s is one of the few securely dated to His time.',
    'Luke names Mary Magdalene among women who ministered to Jesus and the Twelve “out of their own means” (Luke 8:2–3).',
    'Josephus calls a town on this shore Taricheae, from its salted fish; most scholars identify it with Magdala.'
  ],
  bethphage: [
    'The name probably means “house of unripe figs”.',
    'Matthew, Mark and Luke name Bethphage as Jesus neared Jerusalem and sent two disciples for the colt (Matthew 21:1–2; Mark 11:1; Luke 19:29).',
    'Each Palm Sunday, a procession walks from here over the Mount of Olives into the Old City.'
  ],
  sychar: [
    'Many Samaritans from the town believed, first because of the woman’s word and then because of Jesus’ own (John 4:39–42).',
    'Jesus stayed there two days (John 4:40).',
    'Nearby Shechem is where Abram built his first altar in Canaan (Genesis 12:6–7).'
  ],
  tibcity: [
    'The Gospels never say Jesus entered Tiberias. John mentions boats from Tiberias after the feeding of the five thousand (John 6:23).',
    'Josephus says Antipas built it over a cemetery, so many observant Jews avoided it at first.',
    'John also calls the lake the Sea of Tiberias (John 6:1; 21:1).',
    'Centuries later, scholars in Tiberias (the Masoretes) added the vowel marks still used in Hebrew Bibles.'
  ],
  sepphoris: [
    'Josephus called it “the ornament of all Galilee”.',
    'Some scholars suggest Joseph and Jesus may have worked on its rebuilding; the Gospels say nothing about it.',
    'A Christian tradition places the home of Mary’s parents, Joachim and Anne, here; a Crusader church marks it.',
    'Rabbi Judah the Prince, who completed the Mishnah, the first written collection of Jewish oral law, around AD 200, lived his last years at Sepphoris.'
  ]
});
