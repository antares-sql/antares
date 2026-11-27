/**
 * Brand logos redrawn in the Antares style (same grid and classes as glyphs.ts), so they follow the theme.
 * Each one keeps the distinctive mark of the original logo. Every logo is a trademark of its owner.
 * Thinner stroke than the glyphs (THIN_STROKE, like the outline of the original MySQL dolphin): logos carry more
 * detail. A --icon-stroke-width set on the icon (BaseIcon prop `stroke-width`) still overrides it.
 */
/** Stroke of the brand logos, and of every connection icon (glyphs included) so that they all match */
export const THIN_STROKE = 1.25;

const logos: Record<string, string> = {
   /* ---------- database engines ---------- */
   // MySQL: outline of the dolphin, beak top-left, flipper under the belly, tail bottom-right
   mysql: '<path class="f" stroke="none" d="M4.4 5c1.2 1.9 2.4 3.4 2.4 4.9-.5 1-.8 2.1-.7 3.4 0 1.2.3 2.2 1 2.4.6.1.7-1.1.9-1.9l.4-.6C11 13.6 14.6 15.6 17.8 16.2 16.4 15.7 15.4 14.9 14.7 13.6L13.4 11C12.4 8.6 10.7 6.5 8.3 5.2 7.5 4.7 6.5 4.3 5.4 4.3 4.7 4.2 4.3 4.4 4.4 5z"/><path d="M4.4 5c1.2 1.9 2.4 3.4 2.4 4.9-.5 1-.8 2.1-.7 3.4 0 1.2.3 2.2 1 2.4.6.1.7-1.1.9-1.9l.4-.6 1.8 3.4M4.4 5c-.1-.6.3-.8 1-.7 1.1 0 2.1.4 2.9.9 2.4 1.3 4.1 3.4 5.1 5.8l1.3 2.6c.7 1.3 1.7 2.1 3.1 2.6l2.2 1.1-2.1.4c-.7.2-.8.8-.3 1.3l2.6 1.7M4.4 5c1.4.4 2.9.7 4.1 1.3"/>',
   // MariaDB: sea lion lying towards the forked tail on the left, head raised on the right, flippers under the body
   mariadb: '<path class="f" d="M2.3 16.9l1.3-.3c1-.1 1.7-.3 2.2-.7 1-1.5 1.8-2 3.2-2.4 2-.6 4.4-1.5 6.2-2.5 1.4-1.2 2.2-2.6 2.8-3.6.6-1.1 1.4-1.8 3.2-2.1.8-.2 1.2-.5.8.7-.3.9-.8 1.3-1.4 1.6-1 .6-1.4 1.4-1.6 2.4-.4 2.6-1.2 4.6-2.1 6.3l-.4-1.3c-.9 2-1.7 3.2-2.8 4 .1-.7.3-1.4.4-2.2-1.5-.2-2.9-.3-3.9-.2-1.4.1-2.4.4-3.3 1-.9.7-2.3 1.3-3.6 1.4l.6-1.3z"/><circle class="d" cx="20.2" cy="6.6" r=".6"/>',
   // PostgreSQL: Slonik as in the logo, asymmetric ears, eye sockets, short trunk off to the right between the tusks
   postgresql: '<path class="t" d="M9.4 3.27C7.28 2.44 4.68 2.21 3.27 3.86 2.32 5.16 2.32 7.52 3.03 9.88 3.74 12.35 4.92 15.42 6.34 16.13 7.28 16.6 8.22 15.66 8.93 14.24 8.7 12.12 8.93 9.29 9.17 7.4 9.4 5.75 9.99 4.09 11.29 3.15Z"/><path class="t" d="M15.54 2.68C17.66 2.09 20.02 2.56 21.2 4.57 21.68 6.45 20.97 9.29 20.02 11.41 19.32 12.83 18.61 14.01 18.14 14.71 18.37 11.65 18.25 8.81 18.14 6.93 17.43 5.27 16.48 4.09 13.89 2.91Z"/><path d="M9.64 3.27C11.53 2.44 13.77 2.09 15.89 2.56"/><path d="M9.4 7.52C10.23 7.16 11.17 7.16 11.53 7.63 11.76 9.29 11.76 11.17 11.29 12.59 11.06 13.53 11.53 14.48 12.12 14.95M18.02 7.63C17.19 7.4 16.25 7.52 15.89 8.11 15.54 9.76 16.25 11.41 17.07 12.83 17.43 13.53 17.19 14.71 16.96 15.54"/><path d="M12.12 14.95L12.12 20.38C12.24 21.56 13.65 21.79 14.83 21.44 16.37 20.85 16.72 19.08 16.72 17.31L16.96 15.54"/><path d="M12.12 15.07C10.82 14.71 9.29 14.95 8.46 15.78 9.17 16.48 10.82 16.37 12.12 15.89M16.96 15.54C18.61 15.54 20.26 15.19 21.44 14.36 20.97 13.89 19.55 14.01 18.14 14.6"/><circle class="d" cx="10.47" cy="8.81" r=".6"/><circle class="d" cx="16.96" cy="8.81" r=".6"/>',
   // SQLite: feather
   sqlite: '<path class="f" d="M19.6 3.2c1.6 3.6-.4 8.6-4.2 11.7-1.6 1.3-3.4 2.1-5.2 2.4-.6-2.7 0-5.8 1.8-8.4 2.1-3.1 4.8-5.2 7.6-5.7z"/><path d="M17.6 6.4C14 10.6 11.2 15.4 8.4 21"/>',
   // Firebird: ring open at the top, the bird rising inside it with its head in the gap
   firebird: '<path d="M11 3a9 9 0 0 0-2.2 17.4"/><path class="f" d="M14.8 3.1A9 9 0 0 1 12.8 21c-2 0-3.2-1.4-3.2-3.6 0-2 .6-3.6 2-4.8.8-.7 1-1.6.4-2-.6-.4-1.4-.2-1.8.3 0-1.5 1-2.3 2-2.3 0-1 1-1.2 1.4-.6 1.2-.2 2.4.2 3.2 0-.4.8-.2 1.6.2 2.4.4 1.6-.6 3-1.8 4.2-.8.8-.4 1.6.6 1.6 2.4-.1 4-2.2 4.4-4.6A8 8 0 0 0 14.6 4.3z"/><circle class="d" cx="13.3" cy="9.5" r=".55"/>',
   // SQL Server: the twisted ribbon of the logo; the tinted front face (the wing pointing right) runs between the two folds,
   // with the back of the ribbon showing above it (top flap) and below it (flared lobe, one arc of its mesh)
   sqlserver: '<path d="M10.3 2C10.8 3.3 11.2 4.5 11.6 5.5C14.9 6 18.3 7 20.8 10.1C18.3 10.3 15.7 11.2 13.5 11.8C14 15 13.5 18.7 11.8 22C8.7 21.7 5.5 20.8 3.7 19.7C2.5 19 2.5 17.7 3.7 16.7C5.3 15 8.2 13.3 8.8 10.3C9 9 8.7 7.8 7.8 6.7C7 5.8 6.2 5.2 6 4.3C6.5 3.5 8.7 2.5 10.3 2Z"/><path class="t" d="M6.1 4.7C9.5 4.8 12.8 5.3 15.8 6.7C17.8 7.7 19.8 8.8 20.8 10.1C17 10.7 13.7 11.5 10.3 12.8C7.8 13.8 5.7 15.3 3.7 16.7C5.3 15 8.2 13.3 8.8 10.3C9 9 8.7 7.8 7.8 6.7C7 5.8 6.3 5.3 6.1 4.7Z"/><path d="M6.8 14.5C7 17 8.7 19 12.5 19.8"/>',
   // DuckDB: round badge with the duck head on the left and the bill on the right
   duckdb: '<circle cx="12" cy="12" r="9"/><circle class="t" cx="10" cy="12" r="4.2"/><rect class="d" x="15.2" y="10.8" width="4.3" height="2.4" rx="1.2"/>',

   /* ---------- platforms and services ---------- */
   // Docker: whale carrying containers
   docker: '<path class="f" d="M2.6 12.8H19c.4-1.3 1.6-2.1 3-2-.3 1.4-1.4 2.3-2.8 2.4-1.3 4.4-5 7.1-9.7 7.1-4.2 0-6.6-2.4-6.9-7.5z"/><rect class="d" x="4.2" y="9.6" width="2.3" height="2.3" rx=".4"/><rect class="d" x="7.2" y="9.6" width="2.3" height="2.3" rx=".4"/><rect class="d" x="10.2" y="9.6" width="2.3" height="2.3" rx=".4"/><rect class="d" x="13.2" y="9.6" width="2.3" height="2.3" rx=".4"/><rect class="d" x="7.2" y="6.6" width="2.3" height="2.3" rx=".4"/><rect class="d" x="10.2" y="6.6" width="2.3" height="2.3" rx=".4"/><rect class="d" x="13.2" y="6.6" width="2.3" height="2.3" rx=".4"/><rect class="d" x="13.2" y="3.6" width="2.3" height="2.3" rx=".4"/><circle class="d" cx="7" cy="15.6" r="0.9"/>',
   // GitHub: Octocat
   github: '<path class="f" d="M6.5 4.3l2.4 2a8.5 8.5 0 0 1 6.2 0l2.4-2c.6 1.2.7 2.7.3 4 .9 1 1.4 2.3 1.4 3.8 0 3.5-2.4 5.2-5.7 5.6H10.5c-3.3-.4-5.7-2.1-5.7-5.6 0-1.5.5-2.8 1.4-3.8-.4-1.3-.3-2.8.3-4z"/><path d="M13.5 17.7c.6.6.9 1.4.9 2.3V21M10.5 17.7c-.6.6-.9 1.4-.9 2.3V21M9.6 19.3c-2.4.5-3.3-.7-3.9-1.8-.3-.5-.8-.9-1.5-1.1"/>',
   // Mastodon: speech bubble with the m
   mastodon: '<path class="t" d="M18.7 4.1C20.1 4.7 21 6 21 7.7v4.5c0 2-1.5 3.6-3.5 3.9-2.6.4-5.3.5-7.9.2.2 1.6 1.4 2.5 3.2 2.6 1.4.1 2.8-.1 4-.5v2.2c-1.6.6-3.4.8-5.2.6-3.3-.4-5.4-2.5-5.6-6.4L5.8 8C5.7 6.2 6.6 4.6 8.3 4c3.4-1.3 7-1.3 10.4.1z"/><path d="M9.6 12.8V9.6a1.6 1.6 0 0 1 3.2 0v1.5M12.8 11.1V9.6a1.6 1.6 0 0 1 3.2 0v3.2"/>',
   // Raspberry Pi: raspberry, two leaves over a cluster of drupelets
   'raspberry-pi': '<path class="f" d="M12 7.2C10.2 4.4 7.3 4 5.6 4.8c.9 2 3.6 3 6.4 2.4zM12 7.2c1.8-2.8 4.7-3.2 6.4-2.4-.9 2-3.6 3-6.4 2.4z"/><circle class="t" cx="9.5" cy="10.5" r="2.3"/><circle class="t" cx="14.5" cy="10.5" r="2.3"/><circle class="t" cx="7.5" cy="14.6" r="2.3"/><circle class="t" cx="12" cy="14.4" r="2.3"/><circle class="t" cx="16.5" cy="14.6" r="2.3"/><circle class="t" cx="12" cy="18.6" r="2.3"/>',
   // Open Source Initiative: keyhole ring open at the bottom
   osi: '<path class="t" d="M9.4 20.6A9 9 0 1 1 14.6 20.6l-1.7-5.3A3.6 3.6 0 1 0 11.1 15.3z"/>',
   // AWS: lettering and smile arrow
   aws: '<path d="M4.2 6.9c.8-.8 3.3-.9 3.3.9V12M7.5 9.4c-2.3-.4-4 .2-4 1.4 0 1.6 2.6 1.6 4-.2M8.9 6.6l1.5 5.4 1.6-4.4 1.6 4.4 1.5-5.4M20 7c-.8-.6-3.6-.8-3.6.8 0 1.6 3.8 1 3.8 2.6 0 1.7-3 1.5-4 .8M3.5 15.6c5 3 12 3 17 0M17.6 14.8l3 .8-.8 3"/>',
   // Google Cloud: cloud with the inner arc
   'google-cloud': '<path class="t" d="M7 19.5h10a4.5 4.5 0 0 0 1.4-8.8A6.5 6.5 0 0 0 5.8 10.9 4.4 4.4 0 0 0 7 19.5z"/><path d="M9.2 16h6a2 2 0 0 0 .3-4 3.6 3.6 0 0 0-6.6-.6"/>',
   // Azure: the two strokes of the A
   azure: '<path class="f" d="M12.6 4L6.4 18.5H3L9.6 7z"/><path d="M14.2 6.6L21 19.5H7.5l8.2-1.6-4-4.6z"/>',
   // Linux: Tux
   linux: '<path d="M12 3c-2.3 0-3.5 1.8-3.5 4.2v2.3c-1.4 1.6-3.5 4.4-3.5 7.3 0 2.2 2.6 3.7 7 3.7s7-1.5 7-3.7c0-2.9-2.1-5.7-3.5-7.3V7.2C15.5 4.8 14.3 3 12 3z"/><ellipse class="f" cx="12" cy="15.6" rx="3.1" ry="3.9"/><circle class="d" cx="10.7" cy="6.8" r="0.9"/><circle class="d" cx="13.3" cy="6.8" r="0.9"/><path class="d" d="M10.4 8.9h3.2L12 10.6z"/>',
   // Windows: four panes in perspective
   windows: '<path class="t" d="M3 5.6l7.5-1.1v7H3zM13 4.1l8-1.1v8.5h-8zM3 12.5h7.5v7L3 18.4zM13 12.5h8V21l-8-1.1z"/>',
   // Apple: bitten apple with the leaf
   apple: '<path class="t" d="M15.8 7.3c-1.3 0-2.4.8-3.8.8s-2.5-.8-3.8-.8C5.6 7.3 4 9.7 4 12.7c0 4.2 2.8 8.3 4.9 8.3 1.2 0 1.8-.7 3.1-.7s1.9.7 3.1.7c1.7 0 3.4-2.6 4.3-5.1-1.8-.8-3-2.5-3-4.5 0-1.6.8-3 2-3.8-.8-.9-1.6-1.3-2.6-1.3z"/><path class="f" d="M12.2 5.6c0-1.8 1.4-3.2 3.1-3.3 0 1.8-1.4 3.2-3.1 3.3z"/>',
   // Android: head with antennas
   android: '<path class="t" d="M4 19.5a8 8 0 0 1 16 0z"/><path d="M7.3 12.6L5.6 9.4M16.7 12.6l1.7-3.2"/><circle class="d" cx="9" cy="16" r="1.1"/><circle class="d" cx="15" cy="16" r="1.1"/>'
};

export const brands: Record<string, string> = Object.fromEntries(
   Object.entries(logos).map(([name, markup]) => [name, `<g style="stroke-width: var(--icon-stroke-width, ${THIN_STROKE})">${markup}</g>`])
);
