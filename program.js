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

const GetFormattedPackageData = async (packageId) => {
  let pd = await GetPackageData(packageId);

  return "|" + pd["name"]
    + "|" + pd["description"]
    + "|" + pd["license"]
    + "|" + "[Repository](" +  pd["repository"]["url"].replace("git+", "") + ")"
    + "|" + "[NPM](https://www.npmjs.com/package/" + pd["_id"] + ")"
    + "|" + "[Vulnerabilities](https://security.snyk.io/package/npm/" + packageId + ")"
    + "|";
};

const GetAllPackagesFormatted = async (packages, installedPackages) => {

  let packageMarkdown = {}

  await Promise.all(Object.keys(packages).map(async (packageId) => {
    let version = packages[packageId]
    let installedVersion = installedPackages["node_modules/" + packageId]["version"]
    let md = await GetFormattedPackageData(packageId)
    packageMarkdown[packageId] = "|" + version + "|" + installedVersion + md;
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
    
|Version|Installed Version|Package Name|Description|License|Repository|NPM|Vulnerabilities|
|-------|-----------------|------------|-----------|-------|----------|---|---------------|
${await GetAllPackagesFormatted(packages, installedPackages)}`

  writeFileSync(MARKDOWN_PATH, md)
  console.log("Done")

}

main();
