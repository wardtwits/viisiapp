# Viisi native-style browser demo verification

Latest follow-up: removed Game options, its dialog, associated handlers, and unused styles. Reset and the sound toggle passed browser smoke checks; no browser errors. All 63 repository tests, JavaScript syntax, formatting, HTML IDs/ARIA references, and `git diff --check` passed. Evidence: [Reset only](docs/demo-2026-11-02/refinements/reset-only.jpg). Physical-device/deployed parity remains unverified; no new risks or guidance conflicts. Earlier descriptions of Game options below are historical.


## Follow-up refinement verification — November 2, 2026

This pass supersedes the original build notes below for header placement, controls, sound defaults, hint recall, sharing, and tile animation. Changes follow the user's explicit refinement request.

- **Hint priority fix:** deleted or edited hints can be recalled on the same row without another deduction. This also works after both paid hints have been used. The selected prefix is derived from the same unchanged remaining-answer list; no duplicate score or hint state was introduced. Two new regression tests failed against the prior code (`false !== true`, `false !== 'HA'`) and passed after the fix. Current focused suite: **22 passed**; full repository suite: **63 passed, zero failures/skips**.
- **Header/Reset:** reserved extra space below the actual desktop frame's Dynamic Island and moved the text Reset button below the phone. Game options moved beside Reset, retaining mode/theme/contrast controls. Narrow Practice Puzzle text has sufficient clearance from the right-side buttons. At a 320×800 viewport, the actual document width/scroll width were both 305px (15px scrollbar), Reset began 18px below the phone, and heading/actions had approximately 9.5px separation. After Reset confirmation, focus and the view return to the game; Cancel retains normal trigger focus.
- **Sound:** new games default to sound effects enabled. The white circular ruby speaker control replaces the toolbar settings icon and toggles sound with an accessible pressed state; its mute choice is saved. Previously saved mute choices are preserved. Only short existing effects are played; nothing loops and no background music was added. The existing win effect is approximately 1.48 seconds. Real speaker output/volume remains a device check.
- **Letter flight:** destination glyphs stay hidden while a visible tile travels from the tapped rack key to its entry box over 360ms. Submission waits for the final tile to land. Browser observation confirmed an active translated flight and an `arriving` entry tile.
- **Valid word:** tiles visibly fill from bottom to top over 550ms before rising into the compact accepted-word list. Browser sampling measured an intermediate fill scale of about 0.477, followed by a translated/scaled accepted row. Glyph sizes are compensated during the shrink to avoid a font-size jump. Reset/reveal cancel outstanding visual work; a reset check finished with zero accepted words, empty entry, and zero flying-tile ghosts.
- **Shuffle:** the native `DailyLetterBox.swift` uses a horizontal 360° flip; the browser now follows that axis. Rack letters change between the outgoing/incoming flip phases. Browser checks confirmed a non-identity X-axis 3D transform and preserved the partial/hinted entry and used-key mapping. Reduced-motion branches skip the effects; actual OS preference switching remains unverified.
- **Share:** disabled in HTML and reasserted disabled on results render. The share/clipboard handler was removed. A two-hint completion scored **100** with `shareEnabled: false` and a visible explanation. No clipboard or external sharing action is available.
- **Additional visible correction:** revealed answers now count toward the cat's lying pose, preventing the sitting cat from overlapping the five revealed rows.

Current browser evidence in `docs/demo-2026-11-02/refinements/`:

- `practice-header-reset.jpg`: complete desktop frame, readable Practice Puzzle heading below the island, circular sound toggle, and Reset/Game options underneath.
- `letter-flight.jpg`: a rack tile in flight, with the destination not yet revealed.
- `word-fill.jpg`: accepted tiles partly filled before rising.
- `word-rising.jpg`: accepted row moving upward.
- `shuffle-flip.jpg`: horizontal rack flip during a narrow-screen interaction.
- `share-disabled.jpg`: completed game with an inactive Share control.

Checks: JavaScript syntax passed; Prettier 3.6.2 passed; HTML validation found 59 unique IDs with valid ARIA targets/assets, one external Reset button and a natively disabled Share button; `git diff --check` passed. Main browser error log was empty. No configured lint/typecheck/build commands exist. A result-dialog wait reached its default tooling deadline at the end of the longer completion animation; the immediately following state confirmed the open dialog, score 100, and disabled Share. It was not an application failure.

Remaining limits: physical iPhone/iPad, Safari/Firefox, OS audio output and reduced-motion switching, and deployed-site parity remain unverified. Native-palette contrast limits from the original review still apply; high-contrast mode remains available. No further guidance conflicts, commits, pushes, native source changes, or deployment.


## Original build review


Reviewed November 2, 2026. Scope: `demo.html`, one browser practice puzzle, and preservation of older browser saves. The iOS project was read-only. This supersedes the October 16 demo review; it is not a WCAG conformance certification.

**Findings and accepted differences**

No actionable P0/P1/P2 visual differences remain in the compared gameplay, definition, and result states within this scope.

