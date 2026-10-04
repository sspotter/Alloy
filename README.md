# Applied AI landing page

A static landing page for Yousef Mamdouh & collaborators, based on the three PDFs in `data/`.

Run `npm run dev`, then open http://localhost:5173. No dependency installation is required. Run `npm run check` to check JavaScript syntax.

Deploy `index.html`, `styles.css`, `app.js`, and `assets/` to a static host. The local server serves those public files only; it does not expose the source PDFs or project documentation.

The page includes category filters, expandable project details, real project screenshots extracted from the supplied About Us PDF, team profiles, and email contact links. Swarminal and Nest Invest visuals are labeled illustrations.

Edit branding and copy in `index.html`, visual tokens in `styles.css`, and filter/detail behavior in `app.js`. The font is served locally. Screenshots retain their source attribution in `assets/PROVENANCE.md`.


The objective section includes a downloadable 75-second MP4 brand film, with burned-in captions, local synthetic narration, and an original synthesized music bed. The editable scene script is `scripts/film-scenes.json`. Rebuild narration on Windows with `powershell -NoProfile -File scripts/narrate-film.ps1`, then run `python scripts/render-film.py` with Pillow, NumPy, and imageio-ffmpeg installed. Intermediate narration and renders are stored in `tmp/film/`. The local preview server supports byte ranges for video seeking.
