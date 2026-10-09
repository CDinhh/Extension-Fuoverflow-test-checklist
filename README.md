# Extension-Fuoverflow-test-checklist

Browser extension (Manifest V3) that adds a checkbox to every thread in the
[FuOverflow](https://fuoverflow.com) forum lists, so you can tick the exams you have
finished reviewing.

## Features

- Checkbox in front of each thread title on thread lists.
- Ticked threads are struck through and highlighted.
- State is saved in `localStorage` (key `fuo-test-checklist`), keyed by thread ID, so it
  survives pagination, reordering and page reloads.
- Progress bar showing the total ticked and the count on the current page.

## Install (Brave / Chrome)

1. Open `brave://extensions` (or `chrome://extensions`).
2. Enable **Developer mode**.
3. Click **Load unpacked** and select this folder.
4. Open a forum page such as https://fuoverflow.com/forums/MLN111/.

## Notes

- Data is stored per browser; ticks in Brave do not appear in Chrome.
- The total counts every ticked thread on fuoverflow.com, not only one subject.
