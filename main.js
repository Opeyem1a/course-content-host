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

const getSectionNumber = () => {
  return 1;
};

const getModuleNumber = () => {
  return 2;
};

const getModuleSection = (path) => {
    //window.location.pathname

}
