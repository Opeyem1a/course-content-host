const csvBaseName = "module";

$(function () {
  populateQuiz();
});

const populateQuiz = () => {
  fetch(`./assets/${csvBaseName}${getModuleNumber()}.csv`)
    .then((response) => response.text())
    .then((text) => {
      let csvData = $.csv.toObjects(text);
      csvData = csvData
        .filter((qObj) => qObj.section == getSectionNumber())
        .map((qObj) => {
          return {
            question: qObj.question,
            options: [
              { answer: qObj.answer },
              { d1: qObj.distractor1 },
              { d2: qObj.distractor2 },
            ].sort(() => Math.random() - 0.5),
          };
        });
      console.log(csvData);
    });
};

const getSectionNumber = () => {
  return 1;
};

const getModuleNumber = () => {
  return 2;
};
