(() => {
  'use strict';

  function direction(text) {
    const prose = text.replace(/(?:https?:\/\/|www\.)\S+|\b[\w.+-]+@[\w.-]+\.[a-z]+\b/giu, '');
    const rtl = (prose.match(/[[\p{Script=Hebrew}\p{Script=Arabic}\p{Script=Syriac}\p{Script=Thaana}\p{Script=Nko}]&&\p{Letter}]/gv) || []).length;
    const latin = (prose.match(/[\p{Script=Latin}&&\p{Letter}]/gv) || []).length;

    // shortcut: letter counts approximate mixed prose. Revisit if common phrases flip incorrectly.
    if (rtl) return rtl * 1.5 >= latin ? 'rtl' : 'ltr';
    return /^\p{Script=Latin}$/u.test(prose.match(/\p{Letter}/u)?.[0] ?? '') ? 'ltr' : null;
  }

  globalThis.__aiChatRtl = { direction };
})();
