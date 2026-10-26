# Documentation

These instructions apply to `docs/` and its subfolders.

## Content

- Keep each document short: what was done, how it was checked, and what the result was.
- When documenting a conversation, keep the user's request and Claude's response clearly separate, for example under their own headings.
- Quotes must match the source exactly, so readers can trust them. Mark any shortened or paraphrased text as a summary, not a quote. If the source is not available, ask for it instead of writing a quote.

## Direction (GitHub Markdown)

- Wrap Hebrew text in `<div dir="rtl">` … `</div>`, with a blank line after the opening tag and before the closing tag, so GitHub still renders the Markdown inside.
- Put commands, code, paths and English blocks in fenced code blocks outside the RTL `div`: close the `div` before the block and reopen it after, so they display left to right.
- Short inline code such as `npm run check` can stay inside Hebrew sentences.
