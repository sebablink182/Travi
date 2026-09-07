// Idee per città — quello che si fa nei pomeriggi liberi.
//
// Nel piano ci sono già i posti grossi. Questi sono gli altri: le cose che si
// cercano quando il pomeriggio è libero, quando piove, quando si è stanchi e
// si vuole qualcosa vicino, o quando è l'ultima sera e si vuole che sia bella.
// Ognuna si salva nei Preferiti con un tocco, e da lì "Pianifica" la mette nel
// giorno dove ci sta davvero.
//
// TUTTE le voci sono state controllate su fonti vere il 7 settembre 2026:
// orari, giorni di chiusura, prenotazioni obbligatorie, prezzi, e se il posto
// esiste ancora. Due cose sono state TOLTE proprio per questo — la crociera
// GINGA di Hiroshima (chiude) e il kagura del mercoledì (giorno sbagliato).
//
// ⚠️ Vanno RICONTROLLATE nei mesi prima di partire: prezzi e orari cambiano, e
// per il 2027 alcuni calendari non erano ancora usciti (le partite dei Carp, la
// stagione del bar sul tetto della Orizuru Tower, le mostre del Nezu).
//
// I giorni della settimana del viaggio, che qui contano parecchio:
//   Tokyo 6-8 mag = gio/ven/sab · Hakone 9 = dom · Kanazawa 10 = LUNEDÌ
//   Kyoto 11-13 = mar/mer/gio · Hiroshima 14 = ven · Miyajima 15-16 = sab/dom
//   Osaka 17 = LUNEDÌ
// I due lunedì sono il motivo per cui certi musei ovvi non sono in questa
// lista: sarebbero chiusi.
window.TRAVI_IDEE = [
  {
    citta: "Tokyo",
    voci: [
      { titolo: "Nezu Museum", zona: "Minami-Aoyama, Tokyo", perche: "Dietro le vetrine di Omotesando, un giardino con stagni, lanterne e sentieri di pietra: silenzio totale a dieci minuti dal caos.", quando: "10-17, ultimo ingresso 16:30; chiuso il lunedì", durata: 90, lat: 35.66224, lon: 139.71726, nota: "Biglietto online a fascia oraria, più economico. A metà maggio spesso è esposto il paravento degli iris di Kōrin." },
      { titolo: "teamLab Borderless", zona: "Azabudai Hills, Minato, Tokyo", perche: "Sale buie dove le opere migrano da una stanza all'altra e vi seguono: si gira mano nella mano, senza mappa e senza percorso.", quando: "La sera dopo le 18, meno famiglie", durata: 150, lat: 35.66200, lon: 139.74342, nota: "Trasferito da Odaiba ad Azabudai nel 2024. Biglietto a data e ora, 3.800-4.800 ¥: si prenota settimane prima." },
      { titolo: "Bunkyo Civic Center", zona: "Kasuga, Bunkyo, Tokyo", perche: "Terrazza gratuita al 25° piano: Shinjuku, il Tokyo Dome e col cielo pulito il Fuji al tramonto, quasi senza turisti.", quando: "9-20:30; arrivare 30 min prima del tramonto", durata: 45, lat: 35.70801, lon: 139.75222, nota: "Gratis e senza prenotazione. Linea Marunouchi da Ikebukuro, ascensore dedicato dalla hall del municipio." },
      { titolo: "Yanaka Ginza", zona: "Yanaka, Taito, Tokyo", perche: "Centosettanta metri di botteghe e cibo di strada, con la scalinata Yuyake Dandan che al tramonto guarda dritta nel sole.", quando: "Verso il tramonto; i banchi chiudono alle 19", durata: 90, lat: 35.72767, lon: 139.76586 },
      { titolo: "Kagurazaka", zona: "Kagurazaka, Shinjuku, Tokyo", perche: "Vicoli lastricati dietro la salita, fra case da tè di legno e bistrot francesi: il quartiere dove Tokyo somiglia a Kyoto.", quando: "La sera dopo le 18, vicoli illuminati", durata: 120, lat: 35.70141, lon: 139.73946 },
      { titolo: "Giardino dell'Hotel Chinzanso", zona: "Sekiguchi, Bunkyo, Tokyo", perche: "A due fermate da Ikebukuro: giardino con pagoda del Settecento e un mare di nebbia illuminata che sale ogni ora dopo il buio.", quando: "Nebbia illuminata dalle 18:40 alle 22:40", durata: 75, lat: 35.71332, lon: 139.72596, nota: "Il giardino è riservato a chi usa l'hotel: basta prenotare un tavolo, un drink o il tè del pomeriggio." },
      { titolo: "Tsukishima Monja Street", zona: "Tsukishima, Chuo, Tokyo", perche: "Una via intera di locali dove il monjayaki lo cuocete voi sulla piastra: cena disordinata, economica e da ridere in due.", quando: "A cena dalle 18; molti chiusi il lunedì", durata: 90, lat: 35.66428, lon: 139.78246, nota: "Nei locali più noti si fa la fila: andarci presto, o prenotare il tavolo." },
      { titolo: "Kabukiza Theatre", zona: "Ginza, Chuo, Tokyo", perche: "Un solo atto di kabuki dal quarto piano al prezzo di due birre: un'ora di teatro vero senza impegnare tutta la serata.", quando: "Biglietti per un atto solo, il giorno stesso", durata: 75, lat: 35.66966, lon: 139.76811, nota: "Coda sul lato dell'edificio, quarto piano non numerato, 1.500-3.500 ¥. Programma di maggio su kabukiweb.net." },
    ],
  },
  {
    citta: "Hakone",
    nota: "Si arriva nel pomeriggio del 9 e si riparte la mattina dopo: qui dentro ci stanno una cosa la sera e una prima del treno.",
    voci: [
      { titolo: "Hakone Yuryo", zona: "Tonosawa, Hakone-Yumoto", perche: "Diciannove bagni all'aperto privati nel bosco, solo per voi due, con navetta gratuita a un minuto dalla stazione di Yumoto.", quando: "La domenica fino alle 21, ultimo ingresso 19", durata: 120, lat: 35.23383, lon: 139.09583, nota: "Prenotazione online entro le 15 del giorno prima. Stanza per due 11.400 ¥ per due ore nei festivi." },
      { titolo: "Botteghe di Hakone-Yumoto", zona: "Hakone-Yumoto", perche: "Duecento metri di botteghe fra la stazione e il fiume: manju appena sfornati, wasabi fresco, assaggi gratis camminando.", quando: "Subito all'arrivo: quasi tutto chiude alle 18", durata: 60, lat: 35.23250, lon: 139.10220 },
      { titolo: "Amazake Chaya", zona: "Hatajuku, Hakone", perche: "Casa da tè col tetto di paglia sull'antica Tokaido, aperta da quattro secoli: amazake caldo e mochi davanti al focolare.", quando: "7:00-17:30, perfetta la mattina della partenza", durata: 40, lat: 35.20203, lon: 139.04871, nota: "Sulla linea del bus Yumoto - Moto-Hakone, fermata Amazake-chaya. Amazake circa 400 ¥." },
      { titolo: "Torii della pace, lago Ashi", zona: "Moto-Hakone, Hakone", perche: "Il torii rosso in piedi dentro il lago: all'alba è vuoto e silenzioso e la foto la fate senza nessuno alle spalle.", quando: "All'alba o prima delle 8; di pomeriggio c'è fila", durata: 60, lat: 35.20274, lon: 139.02574, nota: "Gratis e sempre aperto, ma di pomeriggio la coda per la foto sul pontile arriva a 30-60 minuti." },
      { titolo: "Cascate Chisuji", zona: "Kowakidani, Hakone", perche: "Sette minuti di sentiero nel bosco e una cascata larga e bassa su roccia coperta di muschio: nessun negozio, nessun rumore.", quando: "Al mattino presto; sentiero senza illuminazione", durata: 45, lat: 35.23501, lon: 139.05035, nota: "Gratis e sempre accessibile, ma scarpe chiuse: il sentiero resta umido." },
    ],
  },
  {
    citta: "Kanazawa",
    nota: "Il 10 maggio 2027 è un LUNEDÌ: il museo D.T. Suzuki e il museo d'arte contemporanea sono chiusi. Per questo non sono in lista.",
    voci: [
      { titolo: "Myoryuji (Ninja-dera)", zona: "Nomachi, Kanazawa", perche: "Botole, scale segrete e stanze nascoste in un tempio del 1643: la visita è un gioco a due, non un museo.", quando: "9:00-16:30, visita guidata di 40 minuti", durata: 45, lat: 36.5554, lon: 136.649, nota: "Prenotazione obbligatoria per telefono (076-241-0888), 1.200 ¥ a testa, solo contanti." },
      { titolo: "Mercato Omicho", zona: "Omicho, Kanazawa", perche: "Duecento banchi di pesce del Mar del Giappone: kaisendon e ostriche aperte davanti a voi, mangiate in piedi.", quando: "Prima delle 11, poi si fa la fila", durata: 75, lat: 36.5717, lon: 136.656, nota: "Aperto 9:00-17:30, ma molti banchi chiudono mercoledì e domenica e in parecchi si paga solo in contanti." },
      { titolo: "Kazuemachi", zona: "Kazuemachi, Kanazawa", perche: "Il quartiere delle geishe più piccolo e silenzioso: vicoli di legno sul fiume Asano che si accendono di lanterne al tramonto.", quando: "Al tramonto o dopo cena, poca gente", durata: 60, lat: 36.5723, lon: 136.6636, nota: "È una zona ancora abitata: la sera si parla piano. La passeggiata è gratis." },
      { titolo: "Casa dei samurai Nomura", zona: "Nagamachi, Kanazawa", perche: "Mura di terra e canali fuori, dentro un giardinetto con carpe che si guarda seduti sul tatami: dieci minuti di silenzio.", quando: "Pomeriggio, aperta 8:30-17:30", durata: 75, lat: 36.5641, lon: 136.65, nota: "Ingresso 550 ¥ — ma il quartiere di Nagamachi si gira gratis." },
      { titolo: "Fukumitsuya", zona: "Ishibiki, Kanazawa", perche: "Il più antico produttore di sake della città, dal 1625: degustazione guidata di junmai in un negozio di legno, niente folla.", quando: "10:00-18:00, degustazione su prenotazione", durata: 60, lat: 36.5537, lon: 136.6723, nota: "Corso di degustazione 3.300 ¥ su prenotazione. Chiusure irregolari: meglio scrivere prima." },
    ],
  },
  {
    citta: "Kyoto",
    voci: [
      { titolo: "Pontocho", zona: "Nakagyo-ku, Kyoto", perche: "Vicolo di 500 metri largo due persone; da inizio maggio i ristoranti aprono le terrazze di legno sospese sul fiume Kamo.", quando: "Dopo le 18, con le lanterne accese", durata: 120, lat: 35.0055, lon: 135.7712, nota: "Le terrazze sul Kamo aprono dal 1° maggio: si prenota, i tavoli sul fiume finiscono subito." },
      { titolo: "Villa imperiale di Katsura", zona: "Katsura, Nishikyo-ku, Kyoto", perche: "Il giardino da passeggio più bello del Giappone, in gruppi piccoli: un'ora di ponti, muschio e case da tè sull'acqua.", quando: "Turni fissi 9:00-15:00, chiuso il lunedì", durata: 90, lat: 34.9839, lon: 135.7103, nota: "Prenotazione online con passaporto sul sito dell'Agenzia Imperiale, 1.000 ¥. Pochi posti: si prenota mesi prima." },
      { titolo: "Acquedotto di Nanzen-ji", zona: "Okazaki, Sakyo-ku, Kyoto", perche: "Un acquedotto di mattoni del 1888 in mezzo a un tempio zen: archi, muschio e nessuno, se ci si va prima delle 9.", quando: "Presto la mattina; l'area è sempre aperta", durata: 75, lat: 35.0112, lon: 135.7941, nota: "Acquedotto e viali sono gratis; i giardini dei sottotempli si pagano a parte." },
      { titolo: "Museo del sake Gekkeikan Okura", zona: "Fushimi, Kyoto", perche: "A un quarto d'ora da Fushimi Inari: canale con i battelli, magazzini neri di cedro e tre assaggi di sake compresi.", quando: "9:30-16:30, ultimo ingresso alle 16", durata: 60, lat: 34.9289, lon: 135.7616, nota: "600 ¥ con degustazione e bottiglietta in omaggio." },
      { titolo: "Cerimonia del tè Camellia", zona: "Ninenzaka, Higashiyama, Kyoto", perche: "Cerimonia spiegata in inglese in una casa di legno su Ninenzaka: il matcha lo montate voi, in otto persone al massimo.", quando: "Turni ogni ora 10:00-17:00, dura 45 minuti", durata: 45, lat: 34.9985, lon: 135.781, nota: "Prenotazione online obbligatoria, 4.000-5.000 ¥ a testa. Aperto tutti i giorni." },
      { titolo: "Kamishichiken", zona: "Kamigyo-ku, Kyoto", perche: "Il più antico quartiere delle geishe di Kyoto, accanto a Kitano Tenmangu: le lanterne di Gion senza la calca di Gion.", quando: "Verso le 17-18, quando aprono le case da tè", durata: 60, lat: 35.0278, lon: 135.7394 },
      { titolo: "Shinnyo-do", zona: "Sakyo-ku, Kyoto", perche: "Pagoda e aceri verdi a dieci minuti dal Sentiero della Filosofia, ma vuoto: ci si siede sulla veranda e basta.", quando: "9:00-16:00, ultimo ingresso 15:45", durata: 60, lat: 35.0212, lon: 135.7893, nota: "Il giardino esterno è gratis; sala principale e giardini 500 ¥. Aperto tutti i giorni." },
      { titolo: "Mercato Demachi Masugata", zona: "Demachiyanagi, Kyoto", perche: "Mercato coperto di quartiere vero: mochi ai fagioli da Demachi Futaba e poi picnic sulla punta del delta del Kamo.", quando: "Tardo mattino — ma NON di martedì", durata: 75, lat: 35.0303, lon: 135.77, nota: "Demachi Futaba chiude il martedì (l'11 maggio 2027 è martedì) e il quarto mercoledì. Coda di 20-30 minuti." },
    ],
  },
  {
    citta: "Hiroshima",
    voci: [
      { titolo: "Shukkei-en", zona: "Naka-ku, Hiroshima", perche: "Giardino del 1620 con laghetto, isolotti e ponti: dieci minuti dal Parco della Pace, ma quasi vuoto nel tardo pomeriggio.", quando: "Tardo pomeriggio: chiude alle 18", durata: 60, lat: 34.4005, lon: 132.467, nota: "Ingresso 350 ¥, orario 9-18 da metà marzo, ultimo ingresso 17:30." },
      { titolo: "Ekinishi", zona: "Osuka-cho, Minami-ku, Hiroshima", perche: "Vicoli anni Cinquanta dietro la stazione, bar da sei posti: si cena spostandosi di locale in locale, quasi senza turisti.", quando: "Dalle 18; il venerdì si riempie presto", durata: 150, lat: 34.4003, lon: 132.47, nota: "Locali minuscoli e spesso solo contanti. Ultimo tram verso il centro intorno alle 23:30." },
      { titolo: "Orizuru Tower", zona: "Otemachi, Naka-ku, Hiroshima", perche: "Terrazza in legno accanto alla Cupola: un cocktail agli agrumi al tramonto, con la città illuminata sotto e nessuna coda.", quando: "Bar sul tetto 18-23; l'osservatorio chiude alle 18", durata: 90, lat: 34.39567, lon: 132.45469, nota: "Il bar sul tetto è stagionale (da fine aprile a ottobre), ingresso 1.500 ¥ a persona. Stagione 2027 da confermare." },
      { titolo: "Partita dei Hiroshima Carp", zona: "Minami-ku, Hiroshima", perche: "Una partita dei Carp è la serata più allegra della città: birra portata al posto, cori continui e zero altri stranieri intorno.", quando: "Sera, solo se c'è partita in casa", durata: 210, lat: 34.39191, lon: 132.48462, nota: "Il calendario 2027 non è ancora uscito. I biglietti si esauriscono: vanno presi appena escono." },
    ],
  },
  {
    citta: "Miyajima",
    nota: "Sull'isola si paga una tassa di ingresso di 100 ¥ a testa, dentro il biglietto del traghetto. Il 16 è il giorno lento: qui sotto ce n'è per riempirlo senza correre.",
    voci: [
      { titolo: "Crociera notturna sotto il torii", zona: "Pontile n.3, Miyajima", perche: "Trenta minuti di barca fin sotto il torii illuminato: si esce dal ryokan dopo cena e in acqua non c'è praticamente nessuno.", quando: "Partenze 17:55-21:15, meglio con alta marea", durata: 30, lat: 34.3031, lon: 132.32262, nota: "Prenotazione obbligatoria almeno 2 ore prima, pagamento solo in contanti, 2.000 ¥ a testa." },
      { titolo: "Machiya-dori", zona: "Miyajima", perche: "La via parallela all'Omotesando: case di mercanti restaurate, gallerie e caffè, senza la calca dei gitanti giornalieri.", quando: "Dopo le 17, quando i traghetti si svuotano", durata: 60, lat: 34.29844, lon: 132.3224 },
      { titolo: "Centro dell'artigianato di Miyajima", zona: "Miyajima", perche: "Si cuociono da sé i momiji-manju o si intaglia un cucchiaio di legno: un'ora lenta in due, e funziona anche se piove.", quando: "Laboratori 9:30-16, chiuso il lunedì", durata: 60, lat: 34.30208, lon: 132.32349, nota: "Solo su prenotazione (0829-44-1758): momiji-manju 1.000 ¥, cucchiaio 660 ¥." },
      { titolo: "Parco Omoto", zona: "Omoto, Miyajima", perche: "Pineta secolare in riva al mare a 25 minuti a piedi dal pontile: cervi, panchine e silenzio, perfetta per il giorno lento.", quando: "Metà mattina o al tramonto, sempre aperto", durata: 75, lat: 34.2946, lon: 132.3143 },
      { titolo: "Miyajima Brewery", zona: "Omotesando, Miyajima", perche: "Unico birrificio dell'isola: stout alle ostriche e IPA di produzione propria, bevute guardando il mare interno di Seto.", quando: "10:30-17, è un aperitivo pomeridiano", durata: 60, lat: 34.29803, lon: 132.32065, nota: "Chiusure irregolari annunciate sui social: meglio dare un'occhiata la mattina stessa." },
    ],
  },
  {
    citta: "Osaka",
    nota: "Il 17 maggio 2027 è un LUNEDÌ: i due musei d'arte di Nakanoshima sono chiusi. Per questo non sono in lista.",
    voci: [
      { titolo: "Roseto di Nakanoshima", zona: "Nakanoshima, Kita-ku, Osaka", perche: "Quattromila rose in piena fioritura a metà maggio, fra i due fiumi e i grattacieli: gratis, sempre aperto, quasi vuoto presto.", quando: "Prima mattina o poco prima del tramonto", durata: 45, lat: 34.69201, lon: 135.50898, nota: "Ingresso libero e sempre aperto. Il picco di fioritura va da inizio maggio a inizio giugno." },
      { titolo: "Hozenji Yokocho", zona: "Namba, Chuo-ku, Osaka", perche: "A due isolati dal frastuono di Dotonbori: vicolo lastricato con lanterne e il Fudo coperto di muschio da bagnare per un desiderio.", quando: "Dopo le 19, quando accendono le lanterne", durata: 60, lat: 34.66797, lon: 135.50332, nota: "I ristoranti del vicolo hanno pochi coperti: per cena conviene prenotare." },
      { titolo: "Nakazakicho", zona: "Kita-ku, Osaka", perche: "Case di legno scampate ai bombardamenti diventate caffè e negozi vintage: dieci minuti da Umeda e sembra un'altra città.", quando: "Pomeriggio, molti locali aprono a mezzogiorno", durata: 120, lat: 34.706, lon: 135.505, nota: "Chiusure irregolari, spesso martedì e mercoledì. Ai caffè più noti si fa la coda." },
      { titolo: "Sumiyoshi Taisha", zona: "Sumiyoshi-ku, Osaka", perche: "Ponte rosso ad arco e architettura più antica del buddhismo: ci si arriva col vecchio tram Hankai, e il viaggio è metà del piacere.", quando: "Mattina presto: apre alle 6, ingresso libero", durata: 75, lat: 34.613, lon: 135.4931, nota: "Tram Hankai da Ebisucho o Tennoji fino a Sumiyoshi-toriimae: 15 minuti, circa 230 ¥." },
      { titolo: "Museo della casa di Osaka", zona: "Tenjinbashi 6-chome, Osaka", perche: "Una strada di Osaka del 1830 ricostruita al coperto, con alba e tramonto finti ogni venti minuti: si gira in kimono a noleggio.", quando: "10-17, ultimo ingresso 16:30, chiuso il martedì", durata: 90, lat: 34.71047, lon: 135.51143, nota: "È stato chiuso per lavori fino a gennaio 2027: dovrebbe essere riaperto, ma va verificato prima di andarci." },
    ],
  },
];
