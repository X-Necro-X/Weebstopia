$("#loader").hide(0);
$("#next-button").hide(0);
$("#previous-button").hide(0);

$(document).ready(function () {

  var content = "";
  var pg;
  var userSearch;
  const object = {
    hd: "<div class='list-group col-2'>",
    td: "</div>",
    hi: "<img src='",
    ti: "' />",
    ht: "<p>",
    tt: "</p>",
    hb: "<button onclick='add(",
    tb: ")'>Add</button>"
  };

  $("#search-button").click(search);
  $("#search-box").keypress(function (event) {
    if (event.which == '13')
      search();
  });

  function search() {

    $("#display-container").html("");
    $("#loader").show(250);
    pg = 1;
    userSearch = $("#search-box").val();
    pageCheck();
    display();

  };

  $("#next-button").click(function () {

    $("#display-container").html("");
    $("#loader").show(250);
    pg++;
    pageCheck();
    display();

  });

  $("#previous-button").click(function () {

    $("#display-container").html("");
    $("#loader").show(250);
    pg--;
    pageCheck();
    display();

  });

  function display() {

    $.get('https://api.jikan.moe/v3/search/anime', {
      q: userSearch,
      page: pg
    }, function (data) {
      $("#display-container").html("");
      $("#display-container").addClass("row");
      data.results.forEach(function (item) {
        content += object.hd + object.hi + item.image_url + object.ti + object.ht + item.title + object.tt + object.hb + item.mal_id + object.tb + object.td;
      });      
      $("#loader").hide(250);
      $("#next-button").show(0);
      $("#previous-button").show(0);
      $("#display-container").append(content);
      content = "";
    });

  }

  function pageCheck() {

    $("#next-button").prop("disabled", true);
    $("#previous-button").prop("disabled", true);

    $.get('https://api.jikan.moe/v3/search/anime', {
        q: userSearch,
        page: pg - 1
      })
      .done(function () {
        $("#previous-button").prop("disabled", false);
      });

    $.get('https://api.jikan.moe/v3/search/anime', {
        q: userSearch,
        page: pg + 1
      })
      .done(function () {
        $("#next-button").prop("disabled", false);
      });

  }

  function add(id){
    $.post('/add/' + id);
  }

});