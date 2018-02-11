$(document).ready(function() {
    $.get("/events", function(data) {
        var trHtml = "";
        data = JSON.parse(data);
        $.each(data, function(iter, item) {
            trHtml += "<tr><td>" + item.names + "</td><td>(" + item.scores + ")</td><td>" + item.date_event + "</td></tr>";
        });
        $("#event-list").append(trHtml);
    });
    $("#load-data").click(function() {
        $.post("/events", function(data) {
            
        });
    });
});