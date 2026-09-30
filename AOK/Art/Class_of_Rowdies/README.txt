THE DOOR IS OPEN - GitHub Pages package

Upload the contents of this folder to the root of a GitHub Pages repository.
The homepage is index.html.

Network-dependent elements:
- The Class of Rowdies YouTube screening uses the YouTube IFrame API.
- Public-domain artworks attempt to load from Wikimedia/museum-hosted media.
- If an artwork is blocked, the page automatically switches to a bundled local fallback in assets/.
- Plato's cave map is bundled locally.

Audio:
- No audio files are required. Ambience and transition sounds are synthesized in-browser with the Web Audio API.

Recommended:
- Serve through GitHub Pages (HTTPS) rather than opening index.html directly.
- Test once on the classroom network because YouTube may be filtered independently of the page.
