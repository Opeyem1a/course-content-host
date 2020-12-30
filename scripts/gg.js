const fs = require("fs");
const fetch = require("node-fetch");

// const gifs = require("./fake/test.json");
const gifs = require("./gifs.json");
// const destPath = "./fake";
const destPath = "../assets/feedbackGifs/";
// const countsDest = "./fake/counts.json";
const countsDest = "../assets/feedbackGifs/feedbackGifs.json";

let allLinks = [];
let counts = {};
let dupes = {};

const populate = () => {
  for (const [key, value] of Object.entries(gifs)) {
    fs.mkdir(`${destPath}/${key}`, (err) => {
      if (err && err.errno != -4075) {
        // -4075 is the errno for when the directory already exists
        console.log(err);
        return;
      } else {
        err.errno == -4075
          ? console.log(`${destPath}/${key} already exists.`)
          : console.log(`${destPath}/${key} successfully created.`);

        getGifs(key, value);
        updateCounts(key, value);
        if (Object.keys(counts).length == Object.keys(gifs).length)
          saveCounts(counts, countsDest);
      }
    });
  }
};

const saveCounts = (countData, savePath) => {
  let data = JSON.stringify(countData, null, 2);
  fs.writeFileSync(`${savePath}`, data);
  console.log(`Saving counts`);
  console.log(countData);
};

const getGifs = async (type, gifLinks) => {
  if (gifLinks.length != 0) {
    gifLinks.forEach(async (link, index) => {
      const response = await fetch(link).catch((e) => console.log(e));
      const buffer = await response.buffer();

      isUnique(type, link, index); // check if gif is unique, writes a report at the end
      allLinks.push(link); // saves link to list of all links to check for duplicates

      let name = index; // for now, the name is just the index
      fs.writeFile(`${destPath}/${type}/${name}.gif`, buffer, () => {
        console.log(`Downloaded [${type}] - ${link}`);
      });
    });
  }
};

const updateCounts = (type, linksArray) => {
  counts[type] = linksArray.length;
};

const isUnique = (type, link, index) => {
  let unique = !allLinks.includes(link);
  if (!unique) {
    dupes[type] ? dupes[type].push(index) : dupes[type] =  new Array(1).fill(index);
    saveCounts(dupes, "./real-dupes.json");
  }
  return unique;
};

// actually run the script
// to avoid tedious errors, probably destroy all the folders in your chosen destPath directory
populate();
