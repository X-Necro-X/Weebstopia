$("#loader").hide(0);

$(document).ready(function () {

  var content = "";
  var userSearch;
  const object = {
    hd: "<div class='list-group col-2'>",
    td: "</div>",
    hi: "<img src='",
    ti: "' />",
    ht: "<p>",
    tt: "</p>",
    hb: "<button onclick='viewProfile(\"",
    tb: "\")'>viewProfile</button>"
  };

  $("#search-button").click(search);
  $("#search-box").keypress(function (event) {
    if (event.which == '13')
      search();
  });

  function search() {

    $("#display-container").html("");
    $("#loader").show(250);
    userSearch = $("#search-box").val();
    display();

  }

  function display() {

    $.post('/search-user', {
      userSearch: userSearch
    }, function (data) {
      $("#display-container").html("");
      $("#display-container").addClass("row");
      data.forEach(function (item) {
        content += object.hd + object.hi + item.profilePic + object.ti + object.ht + item.userName + object.tt + object.hb + item.userName + object.tb + object.td;
      });
      $("#loader").hide(250);
      $("#display-container").append(content);
      content = "";
    });

  }

});

function viewProfile(userSearch) {
  $.get('/users/' + userSearch, (data) => {
    $('html').html(data)
  });
}