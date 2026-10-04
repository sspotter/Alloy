# Applied AI landing page

A static landing page for Alloy Tech, based on the three PDFs in `data/`.

Run `npm run dev`, then open http://localhost:5173. No dependency installation is required. Run `npm run check` to check JavaScript syntax.

Deploy `index.html`, `styles.css`, `app.js`, and `assets/` to a static host. The local server serves those public files only; it does not expose the source PDFs or project documentation.

The page includes category filters, expandable project details, real project screenshots extracted from the supplied About Us PDF, team profiles, and email contact links. Swarminal and DocViewer use original project screenshots; Nest Invest retains a labeled illustration. Expanded project details include full-size screenshot links.

Edit branding and copy in `index.html`, visual tokens in `styles.css`, and filter/detail behavior in `app.js`. The font is served locally. Screenshots retain their source attribution in `assets/PROVENANCE.md`.


The objective section includes a downloadable 75-second MP4 brand film, with burned-in captions, local synthetic narration, and an original synthesized music bed. The editable scene script is `scripts/film-scenes.json`. Rebuild narration on Windows with `powershell -NoProfile -File scripts/narrate-film.ps1`, then run `python scripts/render-film.py` with Pillow, NumPy, and imageio-ffmpeg installed. Intermediate narration and renders are stored in `tmp/film/`. The local preview server supports byte ranges for video seeking.


The selected Sage/Forest A/T logo is saved as `assets/alloy-tech-logo.png` with transparency and used in the header and favicon. The meeting QR and adjacent email link open a prefilled request to Yousef, copying Mazen and Osama. The editable message is recorded in `assets/meeting-request.txt`.
