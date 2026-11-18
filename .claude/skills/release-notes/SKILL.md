---
name: release-notes
description: Write user-facing release notes (Markdown, in chat) for the latest Antares release in CHANGELOG.md, or for a version the user names. Use when asked for a changelog, release notes or "what's new" for app users.
---

Turn the `standard-version` entry in [CHANGELOG.md](../../../CHANGELOG.md) into release notes for **app users**, and give them in chat as one Markdown code block, ready to paste (GitHub release, website, social).

## 1. Collect the commits

- Version: the first `### [x.y.z...]` heading in `CHANGELOG.md` (the latest release), unless the user names one. Read that section up to the next version heading.
- Commit messages are often terse. For every entry that might matter to users, look at the commit before writing about it:
  ```bash
  git show -s --format='%s%n%b' <sha>      # full message
  git show --stat --format= <sha>          # files touched
  git show <sha> -- src/renderer/i18n/en-US.ts   # new UI strings = what the user actually sees
  ```
  Also check [src/common/shortcuts.ts](../../../src/common/shortcuts.ts) for new shortcuts (give the real keys) and `src/common/customizations/` for which engines a feature applies to.

## 2. Find the contributors

For every entry you keep, find who wrote it:
```bash
git show -s --format='%an' <sha>                                              # git author name
gh api repos/antares-sql/antares/commits/<sha> --jq '.author.login'            # GitHub login (empty if the email isn't linked)
gh api repos/antares-sql/antares/commits/<sha>/pulls --jq '.[0].user.login'    # fallback: author of the PR that brought it in
```
- Credit only external contributors: skip the app author (**Fabio Di Stasio**, GitHub `Fabio286`).
- Commits authored by `Claude` (or co-authored only by Claude) count as the maintainer's work: check the PR author, and skip the credit if it is `Fabio286`.
- Use `@login` when you have a GitHub login; otherwise use the git author name, without `@`.
- Add credits for human `Co-authored-by` trailers too.

## 3. Filter

Leave out anything users don't notice: tests, fixtures, CI, `appDriver`, debug/dev tooling, docs, pure refactors, dependency or build bumps, "CR fixes". Keep a refactor only when it changes behavior users notice (stability, performance, reliability), and put it in "Under the hood" in one plain sentence.

## 4. Write

Language: **English** (unless asked otherwise). Format, with **h2 for the title and h3 for the sections** (never h1):

```md
## Antares SQL <version>

<One or two sentences: the gist of the release.>

### ✨ New features

- **<Short name>**: <what the user can do now and how (shortcut, menu, option); engine in the name if engine-specific, e.g. "(MySQL/MariaDB)">. Thanks to @login!

### 🐛 Bug fixes

- **<Engine or area> – <topic>**: <the symptom users had (quote the error message if known), now fixed; link the issue if closed: [#991](https://github.com/antares-sql/antares/issues/991)>. Thanks to @login!

### 🔧 Under the hood

- <Internal change, explained only by its effect on users.>
```

Rules:
- Describe the effect on the user, not the code: "you can now…", "no longer fails with…". No commit hashes, file names or internal class names.
- Order: most visible first. New translations go at the end of features. Omit empty sections.
- End an entry with "Thanks to @login!" only if it has an external contributor (step 2). Credit several people as "Thanks to @a and @b!".
- For a beta, the title keeps the full version (`0.7.36-beta.0`).
- Don't invent behavior. If you inferred a detail (exact gesture, when a bug occurred), list it after the code block in a short "to verify" list, in the user's language.

The reply text around the code block is in the user's language; start it with one line naming the audience (e.g. "Written for: Antares end users").
