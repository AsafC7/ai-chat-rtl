<div align="center">
  <img src="icons/icon128.png" width="80" height="80" alt="">
  <h1>RTL for AI Chats</h1>
  <a href="https://github.com/AsafC7/ai-chat-rtl/actions/workflows/test.yml"><img src="https://github.com/AsafC7/ai-chat-rtl/actions/workflows/test.yml/badge.svg" alt="Tests"></a>
</div>

A Hebrew paragraph that opens with English can read left to right. This extension makes it read right to left.

**Supported sites** · [ChatGPT](https://chatgpt.com/) · [Claude](https://claude.ai/) · [Gemini](https://gemini.google.com/)

- Chooses a direction for each paragraph and updates the input box as you type.
- Keeps code and math left to right and preserves table column order.
- Detects Hebrew, Arabic, Persian, Syriac, Thaana, and N’Ko.

## Privacy & security

The extension requests no permissions. It reads text on the three supported sites and chooses a direction in your browser. It makes no network requests and does not store data or track you. GitHub Actions enforces the site and permission limits and scans the code for blocked APIs. The two content scripts total about 125 lines of plain JavaScript. [Direction logic](direction.js) · [Page integration](content.js)

## Install on desktop

1. Download this repository as a ZIP and extract it.
2. Open `chrome://extensions`, `brave://extensions`, or `edge://extensions`.
3. If the previous version is active, turn it off. Enable **Developer mode**.
4. Select **Load unpacked** and choose the folder that contains `manifest.json`.
5. Refresh the chat tab.

You can leave the extension unpinned. It has no toolbar button.

## Quick test

Paste this line into the chat input and send it.

> <span dir="rtl">API Gateway מחזיר שגיאה רק אחרי שהחיבור נפתח (HTTP 502).</span>

The draft and sent message should both read right to left, with `API Gateway` at the right and `HTTP 502` near the left. Type an English draft to see the input switch back.

## Limitations

The extension uses a letter count to pick direction. Text with a similar number of letters from each script can go either way. A change to a site's page structure can require an update. Support for Claude and Gemini is new.

<div dir="rtl" lang="he">
  <h2>בעברית</h2>
  <p>התוסף מתאים את כיוון הקריאה של כל פסקה ואת כיוון שדה ההקלדה ב־<bdi>ChatGPT</bdi>, ב־<bdi>Claude</bdi> וב־<bdi>Gemini</bdi>. קוד ונוסחאות נשארים משמאל לימין, וסדר העמודות בטבלאות נשמר. התוסף פועל בדפדפן, בלי הרשאות, בלי לשלוח מידע ובלי לשמור אותו.</p>
  <ol>
    <li>הורידו את המאגר כקובץ <bdi>ZIP</bdi> וחלצו אותו.</li>
    <li>פתחו את דף התוספים בדפדפן והפעילו <bdi>Developer mode</bdi>.</li>
    <li>לחצו על <bdi>Load unpacked</bdi>, בחרו את התיקייה שמכילה את <bdi><code>manifest.json</code></bdi> ורעננו את עמוד השיחה.</li>
  </ol>
</div>

License: MIT
