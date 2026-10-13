"""Build holyweek.html, the Holy Week guide.

    python3 tools/make-holyweek.py

Content lives here as plain text with Bible references written out
("Mark 15:21"); the script links each reference to the passage on BibleHub
(BSB) and each [[scene-id|label]] to that scene in the atlas.
Quotations are from the Berean Standard Bible (public domain).
"""
import html, os, re

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BOOKS = {
    'Genesis': 'genesis', 'Exodus': 'exodus', 'Leviticus': 'leviticus', 'Numbers': 'numbers', 'Deuteronomy': 'deuteronomy',
    'Psalm': 'psalms', 'Psalms': 'psalms', 'Isaiah': 'isaiah', 'Jeremiah': 'jeremiah', 'Hosea': 'hosea', 'Jonah': 'jonah',
    'Zechariah': 'zechariah', 'Matthew': 'matthew', 'Mark': 'mark', 'Luke': 'luke', 'John': 'john', 'Acts': 'acts',
    'Romans': 'romans', '1 Corinthians': '1_corinthians', 'Galatians': 'galatians', '2 Timothy': '2_timothy',
    'Hebrews': 'hebrews', '1 Peter': '1_peter', 'Revelation': 'revelation',
}
REF = re.compile(r'\b(' + '|'.join(sorted((re.escape(b) for b in BOOKS), key=len, reverse=True)) + r')\s+(\d+)(?::\d+(?:[–-]\d+(?::\d+)?)?(?:,\s*\d+(?:[–-]\d+)?)*|[–-]\d+)?(?!\d|:\d)')


def fmt(text):
    """Escape, then link references and scenes; *x* becomes <em>."""
    t = html.escape(text, quote=False)
    t = REF.sub(lambda m: f'<a class="ref" data-ref="{m.group(0)}" href="https://biblehub.com/bsb/{BOOKS[m.group(1)]}/{m.group(2)}.htm" target="_blank" rel="noopener">{m.group(0)}</a>', t)
    t = re.sub(r'\[\[([\w-]+)\|([^\]]+)\]\]', lambda m: f'<a class="scene" href="./?guide=holyweek#s-{m.group(1)}">{m.group(2)}</a>', t)
    t = re.sub(r'\*([^*]+)\*', r'<em>\1</em>', t)
    return t


P = lambda s: f'<p>{fmt(s)}</p>'
Q = lambda s, ref: f'<blockquote>{fmt(s)}<cite>{fmt(ref)}</cite></blockquote>'
UL = lambda items: '<ul class="facts">' + ''.join(f'<li>{fmt(i)}</li>' for i in items) + '</ul>'

SECTIONS = []


def section(sid, title, intro, body):
    SECTIONS.append((sid, title, intro, body))


