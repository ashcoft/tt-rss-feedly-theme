# Feedly theme for Tiny Tiny RSS

[![Release v4.6.0](https://img.shields.io/badge/Release-v4.6.0-blue)](https://github.com/ashcoft/tt-rss-feedly-theme/releases)
[![Download ZIP](https://img.shields.io/badge/Download-ZIP-orange)](https://github.com/ashcoft/tt-rss-feedly-theme/releases/download/v4.6.0/tt-rss-feedly-theme-4.6.0.zip)
[![Download TAR.GZ](https://img.shields.io/badge/Download-TAR.GZ-green)](https://github.com/ashcoft/tt-rss-feedly-theme/releases/download/v4.6.0/tt-rss-feedly-theme-4.6.0.tar.gz)

This is a theme for the popular self-hosted RSS reader [Tiny Tiny RSS](https://tt-rss.org) that provides a Feedly-inspired interface. Enjoy a clean, minimalist design that makes it easy to quickly scan and read your feeds.

For the best experience, please use a current browser.

## Quick Start

1. Download the latest release:
   - [ZIP format](https://github.com/ashcoft/tt-rss-feedly-theme/releases/latest) - `tt-rss-feedly-theme-{version}.zip`
   - [TAR.GZ format](https://github.com/ashcoft/tt-rss-feedly-theme/releases/latest) - `tt-rss-feedly-theme-{version}.tar.gz`
2. Unzip and copy the extracted files to `[tt-rss-root]/themes.local`
   - `feedly*.css` and the `feedly` directory are needed to get all theme variants
   - `local-overrides.js` is optional, it provides polyfills for Safari and prepares utility views for mobile-friendly styling
   - `local-overrides.css` is optional, but depends on `local-overrides.js` to customize the utility views
3. Go into your TT-RSS preferences and select the feedly theme.
4. Install/activate recommended plugins:
   - `toggle_sidebar` for collapsing the feeds holder sidebar
   - `close_button` to allow closing article detail in split view
   - `shorten_expanded` to truncate long articles in combined view

## Features

- A clean, minimalist design that's easy on the eyes
- Responsive layout that works great on mobile devices
- An additional cards view that's not available with the default theme
- Different color variants with light and dark modes
- High contrast variants for improved accessibility
- Customizable fonts and spacing via CSS variables
- Support for various plugins

## Configuration

There are different color variants available. If you choose the _auto_ variants, your OS/browser will decide whether to use the light or dark color scheme.

You can configure fonts and spacing using the _Customize_ button in TT-RSS settings:

```css
:root {
  --base-spacing: 45px;
  --font-size-post: 16px;
  --reading-width: 45;
}
```

## Development

1. Run `npm install` to install dependencies
2. Run `npm start` to watch and compile on changes
3. Run `npm run build` to build all theme CSS files

## Release Process

Releases are created via PR workflow:
1. Go to Actions, Run Release workflow
2. Enter version (e.g., `1.2.3`)
3. PR is created automatically
4. Review and merge PR to publish

## FAQ

### Where are the CSS files?
CSS files are included in the release archives. Download from the [releases page](https://github.com/ashcoft/tt-rss-feedly-theme/releases).

### How do I stay up-to-date?
Clone this repo and symlink to your `themes.local` directory. Run `git pull` to update.

### I followed the installation steps but I don't get all the new features
Please make sure that you don't have an old copy of this theme in the `themes` directory of your TT-RSS installation. Third-party themes should go into the `themes.local` directory, but files in the `themes` directory will override any file with the same name in the `themes.local` directory.

### The theme looks broken
Please make sure to have the most recent version of TT-RSS installed (I test on [TT-RSS git master](https://github.com/tt-rss/tt-rss)). Also, make sure to use a supported browser in the most recent version. If it's still broken, you might have found a bug. Feel free to open an issue or create a PR.

### Which browsers are supported?
This theme works best with Chromium-based browsers like Chrome, Brave, Edge, Vivaldi or Opera. Firefox and Safari are also supported but they're missing some minor features. On mobile devices, again, Chromium-based browsers on Android work best but Safari and other browsers on iOS should also work fine.

### What about tablets?
Tablets are also supported, both iPads and Android. The theme detects touch devices and will show all controls that would only be revealed on hover when using a desktop/laptop with a mouse/trackpad.

### Is there a way to quickly switch between light and night mode?
Yes, this theme is compatible with the [_toggle_night_mode_ plugin by ltGuillaume](https://github.com/ltGuillaume/FeedMei/tree/main/plugins.local). If you selected either a regular or a _night_ color variant, you can toggle back and forth by hitting `a N`. If you want your OS/browser to control this, select an _auto_ color variant.

### Can I change the colors via custom CSS?
It's not possible via CSS variables because colors are processed at build time. You can checkout the _main_ branch, edit `_variables.less` and build your own version of the theme.

### Why did you change the license?
I want this theme to have a proper, well-recognized license to make it clear and easy for others to use this code as source or part of their work. In contrast to the previously used WTFPL, the MIT license is very popular, permissive, short and clear. Please include the license with the copyright notice in any copy or fork.



## Screenshots

This is a selection to give you an impression of what to expect.

![color variants](screenshots/color-variants.png)
_Available color variants. Top: default night, default light, sepia night, sepia light
Bottom: high contrast, high contrast night, sepia contrast, sepia contrast night_

---

![login](screenshots/login.png)
_Login in light mode, password recovery in dark mode on mobile_

---

![cdm expanded sepia](screenshots/cdm-expanded-sepia.png)
_Combined view expanded with sepia color variant, mobile in night mode_

---

![cdm grouped](screenshots/cdm-grouped.png)
_Combined view, expand selected atricle only, grouped by feed, mobile in night mode_

---

![split sepia](screenshots/split-sepia.png)
_Split view, desktop in widescreen mode, mobile non-widescreen in night mode_

---

![cards high contrast](screenshots/cards-high-contrast.png)
_Cards overview (enable grid, combined view, and expand selected article only) with high contrast variant_

---

![cards detail sepia contrast](screenshots/cards-detail-sepia-contrast.png)
_Cards detail (opens as a layer similar to Feedly) with sepia contrast color variant_

---

![preferences mobile](screenshots/prefs-mobile.png)
_Preferences on mobile: main, plugins, feeds, edit feed_
