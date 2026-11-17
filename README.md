# Kalkulačka ceny 3D tisku

Kalkulačka v korunách pro jeden výtisk i celou sérii. Z údajů ze sliceru a cen spočítá filament, elektřinu, volitelnou rezervu materiálu a opotřebení tiskárny. Výpočet i uložení vstupů probíhají v prohlížeči.

**[Otevřít kalkulačku](https://kubarund.github.io/kalkulacka-3d-tisku/)**

## Načtení souboru G-code

Vyber textový soubor ze sliceru přímo v kalkulačce. Aplikace čte komentáře s odhadem doby tisku a spotřebou v gramech. Rozpozná běžný výstup PrusaSliceru, OrcaSliceru a Bambu Studia. Pokud export obsahuje pouze čas, například u běžného výstupu z Cury, hmotnost doplň ručně.

Čas se zaokrouhlí nahoru na celé minuty. Import patří celé tiskové podložce. Po načtení se počet nastaví na jeden kus a můžeš ho upravit podle skutečného počtu. Obsah souboru se zpracuje v prohlížeči bez odesílání. Pro binární `.bgcode` exportuj ze sliceru textový G-code.

## Příklad

Čtyři výtisky, každý o hmotnosti 38 g a s dobou tisku 1 h 35 min. Cívka s kilogramem filamentu stojí 620 Kč, průměrný příkon tiskárny je 95 W a elektřina stojí 6 Kč/kWh. S 8% rezervou filamentu vyjde série na **105,39 Kč** a jeden výtisk na **26,35 Kč**.

Při tisku více kusů na jedné podložce vyber **Pro celou sérii** a zadej celkovou hmotnost a dobu tisku přímo ze sliceru. Kalkulačka výsledný součet vydělí počtem výtisků.

## Spuštění na počítači

```sh
python -m http.server 8769 --directory dist
```

V prohlížeči otevři `http://localhost:8769`. Projekt používá statické HTML, CSS a JavaScript. Testy výpočtu spustíš příkazem `node --test`.

GitHub Pages publikuje obsah větve `gh-pages`, která vychází ze složky `dist/`. Změny po kontrole v hlavní větvi lze publikovat příkazem `git subtree push --prefix dist origin gh-pages`.

<details>
<summary>Titulní obrázek</summary>

Ilustrační fotografie v [`dist/assets/tisk.webp`](dist/assets/tisk.webp) vznikla ve vestavěném generátoru obrázků.

> Editorial photorealistic website cover for a Czech 3D printing cost calculator. Wide landscape crop. Close-up of a real, unbranded desktop FDM 3D printer depositing warm orange filament onto a small geometric part on the textured print bed. The nozzle and layered model are concentrated on the right half of the frame. Moody dark navy workshop lighting and restrained cyan reflections, soft shadows, fine realistic parallel print layers, natural depth of field. Keep the left half dark and visually quiet so it can fade smoothly into a navy interface. No text, logos, people, UI, or watermark.

</details>