# ---------------------------------------------------------------- day by day
DAYS = [
    ('Saturday', 'Six days before the Passover', [
        'Jesus comes to Bethany, home of Lazarus, Martha and Mary (John 12:1). At a dinner, Mary anoints His feet with costly perfume (John 12:2–8). [[anoint|Anointed at Bethany]]',
        'Mark and Matthew tell of an anointing at Bethany, on His head, just after noting that the Passover was two days away (Mark 14:1–9).',
    ]),
    ('Sunday', 'The entry', [
        'Jesus rides a colt down the Mount of Olives as crowds spread cloaks and branches and shout “Hosanna!” (Mark 11:1–10). Seeing the city, He weeps over it (Luke 19:41–44). [[entry|The king enters Jerusalem]]',
        'He looks around the temple courts, then goes back to Bethany for the night (Mark 11:11).',
    ]),
    ('Monday', 'The temple cleared', [
        'On the way in, He finds a fig tree with leaves but no fruit (Mark 11:12–14). In the temple courts He overturns the tables of the money changers (Mark 11:15–18). [[temple|A house of prayer]]',
        'Matthew tells the clearing on the day of the entry (Matthew 21:12).',
    ]),
    ('Tuesday', 'A long day of teaching', [
        'The fig tree has withered (Mark 11:20). In the temple courts, leaders question His authority; He tells the parable of the tenants, answers on taxes to Caesar, on the resurrection and on the greatest commandment, and praises a poor widow’s two small coins (Mark 11:27–12:44). [[greatest|The greatest commandment]]',
        'Leaving the temple, He sits on the Mount of Olives and speaks of the end of the age (Mark 13). [[watch|Watch and stay faithful]]',
    ]),
    ('Wednesday', 'The plot', [
        'Mark says the Passover was “two days away” (Mark 14:1). The chief priests look for a way to arrest Him, and Judas goes to them and is promised money (Mark 14:10–11).',
        'Mark also places here the anointing at Bethany (Mark 14:3–9). The order of days is a common reconstruction.',
    ]),
    ('Thursday', 'The Last Supper and Gethsemane', [
        'Two disciples prepare the Passover in an upper room (Mark 14:12–16). In the evening Jesus washes their feet (John 13:1–17), shares the bread and the cup (Mark 14:22–25) and speaks at length of the Father and the Spirit (John 14–17). [[upper|Bread and the cup]]',
        'After a hymn they go out to the Mount of Olives (Mark 14:26). In Gethsemane He prays, “Not what I will, but what You will” (Mark 14:36). Judas arrives with an armed crowd, and Jesus is arrested (Mark 14:43–50). [[pray|Gethsemane]] [[arrest|The arrest]]',
    ]),
    ('Friday', 'The cross', [
        'Through the night: before Annas, then Caiaphas; Peter denies Him three times (John 18:13–27; Mark 14:53–72). At daybreak the council meets (Luke 22:66). Then Pilate, Herod Antipas, and Pilate again; the crowd asks for Barabbas (Luke 23:1–25). [[trials|Before the authorities]]',
        'He is flogged and crucified at the third hour, about 9 a.m. (Mark 15:25). Darkness covers the land from the sixth hour to the ninth, noon to 3 p.m.; He dies at about the ninth hour, and the veil of the temple is torn (Mark 15:33–38). He is buried before the Sabbath begins at sunset (Mark 15:42–47). [[golgotha|The Place of the Skull]] [[burial|Laid in a tomb]]',
    ]),
    ('Saturday', 'The Sabbath', [
        'The women rest “according to the commandment” (Luke 23:56). The chief priests ask Pilate to secure the tomb, and it is sealed and guarded (Matthew 27:62–66). [[guard|Sealed and guarded]]',
    ]),
    ('Sunday', 'The first day of the week', [
        'At dawn the women find the stone rolled away and the tomb empty (Mark 16:1–8). Jesus appears to Mary Magdalene (John 20:11–18), to the women (Matthew 28:9–10), to Peter (Luke 24:34), to two on the road to Emmaus (Luke 24:13–35), and in the evening to the disciples (John 20:19–23). [[risen|He has risen]] [[emmaus|Emmaus]]',
    ]),
]
days = '<ol class="days">' + ''.join(
    f'<li><div class="day"><b>{d}</b><span>{html.escape(sub)}</span></div>' + ''.join(P(x) for x in items) + '</li>' for d, sub, items in DAYS) + '</ol>'
dating = '<div class="aside"><h3>Which day, which year?</h3>' + P(
    'The Gospels place the crucifixion on Preparation Day, “the day before the Sabbath” (Mark 15:42; compare John 19:31), so most Christians and most historians hold that it was a Friday. Pilate governed from AD 26 to 36; within those years, astronomical reckoning puts 14 Nisan, the day the Passover lambs were killed, on a Friday in AD 30 and AD 33, so the dates most often given are 7 April AD 30 and 3 April AD 33.') + P(
    'Others propose a Thursday or Wednesday, partly to fit “three days and three nights” (Matthew 12:40). Elsewhere the Gospels say “on the third day” (Matthew 16:21; Luke 24:7), which in Jewish counting includes part days. John also times the Passover differently from the other three: in John, Jesus is condemned on “the day of Preparation for the Passover” (John 19:14), while Mark calls the Last Supper a Passover meal (Mark 14:12). How the two fit is debated.') + '<p class="small">Hours are counted from sunrise, about 6 a.m.: the third hour is about 9 a.m., the sixth noon, the ninth 3 p.m. The Jewish day began at sunset.</p></div>'
section('days', 'Day by day', 'From the arrival at Bethany to the empty tomb. The days of the week are a reconstruction from the Gospels’ own time markers.', days + dating)