- Fonts/typography: Nunito is the native `AppFont` family. Accepted letters use a lighter weight and larger glyphs than the first implementation; entry letters are semibold. Definition text now follows the source's line breaks. Browser rasterization and the score's gold treatment remain slightly different from SwiftUI.
- Spacing/layout: the fixed entry row, compact accepted-word stack, reserved score slot, cat, rack, and action row follow the reference composition. The definition panel and result hierarchy were revised after comparison. Desktop retains the site's actual iPhone frame; mobile shows app content without an invented OS status bar. Result dialogs scroll vertically; narrow definition panels scroll when required.
- Colors/tokens: uses the source's navy, ruby, mint, and gold. Light decoration and result rays were exported from native SwiftUI drawing code. Default white letters on mint intentionally follow the supplied visual target, which conflicts with the older web demo's dark-letter contrast treatment. A working High-contrast letters setting and `prefers-contrast: more` adaptation retain the accessible dark-letter alternative. The default native palette is **not** claimed to meet WCAG AA for every foreground/background pair.
- Assets/image quality: original sitting/lying cats, bulb, sound effects, and native-rendered crown/backgrounds are used. The winning cat uses the original eye masks, pupils, crown, and native gaze geometry. It is interactive gameplay, not a screenshot or video substitute. Phosphor MIT icons provide web equivalents for Apple's navigation symbols; their silhouettes are an accepted P3 difference. Native idle expression sequences and the complete crown-drop choreography are not reproduced.
- Copy/content: the screenshot's October 24 practice puzzle has seven valid words and Special Word SELAH. The date is fixed and does not imply today's live puzzle. Results say Browser Demo and only say Replay for an actual replay. Solve times reflect the browser run; older saves with no recorded timer explicitly report time unavailable. Game Center/iCloud/daily account services are outside this demo. The extra View results control supports reopening the browser dialog.

**Source and browser evidence**

Source visual truth supplied by the user:

- `/Users/ww1999/Downloads/IMG_8857.jpg`: empty Expert board, 1170 × 2404 pixels.
- `IMG_8859.jpg` and `IMG_8860.jpg`: first word and partial entry.
- `IMG_8861.jpg` and `IMG_8862.jpg`: four accepted words and HA entry, light/dark.
- `IMG_8863.jpg`: 110-point results.
- `IMG_8864.jpg` and `IMG_8865.jpg`: 110-point win and selected LEASH definition, light/dark.
- The two supplied November 2 screen recordings were sampled into frame sheets to inspect entry, word acceptance, hints, completion, and layout transitions.

The final four-word, win, and results reference images are 1170 × 2391 pixels, normalized proportionally to **390 × 797** pixels. Browser mobile captures use **390 × 797 CSS pixels**, exported at 390 × 797 pixels (1× output density), without website chrome or device bezel. No vertical stretching was used. Additional checks: 390 × 844, 320 × 800, and desktop 1200 × 1200.

