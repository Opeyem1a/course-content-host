const csvBaseName = "module";
//TODO: replace with window.location.pathname for deployment
const pagePath = "website/again/2-1DesignGuidelines";

$(function () {
  populateQuiz();
});

const populateQuiz = () => {
  fetch(`./assets/${csvBaseName}${getModuleNumber(pagePath)}.csv`)
    .then((response) => response.text())
    .then((text) => {
      let csvData = $.csv.toObjects(text);
      csvData = csvData
        .filter((qObj) => qObj.section == getSectionNumber(pagePath))
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
      return csvData;
    })
    .then((questions) => {
      console.log(questions);
      questions.forEach((question, qIndex) => {
        let currentQuestion = $("<div></div>")
          .attr({ class: "form-group question-wrapper" })
          .append(
            $("<p></p>").text(`${question.question}`).attr({
              class: "question-title",
            })
          );

        question.options.forEach((option, oIndex) => {
          let opt = $("<div></div>")
            .attr({ class: "form-check" })
            .append(
              $("<input></input>").attr({
                class: "form-check-input",
                type: "radio",
                name: `q${qIndex}`,
                id: `q${qIndex}o${oIndex}`,
              })
            )
            .append(
              $("<label></label>")
                .text(`${option[Object.keys(option)[0]]}`)
                .attr({
                  class: "form-check-label",
                  for: `q${qIndex}o${oIndex}`,
                })
            );
          currentQuestion.append(opt);
        });
        $("#review-form").append(currentQuestion);
      });
    });
};

const getSectionNumber = (path) => {
  return getModuleSection(path)[1];
};

const getModuleNumber = (path) => {
  return getModuleSection(path)[0];
};

const getModuleSection = (path) => {
  //window.location.pathname
  let temp = path.split("/").pop().split("-");
  let moduleNo = parseInt(temp[0]);
  //if first 2 chars are numeric, return ##, else return just the first one, which will be numeric by convention
  let sectionNo = /^[0-9]+$/.test(temp[1].slice(0, 2))
    ? parseInt(temp[1].slice(0, 2))
    : parseInt(temp[1].slice(0, 1));
  return [moduleNo, sectionNo];
};
