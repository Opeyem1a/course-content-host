const fs = require("fs");
const fetch = require("node-fetch");

const gifs = require("./gifs.json");
const destPath = "../assets/feedbackGifs/";
const countsDest = '../assets/feedbackGifs/feedbackGifs.json';

let counts = {};

const populate = () => {
  for (const [key, value] of Object.entries(gifs)) {
    fs.mkdir(`${destPath}/${key}`, async function (err) {
      if (err && err.errno != -4075) {
        // -4075 is the errno for when the directory already exists
        console.log(err);
        return;
      } else {
        err.errno == -4075
          ? console.log(`${destPath}/${key} already exists.`)
          : console.log(`${destPath}/${key} successfully created.`);

        await getGifs(key, value);
        await updateCounts(key, value);
        if (Object.keys(counts).length == Object.keys(gifs).length)
          saveCounts();
      }
    });
  }
};

const saveCounts = () => {
  let data = JSON.stringify(counts, null, 2);
  fs.writeFileSync(`${countsDest}`, data);
  console.log(`Saving counts`);
  console.log(counts);
};

const getGifs = async (type, gifLinks) => {
  if (gifLinks.length != 0) {
    gifLinks.forEach(async (link, index) => {
      const response = await fetch(link).catch(e => console.log(e));
      const buffer = await response.buffer();
      fs.writeFile(`${destPath}/${type}/${index}.gif`, buffer, () => {
        console.log(`Downloaded - ${link}`);
      });
    });
  }
};

const updateCounts = (type, linksArray) => {
    counts[type] = linksArray.length;
};

// actually run the script
populate();
