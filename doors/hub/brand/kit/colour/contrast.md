# KINGDOM: contrast

WCAG 2.x ratio is the conformance bar (AA: 4.5 text, 3 large text and UI). APCA Lc is shown as guidance from the WCAG 3 drafts.

| mode | foreground | on | colours | ratio | needs | APCA Lc | |
|---|---|---|---|---|---|---|---|
| light | `text` | `bg` | #1B1E17 on #EFE5CF | 13.48 | 4.5 | 88.9 | ✓ |
| light | `text-muted` | `bg` | #515849 on #EFE5CF | 5.9 | 4.5 | 70.8 | ✓ |
| light | `text` | `surface` | #1B1E17 on #DBD1BC | 11.13 | 4.5 | 77.5 | ✓ |
| light | `focus` | `bg` | #152623 on #EFE5CF | 12.58 | 3 | 87.7 | ✓ |
| light | `primary-text` | `bg` | #152623 on #EFE5CF | 12.58 | 4.5 | 87.7 | ✓ |
| light | `accent-text` | `bg` | #685224 on #EFE5CF | 5.95 | 4.5 | 70.9 | ✓ |
| light | `on-primary` | `primary` | #FFFFFF on #152623 | 15.75 | 4.5 | -105.3 | ✓ |
| light | `on-accent` | `accent` | #1B1E17 on #DBC08B | 9.58 | 4.5 | 69.4 | ✓ |
| light | `primary-ui` | `bg` | #152623 on #EFE5CF | 12.58 | 3 | 87.7 | ✓ |
| light | `accent-ui` | `bg` | #816835 on #EFE5CF | 4.23 | 3 | 61.3 | ✓ |
| light | `primary` | `bg` | #152623 on #EFE5CF | 12.58 | 0 | 87.7 | info |
| light | `accent` | `bg` | #DBC08B on #EFE5CF | 1.41 | 0 | 17.3 | info |
| dark | `text` | `bg` | #F6F7F4 on #152623 | 14.65 | 4.5 | -99.7 | ✓ |
| dark | `text-muted` | `bg` | #9CA593 on #152623 | 6.16 | 4.5 | -49.3 | ✓ |
| dark | `text` | `surface` | #F6F7F4 on #293A37 | 11.13 | 4.5 | -95.4 | ✓ |
| dark | `focus` | `bg` | #778B87 on #152623 | 4.37 | 3 | -35.4 | ✓ |
| dark | `primary-text` | `bg` | #94A6A2 on #152623 | 6.18 | 4.5 | -49.4 | ✓ |
| dark | `accent-text` | `bg` | #DBC08B on #152623 | 8.94 | 4.5 | -67.9 | ✓ |
| dark | `on-primary` | `primary` | #1B1E17 on #778B87 | 4.68 | 4.5 | 38.2 | ✓ |
| dark | `on-accent` | `accent` | #1B1E17 on #DBC08B | 9.58 | 4.5 | 69.4 | ✓ |
| dark | `primary-ui` | `bg` | #778B87 on #152623 | 4.37 | 3 | -35.4 | ✓ |
| dark | `accent-ui` | `bg` | #DBC08B on #152623 | 8.94 | 3 | -67.9 | ✓ |
| dark | `primary` | `bg` | #778B87 on #152623 | 4.37 | 0 | -35.4 | info |
| dark | `accent` | `bg` | #DBC08B on #152623 | 8.94 | 0 | -67.9 | info |

Note: dark mode --primary is #778B87 (primary 500, 4.37:1 on the dark ground), not the brand colour #152623, which is 1.0:1 there and would disappear as a fill.
