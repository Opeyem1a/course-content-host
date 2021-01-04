const { count } = require("console");
const { readdirSync, rename, writeFileSync } = require("fs");
const { resolve } = require("path");

const gifsDir = `feedbackGifs`;
const gifDirPath = resolve(__dirname, gifsDir);
const countsDir = `./${gifsDir}/feedbackGifs.json`;

// Get an array of the files inside the folder
const files = readdirSync(gifDirPath);

let allCounts = {};
const renameGifsIn = (folder) => {
  let dir = `./feedbackGifs/${folder}`;
  const allGifs = readdirSync(dir).filter((gif) => {
    return gif.endsWith(`.gif`);
  });
  console.log(allGifs);

  allGifs.forEach((gif, index) => {
    rename(dir + `/${gif}`, dir + `/${index}.gif`, (err) => console.log(err));
    console.log(gif);
  });

  saveCount(folder, allGifs.length);
};

const saveCount = (folder, count) => {
    console.log(`Save ${count} for ${folder}`);
    allCounts[folder] = count;
};

const runRename = () => {
  files.forEach((file, index) => {
    if (!file.includes(`.`)) {
      renameGifsIn(file);
    }

    if(index == files.length - 1) {
        console.log(allCounts);

        let data = JSON.stringify(allCounts, null, 2);
        writeFileSync(`${countsDir}`, data);
    }
  });
};

console.log(`Started.`);
runRename();
