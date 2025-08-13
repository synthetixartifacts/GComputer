Audio Recorder Styleguide — Execution Plan

Overview
- Add a reusable, configurable `AudioRecorder` UI component using the MediaRecorder API.
- Create a new styleguide page under `test/styleguide/record` to demo three trigger variants:
  - Button recorder
  - Big circular icon recorder
  - Simple icon-only recorder
- Each instance supports: start/stop, playback, save/download, cancel, and re-record.
- Design for configurability (constraints, mime type, labels, durations, etc.).

Step-by-step Tasks
- [x] 1) Routing and Navigation
  - Add route id `test.styleguide.record` to `@features/router/types` and wire it in `@views/App.svelte`.
  - Add nav menu item under Styleguide in `@features/navigation/store`.
  - Create view shell `@views/StyleguideRecordView.svelte` (placeholder content).

- [x] 2) Reusable Component: `@components/audio/AudioRecorder.svelte`
  - Implement recording via `navigator.mediaDevices.getUserMedia` + `MediaRecorder`.
  - Props (with defaults):
    - variant: 'button' | 'icon' | 'circle'
    - size: 'sm' | 'md' | 'lg'
    - constraints: MediaStreamConstraints (default: { audio: true })
    - mimeType: string (default: 'audio/webm;codecs=opus' if supported)
    - audioBitsPerSecond?: number
    - maxDurationMs?: number
    - allowReRecord: boolean (default: true)
    - allowDownload: boolean (default: true)
    - showPlaybackControls: boolean (default: true)
    - labels?: Partial<Record<'start'|'stop'|'save'|'cancel'|'rerecord'|'recording'|'idle', string>>
    - class?: string
  - Events: `start`, `stop` (with Blob), `save` (with Blob), `cancel`, `error`.
  - States: idle → recording → recorded; support cancel and re-record.
  - Cleanup: stop tracks, revoke object URLs, clear timers.

- [x] 3) Styleguide Page Integration
  - Implement `StyleguideRecordView.svelte` showcasing:
    - Basic button variant
    - Big circular icon variant
    - Simple icon-only variant
  - Each instance: record, playback, save/download, cancel, re-record.

- [x] 4) i18n Strings
  - Add menu and page strings to `@ts/i18n/locales/en.json` and `fr.json`.
  - Add component label strings (start/stop/save/cancel/rerecord/recording/idle).

- [x] 5) Typecheck and Build
  - Run `npm run typecheck` and fix issues.
  - Verify dev run for UI interaction sanity.

- [ ] 6) Docs (light)
  - Add short usage snippet to `docs/howto` or note in styleguide page.

Notes
- Renderer-only APIs; no Node/Electron imports in views or component.
- Provide sensible defaults and flexible props for scalability.
- Accessible controls; use existing button styles (`btn`, `gc-icon-btn`).