# ---------------------------------------------------------------- people
PEOPLE = [
    ('Caiaphas', 'High priest, AD 18–36', [
        'Son-in-law of Annas (John 18:13). He told the council, “it is better for you that one man die for the people than that the whole nation perish” (John 11:49–50), and he presided when Jesus was condemned (Matthew 26:57–66).',
        'In 1990 a family tomb south of Jerusalem held an ornate bone box inscribed “Joseph son of Caiaphas”. Many scholars think it belonged to him; some disagree.',
    ]),
    ('Annas', 'Former high priest', [
        'High priest from AD 6 to 15, and still powerful: Jesus is taken to him first (John 18:13, 19–24). Josephus says five of his sons also became high priest.',
    ]),
    ('Pontius Pilate', 'Roman prefect of Judea, AD 26–36', [
        'He asked, “What is truth?” (John 18:38), found no charge against Jesus, washed his hands before the crowd (Matthew 27:24), and handed Him over to be crucified (Mark 15:15).',
        'Philo and Josephus describe him as harsh. A stone found at Caesarea in 1961 names him as prefect. He was recalled to Rome in AD 36 or 37.',
    ]),
    ('Pilate’s wife', 'Unnamed in the Gospels', [
        'She sent Pilate a message: “Have nothing to do with that innocent man, for I have suffered terribly in a dream today because of Him” (Matthew 27:19). Later tradition calls her Claudia Procula.',
    ]),
    ('Herod Antipas', 'Ruler of Galilee and Perea', [
        'The son of Herod the Great, who had John the Baptist beheaded. Jesus called him “that fox” (Luke 13:32). He questioned and mocked Jesus, and that day he and Pilate became friends (Luke 23:6–12). Rome exiled him in AD 39.',
    ]),
    ('Judas Iscariot', 'One of the Twelve', [
        'He kept the money bag and stole from it (John 12:6). The chief priests paid him thirty pieces of silver (Matthew 26:15), and he identified Jesus with a kiss (Mark 14:44–45).',
        'Matthew says he threw the silver into the temple and hanged himself (Matthew 27:3–5); Acts says he fell headlong in a field (Acts 1:18). How the two accounts fit is discussed by commentators.',
    ]),
    ('Simon Peter', 'Leader of the Twelve', [
        'He drew a sword and cut off the ear of the high priest’s servant, Malchus (John 18:10), whom Jesus healed (Luke 22:51). That night he denied Jesus three times, and broke down and wept (Mark 14:66–72).',
        'The risen Jesus appeared to him (Luke 24:34; 1 Corinthians 15:5) and restored him by the sea (John 21:15–19).',
    ]),
    ('Barabbas', 'The prisoner released', [
        'He was “imprisoned with the rebels who had committed murder during the insurrection” (Mark 15:7). Pilate released him at the crowd’s request (Mark 15:15). In Aramaic, Bar-abba means “son of the father”.',
    ]),
    ('Simon of Cyrene', 'He carried the cross', [
        'A man from Cyrene in North Africa, “passing by on his way in from the country”, forced to carry the cross; Mark names his sons Alexander and Rufus, as if readers knew them (Mark 15:21).',
    ]),
    ('The two criminals', 'Crucified beside Him', [
        'Both at first joined in the insults (Mark 15:32). In Luke, one rebukes the other and says, “Jesus, remember me when You come into Your kingdom!” Jesus answers, “today you will be with Me in Paradise” (Luke 23:39–43).',
    ]),
    ('The centurion', 'Officer at the cross', [
        'A Roman officer over a company of soldiers. Seeing how Jesus died, he said, “Truly this man was the Son of God!” (Mark 15:39). In Luke: “Surely this was a righteous man” (Luke 23:47).',
    ]),
    ('Joseph of Arimathea', 'Council member', [
        'A rich man (Matthew 27:57) and a member of the Council who “had not consented to their decision” (Luke 23:51), a secret disciple (John 19:38). He boldly asked Pilate for the body and laid it in his own new tomb (Mark 15:43–46; Matthew 27:60).',
    ]),
    ('Nicodemus', 'Pharisee and teacher', [
        'He first came to Jesus by night (John 3:1–2), later asked the council to give Him a hearing (John 7:50–51), and brought about seventy-five pounds of myrrh and aloes for the burial (John 19:39).',
    ]),
    ('Mary Magdalene', 'First witness of the risen Jesus', [
        'Jesus had freed her from seven demons, and she supported His ministry (Luke 8:2–3). She watched the crucifixion and the burial (Mark 15:40, 47), came to the tomb at dawn, and was the first to see the risen Jesus (John 20:11–18).',
        'The Gospels never call her a prostitute; that idea grew from a sermon of Pope Gregory the Great (AD 591), which merged her with the sinful woman of Luke 7 and with Mary of Bethany.',
    ]),
    ('Mary, mother of Jesus', 'At the cross', [
        'She stood near the cross, and Jesus entrusted her to the disciple He loved (John 19:25–27). After the ascension she was praying with the disciples (Acts 1:14).',
    ]),
    ('The beloved disciple', 'Unnamed in John', [
        'He reclined beside Jesus at the supper (John 13:23), stood at the cross (John 19:26), and ran with Peter to the tomb (John 20:2–8). Church tradition identifies him as John, son of Zebedee.',
    ]),
]
people = '<div class="people">' + ''.join(
    f'<details><summary><b>{html.escape(n)}</b><span>{html.escape(r)}</span></summary>' + ''.join(P(x) for x in items) + '</details>' for n, r, items in PEOPLE) + '</div>'
