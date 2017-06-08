var path = require("path")
var GitHubApi = require("github")

class MeshbluConnectorUploader {
  constructor({ file, githubOwner, githubRepository, githubToken, githubRelease, spinner }) {
    this.spinner = spinner
    this.file = path.resolve(file)
    this.githubRepository = githubRepository
    this.githubOwner = githubOwner
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
    this.spinner.text = `Uploading ${this.file}`
    this.github.repos.getReleaseByTag({ owner: this.githubOwner, repo: this.githubRepository, tag: this.githubRelease }).then(release => {
      const id = release.data.id
      return this.github.repos.uploadAsset({
        owner: this.githubOwner,
        repo: this.githubRepository,
        id: id,
        filePath: this.file,
        name: path.basename(this.file),
      })
    })
  }
}

module.exports.MeshbluConnectorUploader = MeshbluConnectorUploader
