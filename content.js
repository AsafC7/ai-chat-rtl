(() => {
  'use strict';

  const { direction } = globalThis.__aiChatRtl;
  const PROSE = 'p, li, h1, h2, h3, h4, h5, h6, blockquote, td, th, dt, dd, summary, figcaption';
  const LIST = 'ul, ol';
  const BLOCK = `${PROSE}, ${LIST}, table`;
  // Only divs: inline spans (e.g. per-word streaming spans) must never get their own direction.
  const LEAF = 'div';
  const EDITOR = 'textarea, [contenteditable="true"]';
  const EXCLUDED = 'pre, code, kbd, samp, .katex, .katex-display, math, [role="math"], mjx-container, svg, button, input, select, [hidden], [aria-hidden="true"]';
  const CHROME = 'nav, header, footer, [role="navigation"], aside';
  const IGNORED = `${EXCLUDED}, ${CHROME}`;
  const SKIP = `${IGNORED}, ${EDITOR}`;
  const LIST_BOUNDARY = `li, ${LIST}, table`;
  const CANDIDATE = `${PROSE}, ${LIST}, ${LEAF}, ${EDITOR}`;
  const MESSAGE_DIRECTION = 'data-ai-rtl';
  const EDITOR_DIRECTION = 'data-ai-rtl-draft';
  const pending = new Set();
  let frame = 0;

  function proseText(root, skip = `${BLOCK}, ${SKIP}`) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (node.nodeType === Node.TEXT_NODE) return NodeFilter.FILTER_ACCEPT;
        return node.matches(skip) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_SKIP;
      },
    });
    const parts = [];
    while (walker.nextNode()) parts.push(walker.currentNode.nodeValue);
    return parts.join(' ');
  }

  function hasDirectText(element) {
    for (let node = element.firstChild; node; node = node.nextSibling) {
      if (node.nodeType === Node.TEXT_NODE && node.nodeValue.trim()) return true;
    }
    return false;
  }

  function setDirection(element, attribute, value) {
    if (element.getAttribute(attribute) === value) return;
    if (value === null) element.removeAttribute(attribute);
    else element.setAttribute(attribute, value);
  }

  function update(element) {
    if (element.closest(IGNORED)) return;
    if (element.matches(EDITOR)) {
      const parent = element.parentElement;
      if (parent.closest(EDITOR)) return;
      const text = element.matches('textarea') ? element.value : proseText(element, SKIP);
      // Mark the wrapper so the editor keeps control of its DOM and selection.
      setDirection(parent, EDITOR_DIRECTION, direction(text));
      return;
    }
    if (element.closest(EDITOR)) return;

    let text = '';
    if (element.matches(LIST)) {
      const items = [];
      for (const item of element.children) {
        if (item.matches('li') && !item.matches(SKIP)) {
          items.push(proseText(item, `${LIST_BOUNDARY}, ${SKIP}`));
        }
      }
      text = items.join(' ');
    } else if (!element.matches(LEAF) || (hasDirectText(element) && !element.querySelector(BLOCK))) {
      text = proseText(element);
    }
    setDirection(element, MESSAGE_DIRECTION, direction(text));
  }

  function schedule() {
    if (frame || !pending.size) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      for (const element of pending) {
        if (document.body.contains(element)) update(element);
      }
      pending.clear();
    });
  }

  function enqueue(element) {
    if (element.matches(LEAF) && !element.hasAttribute(MESSAGE_DIRECTION) && !hasDirectText(element)) return;
    pending.add(element);
    if (element.matches('li') && element.parentElement?.matches(LIST)) pending.add(element.parentElement);
  }

  function enqueueOwners(node) {
    const element = node instanceof Element ? node : node.parentElement;
    if (!element) return;

    const editor = element.closest(EDITOR);
    if (editor) pending.add(editor);
    else if (!element.closest(IGNORED)) {
      const block = element.closest(BLOCK);
      if (block && !block.matches('table')) enqueue(block);

      // Paragraphs inside an item contribute to the list direction.
      const item = element.closest(LIST_BOUNDARY);
      if (item?.matches('li') && item.parentElement?.matches(LIST)) pending.add(item.parentElement);
    }

    // Adding or removing a nested block can change whether an outer wrapper qualifies as a leaf.
    for (let leaf = (editor?.parentElement ?? element).closest(LEAF); leaf; leaf = leaf.parentElement?.closest(LEAF)) {
      enqueue(leaf);
    }
  }

  function scan(root) {
    if (root.matches(CANDIDATE)) enqueue(root);
    if (root.closest(SKIP)) return;
    for (const element of root.querySelectorAll(CANDIDATE)) enqueue(element);
  }

  function start() {
    const { body } = document;
    const observer = new MutationObserver(records => {
      for (const { target, addedNodes } of records) {
        enqueueOwners(target);
        for (const node of addedNodes) {
          if (node instanceof Element) scan(node);
        }
      }
      schedule();
    });

    observer.observe(body, { childList: true, characterData: true, subtree: true });
    body.addEventListener('input', event => {
      const editor = event.target.closest?.(EDITOR);
      if (!editor) return;
      pending.add(editor);
      schedule();
    });
    scan(body);
    schedule();
  }

  if (document.body) start();
  else document.addEventListener('DOMContentLoaded', start, { once: true });
})();
