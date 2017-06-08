const path = require("path")
const GitHubApi = require("github")
const Promise = require("bluebird")
const glob = Promise.promisify(require("glob"))

class MeshbluConnectorUploader {
  constructor({ installersPath, githubSlug, githubToken, githubRelease, spinner }) {
    this.spinner = spinner
    this.installersPath = path.resolve(installersPath)
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
    return this.github.repos.getReleaseByTag({ owner: this.githubOwner, repo: this.githubRepository, tag: this.githubRelease }).then(release => {
      const id = release.data.id
      return glob(path.join(this.installersPath, "*"), { nodir: true }).each(file => {
        return this.uploadFile({ id, file })
      })
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
