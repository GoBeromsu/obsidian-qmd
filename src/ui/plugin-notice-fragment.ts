import { setIcon } from 'obsidian';

interface BuildNoticeFragmentOptions {
  id: string;
  prefix: string;
  text: string;
  immutable: boolean;
  button?: { text: string; callback: () => void };
  onMute: (id: string) => void;
}

export function buildNoticeFragment(opts: BuildNoticeFragmentOptions): DocumentFragment {
  const fragment = document.createDocumentFragment();
  const wrapper = document.createElement('div');
  wrapper.className = 'plugin-notice';

  const head = document.createElement('p');
  head.className = 'plugin-notice-head';
  head.textContent = `[${opts.prefix}]`;
  wrapper.appendChild(head);

  const body = document.createElement('p');
  body.className = 'plugin-notice-content';
  body.textContent = opts.text;
  wrapper.appendChild(body);

  const actions = document.createElement('div');
  actions.className = 'plugin-notice-actions';

  if (opts.button?.text && typeof opts.button.callback === 'function') {
    actions.appendChild(createActionButton(opts.button.text, opts.button.callback));
  }

  if (!opts.immutable) {
    actions.appendChild(createMuteButton(opts.id, opts.onMute));
  }

  if (actions.childElementCount > 0) {
    wrapper.appendChild(actions);
  }

  fragment.appendChild(wrapper);
  return fragment;
}

function createActionButton(text: string, callback: () => void): HTMLButtonElement {
  const button = document.createElement('button');
  button.className = 'plugin-notice-btn';
  button.type = 'button';
  button.textContent = text;
  button.addEventListener('click', callback);
  return button;
}

function createMuteButton(id: string, onMute: (id: string) => void): HTMLButtonElement {
  const button = document.createElement('button');
  button.className = 'plugin-notice-btn plugin-notice-btn--mute';
  button.type = 'button';
  button.setAttribute('aria-label', `Mute notice: ${id}`);
  setIcon(button, 'bell-off');
  button.addEventListener('click', () => onMute(id));
  return button;
}
