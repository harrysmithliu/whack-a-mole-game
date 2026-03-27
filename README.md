# Whack-a-Mole

A bright, playful browser game built with plain HTML, CSS, and JavaScript. This project turns the classic whack-a-mole idea into a polished mini arcade experience with fast reactions, score chasing, and a fun surprise mechanic that keeps every round lively.

## Play Online

**Live Demo:** `https://harrysmithliu.github.io/whack-a-mole-game/`

**Built from zero with AI assistance, this project was fully recreated based on implementation experience from an earlier version I had completed before.**

## Why This Project Stands Out

- Clean, responsive one-page game experience
- Random single-slot spawning across a 3x3 board
- Distinct hit-state sprite switching for stronger feedback
- Princess penalty mechanic that adds risk and variety
- Lightweight front-end stack with no framework dependency
- Easy to host anywhere as a static site

## Gameplay

The goal is simple: hit the visible mole as quickly as you can and build the highest score possible before time runs out.

- Only one character appears at a time on the 3x3 board
- Hitting a mole increases the score
- Hitting a princess decreases the score
- A successful hit swaps the sprite briefly before the board resets for the next random spawn
- Best score is stored locally in the browser

## Preview

### Gameplay Board

![Gameplay board](./assets/images/1.png)

### Hit Feedback

![Hit feedback](./assets/images/2.png)

### Princess Penalty Mechanic

![Princess penalty mechanic](./assets/images/3.png)

## Tech Stack

- HTML5
- CSS3
- Vanilla JavaScript

## Project Structure

```text
whack-a-mole-game/
├── assets/
│   └── images/
├── src/
│   ├── scripts/
│   └── styles/
├── index.html
└── README.md
```

## Run Locally

Because this is a static front-end project, you can launch it with any simple local server.

1. Open the project folder.
2. Start a local static server.
3. Visit `index.html` through the local server in your browser.

If you use VS Code, the Live Server extension is an easy option.

## Highlights

- Designed as a portfolio-friendly mini game project
- Organized to stay simple, readable, and easy to extend
- Ready for future animation upgrades, extra character states, and difficulty tuning

## Future Ideas

- Add frame-by-frame spawn and hit animations
- Introduce sound effects and background music
- Add difficulty levels and speed scaling
- Add combo scoring or streak bonuses
- Add mobile-friendly tap polish and richer visual effects

## License

This project is released under the terms of the [LICENSE](./LICENSE) file.
