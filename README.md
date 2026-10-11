# Chimwemwe Masona — Portfolio

Personal portfolio showcasing software projects across agriculture, business operations, and community websites.

Owner: chimwemwemasona (personal account)
Target: https://github.com/chimwemwemasona/portfolio

## Design

A responsive editorial bento grid with an ivory background, oversized typography, forest green project cards, restrained citrus accents, and accessible motion.

## Selected work

- Bizrail Africa: an offline-first SME workspace using Next.js, NestJS, and PostgreSQL. https://github.com/chimwemwemasona/Bizrail_Africa
- Twin Palm website and CMS: React, TypeScript, Vite, shadcn/ui, and Tailwind CSS. Live website: http://95.217.214.201/. Repository: https://github.com/chimwemwemasona/tpbc_prod
- Outgrower OS: a prototype for smallholder farming production and procurement workflows. Source remains private.
- Masona Farms: a React Native Android farm-management app with SQLite records. Source remains private.

## Milestones

- [x] Verify GitHub access and project descriptions.
- [x] Prepare the repository foundation and design plan.
- [x] Create the personal portfolio repository and push the foundation.
- [x] Implement responsive bento layouts and project details.
- [x] Add original interface illustrations, labeled as concepts.
- [ ] Verify accessibility and desktop/mobile behavior.
- [ ] Publish the completed site.

Commit meaningful milestones as the website is built. Never commit credentials, private project source, or private business data. Do not invent testimonials, usage figures, employment history, or production-readiness claims.

## Preview locally

This is a buildless HTML/CSS/JavaScript site in dist. No dependency installation is needed.

From this repository, run: python -m http.server 4173 --bind 127.0.0.1 --directory dist

Open http://127.0.0.1:4173 in a browser. The project cards open detail dialogs; Escape closes them. Native dialog focus management, keyboard access, and reduced-motion styles are included.

## Verification

JavaScript syntax and static asset/anchor checks have passed. Browser-based visual and interaction verification is pending because no browser is connected. The interface illustrations are concepts, not screenshots or production metrics.


## Motion design

- Masked, staggered letter entrance for the main headline.
- A sculptural orbital mark that rotates with scroll position.
- Spring-driven project-card tilt, artwork depth, and pointer lighting on fine-pointer devices.
- Individual illustration sequences for charts, phone, fields, and architectural shapes.
- Magnetic contact and navigation controls.
- Origin-aware project-detail entrance and animated dismissal, retaining native dialog focus handling.
- System reduced-motion support, including changes while the page is open. Spring frames stop when settled or the page is hidden.

The local server serves the latest files without a build step. Reload the page to see the entrance sequence. JavaScript syntax and static asset checks pass. Automated Chromium verification was attempted but browser launch is blocked by the environment (spawn EPERM); visual and browser interaction checks remain pending.

## Theme

The navigation includes an accessible dark-mode toggle. First visits follow the operating-system preference; an explicit choice is saved in localStorage and applied in the head before styles load. Cross-tab changes are reflected, and unavailable storage falls back to an in-memory choice. A circular theme reveal uses the View Transitions API where available, with a normal color transition elsewhere. Reduced-motion settings skip the animated reveal.
