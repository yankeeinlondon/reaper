type Link =
    | `http://${string}`
    | `https://${string}`
    | `file://${string}`
    | `mailto:${string}@${string}`
    | `tel:${string}`
    | `sms:${string}`;

/**
 * **link**`(text, link)`
 *
 * Prints a link to the terminal using a relatively new
 * [OSC 8 standard](https://gist.github.com/egmontkob/eb114294efbcd5adb1944c9f3cb5feda) for making pretty links.
 *
 * You can use the following protocols for your links:
 * - `http` / `https`
 * - `file` (note format is `file://hostname/path/to/file.txt` and hostname
 * IS required)
 * - `mailto`
 *
 * Terminal app support includes:
 *
 * - [WezTerm](https://wezterm.org/escape-sequences.html)
 * - [iTerm2](https://iterm2.com/documentation-escape-codes.html) (macOS, since v3.3.0)
 * - Windows Terminal (since v1.6)
 * - GNOME Terminal (since v3.26)
 * - Kitty
 * - [Alacritty](https://github.com/alacritty/alacritty/issues/5909) (since v0.12)
 * - foot
 * - Konsole (KDE)
 * - tmux (with some configuration, and only if the underlying terminal supports it)
 * - Terminal.app (macOS, since Ventura)
 * - Tilix
 * - Hyper (with plugins)
 * - Xfce Terminal (since v0.9.0)
 */
export function link(text: string, link: Link) {
    return `\x1B]8;;${link}\x1B\\${text}\x1B]8;;\x1B\\`;
}
