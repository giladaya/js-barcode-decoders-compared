window.Stats = function($el) {
  var totalTime = 0;
  var correctCount = 0;
  var processedCount = 0;

  var startTime;

  function addResult(time, isCorrect) {
    processedCount++;
    correctCount += isCorrect ? 1 : 0;
    totalTime += time;
  }

  function getCodeFromFileName(name) {
    return name.split('-')[0];
  }

  function startProc() {
    startTime = Date.now();
  }

  function endProc(fileName, resStr) {
    time = Date.now() - startTime;
    var trueCode = getCodeFromFileName(fileName);
    var isCorrect = resStr === trueCode;
    addResult(time, isCorrect);

    $el.innerText = 'Correct: ' + correctCount + '/' + processedCount + ' = %' + 
      Math.round(correctCount / processedCount * 100) + ' Avg time(ms): ' + 
      Math.round(totalTime / processedCount);
  }

  function getResults() {
    return {
      total: processedCount,
      correct: correctCount,
      totalTime: totalTime,
    }
  }

  return {
    startProc: startProc,
    endProc: endProc,
    getResults: getResults,
  }
}