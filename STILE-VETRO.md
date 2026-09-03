# Travi — lo standard del vetro

> Regola di progetto. Vale per **tutto** ciò che nell'app è "vetro stile Apple",
> presente e futuro: pillole, bottoni sospesi, barre, schede traslucide, pannelli.
> Non è una preferenza di una schermata: è il materiale dell'app.

## I valori

Calibrati sull'iPhone vero il **3 settembre 2026** con `pillola.html`, muovendo i
cursori dal vivo sopra contenuti chiari, scuri e colorati.

**Codice scelto: `SB-22-5-170-25-30`**

| | valore | |
|---|---|---|
| velo | `rgba(30,30,32,.22)` | scuro, 22% |
| sfocatura | `blur(5px)` | bassa, volutamente |
| colore | `saturate(170%)` | ravviva ciò che sta sotto |
| ombra | `rgba(20,14,10,.25)` | + una corta al 10% sotto il bordo |
| bordo | `rgba(255,255,255,.30)` | 1px, filo di luce sul bordo |
| testo | `#FFFFFF` | icone incluse, via `currentColor` |

## Come si usa

Nel CSS **non si riscrivono mai questi numeri**. Si usano le variabili definite
nel blocco `VETRO` dentro `:root` in `style.css`:

```css
.qualcosa-di-vetro{
  background: var(--vetro-bg);
  backdrop-filter: var(--vetro-filtro);
  -webkit-backdrop-filter: var(--vetro-filtro);
  border: var(--vetro-bordo);
  box-shadow: var(--vetro-ombra);
  color: var(--vetro-testo);
}
```

Se un elemento nuovo ha bisogno di vetro, eredita da qui. Se un giorno il vetro
va rivisto: si riapre `pillola.html`, si ricalibra guardando, e si cambiano
**solo** le righe nel blocco `VETRO`. Tutta l'app si adegua da sola.

## La variante chiara

`--vetro-chiaro-bg` + `--vetro-chiaro-testo` mantengono la stessa fisica
(sfocatura, bordo, ombra) ma con velo chiaro e testo scuro.

Si usa **solo** dove il vetro sta stabilmente sopra contenuti scuri e serve un
elemento chiaro per contrasto — oggi: la pillola del meteo sopra la foto della
Home. Non è un'alternativa a piacere allo standard.

## Perché la sfocatura è così bassa

È la parte controintuitiva, ed è il motivo per cui i primi tentativi sbagliavano.

Sfocare molto (20–40px) *sembra* più vetro, ma riduce ciò che sta sotto a una
macchia di colore uniforme: il risultato è una superficie piatta e opaca, e a
quel punto tanto vale un colore pieno. Con una sfocatura bassa si riconoscono
le forme che scorrono sotto — ed è quello che rende l'effetto vivo invece che
finto. La trasparenza da sola non basta: serve che si **capisca** cosa passa.

## Dove è applicato oggi

- `.tabbar-inner` — la pillola di navigazione (è l'elemento su cui è stato calibrato)
- `.icon-btn.glass` — i bottoni tondi sopra la foto della Home
- `.weather-pill` — variante chiara

Fuori standard di proposito, perché non sono vetro sospeso ma superfici piene:

- `.next-card` — scheda traslucida che sta sul fondo della pagina, non su contenuto in movimento
- `.backdrop` — velo di oscuramento dietro le finestre modali

## Lo strumento

`pillola.html` resta nel progetto apposta. Non è un file di scarto: è il banco di
prova per ricalibrare il vetro guardando invece che indovinando. Ha 6 preset,
cinque cursori, e sotto la pillola fa scorrere di proposito una foto, card
bianche, una fascia scura e una colorata — se una combinazione regge su tutte e
tre, regge ovunque nell'app.
