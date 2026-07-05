const STILL_QUERY = 'still';

/** The address of a bare view that rests on its best picture instead of playing. */
export function stillSrcOf(src: string) {
  return `${src}?${STILL_QUERY}`;
}

/*
 * A thumbnail is one of many live pages on the same screen, and one loop in any of them makes the
 * browser run a frame for all of them. A still view answers every reduced-motion question with yes
 * before the page hydrates, so each entry shows the state it keeps for people who asked for less motion.
 */
const STILL_SCRIPT = `(function () {
  var isStill = /[?&]${STILL_QUERY}(?:[=&]|$)/.test(location.search);
  if (!isStill) return;
  document.documentElement.setAttribute('data-still', '');
  var matchMedia = window.matchMedia.bind(window);
  window.matchMedia = function (query) {
    var isAboutMotion = /prefers-reduced-motion/.test(query);
    if (!isAboutMotion) return matchMedia(query);
    var asksForFullMotion = /no-preference/.test(query);
    if (asksForFullMotion) return matchMedia('not all');
    return matchMedia('all');
  };
})();`;

const STILL_MARKUP = { __html: STILL_SCRIPT };

export function StillPreviewScript() {
  return <script dangerouslySetInnerHTML={STILL_MARKUP} />;
}
