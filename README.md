# DuckIt - a Vibe Coded Platformer Tutorial

![Duck It repo Logo](repo-assets/og.png)

This is a demo app that any can use to get familar with making games using vibe coding.

Here are the links to the apps used within the project:

Cursor
NodeJS - this includes NPM.
Git
TexturePacker (optional)
Sourcetree (optional)

Remember to add SSH keys when working with Github.
[Add SSH keys to Github on Mac](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent?platform=mac)
[Add SSH keys to Github on Windows](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent?platform=windows)

Shout out to:

Matthew Berman:

[@MatthewBerman on Twitter](https://x.com/MatthewBerman)

[Vibe Coding Complete Tutorial and Tips - Cursor / Windsurf](https://www.youtube.com/watch?v=v7UcVPO4y3c&list=PL8CxOpJNgWgfvmw4ICbxEwCEjS7lhhxcQ)

Cline:

[Cline Memory Bank](https://docs.cline.bot/improving-your-prompting-skills/cline-memory-bank)

Jimp for assets:

[ArtJimp on X](https://x.com/artjimp)

Jay Max Armstrong for assets:

[Jay Armstrong on X](https://x.com/JayMaxArmstrong)

Both from

[MassiveMonster](https://massivemonster.com/)

## DuckIt dashboard verification

The Vite demo merges touch and keyboard controls into boolean player input. Supporting contact pairs persist across Box2D frames, use begin manifold/hit normal fields in either shape order, and are removed by end IDs. Physics runs at1/60 seconds with four substeps and at most four catch-up steps per rendered frame.

Run `pnpm --dir vite-template test`, `pnpm --dir vite-template exec tsc --noEmit`, and `pnpm --dir vite-template build`. Movement and jump impulses run on each fixed physics tick. A sampled short jump is retained through a render with no physics tick, while held controls retain their existing behavior. Silent Chromium/Firefox checks at 390 and 1280 pixels cover matching 30/60/120 Hz movement, jump/relanding, the four-step pause cap, and high-speed landings. Representative physical mobile step-duration comparisons remain required; no performance gain is claimed. See [the scoped fixed-step evidence](docs/evidence/fixed-step-2026-10-25.md).
