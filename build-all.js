const fs = require("fs-extra");
const child_process = require("child_process");
const archiver = require("archiver");

const PLATFORMS = ["chrome", "firefox", "edge", "opera"];

function zipDirectory(source, destFile) {
  const output = fs.createWriteStream(destFile);
  const archive = archiver("zip");

  output.on("close", () => {
    console.log(archive.pointer() + " total bytes");
    console.log(`Finished creating ${destFile}`);
  });

  archive.on("error", (err) => {
    throw err;
  });
  archive.pipe(output);
  archive.directory(source, false);
  archive.finalize();
}

fs.ensureDirSync("dist");
fs.emptyDirSync("dist");
for (const platform of PLATFORMS) {
  fs.emptyDirSync("build");
  child_process.execSync(`npm run build-${platform}`);
  fs.copySync("build", `dist/${platform}/`);
  zipDirectory(`dist/${platform}/`, `dist/${platform}.zip`);
}
