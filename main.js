const csvBaseName = "module";
//TODO: replace with window.location.pathname for deployment
const pagePath = "website/again/2-1DesignGuidelines";
let feedbackGifs = {};
let feedbackGifsSize = {};

$(function () {
  loadFeedbackGifs();
  loadLinksAndScripts();
  populateQuiz();
});

const addFeedbackGifs = () => {
  let i = 0;
  $("input:checked").each(function () {
    let gifType = $(this).attr("id").startsWith("ans") ? "correct" : $(this).attr("id").startsWith("alm") ? "almost" : "wrong";
    let offset = i % feedbackGifsSize[gifType];
    i++;
    //attach gif after the question block element
    attachGif($(this).parent().parent(), feedbackGifs[gifType][offset]);
  });
};

const attachGif = (jqElement, gifLink) => {
  let embed = `<iframe src="https://giphy.com/embed/${codeFromGifLink(gifLink)}" width="440" height="480" frameBorder="0"
              class="giphy-embed" allowFullScreen></iframe>
              <p><a href="${gifLink}">via GIPHY</a></p>`;
  jqElement.after(embed);
};

const codeFromGifLink = (link) => {
  return link.split("-").pop();
};

const loadFeedbackGifs = () => {
  fetch(`./assets/feedback/feedbackGifs.json`)
    .then((response) => response.json())
    .then((json) => {
      feedbackGifs = json;
      Object.keys(json).forEach((key) => {
        feedbackGifsSize[key] = feedbackGifs[key].length;
      })
    });
};

const loadLinksAndScripts = () => {
  //TODO: ask boss to implement this so it doesn't need to be added dynamically
  let scripts = `<script src="https://cdn.jsdelivr.net/npm/bootstrap@4.5.3/dist/js/bootstrap.bundle.min.js"
  integrity="sha384-ho+j7jyWK8fNQe+A12Hb8AhRq26LrZ/JpcUGGOn+Y7RsweNrtN/tE3MoK7ZeZDyx"
  crossorigin="anonymous"></script>`;
  let bootstrapCss = `<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@4.5.3/dist/css/bootstrap.min.css"
  integrity="sha384-TX8t27EcRE3e/ihU7zmQxVncDAy5uIKz4rEkgIXeMed4M0jlfIDPvg6uqKI2xXr2" crossorigin="anonymous">`;
  //TODO: update relative link to custom css
  let customCss = `<link href="styles.css" rel="stylesheet">`;

  $("head").append(bootstrapCss, customCss);
  $("body").append(scripts);
};

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
      //TODO: Remove 👇
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
          let key = Object.keys(option)[0];
          let opt = $("<div></div>")
            .attr({ class: "form-check" })
            .append(
              $("<input></input>").attr({
                class: "form-check-input",
                type: "radio",
                name: `q${qIndex}`,
                id: `${getOptionType(option)}-q${qIndex}o${oIndex}`,
              })
            )
            .append(
              $("<label></label>")
                .text(
                  `${
                    option[key].slice(0, 1) == "~"
                      ? option[key].slice(1)
                      : option[key]
                  }`
                )
                .attr({
                  class: "form-check-label",
                  for: `${getOptionType(option)}-q${qIndex}o${oIndex}`,
                })
            );
          currentQuestion.append(opt);
        });
        $("#review-form").append(currentQuestion);
      });
    })
    .then(() => {
      $("#review-form").append(
        $("<button></button>")
          .text("Submit")
          .attr({
            class: "btn btn-primary",
            type: "submit",
          })
          .on("click", (event) => {
            displayGrade(calculateGrade(event));
            addFeedbackGifs();
          })
      );
    });
};

const displayGrade = (grade) => {
  if ($("#form-grade").length == 0) {
    $("#review-form").append(
      //TODO: update class styling
      $("<p></p>").attr({
        id: "form-grade",
        class: "",
      })
    );
  }
  $("#form-grade").text(`Score: ${grade[0]}/${grade[1]}`);
};

const calculateGrade = (event) => {
  event.preventDefault();
  let score = 0,
    total = 0;
  //function() is needed for the each() callback
  $("input:radio[id^='ans-']").each(function () {
    if ($(this).is(":checked")) score++;
    total++;
  });

  console.log([score, total]);
  return [score, total];
};

//helper functions
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

const getOptionType = (option) => {
  let key = Object.keys(option)[0];
  if (key == "answer") return "ans";
  else return option[key].slice(0, 1) == "~" ? "alm" : "d";
};
