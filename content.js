(() => {
  'use strict';

  const USER_MESSAGE = ':is([data-message-author-role="user"], [data-user-message-bubble="true"])';
  const ASSISTANT_TEXT = ':is([data-chatgpt-selection-message-id], [data-content-search-unit-key$=":assistant"]) [data-markdown-text-style]';
  const SITES = {
    'chatgpt.com': {
      messages: `${USER_MESSAGE}, [data-message-author-role="assistant"], ${ASSISTANT_TEXT}`,
      editor: ':is(#prompt-textarea, #mobile-composer-prompt):is(textarea, [contenteditable="true"])',
      codeScope: `[data-message-author-role], [data-user-message-bubble="true"], ${ASSISTANT_TEXT}`,
    },
    'claude.ai': {
      messages: '[data-testid="user-message"], .font-claude-response, .font-claude-message, [data-is-streaming]',
      editor: '.ProseMirror[contenteditable="true"], :is([data-testid="chat-input"], [data-testid="composer"]) textarea',
    },
    'gemini.google.com': {
      messages: 'user-query, .query-text, message-content, .markdown',
      editor: 'rich-textarea [contenteditable="true"], .ql-editor[contenteditable="true"]',
    },
  };
  const { hostname } = location;
  const { messages: MESSAGE, editor: EDITOR, codeScope = MESSAGE } = SITES[hostname];
  const { direction } = globalThis.__aiChatRtl;
  const isChatGPT = hostname === 'chatgpt.com';
  const PROSE = 'p, li, h1, h2, h3, h4, h5, h6, blockquote, td, th, dt, dd';
  const USER_TEXT = '.whitespace-pre-wrap';
  const ROOT = `${MESSAGE}, ${EDITOR}`;
  const SCAN = `${codeScope}, ${EDITOR}`;
  const EXCLUDED = 'pre, code, .katex, .katex-display, math, [role="math"], mjx-container, button, svg, [hidden], [aria-hidden="true"]';
  const MESSAGE_DIRECTION = 'data-ai-rtl';
  const EDITOR_DIRECTION = 'data-ai-rtl-draft';
  const pending = new Set();
  let frame = 0;

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
    if (value === null) element.removeAttribute(attribute);
    else element.setAttribute(attribute, value);
  }

  function blockDirection(block) {
    if (block.closest(`${EXCLUDED}, [contenteditable="true"]`)) return null;
    if (isChatGPT && block.matches(USER_TEXT) && !block.matches(PROSE) && block.querySelector(PROSE)) return null;
    return direction(proseText(block));
  }

  function update(root) {
    if (root.matches(EDITOR)) {
      const text = root instanceof HTMLTextAreaElement ? root.value : proseText(root);
      // Mark the wrapper so the editor's own DOM and selection stay under its control.
      setDirection(root.parentElement, EDITOR_DIRECTION, direction(text));
      return;
    }

    const isMessage = root.matches(MESSAGE);
    const isUser = isChatGPT && root.matches(USER_MESSAGE);
    const rootIsProse = isChatGPT
      ? isUser && root.matches(USER_TEXT)
      : root.matches(PROSE) || !root.querySelector(`${PROSE}, ${MESSAGE}, table`);
    // An empty value scopes code and math styles without setting the message direction.
    const value = isMessage && rootIsProse ? blockDirection(root) : null;
    setDirection(root, MESSAGE_DIRECTION, value ?? '');
    if (!isMessage) return;
    for (const block of root.querySelectorAll(isUser ? `${PROSE}, ${USER_TEXT}` : PROSE)) {
      if (block.closest(MESSAGE) !== root) continue;
      setDirection(block, MESSAGE_DIRECTION, blockDirection(block));
    }
  }

  function schedule() {
    if (frame || !pending.size) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      for (const root of pending) {
        if (root.isConnected && root.matches(SCAN)) update(root);
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
        if (node.matches(SCAN)) pending.add(node);
        for (const root of node.querySelectorAll(SCAN)) pending.add(root);
      }
    }
    schedule();
  });

  observer.observe(document.documentElement, {childList: true, characterData: true, subtree: true});
  document.addEventListener('input', event => {
    if (isChatGPT && !(event.target instanceof HTMLTextAreaElement)) return;
    if (!(event.target instanceof Element) || !event.target.matches(EDITOR)) return;
    pending.add(event.target);
    schedule();
  });
  for (const root of document.querySelectorAll(SCAN)) pending.add(root);
  schedule();
})();
