import { readFileSync, writeFileSync } from "fs";

const PJSON_PATH = "./package.json"
const PJSON_LOCK_PATH = "./package-lock.json"
const MARKDOWN_PATH = "./packages.md"

const GetPackages = (path) => {
  let fileData = readFileSync(path, 'utf8')
  return JSON.parse(fileData)
}

const GetPackageData = async (packageId) => {
  const packageData = await fetch("https://registry.npmjs.org/" + packageId)
  return packageData.json();
}

const GetFormattedPackageData = async (packageId, installedPackages) => {

  let pd = await GetPackageData(packageId);

  let installedVersion = installedPackages["node_modules/" + packageId]["version"]
  let latestVersion = pd["dist-tags"]["latest"]
  
  let status;
  if(installedVersion == latestVersion) {
    status = "✔"
  } else {
    let installedVersionNumbers = installedVersion.split(".")
    let latestVersionNumbers = latestVersion.split(".")

    if (installedVersionNumbers[0] != latestVersionNumbers[0]) {
      status = "❌"
    } else if (installedVersionNumbers[1] != latestVersionNumbers[1]) {
      status = "⚠"
    } else if (installedVersionNumbers[2] != latestVersionNumbers[2]) {
      status = "ℹ"
    } else {
      status = "❌";
    }
  }

  return "|" + status
    + "|" + pd["dist-tags"]["latest"]
    + "|" + installedVersion
    + "|" + pd["name"]
    + "|" + pd["description"]
    + "|" + pd["license"]
    + "|" + "[NPM](https://www.npmjs.com/package/" + pd["_id"] + ")"
    + "|" + "[Vulnerabilities](https://security.snyk.io/package/npm/" + packageId + ")"
    + "|";
};

const GetAllPackagesFormatted = async (packages, installedPackages) => {

  console.log("Generating summary of packages")

  let packageMarkdown = {}

  await Promise.all(Object.keys(packages).map(async (packageId) => {
    packageMarkdown[packageId] = await GetFormattedPackageData(packageId, installedPackages)
  }))

  let md = "";
  Object.keys(packages).sort().forEach(key => {
    md += packageMarkdown[key] + "\n"
  });
  return md
}

const main = async () => {

  let date = new Date();

  let packages = GetPackages(PJSON_PATH)["dependencies"];
  let installedPackages = GetPackages(PJSON_LOCK_PATH)["packages"]

  let md = `# NPM Packages

*Last Updated ${date.toLocaleDateString()} ${date.toLocaleTimeString()}*

| |Version|Latest|Package Name|Description|License|NPM|Vulnerabilities|
|-|-------|------|------------|-----------|-------|---|---------------|
${await GetAllPackagesFormatted(packages, installedPackages)}

# Key

|Icon|Description|
|----|-----------|
|✔|Package is on latest version|
|ℹ|Newer patch available|
|⚠|Newer minor version available|
|❌|Newer major version available|
`

  writeFileSync(MARKDOWN_PATH, md)
  console.log("Done")

}

main();
