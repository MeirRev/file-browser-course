<div dir="rtl">

# משימה 8 — CLAUDE.md

## מה נוצר

בשורש הפרויקט נוצר `CLAUDE.md` עם חמישה סעיפים, בסדר הזה:

</div>

```text
Forbidden
Conventions
Stack
Commands
Background / open questions
```

<div dir="rtl">

לכל איסור מצורפת סיבה. הטכנולוגיות (React, TypeScript, Vite, Vitest, ESLint) והפקודות (`npm run dev`, `npm run check`, `npm run build`) אומתו מול `package.json`.

## איך נבדק

בשיחה חדשה נשלחה הבקשה הבאה, בלי להזכיר את `CLAUDE.md`:

> בדוק את פיצ׳ר ספירת עמודי ה־PDF הקיים ודווח אם הוא תקין. אל תשנה קבצים.

קטע מהתשובה, שבו הבדיקות שבוצעו בפועל מופרדות מהבדיקות הידניות שלא בוצעו (הושמטו שורות):

> **מה הרצתי בפועל**
> - `npm run check`: כל שלושת השלבים עברו.
> - typecheck עבר בלי שגיאות.
> - lint עבר בלי שגיאות.
> - הבדיקות האוטומטיות עברו: 48 מתוך 48, מתוכן 10 בדיקות של PDF.
>
> […]
>
> **בדיקות ידניות שעדיין צריך לעשות (`npm run dev`)**
> - PDF של עמוד אחד ו־PDF של הרבה עמודים: לוודא שהמספר נכון.
> - PDF שנשמר מ־Word או מהדפדפן (גרסה 1.5 ומעלה, עם דחיסה).
>
> […]

הכלל המתאים מתוך `CLAUDE.md`, בסעיף Conventions:

</div>

```text
In the final report, separate checks you actually ran from manual checks that are still pending. Never present a check that was not run as passed.
```

<div dir="rtl">

התשובה פעלה לפי הכלל הזה, אף שהבקשה לא הזכירה אותו. `CLAUDE.md` נטען לשיחה אוטומטית כשהיא מתחילה.

**הסתייגות:** בשיחה הופעל גם ה־skill בשם `verify-feature`, שכולל הוראות דומות (להפריד בין מה שבוצע למה שממתין, ולא להציג בדיקה שלא רצה כאילו עברה). לכן ההתנהגות תואמת לכלל ב־`CLAUDE.md`, אבל אי אפשר לייחס אותה לקובץ בלבד.

## תוצאה

לפי התוצאה שהתקבלה בשיחה, `npm run check` עברה: typecheck ו־lint עברו, ו־48 מתוך 48 בדיקות עברו.

הבדיקות הידניות של הפיצ'ר תועדו בעבר ב[משימה 3](../exercise-3/README.md). הן לא בוצעו מחדש בשיחה הזו.

</div>
