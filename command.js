#!/usr/bin/env node
const dashdash = require("dashdash")
const path = require("path")
const chalk = require("chalk")
const ora = require("ora")
const { MeshbluConnectorUploader } = require("./src/uploader")

const CLI_OPTIONS = [
  {
    name: "version",
    type: "bool",
    help: "Print connector version and exit.",
  },
  {
    names: ["help", "h"],
    type: "bool",
    help: "Print this help and exit.",
  },
  {
    names: ["installers-path"],
    type: "string",
    env: "MESHBLU_CONNECTOR_INSTALLERS_PATH",
    help: "Path with installers",
    helpArg: "PATH",
    default: path.join("deploy", "installers"),
  },
  {
    names: ["github-slug"],
    type: "string",
    env: ["MESHBLU_CONNECTOR_GITHUB_SLUG", "TRAVIS_REPO_SLUG", "APPVEYOR_PROJECT_SLUG"],
    help: "Github repo name (e.g. octoblu/meshblu-connector-say-hello)",
    helpArg: "REPO",
  },
  {
    names: ["github-release"],
    type: "string",
    env: ["MESHBLU_CONNECTOR_UPLOADER_GITHUB_RELEASE", "TRAVIS_BRANCH", "APPVEYOR_REPO_TAG_NAME", "APPVEYOR_REPO_BRANCH"],
    help: "Github release to upload assets to",
    helpArg: "RELEASE",
  },
  {
    names: ["github-token"],
    type: "string",
    env: "MESHBLU_CONNECTOR_UPLOADER_GITHUB_TOKEN",
    help: "Github token",
    helpArg: "TOKEN",
  },
]

class MeshbluConnectorUploaderCommand {
  constructor(options) {
    if (!options) options = {}
    var { argv, cliOptions } = options
    if (!cliOptions) cliOptions = CLI_OPTIONS
    if (!argv) return this.die(new Error("MeshbluConnectorUploaderCommand requires options.argv"))
    this.argv = argv
    this.cliOptions = cliOptions
    this.parser = dashdash.createParser({ options: this.cliOptions })
  }

  parseArgv({ argv }) {
    try {
      var opts = this.parser.parse(argv)
    } catch (e) {
      return {}
    }

    if (opts.help) {
      console.log(`usage: meshblu-connector-uploader-github [OPTIONS]\noptions:\n${this.parser.help({ includeEnv: true, includeDefault: true })}`)
      process.exit(0)
    }

    if (opts.version) {
      console.log(this.packageJSON.version)
      process.exit(0)
    }

    return opts
  }

  async run() {
    const options = this.parseArgv({ argv: this.argv })
    const { installers_path, github_token, github_release, github_slug } = options
    var errors = []
    if (!installers_path) errors.push(new Error("MeshbluConnectorUploaderCommand requires --installers-path or MESHBLU_CONNECTOR_UPLOADER_INSTALLERS_PATH"))
    if (!github_release) errors.push(new Error("MeshbluConnectorUploaderCommand requires --github-release or MESHBLU_CONNECTOR_UPLOADER_GITHUB_RELEASE"))
    if (!github_token) errors.push(new Error("MeshbluConnectorUploaderCommand requires --github-token or MESHBLU_CONNECTOR_UPLOADER_GITHUB_TOKEN"))
    if (!github_slug) errors.push(new Error("MeshbluConnectorUploaderCommand requires --github-slug or MESHBLU_CONNECTOR_UPLOADER_GITHUB_SLUG"))

    if (errors.length) {
      console.log(`usage: meshblu-connector-uploader-github [OPTIONS]\noptions:\n${this.parser.help({ includeEnv: true, includeDefault: true })}`)
      errors.forEach(error => {
        console.error(chalk.red(error.message))
      })
      process.exit(1)
    }

    const spinner = ora("Starting upload").start()

    const uploader = new MeshbluConnectorUploader({
      installersPath: installers_path,
      githubToken: github_token,
      githubRelease: github_release,
      githubSlug: github_slug,
      spinner,
    })
    try {
      await uploader.upload()
    } catch (error) {
      return spinner.fail(error.message)
    }
    spinner.succeed("Ship it!")
  }

  die(error) {
    console.error("Meshblu Connector Installer Command: error: %s", error.message)
    process.exit(1)
  }
}

const command = new MeshbluConnectorUploaderCommand({ argv: process.argv })
command.run().catch(error => {
  console.error(error)
})
