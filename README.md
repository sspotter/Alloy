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


## Edit projects and images

Run `npm run projects` and choose **Edit project** or **Manage project images**. Select a project by its listed ID. You can also go straight to a project:

```sh
npm run projects edit swarminal
npm run projects images swarminal
```

Editing lets you change the name, value proposition, description, status, visual label, expanded-details title, category, tags, expanded details, project link, and featured layout. Press Enter to keep a field. Use `-` to clear tags or remove external project links. Entering new expanded details replaces the previous expanded story; leaving it blank keeps that story.

The image menu lets you add screenshots, replace all screenshots, reorder them, remove an image, or edit its alt text and caption. Separate multiple new file paths with `|`; quoted Windows paths are supported. The first image in the list is the main image. Enter all image numbers in a new order (for example `3,1,2`) to change the main image. New files get unique names in `assets/` so existing files are not overwritten. Removing an image from the gallery retains the file. A project needs at least one image unless it already has an illustration.

Choose **Save** in the image menu to apply all edits and rebuild the website. Refresh your browser to see the result. Changes to a deployed website still need to be committed and deployed.

For a repeatable edit, create a JSON file containing only the fields to change:

```json
{
  "description": "Your updated description",
  "images": [
    { "src": "assets/swarminal-multi-agent.png", "alt": "Six terminal panes", "caption": "Main workspace" },
    { "src": "new-screenshot.png", "alt": "A new feature in use", "caption": "New feature" }
  ]
}
```

```sh
npm run projects edit swarminal scripts/my-patch.json
```

An `images` array replaces the current list, so include existing images you want to keep. Paths beginning with `assets/` reference existing website assets; other paths resolve relative to the patch JSON file. Omit `images` to leave the gallery unchanged. Project IDs stay fixed.


Inside the image popup, use the previous/next buttons or Left/Right arrow keys to browse the current project’s screenshots. Navigation wraps at the ends, updates the caption and image counter, and is hidden for a single image. Portrait popups browse the three collaborators. Escape, Close, or a backdrop click dismisses the popup.


## Website QR assets

`assets/branding/alloy-tech-website-qr-card.png` is the shareable branded card with the tagline “Different strengths. Better systems.” The standalone code is available as `alloy-tech-website-qr.png` and `alloy-tech-website-qr.svg` in the same folder. These point to `https://alloy-tech.vercel.app/` and retain a white quiet zone and high error correction around the center logo. Recreate them with `python scripts/create-website-qr.py` using Pillow, qrcode, and zxing-cpp. The script verifies decoding of the standalone PNG, complete card, and a reduced-size PNG.


## Generate a QR with custom text

Run the interactive helper and enter the destination URL and bottom description:

```sh
npm run qr
```

Or pass them directly (quote the description):

```sh
npm run qr "https://alloy-tech.vercel.app/" "Scan to discover what we build together."
```

An optional third argument changes the filename prefix, so you can keep multiple versions:

```sh
npm run qr "https://alloy-tech.vercel.app/" "Meet Alloy Tech at your next event." "event"
```

Files are saved under `assets/branding/` as `<prefix>-qr-card.png`, `<prefix>-qr.png`, and `<prefix>-qr.svg`. The default prefix is `alloy-tech-website`; generating the same prefix replaces its previous files. An optional fourth argument selects another output directory. The logo and brand styling stay consistent. Descriptions wrap automatically; excessively long descriptions are rejected with a clear error.

For a custom small footer or named flags, run the Node entry point directly (this also avoids PowerShell's handling of npm flags):

```sh
node scripts/create-qr.mjs --url "https://alloy-tech.vercel.app/" --description "Different strengths. Better systems." --footer "Scan to meet the team" --name "team"
```

The helper finds a Python runtime with Pillow, qrcode, and zxing-cpp installed. If needed, run `python -m pip install -r scripts/qr-requirements.txt`, or set `ALLOY_PYTHON` to the Python executable you want to use. You can also call `python scripts/create-website-qr.py` directly with the same flags. The QR, full card, and a reduced-size version are decoded and checked against your URL before files are saved.
