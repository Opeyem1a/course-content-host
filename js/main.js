const csvBaseName = "module";
const pagePath = window.location.pathname;

let feedbackGifs = {};
let feedbackGifsSize = {};
let sessionTimes = {
  eachContinue: [],
  eachSubmit: [],
  eachScore: [], //array of objects, each object contains q:a pairs for all answered qs
  startTime: 0, //time from load to end
  endTime: 0,
};
let hasQuestions = true;

$(function () {
  setupPage().then((text) => {
    console.log(text);
    loadFeedbackGifs();
    setupContinue().then(() => startTimingContinue());
    populateQuiz().then(() => startTimingQuiz());
  });
});

const setupPage = () => {
  return new Promise((resolve, reject) => {
    sessionTimes.startTime = Date.now();
    resolve("Initializing...");
  });
};

const startTimingContinue = () => {
  $("#goto-next-section").on("click", function (event) {
    event.preventDefault();
    let data = {
      section: $(".content-section:visible").eq(-2).find("h3").text(),
      time: Date.now(),
    };
    sessionTimes.eachContinue.push(data);
  });
};

const startTimingQuiz = () => {
  $("#submit-review-form").on("click", function (event) {
    event.preventDefault();
    let results = {};
    $("input[type=radio]:checked").each(function () {
      results[$(this).parent().parent().attr("id")] = $(this)
        .attr("id")
        .split("-")[0];
    });
    sessionTimes.eachScore.push(results);
    sessionTimes.eachSubmit.push(Date.now());
  });
};

const downloadTiming = (event) => {
  return new Promise((resolve, reject) => {
    sessionTimes.endTime = Date.now();
    let timings = JSON.stringify(sessionTimes);
    console.log(timings);
    let data = new Blob([timings], { type: "text/plain" });

    let url = window.URL.createObjectURL(data);

    $("#download-timing-btn").attr({
      href: url,
      download: `COSC341-${getModuleNumber(pagePath)}-${getSectionNumber(
        pagePath
      )}-Timings.txt`,
    });
    resolve(url);
  });
};

const setupContinue = () => {
  return new Promise((resolve, reject) => {
    $(".content-section").each(function(index) {
      //skip hiding first section
      if (index == 0) return true;
      $(this).hide();
    });
    $("#review-form").each(function() {
      $(this).hide();
    });
    addContinue();
    resolve();
  });
};

const addContinue = () => {
  // TODO: where this gets added kind of matters, double check html structure with
  $("#review-form:last").after(
    $("<a></a>")
      .text("Continue")
      .attr({
        id: "goto-next-section",
      })
      .on("click", function (event) {
        event.preventDefault();
        if ($(".content-section:hidden:first").length == 0) {
          if ($("#review-form:hidden").length != 0 && hasQuestions)
            $("#review-form").show();
          else {
            $("#goto-next-section").after(
              //TODO: what should the download button say?
              $("<a></a>")
                .text("Download Here")
                .attr({
                  id: "download-timing-btn",
                })
                .on("click", function (event) {
                  downloadTiming(event).then((url) => {
                    setTimeout((url) => {
                      //So the user has time to download file before the url is revoked
                      window.URL.revokeObjectURL(url);
                    }, 0);
                  });
                })
            );
            $("#goto-next-section").hide();
          }
        } else {
          $(".content-section:hidden:first").show();
        }
      })
  );
};

const addFeedbackGifs = () => {
  let i = 0;
  $("input:checked").each(function () {
    let gifType = $(this).attr("id").startsWith("ans")
      ? "correct"
      : $(this).attr("id").startsWith("alm")
      ? "almost"
      : "wrong";
    let offset = i % feedbackGifsSize[gifType];
    i++;
    //attach gif after the question-wrapper div element
    attachOrEditGif($(this).parent().parent(), gifType, offset);
  });
};

const getFilenameFromLink = (gifLink) => {
  return gifLink.split("/").pop();
};

const attachOrEditGif = (jqElement, gifType, offset) => {
  let gifLink = feedbackGifs[gifType][offset];
  let gifClass = jqElement.attr("id");

  let embedGif = `<img id="giphy-embed-${gifClass}"
                        src="../assets/feedbackGifs/${gifType}/${getFilenameFromLink(gifLink)}.gif">
                  </img>
                  <p>
                    <a id="giphy-embed-link-${gifClass}" href="${gifLink}">via GIPHY</a>
                  </p>`;

  if ($(`#giphy-embed-${gifClass}`).length == 0) jqElement.after(embedGif);
  else {
    $(`#giphy-embed-${gifClass}`).attr({
      src: `../assets/feedbackGifs/${gifType}/${getFilenameFromLink(gifLink)}.gif`
    });

    $(`#giphy-embed-link-${gifClass}`).attr({
      href: `${gifLink}`
    });
  }
};

const loadFeedbackGifs = () => {
  //TODO: This is essentially unneeded after gifs are manually saved
  fetch(`../assets/feedbackGifs/feedbackGifs.json`)
    .then((response) => response.json())
    .then((json) => {
      feedbackGifs = json;
      Object.keys(json).forEach((key) => {
        feedbackGifsSize[key] = feedbackGifs[key].length;
      });
    });
};

const populateQuiz = async () => {
  //return so the promise can be chained
  return fetch(
    `../assets/questions/${csvBaseName}${getModuleNumber(pagePath)}.csv`
  )
    .then((response) => response.text())
    .then((text) => {
      let csvData = $.csv.toObjects(text);
      csvData = csvData
        .filter((qObj) => qObj.section == getSectionNumber(pagePath))
        .map((qObj) => {
          return {
            question: trimIfDefined(qObj.question),
            options: [
              { answer: trimIfDefined(qObj.answer) },
              { d1: trimIfDefined(qObj.distractor1) },
              { d2: trimIfDefined(qObj.distractor2) },
            ].sort(() => Math.random() - 0.5),
          };
        });
      return csvData;
    })
    .then((questions) => {
      hasQuestions = questions.length == 0 ? false : true;
      questions.forEach((question, qIndex) => {
        let currentQuestion = $("<div></div>")
          .attr({
            class: "form-group question-wrapper",
            id: `q${qIndex}`,
          })
          .append(
            $("<p></p>")
              .text(`${question.question ? question.question : "No Question"}`)
              .attr({
                class: "question-title",
              })
          );

        question.options.forEach((option, oIndex) => {
          let key = Object.keys(option)[0];
          if (!option[key]) return;

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
        //hide the entire form and it functions like a section without needing to be wrapped in a <div>
        $("#review-form").hide().append(currentQuestion);
      });
    })
    .then(() => {
      $("#review-form").append(
        $("<button></button>")
          .text("Submit")
          .attr({
            id: "submit-review-form",
            class: "btn btn-primary",
            type: "submit",
          })
          .on("click", (event) => {
            displayGrade(calculateGrade(event));
            addFeedbackGifs();
          })
      );
    })
    .catch((e) => console.log(e));
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

const getSectionNumber = (path) => {
  return getModuleSection(path)[1];
};

const getModuleNumber = (path) => {
  return getModuleSection(path)[0];
};

const getModuleSection = (path) => {
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

const trimIfDefined = (target) => {
  return target ? target.trim() : target;
};

const codeFromGifLink = (link) => {
  return link.split("-").pop();
};