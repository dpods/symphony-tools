import AdmZip from "adm-zip";
import fs from 'fs'
import semver from 'semver'
import util from 'node:util';
import {exec} from 'node:child_process'
const execPromise = util.promisify(exec);


const readJSON = (path) => JSON.parse(fs.readFileSync(new URL(path, import.meta.url)))
const writeJSON = (path, content) => fs.writeFileSync(new URL(path, import.meta.url), JSON.stringify(content, null, 2))

const incrementVersion = (version, buildType) => {
    switch (buildType) {
        case 'major':
            return semver.inc(version, 'major')
        case 'minor':
            return semver.inc(version, 'minor')
        case 'patch':
            return semver.inc(version, 'patch')
        default:
            throw new Error(`Unknown build type: ${buildType}`)
    }
}

const updatePackageVersion = (newVersion, packageJson) => {
    packageJson.version = newVersion
    writeJSON('../package.json', packageJson)
}

const updateExtensionVersion = (newVersion) => {
    const manifestJson = readJSON('../src/manifest.json')
    manifestJson.version = newVersion
    writeJSON('../src/manifest.json', manifestJson)
}

const createZipArchive = (name, version) => {
    try {
        const zip = new AdmZip()
        const outputFile = `./artifacts/${name}-${version}.zip`
        zip.addLocalFolder("./src")
        zip.writeZip(outputFile)
        console.log(`Created ${outputFile} successfully`)
    } catch (e) {
        console.log(`Something went wrong. ${e}`)
    }
}

const createGitTag = async (version) => {
    await execPromise(`git add .`);
    await execPromise(`git commit -m "v${version}"`);
    await execPromise(`git tag -a v${version} -m "v${version}"`);
    console.log(`tagged commit with v${version}`);
    await execPromise(`git push`);
    console.log('pushed commit');
}

(async () => {
    const releaseType = process.argv[2]
    const packageJson = readJSON('../package.json')
    const newVersion = incrementVersion(packageJson.version, releaseType)
    updatePackageVersion(newVersion, packageJson)
    updateExtensionVersion(newVersion)
    createZipArchive(packageJson.name, newVersion)
    await createGitTag(newVersion)
})()
