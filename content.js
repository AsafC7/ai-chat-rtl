(() => {
  'use strict';

  const USER_MESSAGE = ':is([data-message-author-role="user"], [data-user-message-bubble="true"])';
  const ASSISTANT_TEXT = ':is([data-chatgpt-selection-message-id], [data-content-search-unit-key$=":assistant"]) [data-markdown-text-style]';
  const MESSAGE = `${USER_MESSAGE}, [data-message-author-role="assistant"], ${ASSISTANT_TEXT}`;
  const PROSE = 'p, li, h1, h2, h3, h4, h5, h6, blockquote, td, th, dt, dd';
  const USER_TEXT = '.whitespace-pre-wrap';
  const EDITOR = ':is(#prompt-textarea, #mobile-composer-prompt):is(textarea, [contenteditable="true"])';
  const ROOT = `${MESSAGE}, ${EDITOR}`;
  const EXCLUDED = 'pre, code, .katex, .katex-display, math, [role="math"], mjx-container, button, svg, [hidden], [aria-hidden="true"]';
  const MESSAGE_DIRECTION = 'data-chatgpt-rtl';
  const EDITOR_DIRECTION = 'data-chatgpt-rtl-draft';
  const pending = new Set();
  let frame = 0;

  function direction(text) {
    const prose = text.replace(/(?:https?:\/\/|www\.)\S+|\b[\w.+-]+@[\w.-]+\.[a-z]+\b/giu, '');
    const hebrew = (prose.match(/[\p{Script=Hebrew}&&\p{Letter}]/gv) || []).length;
    const latin = (prose.match(/[\p{Script=Latin}&&\p{Letter}]/gv) || []).length;

    // shortcut: letter counts approximate mixed prose. Revisit if common phrases flip incorrectly.
    if (hebrew) return hebrew * 1.5 >= latin ? 'rtl' : 'ltr';
    return /^\p{Script=Latin}$/u.test(prose.match(/\p{Letter}/u)?.[0] ?? '') ? 'ltr' : null;
  }

  function proseText(block) {
    const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
    const parts = [];
    let node;
    while ((node = walker.nextNode())) {
      const parent = node.parentElement;
      if (parent.closest(EXCLUDED)) continue;
      const nested = parent.closest('li, blockquote');
      if (nested && nested !== block && block.contains(nested)) continue;
      parts.push(node.nodeValue);
    }
    return parts.join(' ');
  }

  function setDirection(element, attribute, value) {
    if (element.getAttribute(attribute) === value) return;
    if (value) element.setAttribute(attribute, value);
    else element.removeAttribute(attribute);
  }

  function update(root) {
    if (root.matches(EDITOR)) {
      const text = root instanceof HTMLTextAreaElement ? root.value : proseText(root);
      // Mark the wrapper so the editor's own DOM and selection stay under its control.
      setDirection(root.parentElement, EDITOR_DIRECTION, direction(text));
      return;
    }

    const isUser = root.matches(USER_MESSAGE);
    const blocks = [...root.querySelectorAll(isUser ? `${PROSE}, ${USER_TEXT}` : PROSE)];
    if (isUser && root.matches(USER_TEXT)) blocks.unshift(root);
    for (const block of blocks) {
      if (block.closest(MESSAGE) !== root || block.closest(`${EXCLUDED}, [contenteditable="true"]`)) continue;
      const wrapsProse = block.matches(USER_TEXT) && !block.matches(PROSE) && block.querySelector(PROSE);
      setDirection(block, MESSAGE_DIRECTION, wrapsProse ? null : direction(proseText(block)));
    }
  }

  function schedule() {
    if (frame || !pending.size) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      for (const root of pending) {
        if (root.isConnected && root.matches(ROOT)) update(root);
      }
      pending.clear();
    });
  }

  function enqueueOwner(node) {
    const element = node instanceof Element ? node : node.parentElement;
    const root = element?.closest(ROOT);
    if (root) pending.add(root);
  }

  const observer = new MutationObserver(records => {
    for (const {target, addedNodes} of records) {
      enqueueOwner(target);
      for (const node of addedNodes) {
        if (!(node instanceof Element)) continue;
        if (node.matches(ROOT)) pending.add(node);
        for (const root of node.querySelectorAll(ROOT)) pending.add(root);
      }
    }
    schedule();
  });

  observer.observe(document.documentElement, {childList: true, characterData: true, subtree: true});
  document.addEventListener('input', event => {
    if (!(event.target instanceof HTMLTextAreaElement) || !event.target.matches(EDITOR)) return;
    pending.add(event.target);
    schedule();
  });
  for (const root of document.querySelectorAll(ROOT)) pending.add(root);
  schedule();
})();
