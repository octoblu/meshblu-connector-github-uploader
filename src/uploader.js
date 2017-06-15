const path = require("path")
const GitHubApi = require("github")
const Promise = require("bluebird")
const glob = Promise.promisify(require("glob"))
const debug = require("debug")("meshblu-connector-uploader-github")

class MeshbluConnectorUploader {
  constructor({ installersPath, githubSlug, githubToken, githubRelease, spinner }) {
    this.spinner = spinner
    this.installersPath = installersPath
    this.githubSlug = githubSlug
    const [githubOwner, githubRepository] = this.githubSlug.split("/")
    this.githubOwner = githubOwner
    this.githubRepository = githubRepository
    this.githubToken = githubToken
    this.githubRelease = githubRelease
    this.github = new GitHubApi({
      headers: {
        "user-agent": "meshblu-connector-uploader-github",
      },
    })
    this.github.authenticate({
      type: "token",
      token: this.githubToken,
    })
  }

  upload() {
    this.spinner.color = "green"
    this.spinner.text = `Uploading ${this.installersPath}`
    debug(`about to upload ${this.installersPath}`)
    return this.github.repos.getReleaseByTag({ owner: this.githubOwner, repo: this.githubRepository, tag: this.githubRelease }).then(release => {
      const id = release.data.id
      return glob(path.join(this.installersPath, "*"), { nodir: true }).each(file => {
        return this.ensureFile({ id, file })
      })
    })
  }

  ensureFile({ id, file }) {
    debug("checking existance of asset")
    return this.getAssetId({
      file: file,
      id: id,
    })
      .then(assetId => {
        if (assetId == null) {
          return Promise.resolve()
        }
        debug("replacing asset since it already exists")
        return this.deleteAsset({ assetId, id })
      })
      .then(() => {
        debug("uploading file")
        return this.uploadFile({ id, file })
      })
  }

  getAssetId({ id, file }) {
    return this.github.repos
      .getAssets({
        owner: this.githubOwner,
        repo: this.githubRepository,
        id: id,
      })
      .then(response => {
        const assets = response.data
        let assetId = null
        assets.forEach(asset => {
          if (asset.name == path.basename(file)) {
            assetId = asset.id
          }
        })
        return Promise.resolve(assetId)
      })
  }

  deleteAsset({ assetId }) {
    return this.github.repos.deleteAsset({
      owner: this.githubOwner,
      repo: this.githubRepository,
      id: assetId,
    })
  }

  uploadFile({ id, file }) {
    return this.github.repos.uploadAsset({
      owner: this.githubOwner,
      repo: this.githubRepository,
      id: id,
      filePath: file,
      name: path.basename(file),
    })
  }
}

module.exports.MeshbluConnectorUploader = MeshbluConnectorUploader
