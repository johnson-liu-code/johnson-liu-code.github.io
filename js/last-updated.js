/**
 * Fetches and renders the last git commit date for a given file in a GitHub repo.
 * Usage: call updateLastUpdated({...}) after including this script.
 */
(async () => {
  // internal cache to avoid refetching same path repeatedly in one session
  const cache = {};

  function formatDate(isoString) {
    const d = new Date(isoString);
    const opts = { year: 'numeric', month: 'long', day: 'numeric' };
    return d.toLocaleDateString('en-US', opts);
  }

  async function fetchLastCommitDate(owner, repo, path) {
    const cacheKey = `${owner}/${repo}/${path}`;
    if (cache[cacheKey]) return cache[cacheKey]; // in-memory cache

    const endpoint = `https://api.github.com/repos/${owner}/${repo}/commits?path=${encodeURIComponent(path)}&per_page=1`;
    try {
      const resp = await fetch(endpoint, {
        headers: {
          'Accept': 'application/vnd.github+json'
          // NOTE: don't put a personal access token here in public JS; if you need higher rate
          // limits consider proxying server-side or using build-time injection instead.
        }
      });

      if (!resp.ok) throw new Error(`GitHub API ${resp.status}`);

      const data = await resp.json();
      if (Array.isArray(data) && data.length > 0) {
        const isoDate = data[0].commit.author.date;
        cache[cacheKey] = isoDate;
        return isoDate;
      }
    } catch (e) {
      console.warn('Failed fetching commit date for', path, e);
    }
    return null;
  }

  /**
   * Public function to update an element with last-updated text.
   * @param {Object} opts
   *   - elementId: id of DOM element to write into
   *   - owner: github owner/org (e.g., 'johnson-liu-code')
   *   - repo: repo name (e.g., 'johnson-liu-code.github.io')
   *   - filePath: path inside repo corresponding to this HTML page (e.g., 'projects/sentiment_analysis/sentiment.html')
   *   - fallbackToNow: boolean, if true uses current date when commit lookup fails
   */
  window.updateLastUpdated = async function ({
    elementId,
    owner,
    repo,
    filePath,
    fallbackToNow = true
  }) {
    const el = document.getElementById(elementId);
    if (!el) return;

    let display = '';
    const iso = await fetchLastCommitDate(owner, repo, filePath);
    if (iso) {
      display = `Last updated: ${formatDate(iso)}`;
    } else if (fallbackToNow) {
      display = `Last updated: ${formatDate(new Date().toISOString())}`;
    } else {
      display = 'Last updated: unknown';
    }
    el.textContent = display;
  };
})();
