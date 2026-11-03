# Native demo assets

Imported from the user-supplied iOS source at `viisi`, November 2, 2026.

- Cat poses and hint bulb: original `Resources/Assets.xcassets` artwork, converted to WebP without changing the artwork.
- Crown: rendered directly from `GoldCrownView` in `Features/Gameboard/Components/CrownScoreView.swift` using SwiftUI ImageRenderer.
- Light background: rendered from `Core/LetterTilesBackground.swift` at 390 × 844 points and 3× density. AppKit font lookup replaces UIKit font lookup only for this export; the original drawing and palette are unchanged.
- Winning cat: rendered from the native lying artwork, eye masks, pupil assets, crown, and `MascotGazeKit` crown-target geometry in `ViisiCatMascot.swift`.
- Results background: rendered from `RadialBurstLayer` with the native blueberry color and midnight base.
- Sound effects: original valid/invalid, win, shuffle, and pop audio from `Resources/sounds`.
- Puzzle: `aehls` from `Resources/words_shuffled.json`, including the Special Word SELAH; definitions copied from `Resources/definitions.json`.
- Legacy EASTR puzzle retained to migrate existing browser demo progress without deleting it.
- Interface icons: Phosphor Icons 2.1.1, MIT license included in `PHOSPHOR-LICENSE`.

No iOS source files were modified. None of the screenshots or videos are shipped as a substitute for the interactive game.

The sound-on and sound-off toolbar icons also use Phosphor Icons 2.1.1 (speaker-high and speaker-slash, regular weight).
