# Viisi demo visual and accessibility verification

Reviewed October 16, 2026. Scope: the browser demo, targeting WCAG 2.2 A/AA, including WCAG 2.0 and 2.1 criteria. This is targeted verification, not a conformance certification.

**Visual evidence**

- Source visual truth: [native light gameplay](assets/images/screenshots/light2.jpg) and [native dark gameplay](assets/images/screenshots/dark2.jpg), as used by `index.html`. The supplied backup video was unnecessary.
- Implementation screenshots: the Demo light and Demo dark panels of [comparison.png](docs/accessibility/demo-2026-10-16/comparison.png). [preview.png](docs/accessibility/demo-2026-10-16/preview.png) contains the two implementation captures alone.
- State: two accepted words, score 40, and T in the third row. The native screenshots use TAKES/SKATE; the demo retains its existing STARE/TEARS puzzle and rules.
- Browser viewport: 390 × 844 CSS pixels, device scale factor 1. The scrollbar leaves 375 CSS pixels for content. Implementation game crops are 375 × 745 pixels, taken from full-page browser screenshots, excluding the website instructions and surrounding chrome.
- Sources were normalized proportionally to 375 pixels wide: light 375 × 761, dark 375 × 759. Source and implementation are shown together at equal horizontal density; no vertical stretching. The source files are 1170 × 2374 and 1170 × 2368 pixels respectively.
- Full-view comparison: all four panels in `comparison.png` were opened together. Focused comparison: board/letter crops from those same panels were enlarged together to inspect typography, dashed boundaries, and accepted states. The enlarged intermediate image is `/tmp/viisi-demo-checks/focused-comparison.png`; the retained comparison contains its source regions.

**Findings**

No actionable P0/P1/P2 visual findings remain within this scope.

- Fonts and typography: retained the site's Nunito family, with lighter board letters, larger letter buttons, and a centered Classic Mode heading. The result follows the native rounded typography without introducing another font dependency.
- Spacing and layout rhythm: score sits above the five-by-five board; the rack and shuffle/delete controls sit below it. Desktop retains the existing iPhone frame. Mobile uses the game surface, ordinary page scrolling, and a visible Reset button. Slightly larger tiles and wrapped feedback are intentional accessibility adaptations.
- Colors and tokens: flat navy dark surface, pale decorated light surface, mint accepted words, coral rack, gold score. Dark tile lettering is intentional: coral/letter contrast is 4.66:1 and mint/letter contrast is 7.47:1. Future rows have stronger dashed boundaries than the native screenshots. Accepted state is also conveyed by solid boundaries, visible progress, accessible row labels, and status text.
- Image quality and assets: reused the existing device frame, light-theme decoration, and existing crown/shuffle/delete icons. No new generated art, icons, packages, or assets were added to the runtime.
- Copy and content: preserved demo words, automatic submission, hint rules, points, and completion bonus. Home/Reset remain real web controls in the game toolbar; native skip/settings controls are outside the demo's scope. Results now show Well Done! visibly.

**Comparison and regression history**

1. Initial screenshot comparison identified the old gradient surface, small heavy lettering, solid empty slots, and inline score/header as the main mismatches. Reworked those surfaces and captured both themes again; final evidence is the retained comparison.
2. At 320 pixels with 200% root text size and WCAG text-spacing overrides, the first implementation squeezed individual toolbar words and letter glyphs. Fluid gutters, bounded grid gaps, wrapping toolbar, and responsive letter sizes corrected this. Recheck: document scroll width equaled client width (305 pixels); letter buttons were approximately 52 × 72 pixels with no internal text overflow.
3. Enlarged results exposed overly narrow title space and a wrapped three-digit score. Bounded dialog gutters, a fixed close-button allowance, adaptive statistic columns, and a smaller minimum score size corrected these. Recheck: score 120 stayed on one line; dialog client and scroll widths both measured 264 pixels; End scrolled the results from top to bottom (2110.5 pixels).
4. The Hint-focused completion regression initially returned focus to BODY. Investigation confirmed that the browser can hide Hint before the dialog records focus, and that the first Reset in DOM order is a hidden navigation control. The final implementation rejects unusable return targets and selects a visible Reset fallback. Recheck: Escape focused `#resetBtn`, removed all inert backgrounds, and hid the dialog. Completion with game-region focus restored focus to that region.

**Commands and interaction checks**

