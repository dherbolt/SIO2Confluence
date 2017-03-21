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
  - set Samepage
  	- `sourcePageUrl`, e.g. https://samepage.io/abc123/page-123456
  - set Confluence
	- `targetSpace`, e.g. KERCON
	- `targetPage`, e.g. My Page

or

- set `targetSpace`
- run `npm run start <sourcePageUrl> <targetPage>`

## Other Tasks
- `npm run export-from-sio <sourcePageUrl>`
- `npm run import-to-confluence <folder> <targetPage>`
- `npm run to-html <folder>`
- `npm run download-only <sourcePageUrl>`