section('people', 'The people', 'Tap a name to read who they were.', people)

# ---------------------------------------------------------------- temple
temple = UL([
    'Herod began rebuilding the temple about 20 BC, and work went on for decades: “This temple took forty-six years to build” (John 2:20). It was finished in the 60s AD and destroyed by Rome in AD 70.',
    'All week Jesus taught in its courts by day and spent the nights on the Mount of Olives (Luke 21:37; Mark 14:49). There He watched a poor widow give “two small copper coins” (Mark 12:41–44).',
    'He foretold its fall: “Not one stone here will be left on another” (Mark 13:2). Huge stones thrown down in AD 70 still lie on the Herodian street below the southwest corner of the Temple Mount.',
    'Gentiles could enter the outer court, but stone notices in Greek warned them, on pain of death, not to go further. Two have been found, in 1871 and 1935.',
    'Hebrews describes a curtain in the tabernacle that closed off the Most Holy Place (Hebrews 9:3); the temple sanctuary had the same arrangement. At Jesus’ death, “the veil of the temple was torn in two from top to bottom” (Mark 15:38). Josephus describes a great curtain of blue, scarlet, fine linen and purple at the sanctuary’s entrance; which curtain tore, the Gospels do not say.',
    'Hebrews sees the way to God opened “through the curtain of His body” (Hebrews 10:19–20).',
    'On the afternoon before Passover, lambs were slaughtered in the temple courts (Exodus 12:6). Josephus says from the ninth hour to the eleventh. In John’s timing (John 19:14), that was the afternoon Jesus died. Paul writes, “Christ, our Passover lamb, has been sacrificed” (1 Corinthians 5:7).',
])
section('temple', 'The temple', 'The setting of Jesus’ last days of teaching, and of the torn veil.', temple + P('See it in 3D: [[temple|the temple courts in the atlas]].'))

# ---------------------------------------------------------------- cross
cross = UL([
    'Crucifixion was Rome’s punishment for slaves, rebels and the worst criminals, carried out in public as a warning. Cicero called it “a most cruel and disgusting penalty” (*Against Verres* 2.5.165).',
    'The condemned were usually flogged first (Mark 15:15) and made to carry their cross out to the place of execution. John says Jesus carried His own cross (John 19:17); the other Gospels say the soldiers forced Simon of Cyrene to carry it (Mark 15:21), without saying why.',
    'Golgotha means “the Place of the Skull” (John 19:17); Calvary comes from the Latin. It lay outside the city but near it, by a road where passers-by could read the charge (John 19:20; Mark 15:29; Hebrews 13:12).',
    'Above His head was the charge: “JESUS OF NAZARETH, THE KING OF THE JEWS”, written in Hebrew, Latin and Greek (John 19:19–20).',
    'The Gospels do not mention nails at the crucifixion itself, but Peter speaks of “nailing Him to the cross” (Acts 2:23), and the risen Jesus shows His hands and feet, and Thomas speaks of “the nail marks” (Luke 24:39; John 20:25). In 1968 the heel bone of a crucified man, Yehohanan, was found in Jerusalem with an iron nail still through it.',
    'He refused wine mixed with myrrh (Mark 15:23), was later offered sour wine (John 19:29), and the soldiers divided His clothes (John 19:23–24).',
    'To hurry death before the Sabbath, the soldiers broke the legs of the two criminals; Jesus was already dead, and a spear brought out blood and water (John 19:31–34).',
    'The Law said a body hung on a tree must be buried that same day, “because anyone who is hung on a tree is under God’s curse” (Deuteronomy 21:22–23). Paul: “Christ redeemed us from the curse of the law by becoming a curse for us” (Galatians 3:13).',
    'The Gospels do not describe the cross’s shape. The charge “above His head” (Matthew 27:37) fits the traditional form.',
])
sayings = '<div class="aside"><h3>Seven sayings from the cross</h3><ol class="say">' + ''.join(f'<li>{fmt(x)}</li>' for x in [
    '“Father, forgive them, for they do not know what they are doing.” (Luke 23:34)',
    '“Truly I tell you, today you will be with Me in Paradise.” (Luke 23:43)',
    '“Woman, here is your son.” … “Here is your mother.” (John 19:26–27)',
    '“My God, My God, why have You forsaken Me?” (Mark 15:34; Matthew 27:46)',
    '“I am thirsty.” (John 19:28)',
    '“It is finished.” (John 19:30)',
    '“Father, into Your hands I commit My Spirit.” (Luke 23:46)',
]) + '</ol><p class="small">' + fmt('No one Gospel records all seven; tradition gathers them. The words “Father, forgive them…” (Luke 23:34) are missing from some early manuscripts.') + '</p></div>'
section('cross', 'The cross', 'What the Gospels describe, and what history and archaeology add.', cross + sayings)