- `python3 -m http.server 4173`: served the unmodified application files. Real-page smoke test passed: keyboard STARE/TEARS followed by T produced 2 / 5 and score 40; desktop game client/scroll heights both measured 777 pixels, with no document overflow.
- `node --check assets/js/demo.js`: passed.
- Python HTMLParser check of `demo.html`: unique IDs, valid ARIA references, and existing local file references passed.
- tinycss2 1.5.1 parse of `assets/css/demo.css`, including nested rules and declarations: passed.
- `git diff --check`: passed.
- Chrome UI tests: invalid EASTR rejected without points; duplicate STARE rejected without points; pointer letter entry; Backspace; shuffle preserving an entered S and its used-rack state; reset; reload persistence; Hint unlocked after three words; one hint deducted 10 points; hint-assisted completion scored 110; unassisted completion scored 120. Passed.
- Keyboard scope regression: S while `#main-content` had focus left the board empty; focusing the named game region enabled letter shortcuts. Native Space still activated Hint. Passed.
- Results accessibility: named dialog, Close receives focus, Tab/Shift+Tab containment, Escape dismissal, background inertness, visible focus restoration, keyboard scrolling of enlarged results. Passed.
- Viewports: desktop 1200 × 1200 and normal desktop browser size; mobile 390 × 844; narrow 320 × 800 with 200% root font size plus line-height 1.5, letter-spacing .12em, word-spacing .16em, and paragraph spacing 2em. No horizontal document overflow in the checked states. At normal 390-pixel viewport, letter targets measured approximately 64 × 64 pixels; shuffle/delete are 50 × 50 and Reset/Hint/Close have at least 44-pixel heights.
- axe-core 4.11.0, tags `wcag2a`, `wcag2aa`, `wcag21aa`, `wcag22aa`: zero violations in checked light/dark gameplay and results states; 24 passing rule groups for gameplay, 22 for results. `color-contrast` also reported incomplete nodes, so automated output alone does not establish full contrast coverage.
- Manual WCAG luminance spot calculations: coral letters 4.66:1, mint letters 7.47:1, light normal text 9.72:1, light secondary text 5.90:1, light score 5.69:1, light empty-slot boundary 3.23:1, dark normal text 13.42:1, dark secondary text 8.79:1, dark empty-slot boundary 4.16:1.
- Reduced-motion fixture: no flying tiles or confetti; results transition duration 0s and score immediately 120. Passed. This uses a temporary local fixture forcing the media-query result and matching CSS, rather than changing operating-system settings.
- Browser error logs: no errors in the checked session.
- No configured formatter, linter, typechecker, package manifest, or test runner exists in this static repository. `tmp-demo.spec.js` is an older animation script, not a test suite. These configured checks were skipped; no infrastructure was added.
- Tooling interruptions: the first image composition command failed with `ModuleNotFoundError: No module named 'PIL'`; an isolated temporary environment resolved it. A Playwright locator press on the aria-disabled Hint timed out (`Playwright selector deadline exceeded`); native key presses completed the intended regression scenario. These were tooling failures, not unresolved application test failures.

Theme and accessibility fixtures were served separately on port 4174, with temporary dependencies under `/tmp/viisi-demo-checks`. They force the selected theme, inject axe, and optionally apply enlarged text/spacing/reduced motion. The project dependency structure and application assets were not changed for testing.

**Not verified / follow-ups**

- VoiceOver/NVDA speech, physical touch devices, Safari/Firefox, real operating-system reduced-motion switching, native forced-colors rendering, actual browser zoom at 400%, and deployed-site parity need manual validation.
- The contrast calculations cover the changed primary game palette, not every composited pixel or every unchanged website element. Complete an assistive-technology and cross-browser audit before claiming full WCAG conformance.
- P3: native crown rendering and platform-specific typography remain approximate. Home and Reset deliberately use labeled web controls.
- Guidance conflicts: none. The existing static project was preserved instead of initializing a prototype starter, consistent with the user's scope and repository guidance. No commit, push, or deployment performed.

**Implementation checklist**

- [x] Compare against real screenshots in both themes.
- [x] Reuse existing assets and gameplay state.
- [x] Check narrow reflow, enlarged text, status feedback, keyboard scope, results focus, and motion preference behavior.
- [x] Save browser-rendered evidence and report verification limits.

Reference: [W3C WCAG 2 quick reference](https://www.w3.org/WAI/WCAG22/quickref/).

final result: passed
