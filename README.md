# Applied AI landing page

A static landing page for Alloy Tech, based on the three PDFs in `data/`.

Run `npm run dev`, then open http://localhost:5173. No dependency installation is required. Run `npm run check` to check JavaScript syntax.

Deploy `index.html`, `styles.css`, `app.js`, and `assets/` to a static host. The local server serves those public files only; it does not expose the source PDFs or project documentation.

The page includes category filters, expandable project details, real project screenshots extracted from the supplied About Us PDF, team profiles, and email contact links. Swarminal and DocViewer use original project screenshots; Nest Invest retains a labeled illustration. Project image viewers include previous/next controls and image popups.

Edit branding and non-project copy in `index.html`, project content in `scripts/projects.json`, visual tokens in `styles.css`, and browser interactions in `app.js`. Run `npm run projects:build` after changing project data. The font is served locally. Screenshots retain their source attribution in `assets/PROVENANCE.md`.


The objective section includes a downloadable 75-second MP4 brand film, with burned-in captions, local synthetic narration, and an original synthesized music bed. The editable scene script is `scripts/film-scenes.json`. Rebuild narration on Windows with `powershell -NoProfile -File scripts/narrate-film.ps1`, then run `python scripts/render-film.py` with Pillow, NumPy, and imageio-ffmpeg installed. Intermediate narration and renders are stored in `tmp/film/`. The local preview server supports byte ranges for video seeking.


The selected Sage/Forest A/T logo is saved as `assets/alloy-tech-logo.png` with transparency and used in the header and favicon. The meeting QR and adjacent email link open a prefilled request to Yousef, copying Mazen and Osama. The editable message is recorded in `assets/meeting-request.txt`.


## Add a project

Run the interactive helper from the repository directory:

```sh
npm run project:add
```

Enter the name, category (`ai`, `tools`, or `ml`), one-line benefit, description, status, tags, and image paths. Separate multiple image paths with `|`; paths can be absolute or relative to the current directory. The first image is the main screenshot. The helper asks for descriptive alt text for each image, optional expanded details, and an optional project URL. It copies images into `assets/`, saves the project in `scripts/projects.json`, and rebuilds the page. Refresh the browser after adding it. PNG, JPG, JPEG, WebP, GIF, and AVIF images are supported.

For a repeatable import, copy `scripts/project.example.json`, replace the example content and screenshots, and run:

```sh
npm run project:add scripts/my-project.json
```

Image paths in the import are resolved relative to the JSON file. Give each project a unique `id` using lowercase letters, numbers, or hyphens, such as `knowledge-workspace` or `123`. The helper refuses duplicate IDs and missing images before saving. Optional `featured: true` makes a card span the desktop grid. Action URLs must use HTTP or HTTPS. Actions with `details: true` open the project's expanded details; omit source links when no public source is available.

## Add images to an existing project

Copy screenshots into `assets/` and add entries to that project's `images` array in `scripts/projects.json`:

```json
"images": [
  { "src": "assets/docviewer-showcase.png", "alt": "DocViewer displaying Markdown preview", "caption": "Markdown preview" },
  { "src": "assets/docviewer-split.png", "alt": "Source editor beside the rendered document", "caption": "Split editing" }
]
```

Then run `npm run projects:build`. Reorder the entries to choose the main image. Each card's viewer works independently and wraps from the last image to the first; clicking an image opens an on-page popup (Escape or the close button dismisses it). A single-image card has no navigation controls. Nest Invest keeps its existing illustration until real screenshots are supplied.

The build updates only the marked project cards and project counts in `index.html`; that HTML is committed and deployed with the other static files, so hosting needs no Node build step or project-data endpoint. Existing `detailsHtml` and `illustrationHtml` fields preserve authored markup; new projects can use plain-text `details`. Do not edit generated cards directly, as rebuilding replaces them.

Run `npm test` for generator and import tests and `npm run check` for JavaScript syntax checks. No additional dependencies are required.


## Manage projects

Use one menu for adding, removing, listing, or rebuilding projects:

```sh
npm run projects
```

You can also run a specific action directly:

```sh
npm run projects add
npm run projects add scripts/my-project.json
npm run projects list
npm run projects remove project-id
npm run projects build
```

The earlier `npm run project:add` command still works as an alias. Interactive prompts check the ID, category, required text, image files, and optional URL before continuing; invalid inputs can be corrected without re-entering the earlier fields. Numeric IDs are accepted. For an optional URL, enter a complete `https://` or `http://` address, or leave it blank. Successful additions and removals rebuild the website immediately; refresh the browser to load the new HTML. Rejected input does not add a card. On a deployed website, commit and deploy the updated HTML and assets to publish the change.

Removal deletes the project entry and its generated card, retaining image files so shared assets stay available. The interactive menu asks for confirmation; the explicit `remove project-id` command performs the requested removal directly.

## Collaborator CVs

Each team card has a View CV link. Public PDFs are copied to `assets/cvs/`. Update a CV with:

```sh
npm run cv:add yousef "path/to/yousef-cv.pdf"
npm run cv:add osama "path/to/osama-cv.pdf"
npm run cv:add mazen "path/to/mazen-cv.pdf"
```

You can supply a public HTTPS CV URL instead of a local PDF. The script updates only the selected team member's CV link. The source PDFs in `data/cvs/` are not exposed by the preview server. Team portraits also open in the image popup.