# ---------------------------------------------------------------- tomb
tomb = UL([
    'Joseph laid the body in his own new tomb, “cut into the rock, where no one had yet been laid” (Luke 23:53; Matthew 27:60), in a garden near the place of crucifixion (John 19:41–42).',
    'Wealthy families cut tombs into the soft limestone around Jerusalem: a low entrance, a chamber, and shelves or niches for the dead. A year or so later the bones were often gathered into a stone box, an ossuary.',
    'A stone was rolled across the entrance (Mark 15:46); Mark says it was “extremely large” (Mark 16:4). Most tombs of the time were closed with square blocks; round rolling stones are rare and belong to wealthy tombs.',
    'The body was wrapped in linen with spices, “according to the Jewish burial custom” (John 19:40). Nicodemus brought about seventy-five pounds of myrrh and aloes (John 19:39), a lavish amount.',
    'Everything was rushed because the Sabbath began at sunset (Luke 23:54–56), so the women came back with spices when the Sabbath was over (Mark 16:1).',
    'The tomb was sealed and guarded at the chief priests’ request (Matthew 27:62–66). Matthew says the guards were later paid to say the disciples stole the body, “and this account has been circulated among the Jews to this very day” (Matthew 28:11–15).',
    'Peter found the linen cloths lying there, and the cloth that had been around Jesus’ head “rolled up, lying separate” (John 20:6–7).',
    'Where was it? The Church of the Holy Sepulchre has marked the site since the fourth century, and most archaeologists place it outside the walls of Jesus’ day. The Garden Tomb was proposed in the nineteenth century; most archaeologists date that tomb centuries earlier.',
])
section('tomb', 'The tomb', 'A rich man’s tomb, closed in a hurry before the Sabbath.', tomb)

# ---------------------------------------------------------------- women
women = UL([
    'Women had followed Jesus from Galilee and supported Him (Luke 8:2–3). When the disciples fled, they watched the crucifixion “from a distance” (Mark 15:40–41) and saw where the body was laid (Mark 15:47).',
    'They came back at dawn on the first day of the week to anoint the body, asking one another, “Who will roll away the stone?” (Mark 16:3). They were the first to find the tomb empty and to hear that He had risen (Mark 16:5–7).',
    'The risen Jesus appeared first to women: to Mary Magdalene (John 20:14–18) and, in Matthew, to Mary Magdalene and “the other Mary” together (Matthew 28:9–10). Mary went and told the disciples, “I have seen the Lord!” (John 20:18).',
    'At first “their words seemed like nonsense to them, and they did not believe the women” (Luke 24:11).',
    'In that world a woman’s testimony carried little weight; Josephus says women should not be admitted as witnesses. Many historians point out that a made-up story would hardly have chosen women as its first witnesses.',
])
names = ('<table class="names"><thead><tr><th>Gospel</th><th>Women named at the tomb</th></tr></thead><tbody>'
         + ''.join(f'<tr><td>{fmt(a)}</td><td>{fmt(b)}</td></tr>' for a, b in [
             ('Matthew 28:1', 'Mary Magdalene and “the other Mary”'),
             ('Mark 16:1', 'Mary Magdalene, Mary the mother of James, and Salome'),
             ('Luke 24:10', 'Mary Magdalene, Joanna, Mary the mother of James, and other women'),
             ('John 20:1–2', 'Mary Magdalene (she says “we do not know where they have put Him”)'),
         ]) + '</tbody></table><p class="small">Each Gospel names some of the group; all four name Mary Magdalene.</p>')
