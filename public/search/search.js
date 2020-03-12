$("#loader").hide(0);

$(document).ready(function () {

  $("#search-button").click(search);
  $("#search-box").keypress(function (event) {
    if (event.which == '13')
      search();
  });

  function search() {

    $("#display-container").html("");
    $("#loader").show(250);
    display($("#search-box").val());
  };

  function display(userSearch) {

    $.post('/search-user', {
      userSearch: userSearch
    }, function (data) {
      $("#loader").hide(0);
      $('#display-container').html("");
      $('#display-container').append("<form action='/show-profile' method='POST'></form>");
      data.forEach((user) => {
        var text = '';
        text = "<button onclick='this.form.submit()' name='hello' value=" + user._id + ">" + user.fullName + "</button>";
        $('#test').append(text);
      });
    });
  }
});