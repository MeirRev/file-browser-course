# משימה 1: הגדרות Claude Code ברמות User, Project ו-Local

## ההגדרות

| רמה | קובץ | הגדרות | ב-Git |
|---|---|---|---|
| User | `~/.claude/settings.json` | `theme: "dark"` (ללא שינוי; גם `autoUpdatesChannel` נשאר כפי שהיה) | לא, מחוץ לפרויקט |
| Project | `.claude/settings.json` | `model: "sonnet"`; Allow: `Bash(npm run check)`, `PowerShell(npm run check)` | כן, משותף |
| Local | `.claude/settings.local.json` | `model: "claude-opus-5-5"`; Allow: `Bash(npm run dev)`, `PowerShell(npm run dev)` | לא, מוחרג ב-`.gitignore` |

הכללים נכתבו בלי `:*`, ולכן כל אחד מהם מתיר רק את הפקודה המדויקת.

`sonnet` ברמת Project הוא ברירת המחדל של הפרויקט. הוא חל על כל מי שפותח את הפרויקט בלי קובץ Local משלו, למשל חבר צוות או clone חדש. ברמת Local נקבע המזהה המלא של המודל שהיה פעיל בתחילת המשימה, כדי שהמודל שאני עובד בו לא ישתנה.

## בדיקת קדימות: `model`

הקדימות נבדקה רק בעזרת `model`, ולא בעזרת הרשאות, כי כללי הרשאה מתמזגים בין הרמות ולא דורסים זה את זה.

| שלב | הפעלה | Setting sources ב-`/status` | מודל |
|---|---|---|---|
| 1 | `claude` | User, Shared project, Project local | `claude-opus-5-5` |
| 2 | `claude --setting-sources user,project` | User, Shared project | `sonnet (claude-sonnet-5-5)` |
| 3 | `claude` (חזרה להפעלה רגילה) | לא צולם; רק מסך הפתיחה | Opus 5.5 |

**מסקנה:** כש-Project ו-Local מגדירים ערכים שונים ל-`model`, הערך של Local גובר. בלי טעינת Local נבחר הערך של Project. שלב 2 הוא ההוכחה המכרעת: הוא מראה שקובץ ה-Project אכן נקרא, ושולל את האפשרות ש-Opus הגיע סתם מברירת המחדל של החשבון. הקבצים עצמם לא נמחקו ולא שונו במהלך הבדיקה.

**הערות:**
- Claude Code התעדכן אוטומטית במהלך הבדיקה: בשלב 1 הגרסה הייתה 2.1.309, ובשלבים 2 ו-3 הגרסה הייתה 2.1.310 (בגלל `autoUpdatesChannel: "latest"`). העדכון לא משפיע על המסקנה.
- צילומי שלבים 1 ו-2 כוללים כתובת דואר ומזהי session. לכן הם **לא נכללו במאגר** ונשמרו מקומית מחוץ לפרויקט.

## בדיקת הרשאות

### שלב א: הרצה ב-Auto mode (ללא הוכחה להרשאות)

`npm run check` רץ בהצלחה דרך Bash ודרך PowerShell, ו-29 בדיקות עברו. ה-session רץ ב-Auto mode, שבו פקודות מאושרות בלי לשאול את המשתמש. לכן העובדה שלא הופיעה בקשת אישור **לא מוכיחה** שכללי ההרשאה עובדים.

### שלב ב: הרצה דרך PowerShell ב-Manual mode

| צילום | מה הוא מראה |
|---|---|
| [`01-loaded-allow-rules.png`](evidence/permissions/01-loaded-allow-rules.png) | `/permissions`, בלשונית Allow: מופיעים ארבעת הכללים, כולל `PowerShell(npm run check)`. |
| [`02-manual-mode.png`](evidence/permissions/02-manual-mode.png) | שורת המצב מציגה `manual mode on`. |
| [`03-powershell-check-passed.png`](evidence/permissions/03-powershell-check-passed.png) | בקשה להריץ `npm run check` דרך PowerShell: typecheck ו-lint עברו, 29 בדיקות עברו, ובתחתית עדיין מופיע `manual mode on`. |

לפי עדות המשתמש, במהלך ההרצה **לא הופיעה בקשת אישור**.

**מסקנה:** יש ראיה לכך ש-`npm run check` רץ דרך PowerShell ב-Manual mode בלי בקשת אישור, כשהכלל `PowerShell(npm run check)` מופיע ברשימת Allow.

**גבולות הראיה:**
- כך נבדק **רק** `PowerShell(npm run check)`. הכללים `Bash(npm run check)`, `Bash(npm run dev)` ו-`PowerShell(npm run dev)` לא נבדקו ב-Manual mode.
- היעדר בקשת אישור הוא עדות של המשתמש. צילום מסך לא יכול להראות דבר שלא קרה.
- בצילום 3 הפקודה מוצגת בתצוגה מקוצרת (`Ran 1 shell command`). הכלי והפקודה המדויקת מופיעים בבקשה ובתשובה, אבל לא בפירוט ההרצה עצמו.
- בצילום 1 לא רואים מאיזה קובץ הגיע כל כלל, Project או Local.

**פרטיות:** בדקתי את שלושת הצילומים לפני שהעתקתי אותם לפרויקט. אין בהם כתובת דואר, מזהי session או מטא-דאטה מוטמע בקובץ. כן מופיעים בהם הנתיב `~\Desktop\file browser`, סוג המנוי (Claude Pro) והגרסה.

## החרגת קובץ Local מ-Git

- `git check-ignore -v .claude/settings.local.json` מאשר שהקובץ מוחרג, לפי השורה `.gitignore:6`.
- `git ls-files .claude/settings.local.json` לא מחזיר דבר, כלומר הקובץ אינו במעקב.

## לפני סימון המשימה כמושלמת

- לבצע commit ל-`.claude/settings.json`, לשינוי ב-`.gitignore` ולתיקייה `docs/exercise-1/`.
- לא לכלול ב-commit את `.claude/settings.local.json` ואת צילומי ה-`/status`.

## אחרי המשימה: הסרת הגדרות `model`

בדיקת הקדימות הושלמה ונשמרה ב-commit `356278c`. לאחר מכן הוסר המפתח `model` מ-`.claude/settings.json` ומ-`.claude/settings.local.json`, כדי לחזור לבחירת המודל הרגילה. ההרשאות נשארו ללא שינוי: `npm run check` ברמת Project ו-`npm run dev` ברמת Local, דרך Bash ו-PowerShell.
