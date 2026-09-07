// Frasi utili in giapponese.
//
// Perché stanno qui e non su un traduttore: in metropolitana non c'è rete, e
// alla cassa di un izakaya non si apre un'app, si mostra lo schermo. Ogni frase
// ha tre righe — giapponese grande (da FAR LEGGERE a qualcuno), lettura in
// caratteri latini (da PROVARE A DIRE), italiano (per noi).
//
// La lettura latina è in stile Hepburn ma scritta come si legge in ITALIANO:
// "sh" = sc di scena, "ch" = c di cena, "j" = g di gelo, "u" quasi muta a fine
// parola (arigatō gozaimasu → "arigatò gozaimàs").
window.TRAVI_FRASI = [
  {
    gruppo: "Le sei che servono davvero",
    voci: [
      { ja: "すみません", ro: "sumimasen", it: "Scusi / mi scusi (anche per chiamare un cameriere)" },
      { ja: "ありがとうございます", ro: "arigatō gozaimasu", it: "Grazie (formale, va sempre bene)" },
      { ja: "お願いします", ro: "onegaishimasu", it: "Per favore / sì, grazie (quando accettate qualcosa)" },
      { ja: "大丈夫です", ro: "daijōbu desu", it: "Va bene così / no grazie (gentile, chiude il discorso)" },
      { ja: "はい / いいえ", ro: "hai / iie", it: "Sì / no" },
      { ja: "英語は話せますか？", ro: "eigo wa hanasemasu ka?", it: "Parla inglese?" },
    ],
  },
  {
    gruppo: "Presentarsi",
    voci: [
      { ja: "はじめまして", ro: "hajimemashite", it: "Piacere di conoscerla" },
      { ja: "イタリアから来ました", ro: "Itaria kara kimashita", it: "Veniamo dall'Italia" },
      { ja: "新婚旅行です", ro: "shinkon ryokō desu", it: "Siamo in viaggio di nozze" },
      { ja: "日本語は話せません", ro: "nihongo wa hanasemasen", it: "Non parlo giapponese" },
      { ja: "もう一度お願いします", ro: "mō ichido onegaishimasu", it: "Può ripetere, per favore?" },
      { ja: "ゆっくりお願いします", ro: "yukkuri onegaishimasu", it: "Più lentamente, per favore" },
    ],
  },
  {
    gruppo: "Al ristorante",
    voci: [
      { ja: "二人です", ro: "futari desu", it: "Siamo in due" },
      { ja: "メニューをお願いします", ro: "menyū o onegaishimasu", it: "Il menù, per favore" },
      { ja: "英語のメニューはありますか？", ro: "eigo no menyū wa arimasu ka?", it: "Avete un menù in inglese?" },
      { ja: "これをお願いします", ro: "kore o onegaishimasu", it: "Questo, per favore (indicando)" },
      { ja: "おすすめは何ですか？", ro: "osusume wa nan desu ka?", it: "Cosa consiglia?" },
      { ja: "いただきます", ro: "itadakimasu", it: "Si dice prima di mangiare" },
      { ja: "ごちそうさまでした", ro: "gochisōsama deshita", it: "Si dice alla fine: grazie, era ottimo" },
      { ja: "おいしいです", ro: "oishii desu", it: "È buonissimo" },
      { ja: "お会計をお願いします", ro: "o-kaikei o onegaishimasu", it: "Il conto, per favore" },
      { ja: "水をください", ro: "mizu o kudasai", it: "Dell'acqua, per favore" },
      { ja: "生ビールを二つ", ro: "nama bīru o futatsu", it: "Due birre alla spina" },
      { ja: "持ち帰りできますか？", ro: "mochikaeri dekimasu ka?", it: "Si può portare via?" },
    ],
  },
  {
    gruppo: "Allergie e cose che non mangiamo",
    nota: "Da mostrare, non da dire: si passa il telefono e si aspetta il sì o il no.",
    voci: [
      { ja: "アレルギーがあります", ro: "arerugī ga arimasu", it: "Ho un'allergia" },
      { ja: "これに乳製品は入っていますか？", ro: "kore ni nyūseihin wa haitte imasu ka?", it: "Contiene latticini?" },
      { ja: "これに卵は入っていますか？", ro: "kore ni tamago wa haitte imasu ka?", it: "Contiene uova?" },
      { ja: "肉なしでお願いします", ro: "niku nashi de onegaishimasu", it: "Senza carne, per favore" },
      { ja: "辛くしないでください", ro: "karaku shinaide kudasai", it: "Non piccante, per favore" },
      { ja: "わさび抜きでお願いします", ro: "wasabi nuki de onegaishimasu", it: "Senza wasabi, per favore" },
    ],
  },
  {
    gruppo: "Muoversi",
    voci: [
      { ja: "駅はどこですか？", ro: "eki wa doko desu ka?", it: "Dov'è la stazione?" },
      { ja: "トイレはどこですか？", ro: "toire wa doko desu ka?", it: "Dov'è il bagno?" },
      { ja: "この電車は〜に行きますか？", ro: "kono densha wa … ni ikimasu ka?", it: "Questo treno va a…?" },
      { ja: "何番線ですか？", ro: "nanbansen desu ka?", it: "Quale binario?" },
      { ja: "ここに行きたいです", ro: "koko ni ikitai desu", it: "Vorrei andare qui (mostrando l'indirizzo)" },
      { ja: "歩いてどのくらいですか？", ro: "aruite dono kurai desu ka?", it: "Quanto ci vuole a piedi?" },
      { ja: "道に迷いました", ro: "michi ni mayoimashita", it: "Ci siamo persi" },
      { ja: "タクシーを呼んでもらえますか？", ro: "takushī o yonde moraemasu ka?", it: "Può chiamarci un taxi?" },
      { ja: "荷物を預けられますか？", ro: "nimotsu o azukeraremasu ka?", it: "Posso lasciare i bagagli?" },
    ],
  },
  {
    gruppo: "In hotel e in ryokan",
    voci: [
      { ja: "チェックインお願いします", ro: "chekku-in onegaishimasu", it: "Vorrei fare il check-in" },
      { ja: "予約しています", ro: "yoyaku shite imasu", it: "Abbiamo una prenotazione" },
      { ja: "何時からですか？", ro: "nanji kara desu ka?", it: "Da che ora?" },
      { ja: "朝食は何時ですか？", ro: "chōshoku wa nanji desu ka?", it: "A che ora è la colazione?" },
      { ja: "温泉は何時までですか？", ro: "onsen wa nanji made desu ka?", it: "Fino a che ora è aperto l'onsen?" },
      { ja: "浴衣のサイズを変えてもらえますか？", ro: "yukata no saizu o kaete moraemasu ka?", it: "Posso cambiare taglia di yukata?" },
      { ja: "Wi-Fiのパスワードを教えてください", ro: "Wi-Fi no pasuwādo o oshiete kudasai", it: "Mi dice la password del Wi-Fi?" },
    ],
  },
  {
    gruppo: "Comprare",
    voci: [
      { ja: "いくらですか？", ro: "ikura desu ka?", it: "Quanto costa?" },
      { ja: "カードで払えますか？", ro: "kādo de haraemasu ka?", it: "Si può pagare con la carta?" },
      { ja: "見ているだけです", ro: "mite iru dake desu", it: "Sto solo guardando" },
      { ja: "免税できますか？", ro: "menzei dekimasu ka?", it: "Si può fare il tax free?" },
      { ja: "袋はいりません", ro: "fukuro wa irimasen", it: "Non serve il sacchetto" },
      { ja: "試着してもいいですか？", ro: "shichaku shite mo ii desu ka?", it: "Posso provarlo?" },
      { ja: "写真を撮ってもいいですか？", ro: "shashin o totte mo ii desu ka?", it: "Posso fare una foto?" },
      { ja: "写真を撮ってもらえますか？", ro: "shashin o totte moraemasu ka?", it: "Ci fa una foto?" },
    ],
  },
  {
    gruppo: "Se qualcosa va storto",
    nota: "Emergenze: 119 ambulanza e pompieri, 110 polizia. Si può chiamare anche senza SIM giapponese.",
    voci: [
      { ja: "助けてください", ro: "tasukete kudasai", it: "Aiuto, per favore" },
      { ja: "気分が悪いです", ro: "kibun ga warui desu", it: "Mi sento male" },
      { ja: "病院に連れて行ってください", ro: "byōin ni tsurete itte kudasai", it: "Mi porti in ospedale, per favore" },
      { ja: "薬局はどこですか？", ro: "yakkyoku wa doko desu ka?", it: "Dov'è la farmacia?" },
      { ja: "財布をなくしました", ro: "saifu o nakushimashita", it: "Ho perso il portafoglio" },
      { ja: "パスポートをなくしました", ro: "pasupōto o nakushimashita", it: "Ho perso il passaporto" },
      { ja: "警察を呼んでください", ro: "keisatsu o yonde kudasai", it: "Chiami la polizia, per favore" },
      { ja: "イタリア大使館に連絡したいです", ro: "Itaria taishikan ni renraku shitai desu", it: "Devo contattare l'ambasciata italiana" },
    ],
  },
  {
    gruppo: "Numeri",
    nota: "Per ordinare basta quasi sempre indicare e dire quanti: hitotsu, futatsu, mittsu…",
    voci: [
      { ja: "一つ / 二つ / 三つ", ro: "hitotsu / futatsu / mittsu", it: "Uno / due / tre (di oggetti)" },
      { ja: "一 二 三 四 五", ro: "ichi ni san yon go", it: "1 2 3 4 5" },
      { ja: "六 七 八 九 十", ro: "roku nana hachi kyū jū", it: "6 7 8 9 10" },
      { ja: "百 / 千 / 万", ro: "hyaku / sen / man", it: "100 / 1.000 / 10.000 — attenzione: 一万 = 10.000 yen" },
    ],
  },
];
