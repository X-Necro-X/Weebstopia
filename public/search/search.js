$("#loader").hide(0);

$(document).ready(function () {

  var content = "";
  var userSearch;

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
        content += "<a class='col-2' href='/users/" + item.userName + "'> <img height='250' width='250' src='" + item.profilePic + "' /> <br> <p>" + item.userName + "</p> </a>";
      });
      $("#loader").hide(250);
      $("#display-container").append(content);
      content = "";
    });

  }

});