section('women', 'The women at the tomb', 'Last at the cross, first at the empty tomb.', women + names)

# ---------------------------------------------------------------- history
hist = [
    ('Tacitus', 'Roman historian, about AD 116', '“Christus, from whom the name had its origin, suffered the extreme penalty during the reign of Tiberius at the hands of one of our procurators, Pontius Pilatus” (*Annals* 15.44). Widely accepted as genuine; Tacitus was no friend of Christians.'),
    ('Josephus', 'Jewish historian, about AD 93', 'His *Antiquities* mentions Jesus twice. One passage (18.63–64) says Pilate condemned Him to the cross and His followers did not abandon Him; most scholars think a Christian copyist added some phrases, but that the core is Josephus’s own. The other (20.200) mentions “the brother of Jesus, who was called Christ, whose name was James” and is generally accepted.'),
    ('Thallus and Phlegon', 'Writers known through later quotations', 'Julius Africanus, about AD 220, says Thallus explained a darkness as an eclipse of the sun, and that Phlegon recorded an eclipse in the reign of Tiberius. Africanus objected that an eclipse cannot happen at full moon, when Passover falls. The original texts are lost.'),
    ('Pliny the Younger', 'Roman governor, about AD 112', 'He reported to the emperor Trajan that Christians met before dawn and sang hymns “to Christ as to a god” (*Letters* 10.96).'),
    ('Mara bar Serapion', 'Syriac letter, after AD 73', 'Asks what the Jews gained by executing their “wise king”. Many think he means Jesus, though he does not name Him.'),
    ('The Talmud', 'Jewish writings, compiled centuries later', 'A passage in Sanhedrin 43a says “Yeshu” was hanged on the eve of Passover. Its date and meaning are debated, but its timing agrees with John’s Gospel.'),
]
history = '<ul class="sources">' + ''.join(f'<li><b>{n}</b><small>{w}</small>{fmt(t)}</li>' for n, w, t in hist) + '</ul>'
world = '<div class="aside"><h3>The wider world, AD 30–33</h3>' + UL([
    'Tiberius was emperor of Rome (AD 14–37), ruling from the island of Capri. In AD 31 his powerful commander Sejanus was executed in Rome.',
    'In Alexandria, the Jewish philosopher Philo was writing; in China, the Han dynasty had been restored under Emperor Guangwu.',
    'On 3 April AD 33, one of the dates proposed for the crucifixion, a partial eclipse of the moon was under way as the moon rose over Jerusalem; whether it could be seen is debated. Some connect it with Peter’s words about “the moon to blood” (Acts 2:20); this is a modern suggestion.',
]) + '</div>'
archaeology = '<div class="aside"><h3>Found by archaeologists</h3>' + UL([
    'The Pilate stone (Caesarea, 1961): an inscription naming “[Pon]tius Pilatus”, prefect of Judea.',
    'The Caiaphas ossuary (Jerusalem, 1990): a bone box inscribed “Joseph son of Caiaphas”.',
    'The heel bone of Yehohanan (Jerusalem, 1968): the first crucified man’s remains identified, with the nail still in place. A second, also with a nail through the heel, was found at Fenstanton, England (published 2021).',
    'The temple warning notices (1871, 1935), and the stones thrown down from the temple in AD 70.',
]) + '</div>'
section('history', 'Outside the Bible', 'What Roman and Jewish writers recorded, with how much weight each can bear.', history + archaeology + world)

