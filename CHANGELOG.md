# Changelog

## [0.14.1](https://github.com/zainadeel/compomo/compare/v0.14.0...v0.14.1) (2026-06-08)


### Fixed

* defer BarNav tab strip until overflow layout is committed ([#140](https://github.com/zainadeel/compomo/issues/140)) ([6b2d82e](https://github.com/zainadeel/compomo/commit/6b2d82eaf6a541e4ba707906678d9ff0efcf1605))

## [Unreleased]

### Changed

* **BarNav:** collapsed tab menu trigger uses **`md`** icon size for `ChevronDown` (was `sm`).

### Fixed

* **BarNav:** observe the intrinsic-width probe with `ResizeObserver` and allow more measurement retries so narrow hard reloads do not commit an expanded tab row while `ds-tab-group` still reports `scrollWidth === 0`.

## [0.14.0](https://github.com/zainadeel/compomo/compare/v0.13.0...v0.14.0) (2026-06-08)


### Added

* **BarNav:** harden overflow collapse for SPA integrators ([#138](https://github.com/zainadeel/compomo/issues/138)) ([4ade3d5](https://github.com/zainadeel/compomo/commit/4ade3d5ff9536cf20858d59cac866ab81da59bd8))

## [0.13.0](https://github.com/zainadeel/compomo/compare/v0.12.0...v0.13.0) (2026-06-08)


### Added

* **BarNav:** collapse overflowing tabs into menu trigger ([#136](https://github.com/zainadeel/compomo/issues/136)) ([ba40b44](https://github.com/zainadeel/compomo/commit/ba40b44af1ca378f81f0cc29da58996a971825c5))

## [0.12.0](https://github.com/zainadeel/compomo/compare/v0.11.3...v0.12.0) (2026-06-08)


### Added

* **TabGroup:** add in-tablist divider for grouped tabs ([#134](https://github.com/zainadeel/compomo/issues/134)) ([17b1da0](https://github.com/zainadeel/compomo/commit/17b1da0d5d84453ad71ff0e5bb1398b12071a1ef))

## [0.11.3](https://github.com/zainadeel/compomo/compare/v0.11.2...v0.11.3) (2026-06-06)


### Fixed

* **panel-nav:** read document variant hint on framework hard reload ([#132](https://github.com/zainadeel/compomo/issues/132)) ([8b0ccb8](https://github.com/zainadeel/compomo/commit/8b0ccb8c9dbe153bbaafe422b6893d1e93d6734c))

## [0.11.2](https://github.com/zainadeel/compomo/compare/v0.11.1...v0.11.2) (2026-06-06)


### Fixed

* **panel-nav:** resync renderedVariant on Angular first paint ([#130](https://github.com/zainadeel/compomo/issues/130)) ([f6fed20](https://github.com/zainadeel/compomo/commit/f6fed20d339e0631fd92bfa36323866fa5e98b17))

## [0.11.1](https://github.com/zainadeel/compomo/compare/v0.11.0...v0.11.1) (2026-06-06)


### Fixed

* **nav:** sync host props after Angular assigns groups and tabs ([#128](https://github.com/zainadeel/compomo/issues/128)) ([9ac0545](https://github.com/zainadeel/compomo/commit/9ac05456bbc5a61ac04923580fc17c5e57d4b422))

## [0.11.0](https://github.com/zainadeel/compomo/compare/v0.10.3...v0.11.0) (2026-06-06)


### Added

* **nav:** harden PanelNav and BarNav for SPA framework integration ([#126](https://github.com/zainadeel/compomo/issues/126)) ([6f3b2ce](https://github.com/zainadeel/compomo/commit/6f3b2ce2cee4ba41c7578789520e12f27356816a))

## [0.10.3](https://github.com/zainadeel/compomo/compare/v0.10.2...v0.10.3) (2026-06-03)


### Fixed

* **bar-nav:** style no-tabs area name to match a single tab ([#124](https://github.com/zainadeel/compomo/issues/124)) ([7632f2e](https://github.com/zainadeel/compomo/commit/7632f2e9caa08d44cb1a19082cbaad6b40b6e486))

## [0.10.2](https://github.com/zainadeel/compomo/compare/v0.10.1...v0.10.2) (2026-06-03)


### Fixed

* **nav:** pin PanelNav header + BarNav to 48px with border inside ([#122](https://github.com/zainadeel/compomo/issues/122)) ([8e40b6e](https://github.com/zainadeel/compomo/commit/8e40b6e2d628be0616e76e2e8e273af5009568c9))

## [0.10.1](https://github.com/zainadeel/compomo/compare/v0.10.0...v0.10.1) (2026-06-03)


### Fixed

* **bar-nav:** align ::after overlay with PanelNav pattern ([#120](https://github.com/zainadeel/compomo/issues/120)) ([4f76739](https://github.com/zainadeel/compomo/commit/4f76739ce68d92ed6d9d9f587efce47653469c70))

## [0.10.0](https://github.com/zainadeel/compomo/compare/v0.9.4...v0.10.0) (2026-06-02)


### Added

* **bar-nav:** add BarNav secondary nav and BarNavAction; refactor TabGroup to button-tab style ([#118](https://github.com/zainadeel/compomo/issues/118)) ([a7631f1](https://github.com/zainadeel/compomo/commit/a7631f1144e488dd4277cb2ebcc32535e9881300))

## [0.9.4](https://github.com/zainadeel/compomo/compare/v0.9.3...v0.9.4) (2026-06-02)


### Fixed

* **lint:** resolve no-explicit-any and no-useless-assignment errors ([#114](https://github.com/zainadeel/compomo/issues/114)) ([739ea9c](https://github.com/zainadeel/compomo/commit/739ea9c8400784d9583f8ff6e6a00085f6d84656))

## [0.9.3](https://github.com/zainadeel/compomo/compare/v0.9.2...v0.9.3) (2026-06-02)


### Fixed

* **build:** remove deprecated @storybook/addon-toolbars to unblock storybook 10 ([#111](https://github.com/zainadeel/compomo/issues/111)) ([54288b3](https://github.com/zainadeel/compomo/commit/54288b3163b6135c15bc8bd7f2780ea353880436))

## [0.9.2](https://github.com/zainadeel/compomo/compare/v0.9.1...v0.9.2) (2026-06-02)


### Fixed

* correct README — web components library, not React ([#109](https://github.com/zainadeel/compomo/issues/109)) ([6faf46c](https://github.com/zainadeel/compomo/commit/6faf46cb0aadd5b642385239f1f14600bf8cc90f))

## [0.9.1](https://github.com/zainadeel/compomo/compare/v0.9.0...v0.9.1) (2026-06-02)


### Fixed

* **PanelNav:** parse view-transition duration token as CSS time ([#106](https://github.com/zainadeel/compomo/issues/106)) ([7c7f609](https://github.com/zainadeel/compomo/commit/7c7f609a6aa908477100ccbd38b0d35be571808e))

## [0.9.0](https://github.com/zainadeel/compomo/compare/v0.8.7...v0.9.0) (2026-06-01)


### Added

* **wc:** port LabelWrap, ToggleButton, ToggleButtonGroup, ButtonGroup, Select to web components ([#98](https://github.com/zainadeel/compomo/issues/98)) ([86c34ab](https://github.com/zainadeel/compomo/commit/86c34ab327ed36bbc6f8cb052bfc4e74ac6e34ea))


### Fixed

* **PanelNav:** add disableViewTransition prop to defer transitions to host app ([#97](https://github.com/zainadeel/compomo/issues/97)) ([8e09e1a](https://github.com/zainadeel/compomo/commit/8e09e1a66d6c03dee3058d76f51dd05c6e46b75f))
* **TabGroup:** translateX indicator, count badges, aria-controls, orientation, keyboard nav fix ([#100](https://github.com/zainadeel/compomo/issues/100)) ([bad3a85](https://github.com/zainadeel/compomo/commit/bad3a85c34c188afa167ab65f0525d2c683b6b9c))

## [0.8.7](https://github.com/zainadeel/compomo/compare/v0.8.6...v0.8.7) (2026-06-01)


### Fixed

* **PanelNav:** use componentDidRender to signal VT callback instead of rAF ([#95](https://github.com/zainadeel/compomo/issues/95)) ([1d0af2d](https://github.com/zainadeel/compomo/commit/1d0af2d622a72b0321cc34fbebcd7621a5ac23f0))

## [0.8.6](https://github.com/zainadeel/compomo/compare/v0.8.5...v0.8.6) (2026-06-01)


### Fixed

* **PanelNav:** skip in-progress VT on rapid variant changes to prevent nav stuck ([#93](https://github.com/zainadeel/compomo/issues/93)) ([e0fae13](https://github.com/zainadeel/compomo/commit/e0fae1349c743a96f801fefe38328935d46858c1))

## [0.8.5](https://github.com/zainadeel/compomo/compare/v0.8.4...v0.8.5) (2026-06-01)


### Fixed

* **PanelNav:** use rAF instead of microtasks in VT callback for zone.js compat ([#91](https://github.com/zainadeel/compomo/issues/91)) ([f860bc0](https://github.com/zainadeel/compomo/commit/f860bc0728808e9075588c9d73d86aaa4e3bf91e))

## [0.8.4](https://github.com/zainadeel/compomo/compare/v0.8.3...v0.8.4) (2026-06-01)


### Fixed

* **a11y:** add focusable=false and aria-hidden to decorative SVGs ([#89](https://github.com/zainadeel/compomo/issues/89)) ([4419e13](https://github.com/zainadeel/compomo/commit/4419e13d8780c2866a8f18ec43e4f5d55d2b5c2f))

## [0.8.3](https://github.com/zainadeel/compomo/compare/v0.8.2...v0.8.3) (2026-06-01)


### Fixed

* **PanelNav:** group-label styling and live variant animation ([#87](https://github.com/zainadeel/compomo/issues/87)) ([3fcbaf4](https://github.com/zainadeel/compomo/commit/3fcbaf402b96568b1273594ecbbf24c0abd658cd))

## [0.8.2](https://github.com/zainadeel/compomo/compare/v0.8.1...v0.8.2) (2026-05-23)


### Fixed

* **PanelNav:** section heading styles + live variant radial reveal ([#85](https://github.com/zainadeel/compomo/issues/85)) ([a101e30](https://github.com/zainadeel/compomo/commit/a101e30abfaaf5a59285b823c2100c9432e3609d))

## [0.8.1](https://github.com/zainadeel/compomo/compare/v0.8.0...v0.8.1) (2026-05-22)


### Fixed

* **panel-nav:** re-sync groups in componentDidLoad to fix Angular initial render ([#83](https://github.com/zainadeel/compomo/issues/83)) ([36876c8](https://github.com/zainadeel/compomo/commit/36876c88c2df728d58d0a9fecf89a41621f68d35))

## [0.8.0](https://github.com/zainadeel/compomo/compare/v0.7.5...v0.8.0) (2026-05-22)


### Added

* **panel-nav:** storageKey persistence and href/currentUrl routing support ([#80](https://github.com/zainadeel/compomo/issues/80)) ([5a24fb3](https://github.com/zainadeel/compomo/commit/5a24fb3e68d800a7d582465aa135f769db938050))

## [0.7.5](https://github.com/zainadeel/compomo/compare/v0.7.4...v0.7.5) (2026-05-22)


### Fixed

* **storybook:** add light/dark theme toggle to toolbar ([#78](https://github.com/zainadeel/compomo/issues/78)) ([378e7d7](https://github.com/zainadeel/compomo/commit/378e7d713ec7097a33e9422425ad0e78a76ff66c))

## [0.7.4](https://github.com/zainadeel/compomo/compare/v0.7.3...v0.7.4) (2026-05-22)


### Fixed

* **panel-nav:** eliminate flash and snap-back in VT circle animation ([#76](https://github.com/zainadeel/compomo/issues/76)) ([08db13d](https://github.com/zainadeel/compomo/commit/08db13d29ea73ab2512ce75b3dfa80fd793fad71))

## [0.7.3](https://github.com/zainadeel/compomo/compare/v0.7.2...v0.7.3) (2026-05-22)


### Fixed

* **DEVPRD-panel-nav:** replace rAF with microtask yield in VT callback ([#73](https://github.com/zainadeel/compomo/issues/73)) ([c00e3db](https://github.com/zainadeel/compomo/commit/c00e3db549c6af873f227493954f8b7cb7807433))

## [0.7.2](https://github.com/zainadeel/compomo/compare/v0.7.1...v0.7.2) (2026-05-22)


### Fixed

* **DEVPRD-panel-nav:** await rAF so Stencil renders before VT snapshot ([#71](https://github.com/zainadeel/compomo/issues/71)) ([a9e7ddf](https://github.com/zainadeel/compomo/commit/a9e7ddffc130856f5c7ebde3a98fd5266ad1a626))

## [0.7.1](https://github.com/zainadeel/compomo/compare/v0.7.0...v0.7.1) (2026-05-22)


### Fixed

* **DEVPRD-panel-nav:** move view-transition suppression to preview-head.html ([#69](https://github.com/zainadeel/compomo/issues/69)) ([928da27](https://github.com/zainadeel/compomo/commit/928da2750c7554907eed204430ab6dbd95335cd5))

## [0.7.0](https://github.com/zainadeel/compomo/compare/v0.6.0...v0.7.0) (2026-05-22)


### Added

* **DEVPRD-panel-nav:** polish PanelNav tokens, dot badge, and scroll fade ([#66](https://github.com/zainadeel/compomo/issues/66)) ([611511d](https://github.com/zainadeel/compomo/commit/611511d7e4a8902bb5f31a1b510f61b55273f957))


### Fixed

* **DEVPRD-panel-nav:** animate color/background on variant shift ([#68](https://github.com/zainadeel/compomo/issues/68)) ([c35e0bf](https://github.com/zainadeel/compomo/commit/c35e0bfc3905c7b0cca92f3447f1fc19e1a64133))

## [0.6.0](https://github.com/zainadeel/compomo/compare/v0.5.0...v0.6.0) (2026-05-20)


### Added

* **storybook:** add Foundation/Icons gallery and expand Text stories ([#64](https://github.com/zainadeel/compomo/issues/64)) ([cf83f09](https://github.com/zainadeel/compomo/commit/cf83f095222fbf3bb48b56856f74a4b6c87d1f0b))

## [0.5.0](https://github.com/zainadeel/compomo/compare/v0.4.1...v0.5.0) (2026-05-20)


### Added

* **storybook:** add Foundation/Colors, Foundation/Typography, and expand Button stories ([#62](https://github.com/zainadeel/compomo/issues/62)) ([95954cc](https://github.com/zainadeel/compomo/commit/95954cc4675cb5c8b8e8be83fc2491d4a7e14f12))

## [0.4.1](https://github.com/zainadeel/compomo/compare/v0.4.0...v0.4.1) (2026-05-20)


### Fixed

* **storybook:** prevent Vite from tree-shaking Stencil component registrations ([#60](https://github.com/zainadeel/compomo/issues/60)) ([ca3e572](https://github.com/zainadeel/compomo/commit/ca3e5727a1cd291e83e7f36b6562d68ba163d425))

## [0.4.0](https://github.com/zainadeel/compomo/compare/v0.3.0...v0.4.0) (2026-05-20)


### Added

* **stencil:** migrate CompoMo to Stencil web components ([#57](https://github.com/zainadeel/compomo/issues/57)) ([2b5b7e1](https://github.com/zainadeel/compomo/commit/2b5b7e1a40356eb3de844cf599470c5cd933541b))

## [0.3.0](https://github.com/zainadeel/compomo/compare/v0.2.4...v0.3.0) (2026-05-04)


### Added

* **Badge:** make aria-label configurable ([#39](https://github.com/zainadeel/compomo/issues/39)) ([458abef](https://github.com/zainadeel/compomo/commit/458abef7351decf506bdb66c79a5f9a1b9cb18bb))
* **Input:** enforce labeling and add error-state a11y ([#38](https://github.com/zainadeel/compomo/issues/38)) ([f10e9ed](https://github.com/zainadeel/compomo/commit/f10e9ed8ca814e4175723ed227146b219deeb013))
* **Loader:** add optional label for standalone a11y announcement ([#42](https://github.com/zainadeel/compomo/issues/42)) ([4976f4a](https://github.com/zainadeel/compomo/commit/4976f4a3876662f14afde43be84b0cd6dffa1f39))
* **menu:** add WAI-ARIA keyboard pattern, roles, and focus management ([#50](https://github.com/zainadeel/compomo/issues/50)) ([15f76ff](https://github.com/zainadeel/compomo/commit/15f76ff44106a9312111d15514e97b0cca4e334e))
* **Slider:** add valueText prop and clean up a11y ([#45](https://github.com/zainadeel/compomo/issues/45)) ([6137305](https://github.com/zainadeel/compomo/commit/6137305a43171723713e0aaa13c39152ced02d83))


### Fixed

* **a11y:** make Table sortable headers and clickable rows keyboard-accessible ([#46](https://github.com/zainadeel/compomo/issues/46)) ([4849522](https://github.com/zainadeel/compomo/commit/4849522664769bd045b46988818086073e08b4e5))
* **Accordion:** wire disclosure-pattern ARIA on trigger and panel ([#34](https://github.com/zainadeel/compomo/issues/34)) ([10865ea](https://github.com/zainadeel/compomo/commit/10865ea722da5cd42e8820bf5bfc3f7c3d29c332))
* **Banner:** announce content to screen readers and add dismiss button ([#51](https://github.com/zainadeel/compomo/issues/51)) ([996f3b1](https://github.com/zainadeel/compomo/commit/996f3b11dde86933db618ab496a986f07d74b076))
* **Button:** tighten icon-only and polymorphic a11y ([#47](https://github.com/zainadeel/compomo/issues/47)) ([1235699](https://github.com/zainadeel/compomo/commit/1235699042c59a706c1df425bcd5f5731649212d))
* **checkbox:** communicate inactive state to assistive tech ([#40](https://github.com/zainadeel/compomo/issues/40)) ([f39d3d4](https://github.com/zainadeel/compomo/commit/f39d3d440153890f220f4f14906a4e00fde1af4a))
* **Field:** auto-associate label with child input ([#36](https://github.com/zainadeel/compomo/issues/36)) ([95db1e8](https://github.com/zainadeel/compomo/commit/95db1e806fb192d14c5197618919459a357b2206))
* **modal:** trap focus, restore on close, link aria-describedby ([#35](https://github.com/zainadeel/compomo/issues/35)) ([865b374](https://github.com/zainadeel/compomo/commit/865b37423518808884781c54754108cee24d78ef))
* **Radio:** implement WAI-ARIA radiogroup keyboard pattern ([#49](https://github.com/zainadeel/compomo/issues/49)) ([59d0f13](https://github.com/zainadeel/compomo/commit/59d0f138933e227b8af5d07e3200d537366c931f))
* **Scrollbar:** keyboard-focusable scroll region, decorative thumbs ([#37](https://github.com/zainadeel/compomo/issues/37)) ([76e919e](https://github.com/zainadeel/compomo/commit/76e919e5452338c8621cb60cb79d8d67745cd01d))
* **Select:** use WAI-ARIA 1.2 combobox + listbox pattern ([#52](https://github.com/zainadeel/compomo/issues/52)) ([61783d5](https://github.com/zainadeel/compomo/commit/61783d5643c8c7aadca0253683b8da751dad5a02))
* **Sidebar:** improve resize handle and mobile overlay a11y ([#55](https://github.com/zainadeel/compomo/issues/55)) ([851fc26](https://github.com/zainadeel/compomo/commit/851fc26c1f99340c201164687f0da9835596e9da))
* **TabGroup:** implement WAI-ARIA tabs pattern with keyboard nav ([#48](https://github.com/zainadeel/compomo/issues/48)) ([8f293c9](https://github.com/zainadeel/compomo/commit/8f293c97a00edd795085d3af82dab44a6e3b8b20))
* **Tag:** tighten a11y for interactive and pressed states ([#44](https://github.com/zainadeel/compomo/issues/44)) ([7a0457b](https://github.com/zainadeel/compomo/commit/7a0457be907eb75d5f1030f9096152c62641ba42))
* **Toast:** improve a11y for role, live region, and timer pausing ([#41](https://github.com/zainadeel/compomo/issues/41)) ([6b546ae](https://github.com/zainadeel/compomo/commit/6b546ae621fbf1fb8f9be0f012fc3cd16585fa84))
* **toggle:** make Toggle keyboard-activatable and require accessible name ([#54](https://github.com/zainadeel/compomo/issues/54)) ([117e724](https://github.com/zainadeel/compomo/commit/117e7247dab1d58fd468cb0c6956fa914e96c7a0))
* **tooltip:** wire keyboard and screen-reader accessibility ([#43](https://github.com/zainadeel/compomo/issues/43)) ([cc6516e](https://github.com/zainadeel/compomo/commit/cc6516e2a458e808b8b5a1a8c582b87d1aaea256))

## [0.2.4](https://github.com/zainadeel/compomo/compare/v0.2.3...v0.2.4) (2026-04-29)


### Documentation

* add button mdx guidelines page with embedded examples ([#25](https://github.com/zainadeel/compomo/issues/25)) ([6a36ead](https://github.com/zainadeel/compomo/commit/6a36ead84bbd73c89570c7c88e3eb45236698119))

## [0.2.3](https://github.com/zainadeel/compomo/compare/v0.2.2...v0.2.3) (2026-04-23)


### Fixed

* add npm version badge to readme ([#23](https://github.com/zainadeel/compomo/issues/23)) ([21b3d5b](https://github.com/zainadeel/compomo/commit/21b3d5bf0195cab680012cfdab31dd15220f5216))

## [0.2.2](https://github.com/zainadeel/compomo/compare/v0.2.1...v0.2.2) (2026-04-23)


### Documentation

* refresh readme component list and point homepage at storybook ([#21](https://github.com/zainadeel/compomo/issues/21)) ([ba55ab7](https://github.com/zainadeel/compomo/commit/ba55ab72f64f0985610a971d551840de24b2873e))

## [0.2.1](https://github.com/zainadeel/compomo/compare/v0.2.0...v0.2.1) (2026-04-17)


### Fixed

* align react 19 types and bump vite to unbreak npm ci ([#17](https://github.com/zainadeel/compomo/issues/17)) ([b9c5f9f](https://github.com/zainadeel/compomo/commit/b9c5f9f5960fe2891d583095f1ae17d6a48d52a6))

## [0.2.0](https://github.com/zainadeel/compomo/compare/v0.1.0...v0.2.0) (2026-04-17)


### Added

* invert primary intentNone background and expand surface-context stories ([#3](https://github.com/zainadeel/compomo/issues/3)) ([582f96c](https://github.com/zainadeel/compomo/commit/582f96cb5d07c97a3bd57641a504420554e3e163))


### Fixed

* bump @ds-mo/icons to 0.5.0 and rename CrossUI to Cross ([#2](https://github.com/zainadeel/compomo/issues/2)) ([d03019f](https://github.com/zainadeel/compomo/commit/d03019f1cb758ca5b019bc69a75dadb0a1951426))
* use lowercase /compomo/ base URL to match Pages path ([83f8db9](https://github.com/zainadeel/compomo/commit/83f8db9fd5b598bce9504a9726507e0d144813ed))


### Documentation

* add AGENTS.md and CLAUDE.md ([#5](https://github.com/zainadeel/compomo/issues/5)) ([c954098](https://github.com/zainadeel/compomo/commit/c954098374fe5397ce2a585bd587d619ac568bc7))
