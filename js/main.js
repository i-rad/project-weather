$('#input-departure, #input-destination').keypress(function (e) {
 var key = e.which;
 if(key == 13)
  {
    mainFunc('departure');
    mainFunc('destination');
  }
});

$("#button").click(function() {
  mainFunc('departure');
  mainFunc('destination');
})

async function mainFunc(location) {
  let input = $('#input-' + location).val();
  let coor = /^(-?\d+(\.\d+)?),?\s*(-?\d+(\.\d+)?)$/;
  let lat, lon;

  if (input == "") {
    $('#after' + location).remove();
    $('#input-' + location).after("<p id='after" + location + "'>Location not entered</p>");
    return;
  }
  else if(coor.test(input)) {
    let split = input.split(/[ ,]+/);
    lat = split[0];
    lon = split[1];
  }
  else {
      await fetch("https://api.locationiq.com/v1/autocomplete.php?key=9d01eb6ed0c5e4&q=" + input)
      .then(response => response.json())
      .then(contents => {
        lat = contents[0].lat;
        lon = contents[0].lon;
      })
  }

  let loader = $('.loader');
  loader.show();
  $('#after' + location).remove();

  const proxyurl = "http://localhost:8080/";
  const url = "http://api.met.no/weatherapi/locationforecast/1.9/?lat=" + lat + ";lon=" + lon;

  fetch(proxyurl + url)
  .then(response => response.text())
  .then(contents => {
    getDataForToday(contents, input, location);
    $(".tempByHour", '.' + location).children().remove();
    for (var i = 1; i < 24; i++) {
      let temp = getDataHourly(contents, i);
      $(".tempByHour", "." + location).append("<div class='hour'>" + temp[0] + ":00<br>" + temp[1] + "°C</div>");
    }
    $(".tempWeek", "." + location).children().remove();
    for (let i = 1; i < 10; i++) {
      let nextDay = new Date($(contents).find('time').attr('from'));
      nextDay.setDate(nextDay.getDate() + i);
      let minMaxTemp = getDataForGivenDay(contents, nextDay, i);
      $(".tempWeek", "." + location).append("<div class='day'>" + nextDay.toDateString() + ":   <p class='float-right border-bottom'>" + minMaxTemp[0] + "°C / " + minMaxTemp[1] + "°C</p></div><br>");
    }
    loader.hide();
  })
  .catch(() => {
    console.log("Can’t access " + url + " response.");
    loader.hide();
  })
}


const getDataForToday = (content, input, location) => {

  let dewPoint = $(content).find('dewPointTemperature').attr('value');
  let humidity = $(content).find('humidity').attr('value');
  let temperature = $(content).find('temperature').attr('value');
  let fog = $(content).find('fog').attr('percent');
  let lowClouds = $(content).find('lowClouds').attr('percent');
  let mediumClouds = $(content).find('mediumClouds').attr('percent');
  let highClouds = $(content).find('highClouds').attr('percent');

  $('.' + location).show();

  $("#" + location + "-name").html("Current weather at location: " + input);
  $('.dew-point', '.' + location).html("<b>Dew Point: </b>" + dewPoint + "°C");
  $('.humidity', '.' + location).html("<b>Humidity: </b>" + humidity + "%");
  $('.temperature', '.' + location).html("<b>Temperature: </b>" + temperature + "°C");
  $('.fog', '.' + location).html(fog + "% <br> Fog");
  $('.low-clouds', '.' + location).html(lowClouds + "% <br> Low Clouds");
  $('.medium-clouds', '.' + location).html(mediumClouds + "% <br >Medium Clouds");
  $('.high-clouds', '.' + location).html(highClouds + "% <br> High Clouds");

  $('.lcloud', '.' + location).css('opacity', opacity(lowClouds));
  $('.mcloud', '.' + location).css('opacity', opacity(mediumClouds));
  $('.hcloud', '.' + location).css('opacity', opacity(highClouds));

}

const getDataForGivenDay = (content, date, n) => {
  let nextDate = date.toISOString().slice(0,10);
  let data = $(content).find("time[from*='" + nextDate + "T']");
  let minTemperature = [];
  let maxTemperature = [];

  for (let i=0; i < data.length; i++) {
      let min = ($(data[i]).find('minTemperature').attr('value'));
      let max = ($(data[i]).find('maxTemperature').attr('value'));
      min != undefined ? minTemperature.push(min) : "";
      max != undefined ? maxTemperature.push(max) : "";
  }

  return [Math.min(...minTemperature), Math.max(...maxTemperature)];
}

const getDataHourly = (content, n) => {
  let date = new Date($(content).find('time').attr('from'));
  date.setHours(date.getHours() + n);
  let dateString = date.toISOString().slice(0, 19);
  let temperature = $(content).find("time[from='"+ dateString +"Z'][to='"+ dateString +"Z']").find('temperature').attr('value');
  return [date.getHours(), temperature];
}

const opacity = (n) => {
  if (n >= 0.0 && n <= 20.0){
    return 0;
  }
  else if (n > 20.0 && n <= 50.0) {
    return 0.5
  }
  else {
    return 1;
  }
}

$( ".left" ).click(function() {
  $( ".tempByHour" ).scroll();
});
