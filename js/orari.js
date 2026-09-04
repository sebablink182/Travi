// Orari di apertura e chiusura delle tappe.
//
// Confermati da Seb il 03/09/2026 sulla pagina orari.html, partendo da una mia
// proposta. Vanno RICONTROLLATI vicino alla partenza: in Giappone molti luoghi
// cambiano orario con la stagione (Kenrokuen, per dire, chiude prima da metà
// ottobre). Per aggiornarli si riapre orari.html.
//
//   tipo "orari"  → ha un orario di chiusura che vincola la giornata
//   tipo "sempre" → accessibile a qualunque ora; ap/ch, se ci sono, riguardano
//                   una parte interna (l'ufficio del santuario, il museo del
//                   parco, i negozi della via) e sono solo un'informazione,
//                   non un limite. Sono le tappe spostabili a fine giornata.
window.TRAVI_ORARI = {
  s301:  {tipo:"orari",  ap:"06:00", ch:"17:00"},
  s302:  {tipo:"orari",  ap:"10:00", ch:"17:00"},
  s303:  {tipo:"orari",  ap:"10:00", ch:"22:00"},
  s601:  {tipo:"orari",  ap:"09:00", ch:"17:00"},
  s602:  {tipo:"orari",  ap:"06:00", ch:"21:00"},
  s603:  {tipo:"sempre", ap:"08:30", ch:"17:00"},
  s701:  {tipo:"orari",  ap:"07:00", ch:"18:00"},
  s702:  {tipo:"sempre", ap:"09:00", ch:"17:00"},
  s705:  {tipo:"sempre"},
  s801:  {tipo:"orari",  ap:"09:00", ch:"17:00"},
  s802:  {tipo:"sempre"},
  s803:  {tipo:"sempre"},
  s804:  {tipo:"orari",  ap:"09:00", ch:"18:00"},
  s901:  {tipo:"orari",  ap:"06:00", ch:"18:00"},
  s902:  {tipo:"sempre", ap:"09:00", ch:"18:00"},
  s903:  {tipo:"sempre"},
  s1101: {tipo:"sempre", ap:"08:30", ch:"18:00"},
  s1103: {tipo:"orari",  ap:"06:30", ch:"18:00"},
  s1201: {tipo:"sempre"},
  s1202: {tipo:"sempre"},
  s1303: {tipo:"sempre"},
  s1304: {tipo:"sempre"}
};
