# SIO2Confluence
Script for migration from [Samepage.io](https://samepage.io) into [Atlassina Confluence](https://www.atlassian.com/software/confluence).

## Prerequisites
You need a [Git](https://git-scm.com/downloads) client and [Node.JS](https://nodejs.org/en/download/) installed on your computer.

## Installation
- run `git clone https://github.com/dherbolt/SIO2Confluence.git`
- run `npm install`

## Usage
- in `config.json`
  - set your Samepage.io and Confluence username and password
  - set Confluence baseUrl
  - set target Confluence space
- run `npm run start <sourcePageUrl> <targetPageName>`

or
- set `sourcePageUrl` and `targetPage` in config.json