# ---------------------------------------------------------------- Old Testament
OT = [
    ('The Passover lamb', 'Exodus 12', 'A lamb without blemish, killed at twilight, its blood on the doorposts, “you may not break any of the bones” (Exodus 12:46).', 'John 19:36; 1 Corinthians 5:7 (John 1:29, “the Lamb of God”, may also echo it)'),
    ('The suffering servant', 'Isaiah 53', '“But He was pierced for our transgressions, He was crushed for our iniquities; the punishment that brought us peace was upon Him, and by His stripes we are healed” (Isaiah 53:5).', 'Luke 22:37; Acts 8:32–35; 1 Peter 2:22–25'),
    ('Psalm 22', 'Psalm 22:1, 8, 18', 'The psalm that begins “My God, My God, why have You forsaken Me?”, with the mocking and the casting of lots for clothing.', 'Mark 15:34; Matthew 27:43; John 19:24'),
    ('The king on a donkey', 'Zechariah 9:9', '“See, your King comes to you… humble and riding on a donkey.”', 'Matthew 21:4–5; John 12:14–15'),
    ('The rejected stone', 'Psalm 118:22', '“The stone the builders rejected has become the cornerstone.”', 'Mark 12:10–11; Acts 4:11; 1 Peter 2:7'),
    ('Thirty pieces of silver', 'Zechariah 11:12–13', 'Wages of thirty pieces of silver, thrown “to the potter” in the house of the Lord.', 'Matthew 27:9–10, which names Jeremiah; the closest wording is Zechariah’s'),
    ('The new covenant', 'Jeremiah 31:31', '“The days are coming… when I will make a new covenant with the house of Israel.”', 'Luke 22:20; Hebrews 8:8'),
    ('The struck shepherd', 'Zechariah 13:7', 'Strike the shepherd, and the sheep will be scattered.', 'Mark 14:27'),
    ('The pierced one', 'Zechariah 12:10', '“They will look on Me, the One they have pierced.”', 'John 19:37'),
    ('Hung on a tree', 'Deuteronomy 21:23', 'Anyone hung on a tree is under God’s curse.', 'Galatians 3:13'),
    ('Not abandoned to the grave', 'Psalm 16:10', '“You will not abandon my soul to Sheol, nor will You let Your Holy One see decay.”', 'Acts 2:27–31; Acts 13:35'),
    ('The sign of Jonah', 'Jonah 1:17', 'Three days and three nights in the belly of the great fish.', 'Matthew 12:40'),
    ('Death swallowed up', 'Isaiah 25:8; Hosea 13:14', '“He will swallow up death forever.” “Where, O Death, are your plagues?”', '1 Corinthians 15:54–55'),
    ('Received back from death', 'Genesis 22', 'Abraham and Isaac on the mountain.', 'Hebrews 11:19: “Abraham reasoned that God could raise the dead, and in a sense, he did receive Isaac back from death.”'),
]
ot = '<ul class="ot">' + ''.join(f'<li><b>{html.escape(t)}</b><span class="ot-ref">{fmt(r)}</span>{fmt(d)}<small>In the New Testament: {fmt(c)}</small></li>' for t, r, d, c in OT) + '</ul>'
ot += P('Paul says Christ “was raised on the third day according to the Scriptures” (1 Corinthians 15:4) without naming a passage; Hosea 6:2 is often compared. Jesus Himself, on the road to Emmaus, explained “what was written in all the Scriptures about Himself” (Luke 24:27).')
section('ot', 'What the Old Testament said', 'Only passages the New Testament itself quotes or points to, with where it does so.', ot)

# ---------------------------------------------------------------- meaning
meaning = P('The New Testament does not tell the cross and the empty tomb as a tragedy with a happy ending. It proclaims a victory: death itself defeated. In its own words:') + ''.join(Q(t, r) for t, r in [
    ('“For even the Son of Man did not come to be served, but to serve, and to give His life as a ransom for many.”', 'Mark 10:45'),
    ('“He Himself bore our sins in His body on the tree, so that we might die to sin and live to righteousness.”', '1 Peter 2:24'),
    ('“Christ died for our sins according to the Scriptures, that He was buried, that He was raised on the third day according to the Scriptures.”', '1 Corinthians 15:3–4'),
    ('“But God raised Him from the dead, releasing Him from the agony of death, because it was impossible for Him to be held in its clutches.”', 'Acts 2:24'),
    ('“Since Christ was raised from the dead, He cannot die again; death no longer has dominion over Him.”', 'Romans 6:9'),
    ('“By His death He might destroy him who holds the power of death, that is, the devil, and free those who all their lives were held in slavery by their fear of death.”', 'Hebrews 2:14–15'),
    ('“Christ Jesus, who has abolished death and illuminated the way to life and immortality through the gospel.”', '2 Timothy 1:10'),
    ('“But Christ has indeed been raised from the dead, the firstfruits of those who have fallen asleep.”', '1 Corinthians 15:20'),
    ('“Death has been swallowed up in victory.” “Where, O Death, is your victory? Where, O Death, is your sting?” … “But thanks be to God, who gives us the victory through our Lord Jesus Christ!”', '1 Corinthians 15:54–57'),
    ('“I am the resurrection and the life. Whoever believes in Me will live, even though he dies.”', 'John 11:25'),
    ('“I was dead, and behold, now I am alive forever and ever! And I hold the keys of Death and of Hades.”', 'Revelation 1:18'),
]) + P('Paul lists those the risen Christ appeared to: Peter, the Twelve, more than five hundred at once, “most of whom are still living”, James, all the apostles, and last Paul himself (1 Corinthians 15:5–8).')
section('meaning', 'What it means', 'Victory over death, in the New Testament’s own words.', meaning)

