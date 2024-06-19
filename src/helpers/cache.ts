import fetch from 'node-fetch';
import retry from 'async-retry';
import convertStream from 'stream-to-string';
import ms from 'ms';

// Utilities
import checkPlatform from './platform'

interface CacheConfig {
    account: string,
    repository: string,
    token: string,
    url: string,
    lastUpdate: null | 0 | Date,
    isOutdated: () => boolean,
    interval: number,

}

export class Cache {
  config: CacheConfig

  constructor(config: CacheConfig) {
    const { account, repository, token, url } = config
    this.config = config

    if (!account || !repository) {
      const error = new Error('Neither ACCOUNT, nor REPOSITORY are defined')
      error.code = 'missing_configuration_properties'
      throw error
    }

    if (token && !url) {
      const error = new Error(
        'Neither VERCEL_URL, nor URL are defined, which are mandatory for private repo mode'
      )
      error.code = 'missing_configuration_properties'
      throw error
    }

    this.config.latest = {}
    this.config.lastUpdate = null

    this.config.cacheReleaseList = this.cacheReleaseList.bind(this)
    this.config.refreshCache = this.refreshCache.bind(this)
    this.config.loadCache = this.loadCache.bind(this)
    this.config.isOutdated = this.isOutdated
  }

  async cacheReleaseList(url: string) {
    const { token } = this.config
    const headers = { Accept: 'application/vnd.github.preview' }

    if (token && typeof token === 'string' && token.length > 0) {
      headers.Authorization = `token ${token}`
    }

    const { status, body } = await retry(
      async () => {
        const response = await fetch(url, { headers })

        if (response.status !== 200) {
          throw new Error(
            `Tried to cache RELEASES, but failed fetching ${url}, status ${status}`
          )
        }

        return response
      },
      { retries: 3 }
    )

    let content = await convertStream(body)
    const matches = content.match(/[^ ]*\.nupkg/gim)

    if (matches.length === 0) {
      throw new Error(
        `Tried to cache RELEASES, but failed. RELEASES content doesn't contain nupkg`
      )
    }

    for (let i = 0; i < matches.length; i += 1) {
      const nuPKG = url.replace('RELEASES', matches[i])
      content = content.replace(matches[i], nuPKG)
    }
    return content
  }

  async refreshCache() {
    const { account, repository, pre, token } = this.config
    const repo = account + '/' + repository
    const url = `https://api.github.com/repos/${repo}/releases?per_page=100`
    const headers = { Accept: 'application/vnd.github.preview' }

    if (token && typeof token === 'string' && token.length > 0) {
      headers.Authorization = `token ${token}`
    }

    const response = await retry(
      async () => {
        const response = await fetch(url, { headers })

        if (response.status !== 200) {
          throw new Error(
            `GitHub API responded with ${response.status} for url ${url}`
          )
        }

        return response
      },
      { retries: 3 }
    )

    const data = await response.json()

    if (!Array.isArray(data) || data.length === 0) {
      return
    }

    const release = data.find(item => {
      const isPre = Boolean(pre) === Boolean(item.prerelease)
      return !item.draft && isPre
    })

    if (!release || !release.assets || !Array.isArray(release.assets)) {
      return
    }

    const { tag_name } = release

    if (this.config.latest.version === tag_name) {
      console.log('Cached version is the same as latest')
      this.lastUpdate = Date.now()
      return
    }

    console.log(`Caching version ${tag_name}...`)

    this.config.latest.version = tag_name
    this.config.latest.notes = release.body
    this.config.latest.pub_date = release.published_at

    // Clear list of download links
    this.config.latest.platforms = {}

    for (const asset of release.assets) {
      const { name, browser_download_url, url, content_type, size } = asset

      if (name === 'RELEASES') {
        try {
          if (!this.config.latest.files) {
            this.config.latest.files = {}
          }
          this.config.latest.files.RELEASES = await this.cacheReleaseList(
            browser_download_url
          )
        } catch (err) {
          console.error(err)
        }
        continue
      }

      const platform = checkPlatform(name)

      if (!platform) {
        continue
      }

      this.config.latest.platforms[platform] = {
        name,
        api_url: url,
        url: browser_download_url,
        content_type,
        size: Math.round(size / 1000000 * 10) / 10
      }
    }

    console.log(`Finished caching version ${tag_name}`)
    this.config.lastUpdate = Date.now()
  }

  isOutdated() {
    const { lastUpdate } = this.config
    const { interval = 15 } = this.config

    return !!(lastUpdate && Date.now() - lastUpdate > ms(`${interval}m`));


  }

  // This is a method returning the cache
  // because the cache would otherwise be loaded
  // only once when the index file is parsed
  async loadCache() {
    const { latest, refreshCache, isOutdated, lastUpdate } = this.config

    if (!lastUpdate || isOutdated()) {
      await refreshCache()
    }

    return Object.assign({}, latest)
  }
}