/* Apply the stored theme before first paint. Kept external so the page can
   ship a strict Content-Security-Policy without inline scripts. */
try {
  var raw = localStorage.getItem('synoptik.state.v1');
  var theme = raw ? JSON.parse(raw).theme : 'system';
  var dark = theme === 'dark' || (theme !== 'light' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
} catch (error) {
  /* storage or matchMedia unavailable: keep the default light theme */
}