# ---------------------------------------------------------------- page
nav = ''.join(f'<a href="#{sid}">{html.escape(t)}</a>' for sid, t, _, _ in SECTIONS)
body = ''.join(f'<section id="{sid}"><h2>{html.escape(t)}</h2><p class="intro">{fmt(i)}</p>{b}</section>' for sid, t, i, b in SECTIONS)
page = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Holy Week · The Way</title>
<meta name="description" content="A guide to Holy Week: day by day, the people, the temple, the cross, the tomb, the women at the tomb, what history recorded, what the Old Testament said, and what it means.">
<meta name="theme-color" content="#F4EEE2">
<meta property="og:title" content="Holy Week · The Way">
<meta property="og:description" content="Day by day, the people, the cross, the tomb, the women, history outside the Bible, the Old Testament, and the victory over death.">
<meta property="og:image" content="https://stinsoniot.github.io/the-way-gospel-atlas/s/hw.jpg">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 14 14'%3E%3Cpath d='M7,0 L8.6,5.4 L14,7 L8.6,8.6 L7,14 L5.4,8.6 L0,7 L5.4,5.4 Z' fill='%23B4532A'/%3E%3C/svg%3E">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
<link rel="manifest" href="manifest.webmanifest">
<link rel="stylesheet" href="css/fonts.css?v=1">
<link rel="stylesheet" href="css/page.css?v=5">
</head>
<body class="guide">
<header class="bar">
  <a href="./?guide=holyweek#s-hw"><svg viewBox="0 0 14 14" aria-hidden="true"><path d="M7,0 L8.6,5.4 L14,7 L8.6,8.6 L7,14 L5.4,8.6 L0,7 L5.4,5.4 Z"/></svg><span class="bk">Back to the atlas</span><span class="sh">Atlas</span></a>
  <nav aria-label="Pages"><a href="holyweek.html" aria-current="page">Holy Week</a><a href="about.html">About</a><a href="sources.html">Sources</a></nav>
</header>
<nav class="toc" aria-label="On this page">{nav}</nav>
<main>
<p class="eyebrow">A guide</p>
<h1>Holy <em>Week.</em></h1>
<p class="lede">The last week of Jesus’ life fills a third of the Gospels. This guide gathers what the text says, what history and archaeology add, and what the New Testament found foretold in the Old, so the story can be read more deeply.</p>
<p class="small">Quotations are from the Berean Standard Bible. Scripture links open the passage here, with study notes; <a class="scene" href="./?guide=holyweek#s-hw">place links</a> open the scene on the map. Use <b>Back to Holy Week guide</b> to return to your place here. Where the evidence is debated, the guide says so.</p>
{body}
<a class="btn" href="./?guide=holyweek#s-hw">Walk through Holy Week on the map</a>
<footer>Scripture quotations: Berean Standard Bible (public domain). Josephus is quoted from William Whiston’s translation; Tacitus from Church and Brodribb. Corrections are welcome on <a href="https://github.com/StinsonIoT/the-way-gospel-atlas/issues">GitHub</a>.</footer>
</main>
<script src="js/reader-lite.js?v=4"></script>
</body>
</html>
'''
open(os.path.join(REPO, 'holyweek.html'), 'w').write(page)
print('wrote holyweek.html', len(page), 'bytes;', len(SECTIONS), 'sections')
