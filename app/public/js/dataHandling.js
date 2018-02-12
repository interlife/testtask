$(document).ready(function() {
    var socket = io.connect('http://localhost:8081');
    var field = $('#progress');

    socket.on('message', function (data) {
        if(data) {
            field.text(data);
        } else {
            console.log("There is a problem:", data);
        }
    });

    $.get("/events", function(data) {
        var trHtml = "";
        data = JSON.parse(data);
        $.each(data, function(iter, item) {
            trHtml += "<tr><td>" + item.names + "</td><td>(" + item.scores + ")</td><td>" + item.date_event + "</td></tr>";
        });
        $("#event-list").append(trHtml);
    });
    $("#load-data").click(function() {
        $.post("/events").fail(function(data) {
            $("#error-load").text(data.responseText);
        });
    });
    $("#delete-rand").click(function() {
        $.ajax({
            url: '/events/' + $('#percent').val(),
            type: 'DELETE',
            success: function(result) {
                console.log(result);
            }
        });
    });
});