Browser-rendered implementation: [local demo](http://127.0.0.1:4175/demo.html). Evidence is in [docs/demo-2026-11-02](docs/demo-2026-11-02/).

Full-view comparisons, with source on the left and implementation on the right, were composed and opened together:

- [Dark hint comparison](docs/demo-2026-11-02/dark-comparison.jpg): HEALS, HALES, SHALE, LEASH, HA hint entry; score 70.
- [Light hint comparison](docs/demo-2026-11-02/light-comparison.jpg): same geometry and words. The source shows score 80 with a transient −10 animation; implementation is the settled, already-deducted score 70. This state difference is recorded rather than treated as a scoring discrepancy.
- [Light definition comparison](docs/demo-2026-11-02/light-definition-comparison.jpg): five words, 110 points, selected LEASH, same definition.
- [Dark definition comparison](docs/demo-2026-11-02/definition-comparison.jpg): same content and selected word.
- [Results comparison](docs/demo-2026-11-02/results-comparison.jpg): 110 points, +100 words, +20 completion, −10 hint. Source is a native replay solved in 0:28; implementation is the first browser result solved in 2:14. Run labels and elapsed times intentionally reflect the actual run.

Focused comparisons were also composed and opened together: [accepted tiles and hinted letters](docs/demo-2026-11-02/tiles-comparison.jpg), [definition typography and line breaks](docs/demo-2026-11-02/definition-detail.jpg). These confirm details that are small in the full-view captures.

**Comparison history**

1. The initial browser render exposed inherited website phone padding/shadow and an invalid date for legacy saves. Removed those inherited frame properties on this page and used Practice Puzzle for undated legacy data. The corrected captures show a full-width mobile surface; legacy progress remains intact.
2. [First hint comparison](docs/demo-2026-11-02/dark-comparison-first-pass.jpg) identified P2 differences in accepted-letter weight, tile spacing, toolbar size, and hint placement. Revised the font weight/size, row gaps, native toolbar colors, hint alignment, and vertical rack/control positions. Re-captured [dark hint](docs/demo-2026-11-02/dark-hint.jpg), compared at equal density in `dark-comparison.jpg`.
3. Results initially had an oversized 3D crown, large outcome title, crowded score hierarchy, and rays centered too high. Replaced the result crown with a real flat library icon, followed the native 18-point title/124-point score hierarchy, revised spacing/breakdown/share treatment, and used native-colored rays with local scrolling. Final evidence: `results.jpg` / `results-comparison.jpg`.
4. Definitions initially used too-large body text and a larger heading, changing source line breaks. Restored 15px body text, smaller heading, matching padding, native Definition/Also labels, and the native crown-directed gaze. Final evidence: light/dark definition comparisons and `definition-detail.jpg`.
5. Narrow-screen screenshot immediately after resizing showed an old-width compositor frame. Settled DOM measurements and a fresh capture confirmed the 320px layout fits; no artificial clipping fix was added. [Narrow capture](docs/demo-2026-11-02/narrow-definition.jpg) records that check with high-contrast letters enabled.

**Behavior and verification**

- `node --test tests/*.test.js`: **60 passed, zero failed/skipped**. Includes 19 new domain tests for scoring, Special Words, Classic/Expert behavior, hint timing/provenance, repeat invalids, duplicates, reveal, replay immutability, repeated letters, migration, and invalid-save rejection. The focused domain suite was rerun after the legacy-time correction and passed.
- `node --check assets/js/demo.js` and `node --check assets/js/demo-game.js`: passed.
- Prettier 3.6.2 on changed HTML/CSS/JS/new test files: passed. This was a temporary formatting tool; no dependency or build system was added.
- HTMLParser validation: unique IDs, existing ARIA targets, and local HTML asset references passed. Prettier parsed the CSS successfully.
- `git diff --check`: passed.
- No configured formatter/linter/typechecker/build manifest exists in this static repository. Configured lint/typecheck/build commands were therefore not available; no substitute infrastructure was added.
- Chrome UI: five-letter auto-submit; 110-point hint-assisted win; correct accepted words and hinted-letter coloring; hint penalty; pointer/keyboard deletion; 1.15-second hold-to-delete; shuffle preserving HEA and used-key mapping; mode lock; Expert repeat-invalid deduplication and three distinct invalids ending the run; reveal confirmation; reset cancellation and confirmation; frozen original 110-point Classic result restored after an Expert replay/reveal; light/dark/high-contrast settings; results reopening; LEASH definitions. Passed.
- Dialog keyboard checks: initial Close focus, Tab to the next result control, Escape dismissal, native modal background exclusion, and usable focus restoration. Passed in the checked flows; not a full assistive-technology audit.
- Sharing: the browser rejected the automated share/clipboard request. The working fallback displayed selectable result text and the practice URL. No message was sent and no permission prompt was bypassed.
- Layout: document client/scroll widths matched at 390 and 320px. Narrow result dialog client/scroll widths both measured 265px. At desktop, document client/scroll widths both measured 1185px; game client/scroll heights both measured 816px. No persistent controls were hidden by horizontal overflow.
- Browser error log: **zero errors** in the main verification tab.
- Tooling interruptions: `pressSequentially` did not support the non-editable game region; individual documented key presses completed the test. An ambiguous Reset locator was corrected by scoping to the confirmation dialog. A separate reload-during-submit browser attempt encountered an existing legacy puzzle at the test origin, so its expected HEALS locator timed out; that attempt is **not** counted as a passed timing regression. Production code resumes a saved five-letter entry on load, but that exact timing window still needs an isolated browser check. Early Swift export actor isolation and shell URL quoting issues were corrected; exports completed.

**Not verified and follow-ups**

- Physical iPhone/iPad touch, Safari/Firefox, VoiceOver/NVDA speech, real OS reduced-motion/forced-colors switching, actual 200%/400% browser zoom, successful OS share sheet/clipboard delivery, and deployed Cloudflare parity need real-world validation.
- Reduced-motion branches are implemented in CSS and JavaScript; this run did not change the user's OS setting to validate them.
- P3 fidelity: web icon silhouettes, SwiftUI's extruded gold-score rendering, decoration letters/seed, some cat idle/choreography details, and browser font rasterization differ slightly. Browser result gutters and explicit reopening control are intentional.
- Guidance resolution: the user's native-fidelity request controls the palette; the earlier dark-letter treatment remains available through high-contrast mode. Existing static-site structure was preserved instead of creating a new prototype project. No other guidance conflicts were found.
- No commit, push, deployment, or native source edits were performed. The local server and deliverable preview remain open.

**Implementation checklist**

- [x] Inspect supplied screenshots, both videos, and native code.
- [x] Use original native assets and one authoritative game state/score model.
- [x] Preserve old saves and the first terminal result.
- [x] Compare actual browser captures with the source at equal density, including focused details.
- [x] Verify key interactions, responsive layouts, and repository tests.
- [x] Record platform/contrast/timing limits without claiming untested native parity.

final result: passed
