#!/usr/bin/env node
const dashdash = require("dashdash")
const path = require("path")
const util = require("util")
const fs = require("fs")
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
    names: ["file"],
    type: "string",
    env: "MESHBLU_CONNECTOR_UPLOADER_FILE",
    help: "File to upload",
    helpArg: "PATH",
  },
  {
    names: ["github-repository"],
    type: "string",
    env: "MESHBLU_CONNECTOR_GITHUB_REPOSITORY",
    help: "Github repo name",
    helpArg: "REPO",
  },
  {
    names: ["github-release"],
    type: "string",
    env: "MESHBLU_CONNECTOR_UPLOADER_GITHUB_RELEASE",
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
  {
    names: ["github-owner"],
    type: "string",
    env: "MESHBLU_CONNECTOR_UPLOADER_GITHUB_OWNER",
    help: "Github owner",
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

    if (!opts.connector_path) {
      opts.connector_path = process.cwd()
    }

    opts.connector_path = path.resolve(opts.connector_path)

    if (opts.help) {
      console.log(`usage: meshblu-connector-uploader-github [OPTIONS]\noptions:\n${this.parser.help({ includeEnv: true })}`)
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
    const { file, github_token, github_release, github_repository, github_owner } = options
    var errors = []
    if (!file) errors.push(new Error("MeshbluConnectorUploaderCommand requires --file or MESHBLU_CONNECTOR_UPLOADER_FILE"))
    if (!github_release) errors.push(new Error("MeshbluConnectorUploaderCommand requires --github-release or MESHBLU_CONNETOR_UPLOADER_GITHUB_RELEASE"))
    if (!github_token) errors.push(new Error("MeshbluConnectorUploaderCommand requires --github-token or MESHBLU_CONNETOR_UPLOADER_GITHUB_TOKEN"))
    if (!github_repository) errors.push(new Error("MeshbluConnectorUploaderCommand requires --github-repository or MESHBLU_CONNETOR_UPLOADER_GITHUB_REPOSITORY"))
    if (!github_owner) errors.push(new Error("MeshbluConnectorUploaderCommand requires --github-owner or MESHBLU_CONNETOR_UPLOADER_GITHUB_OWNER"))

    if (errors.length) {
      console.log(`usage: meshblu-connector-uploader-github [OPTIONS]\noptions:\n${this.parser.help({ includeEnv: true })}`)
      errors.forEach(error => {
        console.error(chalk.red(error.message))
      })
      process.exit(1)
    }

    const spinner = ora("Starting upload").start()

    const uploader = new MeshbluConnectorUploader({
      file,
      githubToken: github_token,
      githubRelease: github_release,
      githubOwner: github_owner,
      githubRepository: github_repository,
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
