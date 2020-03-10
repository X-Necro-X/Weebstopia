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
    display(userSearch);
  };

  function display(userSearch) {
    
    $.post('/searchuser',{temp:userSearch},function(data,status){
        console.log(data);
        $("#loader").hide(0);
        $('#display-container').html("");
        $('#display-container').append("<form id='test' action='/showprofile' method='POST'></form>");
        data.forEach(user=>{
            var text='';
            text="<button onclick='this.form.submit()' name='hello' value="+user._id+">"+user.fullName+"</button>";
            $('#test').append(text);
        });
    });

  }
});