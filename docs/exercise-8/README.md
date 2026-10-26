<div dir="rtl">

# משימה 8 — CLAUDE.md

## מה נוצר

בשורש הפרויקט נוצר [`CLAUDE.md`](../../CLAUDE.md), עם כותרת וחמישה סעיפים. זה התוכן המלא שלו, לפי הסדר המקורי:

</div>

```markdown
# File Browser

## Forbidden

- At runtime the app makes no network requests, uses no localStorage or IndexedDB, and never writes to the user's files, so the files and everything about them stay on the user's machine, unchanged. This does not stop you from editing code, running tests or writing documentation during development.
- Code in `src/lib/` must not import React or anything from `src/components/`, so the core logic does not depend on the user interface.
- Use the CSS variables from `src/styles/tokens.css` for design values, and do not add parallel values outside it, so the design stays consistent.

## Conventions

- Keep each change focused on the request. Report unrelated bugs you find, but do not fix them.
- In the final report, separate checks you actually ran from manual checks that are still pending. Never present a check that was not run as passed.

## Stack

React and TypeScript, built with Vite. Tests use Vitest; linting uses ESLint.

## Commands

- `npm run dev` — start the dev server to view the app in the browser.
- `npm run check` — typecheck, lint and run the automated tests.
- `npm run build` — create a production build.

These are the available commands and what they do, not a list to run on every task.

## Background / open questions

No known open questions at the moment.
```

<div dir="rtl">

לכל איסור מצורפת סיבה. הטכנולוגיות (React, TypeScript, Vite, Vitest, ESLint) והפקודות (`npm run dev`, `npm run check`, `npm run build`) אומתו מול `package.json`.

## איך נבדק

הבדיקה נעשתה בשיחה חדשה, בלי להזכיר את `CLAUDE.md`.

### הבקשה שנשלחה

> בדוק את פיצ׳ר ספירת עמודי ה־PDF הקיים ודווח אם הוא תקין. אל תשנה קבצים.

### התשובה שהתקבלה

שני קטעים מתוך התשובה המקורית, כל אחד בשלמותו.

הבדיקות שבוצעו:

> **מה הרצתי בפועל**
> - `npm run check`: כל שלושת השלבים עברו.
> - typecheck עבר בלי שגיאות.
> - lint עבר בלי שגיאות.
> - הבדיקות האוטומטיות עברו: 48 מתוך 48, מתוכן 10 בדיקות של PDF.
> - קראתי את הקוד. הוא קורא את הקובץ רק בזיכרון, בלי בקשות רשת, בלי localStorage או IndexedDB ובלי כתיבה לקבצים. כלומר הוא עומד בכלל המקומיות.

הבדיקות הידניות שנותרו:

> **בדיקות ידניות שעדיין צריך לעשות (`npm run dev`)**
> - PDF של עמוד אחד ו־PDF של הרבה עמודים: לוודא שהמספר נכון.
> - PDF שנשמר מ־Word או מהדפדפן (גרסה 1.5 ומעלה, עם דחיסה).
> - PDF שנערך ונשמר שוב, למשל באקרובט: לבדוק את בעיה 1.
> - מעבר מהיר בין שני קובצי PDF: לבדוק את בעיה 2.
> - PDF פגום או קטוע, וקובץ ‎.txt ששמו שונה ל־‎.pdf: אמורה להופיע הודעת "Unable to read".
> - PDF מוצפן.
> - PDF גדול מאוד, מעל 100MB: לבדוק אם הממשק נתקע.
> - קובץ PDF עם שם בעברית, קובץ בלי סיומת, ו־dotfile.
> - קובץ שאין הרשאה לקרוא אותו.
> - בכלי המפתחים: בלשונית Network לוודא שאין בקשות. בלשונית Application לוודא ש־localStorage ו־IndexedDB ריקים.

### מה הודגם

התשובה הפרידה בין בדיקות שבוצעו לבדיקות שעדיין ממתינות, בהתאם לכלל הבא בסעיף Conventions של `CLAUDE.md`, אף שהבקשה לא הזכירה אותו:

</div>

```text
In the final report, separate checks you actually ran from manual checks that are still pending. Never present a check that was not run as passed.
```

<div dir="rtl">

**הערה:** בשיחה הופעל גם ה־skill בשם `verify-feature`, שכולל הוראה דומה. לכן ההתנהגות תואמת לכלל ב־`CLAUDE.md`, אבל אי אפשר לייחס אותה לקובץ בלבד.

## תוצאה

לפי התוצאה שהתקבלה בשיחה, `npm run check` עברה: typecheck ו־lint עברו, ו־48 מתוך 48 בדיקות עברו.

הבדיקות הידניות של הפיצ'ר תועדו בעבר ב[משימה 3](../exercise-3/README.md). הן לא בוצעו מחדש בשיחה הזו.

</div>
