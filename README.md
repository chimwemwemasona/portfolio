# Chimwemwe Masona — Portfolio

Personal portfolio showcasing software projects across agriculture, business operations, and community websites.

Owner: chimwemwemasona (personal account)
Target: https://github.com/chimwemwemasona/portfolio

## Design

A responsive editorial grid with alternating emphasis: Kwena Homes beside Twin Palm, Masona Farms beside a wider Bizrail card, and equally sized Agritech Link and Outgrower OS cards. Tablet screens use equal columns; phones use one column. Ivory, forest green, citrus accents, oversized typography, and accessible motion carry the visual identity.

## Selected work

Ordered by an editorial assessment of implemented product breadth, completed workflows, and integration depth. Deployment is considered separately from scope; this is not a quality score or a claim that every project is production-ready.

1. Kwena Homes: property discovery, maps, saved homes, listing management, authentication, and subscription/promotion screens. React Native/Expo. https://github.com/Nile-Living/kwena_homes_mobile
2. Twin Palm: public community website and authenticated CMS for sermons, blogs, media, Bible study, and other content. React/TypeScript. Live: http://95.217.214.201/. Source: https://github.com/chimwemwemasona/tpbc_prod
3. Masona Farms: offline farm records, financial summaries, crop calendar/guidance, photos, notifications, and report exports. React Native/SQLite. https://github.com/chimwemwemasona/Masona-Farms
4. Bizrail Africa: technically deep Phase 1 SME workspace with offline capture, ledger, inventory, sync, and recovery. Next.js/NestJS/PostgreSQL. https://github.com/chimwemwemasona/Bizrail_Africa
5. Agritech Link: produce marketplace, cart/order workflows, crop-analysis integration, and weather services. Flutter/Dart/Supabase. https://github.com/agritech-link/app_v1
6. Outgrower OS: early production/procurement prototype; later business modules remain planned. React/Go. https://github.com/chimwemwemasona/Outgrower-OS

All six source repositories are public. Project dialogs retain their individual implementation and deployment status.

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
