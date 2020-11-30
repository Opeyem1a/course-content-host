const csvBaseName = "module";
const pagePath = window.location.pathname;

let feedbackGifs = {};
let sessionTimes = {
  startTime: 0,
  eachContinue: [],
  eachQuizSubmit: [],
  endTime: 0
};
let hasQuestions = true;

$(function () {
  setupPage().then((text) => {
    console.log(text);
    loadFeedbackGifs();
    setupContinue();
    populateQuiz();
  });
});

const setupPage = () => {
  return new Promise((resolve, reject) => {
    sessionTimes.startTime = Date.now();
    resolve("Initializing...");
  });
};

const logTimingContinue = () => {
    let data = {time: Date.now()};
    if ($("#review-form:visible").length != 0) {
      //review form is already visible i.e. user is continuing beyond the form
        data["section"] = `Review Form`;
    } else {
        data["section"] = $(".content-section:visible:last").find("h2").text();
    }
    console.log(data);
    sessionTimes.eachContinue.push(data);

};

const logTimingQuiz = () => {
    let results = {time: Date.now()};
    $("input[type=radio]:checked").each(function () {
      results[$(this).parent().parent().attr("id")] = $(this)
        .attr("id")
        .split("-")[0];
    });
    console.log(results);
    sessionTimes.eachQuizSubmit.push(results);
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
    $(".content-section").each(function (index) {
      //skip hiding first section
      if (index == 0) return true;
      $(this).hide();
    });
    $("#review-form").each(function () {
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
        logTimingContinue();
        if ($(".content-section:hidden:first").length == 0) {
          if ($("#review-form:hidden").length != 0 && hasQuestions) {
            $("#review-form").show();
            $("#goto-next-section").hide();
          } else {
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
    let offset = i % feedbackGifs[gifType];
    i++;
    //attach gif after the question-wrapper div element
    attachOrEditGif($(this).parent().parent(), gifType, offset);
  });
};

const attachOrEditGif = (jqElement, gifType, offset) => {
  let gifClass = jqElement.attr("id");
  let embedGif = `<img id="giphy-embed-${gifClass}" class="giphy-embed giphy-embed-${gifType}"
                        src="../assets/feedbackGifs/${gifType}/${offset}.gif">
                  </img>`;

  let source = `<p>
                  <a id="giphy-source" href="https://giphy.com/">Gifs via GIPHY</a>
                </p>`;

  if ($(`#giphy-embed-${gifClass}`).length == 0) {
    jqElement.after(embedGif);
    if ($(`#giphy-source`).length == 0) {
      $(".footer").append(source);
    }
  } else {
    $(`#giphy-embed-${gifClass}`).attr({
      src: `../assets/feedbackGifs/${gifType}/${offset}.gif`,
      class: `giphy-embed giphy-embed-${gifType}`
    });
  }
};

const loadFeedbackGifs = () => {
  //TODO: This is essentially unneeded after gifs are manually saved
  fetch(`../assets/feedbackGifs/feedbackGifs.json`)
    .then((response) => response.json())
    .then((json) => {
      feedbackGifs = json;
      // TODO: ideally, the lengths of the directories would be calculated and stored here
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
      $("#review-form").append(
        $("<hr>"),
        $("<h2></h2>").text("Quick Review").attr({
          id: "title-review-form",
        })
      );
      hasQuestions = questions.length == 0 ? false : true;
      questions.forEach((question, qIndex) => {
        let currentQuestion = $("<div></div>")
          .attr({
            class: "form-group question-wrapper",
            id: `q${qIndex}`,
          })
          .append(
            $("<h6></h6>")
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
      $("#review-form")
        .append(
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
        )
        .append($("<hr>"));
    })
    .catch((e) => console.log(e));
};

const displayGrade = (grade) => {
  if ($("#form-grade").length == 0) {
    $("#review-form")
      .find("hr").eq(1)
      .before(
        $("<p></p>").attr({
          id: "form-grade",
          class: "",
        })
      );
  }

  if(grade[0] == grade[1]) {
    $("#goto-next-section").show();
  };

  logTimingQuiz(grade);

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
