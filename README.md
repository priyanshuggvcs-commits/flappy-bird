# Flappy Bird (HTML5 Canvas)

**Play it here: https://priyanshuggvcs-commits.github.io/flappy-bird/**

A Flappy Bird clone built with plain HTML, CSS and JavaScript. No libraries, no image files, no build step. The bird, pipes and sounds are all generated in code.
## Features
- Gravity and flap physics with a frame-rate independent game loop
- Randomly generated pipes with collision detection
- Score counter and best score saved in `localStorage`
- Sound effects made with the Web Audio API
- Pause, mute, and keyboard, mouse and touch controls
- Responsive canvas that works on desktop and mobile

## Controls
| Action | Input |
|---|---|
| Flap / start / retry | Space, Up Arrow, click or tap |
| Pause | P |
| Mute | M |

## Run locally
Open `index.html` in any modern browser. Or serve the folder:

```bash
python -m http.server 8000
```
Then visit http://localhost:8000.

## Play online (GitHub Pages)
Repo **Settings → Pages → Deploy from a branch → `main` / root**. Your game goes live at `https://<your-username>.github.io/<repo-name>/`.

## Project structure
```
index.html   page and canvas
style.css    layout and styling
game.js      game loop, physics, collisions, rendering, audio
```

## How it works
- `update(dt)` moves the bird and pipes using delta time, and checks collisions (circle against pipe rectangles, plus ground and ceiling).
- `draw()` renders everything to a 400x600 canvas that CSS scales to fit the screen.
- The state machine is `ready → playing → paused / over → ready`.

## License
MIT
